import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const publishTweet = asyncHandler(async(req,res) => {
    
})

const updateTweet = asyncHandler(async(req,res) => {

})

const deleteTweet = asyncHandler(async(req,res) => {

})

const getUserTweets = asyncHandler(async(req,res) => {

})

export {
    publishTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}