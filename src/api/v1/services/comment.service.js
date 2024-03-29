"use strict";
const Comment = require("../models/comment.model");
const CommentV2 = require("../models/commentV2.model");
const _ = require("lodash");

const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");

class CommentService {
  static getAllCommentByMovieId = async ({ movieId }, { page, batchSize }) => {
    console.log(">>> CommentService getAllCommentByMovieId <<<", movieId);
    console.log(
      ">>> CommentService getAllCommentByMovieId <<<",
      page,
      batchSize
    );

    let query = {};
    if (movieId) {
      query.movie = movieId;
    }

    const skip = (parseInt(page) - 1) * parseInt(batchSize);

    const commentsByMovieId = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(batchSize))
      .populate({
        path: "user", // Field cần populate
        select: "username avatar isAdmin", // Chỉ lấy trường 'username' và 'avatar' của user
      })
      // .lean();
      .populate({
        path: "replies.user", // Field cần populate cho các user trong replies
        select: "username avatar isAdmin", // Chỉ lấy trường 'username' và 'avatar' của user
      });

    // Reset field 'replies' to an empty array for each comment
    // commentsByMovieId.forEach((comment) => {
    //   comment.replies = [];
    // });

    const totalCount = await Comment.countDocuments(query);

    return {
      data: commentsByMovieId,
      count: totalCount,
    };
  };

  static getReplyCommentByCommentId = async ({ commentId }, { page }) => {
    console.log(">>> CommentService getReplyCommentByCommentId <<<", commentId);
    console.log(">>> CommentService getReplyCommentByCommentId <<<", page);

    let query = {};
    if (commentId) {
      query._id = commentId;
    }

    const startIndex = (parseInt(page) - 1) * 1; // Lấy 1 phần tử tại vị trí chỉ định
    // const endIndex = startIndex + 1;
    // const replies = comment.replies.slice(startIndex, endIndex);
    // console.log(startIndex, endIndex);

    const comment = await Comment.findById(query, {
      replies: { $slice: [startIndex, 1] },
    }).populate({
      path: "replies.user", // Field cần populate cho các user trong replies
      select: "username avatar isAdmin", // Chỉ lấy trường 'username' và 'avatar' của user
    });
    const { replies, ...others } = comment._doc;

    console.log(">>> replies: <<<", comment);

    return {
      data: replies,
      // count: totalCount,
    };
  };

  static addComment = async ({ userId: user, movieId: movie, text }) => {
    console.log(">>> CommentService addComment: <<<", { user, movie, text });

    if (!user || !movie || !text) {
      throw new BadRequestError("Thiếu trường dữ liệu", 401);
    }
    const newComment = new Comment({
      user,
      movie,
      text,
    });
    if (!newComment) {
      throw new BadRequestError("not have new comment", 404);
    }
    const comment = await newComment.save();

    // Populate thông tin người dùng và sau đó gửi sự kiện Socket.io
    const populatedComment = await Comment.populate(comment, [
      {
        path: "user",
        select: "username avatar isAdmin",
      },
    ]);

    return {
      data: populatedComment,
    };
  };

  static addReplyComment = async ({ userId: user, commentId, text }) => {
    console.log(">>> CommentService addReplyComment: <<<", {
      user,
      commentId,
      text,
    });

    const reply = {
      text,
      user, // Sử dụng ID của người dùng từ request
      createdAt: new Date(),
    };

    // Tìm comment dựa trên ID và thêm reply vào mảng replies của comment
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $push: { replies: reply }, $inc: { repliesCount: 1 } },
      { new: true }
    );

    if (!comment) {
      throw new BadRequestError("Comment không tồn tại", 404);
    }

    const populatedComment = await Comment.populate(comment, [
      {
        path: "user",
        select: "username avatar isAdmin",
      },
      {
        path: "replies.user",
        select: "username avatar isAdmin",
      },
    ]);
    // const replyComment = populatedComment.replies[comment.replies.length - 1];

    return {
      data: populatedComment,
      // commentId: commentId,
    };
  };

  static updateComment = async ({
    userId: user,
    movieId: movie,
    commentId,
    text,
  }) => {
    console.log(">>> updateComment: <<<", { user, movie, commentId, text });

    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId },
      {
        user,
        movie,
        text,
      },
      { new: true }
    );

    if (!updatedComment) {
      throw new BadRequestError("Không có comment để cập nhật", 404);
    }

    const populatedComment = await Comment.populate(updatedComment, [
      {
        path: "user",
        select: "username avatar isAdmin",
      },
      {
        path: "replies.user",
        select: "username avatar isAdmin",
      },
    ]);

    return {
      data: populatedComment,
    };
  };

  static updateReplyComment = async ({ commentId, text }) => {
    console.log(">>> updateReplyComment: <<<", { commentId, text });

    const comment = await Comment.findOneAndUpdate(
      { "replies._id": commentId },
      { $set: { "replies.$.text": text } },
      { new: true }
    );

    if (!comment) {
      throw new BadRequestError("Comment không tồn tại", 404);
    }

    const populatedComment = await Comment.populate(comment, [
      {
        path: "user",
        select: "username avatar isAdmin",
      },
      {
        path: "replies.user",
        select: "username avatar isAdmin",
      },
    ]);

    return {
      data: populatedComment,
    };
  };

  static deleteComment = async ({ commentId }) => {
    console.log(">>> deleteComment <<<", commentId);

    const commentDelele = await Comment.findByIdAndDelete(commentId);
    console.log(commentDelele);
    if (!commentDelele) {
      throw new BadRequestError("Không có bình luận để xóa", 404);
    }

    return {
      data: commentId,
    };
  };

  static deleteReplyComment = async ({ commentId, commentParentId }) => {
    // console.log(">>> deleteReplyComment <<<", req.params.commentId);

    console.log(
      ">>> CommentService deleteReplyComment <<<",
      commentId,
      commentParentId
    );

    const comment = await Comment.findByIdAndUpdate(
      commentParentId,
      {
        $pull: { replies: { _id: commentId } }, // Xóa reply từ mảng replies
        $inc: { repliesCount: -1 },
      },
      { new: true } // Trả về comment sau khi đã xóa reply
    );

    if (!comment) {
      throw new BadRequestError("Không tìm thấy bình luận", 404);
    }

    console.log(">>> deleteReplyComment 2 <<<", commentId, commentParentId);

    return {
      data: { commentId, commentParentId },
    };
  };
}

module.exports = CommentService;
