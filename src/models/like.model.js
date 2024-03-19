import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    Comment: {
        type: mongoose.Schema.Types.model,
        ref: "Comment"
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet"
    }

    
},{timestamps: true})

export const Like = mongoose.model("Like", likeSchema)