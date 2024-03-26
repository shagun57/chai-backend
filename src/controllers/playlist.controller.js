import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose, {isValidObjectId} from "mongoose";

const  createPlaylist = asyncHandler(async(req,res) => {
    try {
        const {name, description} = req.body
        if(!name) {
            throw new ApiError(400, "Name is required")
        }
    
        const newPlaylist = await Playlist.create({
            name: name,
            description: description,
            owner: req.user?._id
        })
    
        if(!newPlaylist){
            throw new ApiError(500, "Problem occured while creating playlist, Try again!")
        }
    
        return res
        .status(201)
        .json(new ApiResponse(201, newPlaylist, "Playlist created successfully"))
    } 
    catch (error) {
        throw new ApiError(500, "An error occured, please try again",error)
    }
})

const getUserPlaylists = asyncHandler(async(req,res) => {
    const {userId} = req.params

    if(isValidObjectId(userId)){
        throw new ApiError(400, "userId is not valid")
    }

    try {
        const playlists = await Playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField:"videos",
                    foreignField: "_id",
                    as: "videos",
                    pipeline: [
                        {
                            $match: {
                                isPublished: true
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    totalVideos: {
                        $size: "$videos"
                    },
                    $totalViews: {
                        $sum : "$videos.views"
                    }
                    
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    totalVideos: 1,
                    $totalViews: 1,
                    createdAt: 1,
                    updatedAt: 1
                    
                }
            }
        ])
    
        return res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
    } 
    
    catch (error) {
        throw new ApiError(500, "Something went worng while fetching playlists",  error)
    }
})

const getPlaylistById = asyncHandler(async(req,res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Please provide valid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found or it has been deleted by owner")
    }

    try {
        const playlistVideos = await Playlist.aggregate([
            {
                $match: {
                    _id : new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videosInThisPlaylist",
                    pipeline: [
                        {
                            $match: {
                                isPublished: true
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "playlistOwner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    totalVideos: {
                        $size: "$videosInThisPlaylist"
                    },
                    totalViews: {
                        $sum: "$videos.views"
                    },
                    owner: {
                        $first: "$playlistOwner"
                    }
                    
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalViews: 1,
                    totalVideos: 1,
                    owner: 1,
                    videosInThisPlaylist: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        createdAt: 1,
                    },
                    owner: {
                        username: 1,
                        avatar: 1
                    }
                }
            }
            
        ])
    
        return res
        .status(200)
        .json(new ApiResponse(200, playlistVideos,"Playlist fetched successfully"))
    } 
    
    catch (error) {
        throw new ApiError(500, "Error while fetching playlist videos, please try again.!")
    }
})

const addVideoToPlaylist = asyncHandler(async(req,res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid  playlistId")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid videoId")
    }

    const playlistExist = await Playlist.findById(playlistId)

    if(!playlistExist){
        throw new ApiError(404, "playlist doesnot exist, please create a new playlist")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Cannot find video")
    }

    if(playlistExist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only playlist owner can add videos")
    }

    const updatedplaylist = await Playlist.findByIdAndUpdate(playlistId,
        {$push: {videos: videoId}},
        {new: true})

        if(!updatedplaylist){
            throw new ApiError(500, "Failed to add video to playlist")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "Video added to playlist successfully"))
})

const removeVideoFromplaylist = asyncHandler(async(req,res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid  playlist ID");
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(200,"Invalid video Id")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId)

    if(!playlist){
        throw new ApiError(404, "This playlist does not exist")
    }

    if(!video){
        throw new ApiError(404, "Cant find the video")
    }

    if(playlist.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can remove videos from playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {$pull: {videos: videoId}},
        {new: true})

        return res
        .status(200)
        .json(new ApiResponse(200,updatedPlaylist, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "provide valid playlist Id")
    }

    const playlistToBeDeleted = await Playlist.findById(playlistId)

    if(!playlistToBeDeleted){
        throw new ApiError(404, "Playlist does not exist")
    }

    if(playlistToBeDeleted.owner.toString() == req.user?._id.toString()){
        await Playlist.findByIdAndDelete(playlistId)
        return res
        .status(200)
        .json(new ApiResponse(200, "Playlist deleted"))
    }
    else{
        throw new ApiError(400, "Only owner can delete the  playlist")
    }
})

const updatePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Provide valid  playlist id")
    }

    if(!name) {
        throw new ApiError(400, "Playlist name is required")
    }

    const playlistToUpdate = await Playlist.findById(playlistId)

    if(!playlistToUpdate){
        throw new ApiError(404, "Playlist Does Not Exist")
    }

    if(playlistToUpdate.owner.toString() == req.user?._id.toString()) {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistToUpdate._id,
            {$set: {name , description}},
            {new: true})

            return res
            .status(200)
            .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
    }
    else{
        throw new ApiError(400, "Only owner can update playlist")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromplaylist,
    deletePlaylist,
    updatePlaylist
}