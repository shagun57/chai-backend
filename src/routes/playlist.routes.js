import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromplaylist,
    deletePlaylist,
    updatePlaylist} from "../controllers/playlist.controller.js";

    const router = Router();

    router.use(verifyJWT);

    router.route("/").post(createPlaylist)

    router.route("/user/:userId").get(getUserPlaylists)

    router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist)

    router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
    router.route("/remove/:videoId/:playlisId").patch(removeVideoFromplaylist)

    export default router;