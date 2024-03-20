import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    deleteVideo,
    getAllVideos, 
    getVideoById, 
    publishVideo, 
    togglePublishStatus, 
    updateVideo} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//we want to verify user on all routes in video,
router.use(verifyJWT)

router.route("/get-all-videos").get(getAllVideos)

router.route("/publish-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo)

    router.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"),updateVideo)

    router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

    export default router;