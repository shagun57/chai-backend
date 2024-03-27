import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

//like unlike a video
const toggleVideoLike = asyncHandler(async(req,res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "provide valid video Id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video does not exist.")
    }

    const alreadyLiked = await Like.findOne(
        {video: videoId,
         likedBy: req.user?._id
        }
    )
    
    if(alreadyLiked){
        const deleteLike = await Like.findByIdAndDelete(alreadyLiked?._id)

        return res.status(200).json(new ApiResponse(200, {}, "Video unliked"))
    }
    
    else{
        const createLike = await Like.create({
            video: videoId, 
            likedBy: req.user?._id
        })

        const checkLike = await Like.findById(createLike?._id)

        if(!checkLike){
            throw new ApiError(500, "Error while liking a video.")
        }

        return res
        .status(200)
        .json(new ApiResponse(200,{}, "Video liked"))
    }
})

const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Provide valid comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "No such comment found!")
    }

    const isLikedComment = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if(isLikedComment){
        await Like.findByIdAndDelete(isLikedComment?._id)

        return res
        .status(200)
        .json(200, {}, "Comment disliked")
    }

    else{
        const createCommentLike = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })

        const checkCommentLike = await Like.findById(createCommentLike?._id)

        if(!checkCommentLike){
            throw new ApiError(500,"Internal error while liking a comment")
        }

        return res
        .status(200)
        .json(new ApiResponse(200,{}, "comment liked"))
    }
})

const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Provide valid tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    const isLikedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(isLikedTweet){
        await Like.findByIdAndDelete(isLikedTweet?._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet unliked"))
    }

    else{
        const createTweetLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        const checkTweetLike = await Like.findById(createTweetLike?._id)

        if(!checkTweetLike){
            throw new ApiError(500, "Internal error while  liking the tweet")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet liked"))
    }
})

const getLikedVideos = asyncHandler(async(req,res) => {
    
})

export {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos
}