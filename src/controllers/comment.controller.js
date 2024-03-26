import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const{page = 1, limit = 10} = req.query
})

//add a comment  to video
const addComment = asyncHandler(async(req,res) => {
    
    const {videoId} = req.params

    if(isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Please provide content fro comment")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content,
        owner: req.user?._id,
        video: videoId
    })

    const checkComment = await Comment.findById(comment._id)
    
    if(!checkComment){
        throw new ApiError(500, "Failed to add comment, please try agaim")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, checkComment, "Comment added successfully"))
})

const updateComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params
    const {content} = req.body
})

const deleteComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}