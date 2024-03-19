import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import { ApiError } from "./apiError.js";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        //console.log("File is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);    //delete local copy of image after its uploaded to cloudinary
        return  response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  //remove the locally saved temporary file as the upload got failed
        return null;
    }
}

const deleteOnCloudinary = async (avatarOldURL) => {
    try {
        if(!avatarOldURL) {
            return null
        }
        //spliting the url  to get the public id of the image in Cloudinary
        await cloudinary.uploader.destroy(avatarOldURL.split('/').pop().split('.')[0], (error) => {
            if(error) {
                throw new ApiError(402, 'Failed to delete avatar')
            }
        })
    } catch (error) {
        console.log("error in deleting file from cloudinary", error);
        return null
    }
}

export {uploadOnCloudinary,
        deleteOnCloudinary}

