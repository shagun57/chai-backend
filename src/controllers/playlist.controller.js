import { Playlist } from "../models/playlist.model";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import mongoose, {isValidObjectId} from "mongoose";

const  createPlaylist = asyncHandler(async(req,res) => {
    const {name, description} = req.body
})

const getUserPlaylists = asyncHandler(async(req,res) => {
    const {userId} = req.params
})

const getPlaylistById = asyncHandler(async(req,res) => {
    const {playlistId} = req.params
})

const addVideoToPlaylist = asyncHandler(async(req,res) => {
    const {playlistId, videoId} = req.params;
})

const removeVideoFromplaylist = asyncHandler(async(req,res) => {
    const {playlistId, videoId} = req.params;
})

const deletePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params
})

const updatePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
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