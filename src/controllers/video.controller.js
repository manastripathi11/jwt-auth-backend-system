import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  destoryOnCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  let filters = { isPublished: true };
  if (isValidObjectId(userId))
    filters.owner = new mongoose.Types.ObjectId(userId);

  let pipeline = [
    {
      $match: {
        ...filters,
      },
    },
  ];

  pipeline.push({
    $sort: {
      createdAt: -1,
    },
  });

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    }
  );

  const allVideos = await Video.aggregate(Array.from(pipeline));

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "all videos sent"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title) throw new ApiError(400, "Title is Required");

  // fetch local video file path
  let videoFileLocalFilePath = null;
  if (req.files && req.files.videoFile && req.files.videoFile.length > 0) {
    videoFileLocalFilePath = req.files.videoFile[0].path;
  }
  if (!videoFileLocalFilePath)
    throw new ApiError(400, "Video File Must be Required");

  // fetch local thumbnail file path
  let thumbnailLocalFilePath = null;
  if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
    thumbnailLocalFilePath = req.files.thumbnail[0].path;
  }
  if (!thumbnailLocalFilePath)
    throw new ApiError(400, "Thumbnail File Must be Required");

  // check if connection closed then abort operations else continue
  if (req.customConnectionClosed) {
    console.log("Connection closed, aborting video and thumbnail upload...");
    console.log("All resources Cleaned up & request closed...");
    return; // Preventing further execution
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalFilePath);
  console.log("this is video i have add --", videoFile);
  if (!videoFile) throw new ApiError(500, "Error while Uploading Video File");

  // check if connection closed then delete video and abort operations else continue
  if (req.customConnectionClosed) {
    console.log(
      "Connection closed!!! deleting video and aborting thumbnail upload..."
    );
    await destoryOnCloudinary(videoFile.url);
    fs.unlinkSync(thumbnailLocalFilePath);
    console.log("All resources Cleaned up & request closed...");
    return; // Preventing further execution
  }

  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalFilePath);
  console.log("this is video i have thumbnail --", thumbnailFile);
  if (!thumbnailFile)
    throw new ApiError(500, "Error while uploading thumbnail file");

  // check if connection closed then delete video & thumbnail and abort db operation else continue
  if (req.customConnectionClosed) {
    console.log(
      "Connection closed!!! deleting video & thumbnail and aborting db operation..."
    );
    await destoryOnCloudinary(videoFile.publicId);
    await destoryOnCloudinary(thumbnailFile.publicId);
    console.log("All resources Cleaned up & request closed...");
    return; // Preventing further execution
  }

  console.log("updating db...");

  const video = await Video.create({
    videoFile: videoFile.hlsUrl,
    title,
    description: description || "",
    duration: videoFile.duration,
    thumbnail: thumbnailFile.url,
    owner: req.user?._id,
  });

  if (!video) throw new ApiError(500, "Error while Publishing Video");

  // check if connection closed then delete video & thumbnail & dbEntry and abort response else continue
  if (req.customConnectionClosed) {
    console.log(
      "Connection closed!!! deleting video & thumbnail & dbEntry and aborting response..."
    );
    await destoryOnCloudinary(videoFile.publicId);
    await destoryOnCloudinary(thumbnailFile.publicId);
    let video = await Video.findByIdAndDelete(video._id);
    console.log("Deleted the Video from db: ", video);
    console.log("All resources Cleaned up & request closed...");
    return;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully"));
});

//     const { title, description } = req.body;

//     // const avatarLocalPath = req.files?.videoFile[0]?.path;
//     const videoLocalPath = req.files?.videoFile[0]?.path;
//     const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

//     console.log(title, description , videoLocalPath, thumbnailLocalPath);

//     if (!title || !thumbnailLocalPath || !videoLocalPath) {
//         throw new ApiError(400, "All fields are required");
//     }

//     const videoFile = await uploadOnCloudinary(videoLocalPath);

//     console.log("kya kya araahah heb", videoFile)
//     const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

//     if (!videoFile || !thumbnail) {
//         throw new ApiError(500, "Error while uploading video or thumbnail");
//     }

//     const video = await Video.create(
//         {
//             title,
//             description: description || "",
//             videoFile: videoFile.hlsUrl,
//             duration: videoFile.duration,
//             thumbnail: thumbnail.url
//         }
//     );
//     console.log("video contoler ka code he",video);

//     video.owner = req.user?._id;
//     video.save();

//     console.log(video);

//     return res.status(200).json(new ApiResponse(200, video, "Video uploaded successfully"));

// })

// const getVideoById = asyncHandler(async (req, res) => {
//     const{videoId}=req.params;

//     console.log(videoId);

