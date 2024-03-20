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
    //get titla and desc from body
    const {description,title} = req.body;
    
    //check if title and desc are there 
    if(!title && !description){
        throw new ApiError(400,"Title and description are required")
    }

    //check if video is uploaded on local device
    const videoLocalPath = req.files?.videoFile[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400,"No video found")
    }
    
    //check if thumbnail is uploaded on local device
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbail is missing")
    }

    //upload video on cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    
    if(!videoFile){
        throw new ApiError(400,"Something went wrong while uploading video")
    }
    
    //upload thumbnail on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    if(!thumbnail){
        throw new ApiError(400, "Failed to upload Thumbnail")
    }

    //get the user who is uploading the file
    const user = await User.findById(req.user._id)

    //store in database
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        description: description,
        title: title,
        owner: user,
        duration: videoFile.duration
    })

    //check if video is uploaded to mongoDb
    const uploadedVideo = await Video.findById(video._id)
    .select("-owner -duration")

    if(!uploadedVideo){
        throw new ApiError(500, "Internal Server Error")
    }

    //if succesfull return response
    return res.status(200)
    .json(new ApiResponse(200,uploadedVideo, "Video uploaded successfully"))


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