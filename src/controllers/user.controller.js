import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from  "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { jwt } from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        //find the user with user id.
        const user = await User.findById(userId)
        
        //generate tokens
        const accessToken = user.generateAccessTokens()
        const refreshToken = user.generateRefreshTokens()
        
        //save refresh token in database (user.refreshToken refers to refresh token field in DB)
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        //return refresh token and generate access token
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Server error while generating tokens");
    }
}

const registerUser = asyncHandler( async(req,res) => {
    //get user details
    const {fullName, email, username, password} = req.body;
    //console.log("email:", email);
    
    //check validations for fields if any empty
    if(fullName === ""){
        throw new ApiError(400, "Full name is required")
    }
    if(username === ""){
        throw new ApiError(400, "Username required")
    }
    if(password === ''){
        throw new ApiError(400, "Password is required")
    }
    if(email === ""){
        throw new ApiError(400, "Email address is required")
    }
    
    //check if username or email already exists
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }
    
    //check for avatar and coverImage
    //req.files from multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;   //optional chaining
    
    //check if avatar file is  uploaded successfully.
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }
    //upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //recheck if avatar is uploaded or not because its a compulsory field
    if(!avatar){
        throw new ApiError(400, "Avatar image is required");
    }
    
    //create user object and enter in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    //check if user is created or not and return user without password and refreshToken field using select 
    const createdUser = await User.findById(user._id)
    .select("-password -refreshToken")
     
    //check if user is created
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");
    }
    
    //return response with ApiResponse if user created successfully.  
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )

})

const loginUser = asyncHandler (async(req, res) => {

    //get user data email and password
     const {email, password} = req.body;
     console.log(email);

     //if email not entered
     if(!email && !password) {
        throw new ApiError(400, "Email and password are required");
     }

     //find email from database
     const user = await User.findOne({email})

     //if  no user found by this email then send error message
     if(!user) {
        throw new ApiError(404, "User does not exist");
     }

     //check password is right or not
     const isPasswordValid = await user.isPasswordCorrect(password);
     if(!isPasswordValid) {
        throw new ApiError(401,"Password is Incorrect")
     }

     //generate access and refresh tokens, we have to generate tokens multiple times so
     //we create method(generateAccessAndRefreshTokens) at top of file for reuse.

     const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

     //send cookies
     
     //it contains user info excluding password and refresh tokens
     const loggedInUser = await User.findById(user._id)
     .select("-password -refreshToken")
     //console.log(loggedInUser);

     //option object to send cookies. 
     //httpOnly and secure makes sure that cookies are modified only by server
     const options = {
        httpOnly: true,
        secure: true
     }

     const responseData = {
        user: {
            id: loggedInUser._id,
            email: loggedInUser.email,
            name: loggedInUser.fullName,
            username: loggedInUser.username,
            avatar: loggedInUser.avatar


        },
        refreshToken: refreshToken,
        accessToken: accessToken
     }

     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
        new ApiResponse(200, responseData, "User logged in successfully")
     )

}) 

//user logout, but we dont have access to user so we have create our middleware to clear
//the access tokens 
const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(
        //middleware auth will provide _id as user info is saved in req.user(see auth.middleware)
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }    
        },
        { 
            new:  true,   //return updated user data
        }
    )
    const options = {
        httpOnly: true,
        secure: true
     }
     return res
     .status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200,{}, "User logged out"))  //sending "" coz we dont want to send any data
})

//create new refresh token for user after session expiry
const refreshAccessToken = asyncHandler(async(req,res) => {
    //request refresh token from cookies(browser) or body(mobile)
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
    
    //if no refresh token
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access")
    }

    try {
        //decode the received refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        //find user by id using decoded token
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        // check if incoming token and refresh token(in DB) match
        if(incomingRefreshToken !==  user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        //generate new access and refresh tokens
        const {accessToken, NewRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", NewRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: NewRefreshToken},
                "New access Token Generated"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token')
    }
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    //get user's old and new password  from req body
    const {oldPassword, newPassword} = req.body

    //find user with auth middleware (it has info about user in req.user) and store it.
    const user = await User.findById(req.user?._id)

    //check if password is correct using custom bcrypt method(isPasswordCorrect in user model)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))


})

const getCurrentUser = asyncHandler(async(req,res) =>{
    const user = await User.findById(req.user?._id).select("-password -refreshToken")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User data retrieved"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = User.findByIdAndUpdate(req.user?._id,
        {$set:{fullName, email}},
        {new: true}).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200, user, "Updation succesfull"))
    
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{avatar: avatar.url}},
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated"))
})

const updateCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path
    
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{coverImage: coverImage.url}},
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image updated"))
})

export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateCoverImage
};