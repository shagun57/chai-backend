import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from  "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
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

export {registerUser};