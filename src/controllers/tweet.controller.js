import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const publishTweet = asyncHandler(async(req,res) => {
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Please provide content for tweet")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    const createdTweet = await Tweet.findById(tweet._id)

    if(!createdTweet) {
        throw new ApiError(500, "Failed to tweet, please try again!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, createdTweet, "Tweeted successfully"))
})

const updateTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params
    const {newContent} = req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Provide valid tweet Id")
    }

    if(!newContent){
        throw new ApiError(400, "Please provide content to update")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can edit the tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
    {$set: { newContent }},
    { new: true }
    )

    const checkUpdatedTweet = await Tweet.findById(updatedTweet?._id)

    if(!checkUpdatedTweet){
        throw new ApiError(500, "Something went wrong while tweeting, try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, checkUpdatedTweet, "Tweet has been updated"))
})

const deleteTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Please provide valid tweet ID")
    }

    const tweetToDelete = await Tweet.findById(tweetId)

    if(!tweetToDelete){
        throw new ApiError(404, "Tweet not found")
    }

    if(tweetToDelete?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only owner can delete the tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(200, {}, "Deleted Successfully!")
})

const getUserTweets = asyncHandler(async(req,res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Please provide valid user Id")
    }

    try {
        const allTweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                "avatar.url": 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField:"_id",
                    foreignField: "tweet",
                    as: "tweetLikes",
                    pipeline: [
                        {
                            $project: {
                                likedBy: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    likeCount: {
                        $size: "$tweetLikes"
                    },
                    ownerDetails: {
                        $first: "$ownerDetails"
                    },
                    isLiked: {
                        $cond: {
                            if:{ $in: [req.user?._id, "$tweetLikes.likedBy"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $sort: {
                    createdAt : -1
                }
            },
            {
                $project: {
                    content: 1,
                    ownerDetails: 1,
                    likeCount: 1,
                    createdAt: 1,
                    isLiked: 1
                }
            }
        ])
    
        if(allTweets == 0){
            return res
            .status(200)
            .json(new ApiResponse(200, allTweets,"No tweets to display"))
        }
        else{
            return res
            .status(200)
            .json(new ApiResponse(200, allTweets, "Tweets fetched successfully" ))
        }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching tweets")
    }
})

export {
    publishTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}