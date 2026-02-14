import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    
    if(!name || !description){
        throw new ApiError(400, "Name and description are required")
    }

    const playlist = await Playlist.create({
        name: name,
        description:description,
        owner: req.user._id,
    })

    if(!playlist){
        throw new ApiError(500, "Could not create playlist")
    }

    res.status(201).json(new ApiResponse(200, playlist, "playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId))
    throw new ApiError(400, "Valid userId required");

  // THINKME : playlist thumbnail

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
              username: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        thumbnail: 1,
        videosCount: 1,
        createdAt: 1,
        updatedAt: 1,
        thumbnail: {
          $first: "$videos.thumbnail",
        },
        videosCount: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlist sent successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "plese give valid playlist id");
  }
  const playlists = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: { isPublished: true },
          },
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
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
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
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        thumbnail: 1,
        videosCount: 1,
        createdAt: 1,
        updatedAt: 1,
        thumbnail: {
          $first: "$videos.thumbnail",
        },
        videosCount: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists[0], "Playlist sent successfully"));
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please give valid id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!playlist)
    throw new ApiError(500, "Error while adding video to playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAdded: true },
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "plaese give valid video or playlist id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!playlist)
    throw new ApiError(500, "Error while removing video from playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSuccess: true },
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id not found");
  }
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist Id not valid");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(400, "Playlist Not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "playlist deleted successfully")
    );
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
  
    if (!playlistId) {
      throw new ApiError(400, "Playlist Id not found");
    }
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Playlist Id not valid");
    }
  
    if (!name && !description) {
      throw new ApiError(400, "Name or description must be provided");
    }
  
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(400, "Playlist not found");
    }
  
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlist._id,
      {
        name: name ? name : playlist.name,
        description: description ? description : playlist.description,
      },
      { new: true }
    );
  
    if (!updatePlaylist) {
      throw new ApiError(500, "playlist cannot be updated");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedPlaylist, "playlist updated successfully")
      );
})

// this function is check the user videos is are avlaible in playlists or not

const getVideoSavePlaylists = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Valid videoId required");

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $project: {
        name: 1,
        isVideoPresent: {
          $cond: {
            if: { $in: [new mongoose.Types.ObjectId(videoId), "$videos"] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists sent successfully"));
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getVideoSavePlaylists
}
