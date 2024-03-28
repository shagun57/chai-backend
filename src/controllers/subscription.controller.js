import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

//subscribe or unsubscribe the channel
const togglesubscription = asyncHandler(async(req,res) => {
    const {channelId} = req.params

    //check if channel id provided is valid.
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Please provide valid channel Id")
    }

    //because channel is also a user so find channel inside users collection
    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    //check if user and channel id are same
    if(req.user?._id.toString() === channel._id.toString() ){
        throw new ApiError(400, "You cannot subscribe to yourself.")
    }

    //find  subscription of this user for this channel
    const subscriptionInfo = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    //if user is subscribed then unsubscribe
    if(subscriptionInfo){

        const unsubscribeChannel = await Subscription.findByIdAndDelete(subscriptionInfo?._id)
    

    if(!unsubscribeChannel) {
        throw new ApiError(500, "Something went wrong while unsubscribing")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,unsubscribeChannel,"Channel unsubscribed"))  
    }
    
    //if  user is not subscribed then subscribe
    else{
        const subscribeChannel = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })

        if(!subscribeChannel){
            throw new ApiError(500,"Something went wrong while subscribing")
        }

        return res.status(200).json(new ApiResponse(200,subscribeChannel,"Channel subscribed successfully"))
    }
})


//get  all subscriptions of user channel
const getUserChannelSubscribers = asyncHandler(async(req,res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Not  a valid object id")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    try {
        const subscribersList = await Subscription.aggregate([
            {
                $match: {
                    channel : new mongoose.Types.ObjectId(channelId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField:"subscriber",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        {
                            $project:{
                                fullName: 1,
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 1,
                    subscriber: 1,
                    channel: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "user.fullName": 1,
                    "user.username": 1,
                }
            }
        ])
    
        if(subscribersList.length === 0) {
            return res
            .status(200)
            .json(new ApiResponse(200, "Be the first one to subscribe to this channel"))
        }
    
        else{
            return res
            .status(200)
            .json(new ApiResponse(200, subscribersList,"Subscriber list fetched successfully"))
        }
    } 
    catch (error) {
        throw new ApiError(500, "Something went wrong while fetching the subscribers")
    }

    
    //another way of retrieving subscribers :---

    // const subscribers = await Subscription.find({channel: channel?._id}).populate('subscriber')

    // const subscriberCount = await Subscription.countDocuments({channel: channelId})

    // return res
    // .status(200)
    // .json(new ApiResponse(200,{subscriberCount, subscribers},"subscribers retrieval success"))
})

//get list of channels user is subscribed to
const getsubscribedChannels = asyncHandler(async(req,res) => {
    const {subscriberId} = req.params

    if(isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid id")
    }

    const channel = await User.findById(subscriberId)

    if(!channel) {
        throw new ApiError(404, "Channel does not exist")
    } 

    try {
        const channelsList = await Subscription.aggregate([
            {
                $match: {
                    subscriber : new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channels",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind:  "$channels"
            },
            {
                $project: {
                    _id: 1,
                    channel: 1,
                    subscriber: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "channels.username": 1,
                    "channels.fullName": 1
                }
            }
        ])
    
        if(channelsList.length === 0){
            return res
            .status(200)
            .json(new ApiResponse(200,"No channels found, Lets start by subscribing new channels"))
        }
    
        else{
            return res
            .status(200)
            .json(new ApiResponse(200, "Here's the list of subscribed channels"))
        }
    } catch (error) {
        throw new ApiError(500, "There was problem retrieving list, try again")
    }
})

export {
    togglesubscription,
    getUserChannelSubscribers,
    getsubscribedChannels
}