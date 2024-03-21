import {Video} from "../models/video.model.js"
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError} from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"


//list all videos 
const getAllVideos = asyncHandler(async(req,res) => {
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

    const pageNumber = parseInt(page)
    const pageSize = parseInt(limit)
    const skip = (pageNumber -1) * pageSize

    if(!query) {
        throw new ApiError(400, "Query is required to retrieve videos")
    }

    if(!sortBy) {
        throw new ApiError(400, "Give sort by values to sort videos")
    }

    if(!sortType){
        throw new ApiError(400, "provide sort type values of videos")
    }

    if(!userId){
        throw new ApiError(400, "Please provide user Id")
    }

    try {
        const videos = await Video.aggregate([
            {
                $match : {
                        $or: [ //perform pattern matching with case insensitive flag(i)
                            {title: {$regex: query, $options: 'i'}},
                            {description: {$regex: query, $options: 'i'}}
                        ],
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
                            $count: "totalLikes"
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
                    pipeline: [
                        {
                            $project: {
                                username: 1,
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
                            //check if likes array is empty
                            if:{$eq: [{$size: "$likes.totalLikes"}, 0 ] },
                            then: 0,
                            //project total number of likes
                            else: {$first: "$likes.totalLikes"}
                        }
                    }
                }
            },
            {
                $project: {
                    "_id": 1,
                    "title": 1,
                    "description": 1,
                    "thumbnail": 1,
                    "videoFile": 1,
                    "duration": 1,
                    "likes": 1,
                    "owner": 1,
                    "views": 1,
                    "isPublished": 1,
                    "createdAt": 1,
                    "updatedAt": 1
                }
            },
            {$sort:{[sortBy]: sortType === "asc" ? 1 : -1}},
            {$skip: skip},
            {$limit: pageSize}
        ]);
    
        if(videos.length === 0){
            return res
            .status(200)
            .json(new ApiResponse(200, "No videos available"))
        }
        else{
            return res
            .status(200)
            .json(new ApiResponse(200, "videos fetched successfully"))
        } 
    } catch (error) {
        throw new ApiError(500, `Error while getting videos. error: ${error}`)
    }
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
    try {
        const {videoId} = req.params;
    
        if(!videoId){
            throw new ApiError(400, "videoId not available")
        }
        let video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(400, "No video found")
        }
    
        return res
        .status(200)
        .json(200, video, "Video fetched successfully")
    } catch (error) {
        throw new ApiError(500, `Internal server error: ${error}`)
    }
})

//update video discription, title and thumbnail
const updateVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const CheckRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!videoId){
        throw new ApiError(400, "Video Id is missing")
    }

    const video = await Video?.findById(videoId)
    
    if(!video){
        throw new ApiError(400, "No video  with given id exists.")
    }

    const user = await User?.findOne(CheckRefreshToken)

    if(!user){
        throw new ApiError(404, "No user found")
    }

    if(video.owner != user._id) {
        throw new ApiError(400, "Only video owner can update video")
    }

    const {title, description} = req.body

    if(!title) {
        throw new ApiError(400, "Title cant be empty")
    }

    if(!description) {
        throw new ApiError(400, "description cant  be empty")
    }

    video.title = title
    video.description = description

    //update thumbnail picture
    const newThumbnailLocalPath = req.file?.path

    if(!newThumbnailLocalPath){
        throw new ApiError(400, "Please select thumbnail file to upload")
    }

    const thumbnail = await uploadOnCloudinary(newThumbnailLocalPath)

    if(!thumbnail.url){
        throw new ApiError(500, "failed to upload thumbnail")
    }

    video.thumbnail = thumbnail.url

    await video.save()

    return res.status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully"))

})

//delete a video 
const deleteVideo = asyncHandler(async (req,res) => {
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "Video Id is not available")
    }
    
    const video = await Video.findById(videoId);

    const user = await User.find({refreshToken: req.cookies.refreshToken})

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    if(video.owner === user._id.toString()) {
        await Video.findByIdAndDelete(videoId)
        return res
        .status(200)
        .json(new ApiResponse(200, "Video successfully deleted"))
    }
    else{
        throw new ApiError(401, "Only owner can delete the video")
    }
})

//toggle publish status
const togglePublishStatus = asyncHandler(async (req,res) => {
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "video id not available")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished =  !video.isPublished

    await video.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,video.isPublished, "Video publish status updated successfully"))
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}