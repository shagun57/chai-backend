import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

//middleware to accept json data.
app.use(express.json({limit: "16kb"}))

//middleware to accept url data
app.use(express.urlencoded({extended: true, limit: "16kb"}))

//middleware for static files to store image, pdf etc.
app.use(express.static("public"));

//to use cookie parser
app.use(cookieParser())


//routes import

import userRouter from "./routes/user.routes.js"

//routes declaration

app.use("/api/v1/users", userRouter)


export {app}