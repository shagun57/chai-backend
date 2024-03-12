import mongoose from "mongoose";
import jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true                  //when we have to search efficiently we use index field.
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        
            type: String,
            required: true,
            trim: true,
            index: true 
    },
    avatar: {
        type: String,  //cloudinary url 
        required: true,
    },
    coverImage: {
        type: String   // cloudinary url
    },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
},{timestamps: true})

//password hashing using pre
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next();
})


//custom methods to compare input password with existing password(isPasswordCorrect)
userSchema.methods.isPasswordCorrect = async function(password) {   
     return await bcrypt.compare(password, this.password)
}

//custom methods to generate access tokens
userSchema.methods.generateAccessTokens = function(){
   return jwt.sign(
        {
            _id : this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//custom method to create refresh tokens
userSchema.methods.generateRefreshTokens = function(){
    return jwt.sign(
        {
            _id : this._id
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema);