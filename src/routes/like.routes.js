import { Router } from 'express';
import {
    toggleLike,
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").patch(toggleLike);
router.route("/toggle/v/:videoId").patch(toggleVideoLike);
router.route("/toggle/c/:commentId").patch(toggleCommentLike);
router.route("/toggle/t/:tweetId").patch(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router