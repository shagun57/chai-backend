import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    togglesubscription,
    getUserChannelSubscribers,
    getsubscribedChannels 
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/c/:channelId").get(getUserChannelSubscribers)

router.route("/u/:subscriberId").get(getsubscribedChannels)

router.route("/c/:channelId").post(togglesubscription)

export default router;