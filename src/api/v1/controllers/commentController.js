const Movie = require("../models/Movie");
const User = require("../models/User");
const Comment = require("../models/Comment");
const AppError = require("../utils/appError");
const _ = require("lodash");
const { ObjectId } = require("mongodb");

const commentController = {
  getAllCommentByMovieId: async (req, res) => {
    const { movieId } = req.params;
    console.log(">>> getAllCommentByMovieId <<<", movieId);
    const { page, batchSize } = req.query;
    console.log(">>> getAllCommentByMovieId <<<", page, batchSize);
    try {
      let query = {};
      if (movieId) {
        query.movie = new ObjectId(movieId);
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

      res.status(200).json({
        code: 200,
        mes: "lấy comment thành công",
        data: commentsByMovieId,
        count: totalCount,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  getReplyCommentByCommentId: async (req, res) => {
    const { commentId } = req.params;
    console.log(">>> getReplyCommentByCommentId <<<", commentId);
    const { page } = req.query;
    console.log(">>> getReplyCommentByCommentId <<<", page);
    try {
      let query = {};
      if (commentId) {
        query._id = new ObjectId(commentId);
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

      res.status(200).json({
        code: 200,
        mes: "lấy comment thành công",
        data: replies,
        // count: totalCount,
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
          select: "username avatar isAdmin",
        },
      ]);

      res.status(200).json({
        message: "Thêm bình luận thành công",
        data: populatedComment,
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
        { $push: { replies: reply }, $inc: { repliesCount: 1 } },
        { new: true }
      );

      if (!comment) {
        return res.status(404).json({ error: "Comment không tồn tại" });
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

      res.status(200).json({
        message: "Trả lời bình luận thành công",
        data: populatedComment,
        // commentId: commentId,
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
          select: "username avatar isAdmin",
        },
        {
          path: "replies.user",
          select: "username avatar isAdmin",
        },
      ]);

      res.status(200).json({
        message: "Chỉnh sửa bình luận thành công",
        data: populatedComment,
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
          select: "username avatar isAdmin",
        },
        {
          path: "replies.user",
          select: "username avatar isAdmin",
        },
      ]);

      res.status(200).json({
        message: "Chỉnh sửa bình luận thành công",
        data: populatedComment,
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

      return res.status(200).json({
        message: "Đã xóa bình luận",
        data: req.params.commentId,
      });
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
          $inc: { repliesCount: -1 },
        },
        { new: true } // Trả về comment sau khi đã xóa reply
      );

      if (!comment) {
        return res.status(404).json({ message: "Không tìm thấy bình luận" });
      }

      console.log(">>> deleteReplyComment 2 <<<", commentId, commentParentId);

      return res.status(200).json({
        message: "Đã xóa bình luận",
        data: { commentId, commentParentId },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
};

module.exports = commentController;
