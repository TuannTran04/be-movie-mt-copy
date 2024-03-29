const commentControllerV2 = require("../../controllers/comment.controller");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../../middleware/verifyToken");
const { asyncHandler } = require("../../middleware/asyncHandler");
const router = require("express").Router();

//GET ALL COMMENT BY MOVIE ID
router.get(
  "/getAllCmtV2/:movieId",
  // verifyToken,
  asyncHandler(commentControllerV2.getAllCommentV2)
);
router.get(
  "/getCmtInBranchV2/:movieId/:parentCommentId",
  // verifyToken,
  asyncHandler(commentControllerV2.getCommentInBranchV2)
);
router.get(
  "/:movieId",
  verifyToken,
  asyncHandler(commentControllerV2.getAllCommentByMovieId)
);
router.get(
  // version commentFilm not commentFilm2
  "/:commentId/reply-comment",
  asyncHandler(commentControllerV2.getReplyCommentByCommentId)
);

router.post(
  "/add-commentV2",
  verifyToken,
  asyncHandler(commentControllerV2.addCommentV2)
);
router.post(
  "/add-comment",
  verifyToken,
  asyncHandler(commentControllerV2.addComment)
);
router.post(
  "/add-reply-comment",
  verifyToken,
  asyncHandler(commentControllerV2.addReplyComment)
);

//UPDATE COMMENT
router.put(
  "/update-commentV2",
  verifyToken,
  asyncHandler(commentControllerV2.updateCommentV2)
);
router.put(
  "/update-comment",
  verifyToken,
  asyncHandler(commentControllerV2.updateComment)
);
router.put(
  "/update-reply-comment",
  verifyToken,
  asyncHandler(commentControllerV2.updateReplyComment)
);

//DELETE COMMENT
router.delete(
  "/delete-commentV2/:commentId",
  verifyToken,
  asyncHandler(commentControllerV2.deleteCommentV2)
);
router.delete(
  "/delete-comment/:commentId",
  verifyToken,
  asyncHandler(commentControllerV2.deleteComment)
);
router.delete(
  "/delete-reply-comment/:commentParentId/:commentId",
  verifyToken,
  asyncHandler(commentControllerV2.deleteReplyComment)
);

module.exports = router;
