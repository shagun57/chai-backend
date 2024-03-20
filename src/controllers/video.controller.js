import {Video} from "../models/video.model.js"
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError} from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"


//list all videos 
const getAllVideos = asyncHandler(async(req,res) => {

})

//Upload a new video
const publishVideo = asyncHandler(async(req,res) => {
    const {description,title} = req.body;
})

//get particular video by ID.
const getVideoById = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
})

//update video discription, title and thumbnail
const updateVideo = asyncHandler(async(req,res) => {
    const {videoid} = req.params;
})

//delete a video 
const deleteVideo = asyncHandler(async (req,res) => {
    const {videoId} = req. params;
})

//toggle publish status
const togglePublishStatus = asyncHandler(async (req,res) => {
    const {videoId} = req.params;
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}