import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Subscription } from "../models/subscription.model.js";

//get channel stats like total number of  views, subscribers, videos and likes
const getChannelStats = asyncHandler(async(req,res) => {
    const userId = req.user?._id

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "user Id is invalid")
    }

    try {
        const totalSubscribers = await Subscription.countDocuments(
            {channel: mongoose.Types.ObjectId(userId)})
    
        const videosInfo = await Video.aggregate([
            {
                $match : {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "videoLikes"
                }
            },
            {
                $project: {
                    _id: 0,
                    likes: {
                        $size: "$videoLikes"
                    },
                    views: "$views",
                    videos: 1
                }
            },
            {
                $group: {
                    _id: null,
                    totalLikes: {
                        $sum: "$likes"
                    },
                    totalViews: {
                        $sum: "$views"
                    },
                    totalVideos: {
                        $sum: 1
                    }
                }
            }
        ]);
    
        const channelStats = {
            totalSubsCount : `${totalSubscribers}` || 0,
            totalLikeCount:  videosInfo[0]?.totalLikes || 0,
            totalViewCount: videosInfo[0]?.totalViews || 0,
            totalVideoCount: videosInfo[0]?.totalVideos || 0
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, channelStats, "Dashboard  stats retrieved successfully"));
    } 
    catch (error) {
        throw new ApiError(500, "Something went wrong while getting dashboard data", error);
    }
})

const getChannelVideos = asyncHandler(async(req,res) => {
    const {page, limit} = req.query

    const pageNumber = parseInt(page)
    const pageLimit = parseInt(limit)
    const skip = (pageNumber-1) * pageLimit

    try {
        const allVideos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user?._id),
                    isPublished: true
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                    pipeline: [
                        {
                            $count: "TotalLikes"
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline:[
                        {
                            $project: {
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner.username"
                    },
                    likes: {
                        $cond: {
                            if: {$eq: [{$size: "$likes.totalLikes"}, 0] },
                            then: 0,
                            else: {$first: "$likes.totalLikes"}
                        }
                    }
                }
            },
            {
                $project: {
                    "_id": 1,
                    "videoFile": 1,
                    "title": 1,
                    "thumbnail": 1,
                    "description": 1,
                    "duration": 1,
                    "views":1,
                    "owner": 1,
                    "likes": 1,
                    "createdAt": 1
                }
            },
            {
                $sort : {createdAt: -1}
            },
            {
                $skip: skip
            },
            {
                $limit: pageLimit
            }
        ])
    
        if(allVideos.length == 0){
            return res
            .status(200)
            .json(new ApiResponse(200, "No videos found"))
        }
        else{
            return res
            .status(200)
            .json(new ApiResponse(200, allVideos, "Here are the requested videos"));
        }
    } 
    catch (error) {
        throw new ApiError(500, "Internal server error, try again.!", error)
    }
})

export {
    getChannelStats,
    getChannelVideos
}