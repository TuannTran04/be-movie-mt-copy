const commentController = require("../controllers/commentController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");
const router = require("express").Router();

//GET ALL COMMENT BY MOVIE ID
router.get("/:movieId", commentController.getAllCommentByMovieId);
router.get(
  "/:commentId/reply-comment",
  commentController.getReplyCommentByCommentId
);

router.post("/add-comment", commentController.addComment);
router.post("/add-reply-comment", commentController.addReplyComment);

//UPDATE COMMENT
router.put("/update-comment", commentController.updateComment);
router.put("/update-reply-comment", commentController.updateReplyComment);

//DELETE COMMENT
router.delete("/delete-comment/:commentId", commentController.deleteComment);
router.delete(
  "/delete-reply-comment/:commentParentId/:commentId",
  commentController.deleteReplyComment
);

module.exports = router;
