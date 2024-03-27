import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const{page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Provide valid video Id")
    }

    const pageNumber = parseInt(page)
    const commentNumber = parseInt(limit)
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video  not found.")
    }

    try {
        const allComments = await Comment.aggregate([
            {
                $match:{
                    video : new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likeCount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    },
                    isLiked:{
                        $cond: {
                            if:{$in:[req.user?._id, "$likes.likedBy"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    likeCount: 1,
                    owner: {
                        username: 1,
                        "avatar.url": 1
                    },
                    isLiked: 1
    
                }
            },
            {
                $skip: (pageNumber-1) * commentNumber
            },
            {
                $limit: commentNumber
            }
        ])
    
        if(allComments.length === 0){
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "No comments found, be the first one to comment"))
        }
        else{
            return res
            .status(200)
            .json(new ApiResponse(200, allComments, "Comments retrieved successfully"))
        }
    } catch (error) {
            throw new ApiError(500, "Error in retrieving comments", error)
    }
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

//update the comment
const updateComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params
    const {content} = req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }

    if(!content) {
        throw new ApiError(400, "Please provide content to update comment")
    }

    const commentToUpdate = await Comment.findById(commentId)

    if(!commentToUpdate) {
        throw new ApiError(400, "No such comment exists")
    }

    if(commentToUpdate?.owner.toString() === req.user?._id.toString()){
        const updatedComment = await Comment.findByIdAndUpdate(commentToUpdate._id,
            {$set: {content}},{new: true})
            return res
            .status(200)
            .json(new ApiResponse(200, updatedComment,"Comment updated successfully"))
    }
    else{
        throw new ApiError(400,"Unauthorized request, only owner can edit this comment")
    }
})

//delete a comment
const deleteComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid  Comment ID provided")
    }

    const commentToDelete = await Comment.findById(commentId)

    if(!commentToDelete){
        throw new ApiError(404, "This comment does not exist")
    }

    if(commentToDelete?.owner.toString() === req.user?._id.toString()){
        await Comment.findByIdAndDelete(commentId)
        return res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted successfully"))
    }
    else{
        throw new ApiError(500, "Something went wrong while deleting comment")
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}