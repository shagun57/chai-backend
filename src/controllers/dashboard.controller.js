import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Subscription } from "../models/subscription.model.js";

const getChannelStats = asyncHandler(async(req,res) => {

})

const getChannelVideos = asyncHandler(async(req,res) => {

})

export {
    getChannelStats,
    getChannelVideos
}