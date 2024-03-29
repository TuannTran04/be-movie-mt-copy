"use strict";

const CommentV2 = require("../models/commentV2.model");
const _ = require("lodash");
const { ObjectId } = require("mongodb");

const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");

// >>>>> Materialised Path Model
class CommentServiceV2 {
  static getAllCommentV3 = async (
    { movieId },
    { nextCursor = "", limit = 100, batchSize }
  ) => {
    console.log(">>> CommentService getAllCommentByMovieId <<<", movieId);
    console.log(
      ">>> CommentService getAllCommentByMovieId <<<",
      nextCursor,
      typeof nextCursor,
      !!nextCursor
      // limit,
    );

    let query = {};
    if (movieId) {
      query.movieId = movieId;
      query.commentLevel = 1;
    }

    if (nextCursor) {
      query._id = { $lte: nextCursor };
    }

    const commentsByMovieId = await CommentV2.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(batchSize) + 1)
      .populate({
        path: "userId", // Field cần populate
        select: "username avatar isAdmin", // Chỉ lấy trường 'username' và 'avatar' của user
      })
      .lean();

    console.log("commentsByMovieId >>", commentsByMovieId);
    // console.log(
    //   "commentsByMovieId commentsByMovieId?.[batchSize]?.[_id] >>",
    //   commentsByMovieId?.[batchSize]?.["_id"]
    // );
    console.log(
      "commentsByMovieId commentsByMovieId.length >>",
      commentsByMovieId.length
    );

    if (commentsByMovieId.length <= batchSize) {
      nextCursor = ""; // hoặc bất kỳ giá trị nào bạn muốn gán khi không còn phần tử nào để lấy
    } else {
      nextCursor = commentsByMovieId[batchSize]?.["_id"]; // xác định lần sau mà gọi nữa thì dựa vào đây mà lấy
    }

    // // Lặp qua từng comment cha để đếm số lượng comment con
    for (const comment of commentsByMovieId) {
      // console.log("comment>>", comment);
      const childCount = await CommentV2.countDocuments({ path: comment._id });
      // Thêm số lượng comment con vào đối tượng comment cha
      comment.childCount = childCount;
    }

    commentsByMovieId.length = batchSize; // tra ve theo so luong batchSize

    const totalCount = await CommentV2.countDocuments({
      movieId: movieId,
      commentLevel: 1,
    });

