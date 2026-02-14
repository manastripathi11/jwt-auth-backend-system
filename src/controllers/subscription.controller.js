import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // wo user jiska channel he uski id
  // channel -- hi -- user he

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const channel = await User.findById(channelId);
  //   then we have find in user database

  if (!channel) {
    throw new ApiError(400, "channel not found");
  }

  const existingSubscrption = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  console.log(existingSubscrption);

  if (existingSubscrption) {
    const unSubscribedChannel = await Subscription.findByIdAndDelete(
      existingSubscrption._id
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          unSubscribedChannel,
          "channel unsubscribed successfully"
        )
      );
  } else {
    const newSubscription = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, newSubscription, "channel subscribed successfully")
      );
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId = req.user?._id } = req.params;

  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid ChannelId");

  const subscriberList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "channel",
        foreignField: "subscriber",
        as: "subscribedChannels",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribersSubscribers",
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
              subscribersCount: {
                $size: "$subscribersSubscribers",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$subscriber",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "subscriber.isSubscribed": {
          $cond: {
            if: {
              $in: ["$subscriber._id", "$subscribedChannels.channel"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $group: {
        _id: "channel",
        subscriber: {
          $push: "$subscriber",
        },
      },
    },
  ]);

  const subscribers =
    subscriberList?.length > 0 ? subscriberList[0].subscriber : [];

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscriber Sent Successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId))
    throw new ApiError(400, "Invalid subscriberId");

  const subscribedChannels = await Subscription.aggregate([
    // get all subscribed channels`
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    // get channel details
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$channel",
    },
    // get channel's subscribers
    {
      $lookup: {
        from: "subscriptions",
        localField: "channel._id",
        foreignField: "channel",
        as: "channelSubscribers",
      },
    },
    {
      // logic if current user has subscribed the channel or not
      $addFields: {
        "channel.isSubscribed": {
          $cond: {
            if: { $in: [req.user?._id, "$channelSubscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
        // channel subscriber count
        "channel.subscribersCount": {
          $size: "$channelSubscribers",
        },
      },
    },
    {
      $group: {
        _id: "subscriber",
        subscribedChannels: {
          $push: "$channel",
        },
      },
    },
  ]);

  const users =
    subscribedChannels?.length > 0
      ? subscribedChannels[0].subscribedChannels
      : [];

  return res
    .status(200)
    .json(
      new ApiResponse(200, users, "Subscribed channel list sent successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
