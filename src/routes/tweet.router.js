import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    publishTweet,
    updateTweet,
    deleteTweet,
    getUserTweets } from "../controllers/tweet.controller.js";


    const router = Router()

    router.use(verifyJWT)

    router.route("/").post(publishTweet)
    router.route("/:tweetId").patch(updateTweet)
    router.route("/:tweetId").delete(deleteTweet)
    router.route("/user/:userId").get(getUserTweets)

    export default router;
    