    return {
      data: commentsByMovieId,
      count: totalCount,
      batchSize,
      nextCursor,
    };
  };

  static getAllCommentV2 = async (
    { movieId },
    { page, batchSize, lastReceivedCommentId }
  ) => {
    console.log(">>> CommentService getAllCommentByMovieId <<<", movieId);
    console.log(
      ">>> CommentService getAllCommentByMovieId <<<",
      page,
      batchSize,
      lastReceivedCommentId,
      typeof lastReceivedCommentId
    );

    let query = {};
    if (movieId) {
      query.movieId = movieId;
      query.commentLevel = 1;
    }

    const skip = (parseInt(page) - 1) * parseInt(batchSize);

    // if (lastReceivedCommentId != "undefined") {
    //   // const lastObjectId = new ObjectId(lastReceivedCommentId);
    //   query._id = { $lt: lastReceivedCommentId }; // Chỉ lấy các comment có _id nhỏ hơn lastReceivedCommentId
    //   console.log(
    //     ">>> CommentService lastReceivedCommentId <<<",
    //     lastReceivedCommentId,
    //     typeof lastReceivedCommentId
    //   );
    // }

    const commentsByMovieId = await CommentV2.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(batchSize))
      .populate({
        path: "userId", // Field cần populate
        select: "username avatar isAdmin", // Chỉ lấy trường 'username' và 'avatar' của user
      })
      .lean();

    // // Lặp qua từng comment cha để đếm số lượng comment con
    for (const comment of commentsByMovieId) {
      const childCount = await CommentV2.countDocuments({ path: comment._id });
      // Thêm số lượng comment con vào đối tượng comment cha
      comment.childCount = childCount;
    }

    // Lặp qua từng comment cha để đếm số lượng comment con
    // for (const comment of commentsByMovieId) {
    //   // Tìm một comment con của comment cha hiện tại
    //   const childComment = await CommentV2.findOne({ path: comment._id });

    //   // Nếu tìm thấy comment con, thì đếm là 1
    //   if (childComment) {
    //     comment.hasChildCmt = 1;
    //   } else {
    //     comment.hasChildCmt = 0;
    //   }
    // }

    const totalCount = await CommentV2.countDocuments(query);

    return {
      data: commentsByMovieId,
      count: totalCount,
    };
  };

  static getCommentInBranchV3 = async (
    { movieId, parentCommentId },
    { nextCursor, batchSize }
  ) => {
    console.log(
      ">>> CommentService getCommentInBranchV3 <<<",
      movieId,
      parentCommentId
    );
    console.log(
      ">>> CommentService getCommentInBranchV3 <<<",
      nextCursor,
      batchSize
    );

    let query = {};
    if (movieId) {
      query.movieId = movieId;
      query.commentLevel = 2;
      query.path = { $regex: new RegExp(`^${parentCommentId}`) };
    }
    if (nextCursor) {
      query._id = { $gte: nextCursor };
    }

    // Tìm tất cả các comment trong nhánh của comment cha
    const commentInBranch = await CommentV2.find(query)
      .sort({ createdAt: 1 })
      .limit(parseInt(batchSize) + 1)
      .populate({
        path: "userId", // Field cần populate
        select: "username avatar isAdmin", // Chỉ lấy trường 'username' và 'avatar' của user
      })
      .lean();
    console.log("commentInBranch >>", commentInBranch);

    if (commentInBranch.length <= batchSize) {
      nextCursor = ""; // hoặc bất kỳ giá trị nào bạn muốn gán khi không còn phần tử nào để lấy
    } else {
      nextCursor = commentInBranch[batchSize]?.["_id"]; // xác định lần sau mà gọi nữa thì dựa vào đây mà lấy
    }

    commentInBranch.length = batchSize; // tra ve theo so luong batchSize

    const totalCount = await CommentV2.countDocuments({
      movieId: movieId,
      commentLevel: 2,
      path: { $regex: new RegExp(`^${parentCommentId}`) },
    });

    return {
      data: commentInBranch,
      count: totalCount,
      nextCursorChild: nextCursor,
    };
  };

  static getCommentInBranchV2 = async (
    { movieId, parentCommentId },
    { page, batchSize }
  ) => {
    console.log(
      ">>> CommentService getCommentInBranchV2 <<<",
      movieId,
      parentCommentId
    );
    console.log(">>> CommentService getCommentInBranchV2 <<<", page, batchSize);

    let query = {};
    if (movieId) {
      query.movieId = movieId;
      query.commentLevel = 2; // muon get nhieu level thi comment dong` nay`
      query.path = { $regex: new RegExp(`^${parentCommentId}`) }; // có đường dẫn bắt đầu bằng "parentCommentId"
      //   query.path = { $regex: new RegExp(parentCommentId) }; // path co chua parentCommentId la duoc
      //   query.path = { $regex: new RegExp(`^${parentCommentId}\\.`) }; // có đường dẫn bắt đầu bằng "parentCommentId" theo sau bởi dấu chấm "."
    }

    const skip = (parseInt(page) - 1) * parseInt(batchSize);

    // Tìm tất cả các comment trong nhánh của comment cha
    const commentInBranch = await CommentV2.find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(batchSize))
      .populate({
        path: "userId", // Field cần populate
        select: "username avatar isAdmin", // Chỉ lấy trường 'username' và 'avatar' của user
      })
      .lean();

    const totalCount = await CommentV2.countDocuments(query);

    return {
      data: commentInBranch,
      count: totalCount,
    };
  };

  static addCommentV2 = async ({
    userId,
    movieId,
    parentCommentId = null,
    text,
  }) => {
    let path = "";
    let commentLevel = 1; // Mặc định là cấp độ 1 cho comment mới
    console.log(userId, movieId, parentCommentId, text);

    // Nếu comment mới là một phản hồi, xác định đường dẫn dựa trên comment cha
    if (parentCommentId) {
      const parentComment = await CommentV2.findById(parentCommentId);
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }
      path = parentComment.path
        ? `${parentComment.path}.${parentComment._id}`
        : parentComment._id;
      commentLevel = parentComment.commentLevel + 1; // Cập nhật cấp độ cho comment mới
    }

    // Tạo một comment mới với đường dẫn đã được xác định
    const newComment = new CommentV2({
      userId,
      movieId,
      content: text,
      path: path,
      commentLevel: commentLevel, // Thêm trường commentLevel để xác định cấp độ của comment
    });

    // Lưu comment vào cơ sở dữ liệu
    const commentStore = await newComment.save();

    // Populate thông tin người dùng và sau đó gửi sự kiện Socket.io
    const populatedComment = await CommentV2.populate(commentStore, [
      {
        path: "userId",
        select: "username avatar isAdmin",
      },
    ]);

    return {
      data: populatedComment,
    };
  };

  static updateCommentV2 = async ({ userId, movieId, commentId, text }) => {
    console.log(">>> updateCommentV2: <<<", {
      userId,
      movieId,
      commentId,
      text,
    });

    const updatedComment = await CommentV2.findOneAndUpdate(
      { _id: commentId },
      {
        userId,
        movieId,
        content: text,
      },
      { new: true }
    );

    if (!updatedComment) {
      throw new BadRequestError("Không có comment để cập nhật", 404);
    }

    const populatedComment = await CommentV2.populate(updatedComment, [
      {
        path: "userId",
        select: "username avatar isAdmin",
      },
    ]);

    // Cập nhật số lượng comment con của comment cha
    // const childCount = await CommentV2.updateChildCount(updatedComment._id);
    // populatedComment.childCount = childCount;
    // console.log("childCount>>", childCount);

    const childCount = await CommentV2.countDocuments({
      path: updatedComment._id,
    });
    populatedComment.childCount = childCount;
    console.log("childCount >>", childCount);

    return {
      data: populatedComment,
    };
  };

  static deleteCommentV2 = async ({ commentId }) => {
    console.log(">>> deleteCommentV2 <<<", commentId);

    const commentDelele = await CommentV2.findByIdAndDelete(commentId);
    console.log(commentDelele);
    if (!commentDelele) {
      throw new BadRequestError("Không có bình luận để xóa", 404);
    }

    // xoa cmt co path bắt đầu bằng "commentDelele._id" (TH cmt co 2 level do la` parent va children)
    if (commentDelele.commentLevel === 1) {
      // Xóa comment và tất cả các comment con của nó
      await CommentV2.deleteMany({
        path: { $regex: new RegExp(`^${commentDelele._id}`) },
      });
    }

    // xoa tat ca cmt co path chua id truyen vao Regex (TH cmt co nhieu level)
    // await CommentV2.deleteMany({
    //   path: { $regex: new RegExp(commentDelele._id) },
    // });

    return {
      data: commentId,
    };
  };
}

module.exports = CommentServiceV2;
