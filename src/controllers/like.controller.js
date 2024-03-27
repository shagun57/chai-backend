import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

const toggleVideoLike = asyncHandler(async(req,res) => {
    const {videoId} = req.params
})

const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params
})

const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params
})

const getLikedVideos = asyncHandler(async(req,res) => {
    
})

export {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos
}