//     if (!videoId) {
//         throw new ApiError(400,"video id is missing")
//     }

//     const video = await Video.findById(videoId).populate('owner');

//     if (!video) {
//         throw new ApiError(500,"error while fetching video")
//     }

//     return res.status(200).json(new ApiResponse(200,video,"video fetched successfully"))
// })

// TODO🚀🚀first you have to check like the other videos

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        isPublished: true,
      },
    },
    // get all likes array
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
        pipeline: [
          {
            $match: {
              liked: true,
            },
          },
          {
            $group: {
              _id: "$liked",
              likeOwners: { $push: "$likedBy" },
            },
          },
        ],
      },
    },
    // get all dislikes array
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "dislikes",
        pipeline: [
          {
            $match: {
              liked: false,
            },
          },
          {
            $group: {
              _id: "$liked",
              dislikeOwners: { $push: "$likedBy" },
            },
          },
        ],
      },
    },
    // adjust shapes of likes and dislikes
    {
      $addFields: {
        likes: {
          $cond: {
            if: {
              $gt: [{ $size: "$likes" }, 0],
            },
            then: { $first: "$likes.likeOwners" },
            else: [],
          },
        },
        dislikes: {
          $cond: {
            if: {
              $gt: [{ $size: "$dislikes" }, 0],
            },
            then: { $first: "$dislikes.dislikeOwners" },
            else: [],
          },
        },
      },
    },
    // fetch owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    // added like fields
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        duration: 1,
        thumbnail: 1,
        views: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        totalLikes: {
          $size: "$likes",
        },
        totalDisLikes: {
          $size: "$dislikes",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes"],
            },
            then: true,
            else: false,
          },
        },
        isDisLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$dislikes"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  if (!video.length > 0) throw new ApiError(400, "No video found");

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video sent successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) {
    throw new ApiError(400, "video id is missing");
  }

  if (!title || !description) {
    throw new ApiError(400, "title and description is required");
  }

  // delete the old thumbnail on cloudniray
  const oldthumbnailurl = await Video.findById(videoId);
  console.log(oldthumbnailurl);
  const thumbnailURL = oldthumbnailurl.thumbnail;
  const publicId = thumbnailURL.split("/").pop().split(".")[0];
  await destoryOnCloudinary(publicId);

  const thumbnailLocalpath = req.file?.path;

  if (!thumbnailLocalpath) {
    throw new ApiError(400, "thumbnail is missing");
  }
  // console.log(videoId, title, description , videothumbnail);4
  const thumbnail = await uploadOnCloudinary(thumbnailLocalpath);

  if (!thumbnail) {
    throw new ApiError(500, "error while uploading thumbnail");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail.url,
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(500, "error while updating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"));
});

// todo: there has been impmemetend other functionality in delte video

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "VideoId not found");

  const findRes = await Video.findByIdAndDelete(videoId);

  if (!findRes) throw new ApiError(400, "Video not found");

  const thumbnailURL = findRes.thumbnail;
  const publicId = thumbnailURL.split("/").pop().split(".")[0];
  await destoryOnCloudinary(publicId);

  const videoUrl = findRes.videoFile;
  const publicIdofvideo = videoUrl.split("/").pop().split(".")[0];
  await destoryOnCloudinary(publicIdofvideo);

  const deleteVideoLikes = await Like.deleteMany({
    video: new mongoose.Types.ObjectId(videoId),
  });

  const videoComments = await Comment.find({
    video: new mongoose.Types.ObjectId(videoId),
  });

  const commentIds = videoComments.map((comment) => comment._id);

  const deleteCommentLikes = await Like.deleteMany({
    comment: { $in: commentIds },
  });

  const deleteVideoComments = await Comment.deleteMany({
    video: new mongoose.Types.ObjectId(videoId),
  });

  const deleteVideoFromPlayList = await Playlist.updateMany(
    {},
    { $pull: { videos: new mongoose.Types.ObjectId(videoId) } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, [], "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  console.log(videoId);
  if (!videoId) {
    throw new ApiError(400, "video Id is missing");
  }

  const video = await Video.findById(videoId);
  video.isPublished = !video.isPublished;
  await video.save();

  return res.json(new ApiResponse(200, video, "Video publish status updated."));
});

//  add new functinality UpdateVIEW

const updateView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "videoId required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "Video not found");

  video.views += 1;
  const updatedVideo = await video.save();
  if (!updatedVideo) throw new ApiError(400, "Error occurred on updating view");

  let watchHistory;
  if (req.user) {
    watchHistory = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $push: {
          watchHistory: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        new: true,
      }
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSuccess: true, views: updatedVideo.views, watchHistory },
        "Video views updated successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  updateView,
};
