const Movie = require("../models/Movie");
const User = require("../models/User");
const Comment = require("../models/Comment");
const AppError = require("../utils/appError");
const _ = require("lodash");
const { ObjectId } = require("mongodb");

// const { io } = require("../../../../server");

// Cấu hình Socket.IO
// const io = require("socket.io")();
// io.on("connection", (client) => {
//   console.log(client);
// });
// io.listen(8000);

// const socketManager = require("../utils/socketRT");

const commentController = {
  getAllCommentByMovieId: async (req, res) => {
    const { movieId } = req.params;
    console.log(">>> getAllCommentByMovieId <<<", movieId);
    try {
      let query = {};
      if (movieId) {
        query.movie = new ObjectId(movieId);
      }

      const commentsByMovieId = await Comment.find(query)
        .sort({ createdAt: -1 })
        .populate({
          path: "user", // Field cần populate
          select: "username avatar", // Chỉ lấy trường 'username' và 'avatar' của user
        })
        .populate({
          path: "replies.user", // Field cần populate cho các user trong replies
          select: "username avatar", // Chỉ lấy trường 'username' và 'avatar' của user
        });

      // _io.emit("cmt", "haha");

      res.status(200).json({
        code: 200,
        mes: "lấy comment thành công",
        data: commentsByMovieId,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  addComment: async (req, res) => {
    console.log(">>> addComment: <<<", req.body);
    const { userId: user, movieId: movie, text } = req.body;
    try {
      const newComment = new Comment({
        user,
        movie,
        text,
      });
      if (!newComment) {
        throw new AppError("not have new comment", 401);
      }
      const comment = await newComment.save();

      // Populate thông tin người dùng và sau đó gửi sự kiện Socket.io
      const populatedComment = await Comment.populate(comment, [
        {
          path: "user",
          select: "username avatar",
        },
      ]);

      // Gửi sự kiện Socket.io cho tất cả các clients khi có comment mới
      _io.emit("new-comment", populatedComment);

      res.status(200).json({
        message: "Thêm bình luận thành công",
      });
    } catch (err) {
      console.log("check err", err);
      // throw new AppError(err.message, err.status);
      res.status(404).json({
        code: 404,
        mes: "Lỗi!!!!",
        err,
      });
    }
  },
  addReplyComment: async (req, res) => {
    console.log(">>> addReplyComment: <<<", req.body);
    const { userId: user, commentId, text } = req.body;
    try {
      const reply = {
        text,
        user, // Sử dụng ID của người dùng từ request
        createdAt: new Date(),
      };

      // Tìm comment dựa trên ID và thêm reply vào mảng replies của comment
      const comment = await Comment.findByIdAndUpdate(
        commentId,
        { $push: { replies: reply } },
        { new: true }
      );

      if (!comment) {
        return res.status(404).json({ error: "Comment không tồn tại" });
      }

      const populatedComment = await Comment.populate(comment, [
        {
          path: "user",
          select: "username avatar",
        },
        {
          path: "replies.user",
          select: "username avatar",
        },
      ]);

      _io.emit("new-reply-comment", populatedComment);

      res.status(200).json({
        message: "Trả lời bình luận thành công",
      });
    } catch (err) {
      console.log("check err", err);
      // throw new AppError(err.message, err.status);
      res.status(404).json({
        code: 404,
        mes: "Lỗi!!!!",
        err,
      });
    }
  },
  updateComment: async (req, res) => {
    console.log(">>> updateComment: <<<", req.body);
    const { userId: user, movieId: movie, commentId, text } = req.body;
    try {
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
        throw new AppError("Không có comment để cập nhật", 401);
      }

      const populatedComment = await Comment.populate(updatedComment, [
        {
          path: "user",
          select: "username avatar",
        },
        {
          path: "replies.user",
          select: "username avatar",
        },
      ]);

      _io.emit("comment-updated", populatedComment);

      res.status(200).json({
        message: "Chỉnh sửa bình luận thành công",
      });
    } catch (err) {
      console.log("check err", err);
      // throw new AppError(err.message, err.status);
      res.status(404).json({
        code: 404,
        mes: "Lỗi!!!!",
        err,
      });
    }
  },
  updateReplyComment: async (req, res) => {
    console.log(">>> updateReplyComment: <<<", req.body);
    const { commentId, text } = req.body;
    try {
      const comment = await Comment.findOneAndUpdate(
        { "replies._id": commentId },
        { $set: { "replies.$.text": text } },
        { new: true }
      );

      if (!comment) {
        return res.status(404).json({ error: "Comment không tồn tại" });
      }

      const populatedComment = await Comment.populate(comment, [
        {
          path: "user",
          select: "username avatar",
        },
        {
          path: "replies.user",
          select: "username avatar",
        },
      ]);

      _io.emit("reply-comment-updated", populatedComment);

      res.status(200).json({
        message: "Chỉnh sửa bình luận thành công",
      });
    } catch (err) {
      console.log("check err", err);
      // throw new AppError(err.message, err.status);
      res.status(404).json({
        code: 404,
        mes: "Lỗi!!!!",
        err,
      });
    }
  },

  deleteComment: async (req, res) => {
    console.log(">>> deleteComment <<<", req.params.commentId);
    try {
      const commentDelele = await Comment.findByIdAndDelete(
        req.params.commentId
      );
      console.log(commentDelele);
      if (!commentDelele) {
        throw new AppError("Không có bình luận để xóa", 401);
      }

      _io.emit("comment-deleted", req.params.commentId);

      return res.status(200).json("Đã xóa bình luận");
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  deleteReplyComment: async (req, res) => {
    // console.log(">>> deleteReplyComment <<<", req.params.commentId);
    const { commentId, commentParentId } = req.params;
    console.log(">>> deleteReplyComment <<<", commentId, commentParentId);
    try {
      const comment = await Comment.findByIdAndUpdate(
        commentParentId,
        {
          $pull: { replies: { _id: commentId } }, // Xóa reply từ mảng replies
        },
        { new: true } // Trả về comment sau khi đã xóa reply
      );

      if (!comment) {
        return res.status(404).json({ message: "Không tìm thấy bình luận" });
      }

      console.log(">>> deleteReplyComment 2 <<<", commentId, commentParentId);
      _io.emit("reply-comment-deleted", { commentId, commentParentId });

      return res.status(200).json("Đã xóa bình luận");
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
};

module.exports = commentController;
