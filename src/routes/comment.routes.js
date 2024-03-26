import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
 } from "../controllers/comment.controller.js";

 const router = Router();

 router.use(verifyJWT)

 router.route("/:videoId").get(getVideoComments)
 router.route("/:videoId").post(addComment)
 router.route("/c/:commentId").patch(updateComment)
 router.route("/c/:commentId").delete(deleteComment)

 export default router