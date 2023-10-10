const Notification = require("../models/Notification");
const User = require("../models/User");
const Comment = require("../models/Comment");
const AppError = require("../utils/appError");
const _ = require("lodash");
const { ObjectId } = require("mongodb");

const commentController = {
  getAllNotifyByUserId: async (req, res) => {
    const { recipientId } = req.params;
    console.log(">>> getAllNotifyByUserId <<<", recipientId);
    try {
      let query = {};
      if (recipientId) {
        query.recipient = new ObjectId(recipientId);
      }

      const notifyByRecipientId = await Notification.find(query)
        .sort({ createdAt: -1 })
        .populate({
          path: "movie", // Field cần populate
          select: "slug photo", // Chỉ lấy trường 'username' và 'avatar' của user
        })
        .populate({
          path: "sender", // Field cần populate
          select: "username avatar", // Chỉ lấy trường 'username' và 'avatar' của user
        })
        .populate({
          path: "recipient", // Field cần populate cho các user trong replies
          select: "username avatar", // Chỉ lấy trường 'username' và 'avatar' của user
        });

      res.status(200).json({
        code: 200,
        mes: "lấy comment thành công",
        data: notifyByRecipientId,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  addNotify: async (req, res) => {
    console.log(">>> addNotify: <<<", req.body);
    const {
      sender,
      recipient,
      movieId: movie,
      commentId: comment,
      text: content,
    } = req.body;
    try {
      // Tạo thông báo
      const notification = new Notification({
        movie,
        comment,
        sender, // Người gửi thông báo
        recipient, // Người nhận thông báo
        content,
      });

      // // Lưu thông báo vào MongoDB
      if (!notification) {
        throw new AppError("not have new notification", 401);
      }
      const notifySave = await notification.save();

      // Populate thông tin người dùng và sau đó gửi sự kiện Socket.io
      const populatedNotify = await Comment.populate(notifySave, [
        {
          path: "sender",
          select: "username avatar",
        },
        {
          path: "recipient",
          select: "username avatar",
        },
        {
          path: "movie",
          select: "photo slug",
        },
      ]);

      res.status(200).json({
        message: "Thêm thành công",
        data: populatedNotify,
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
  updateNotifyRead: async (req, res) => {
    console.log(">>> updateNotifyRead: <<<", req.body);
    const { notifyId } = req.body;
    try {
      const updatedNotifyRead = await Notification.findByIdAndUpdate(
        { _id: notifyId },
        { read: true },
        { new: true }
      );

      console.log(updatedNotifyRead);

      if (!updatedNotifyRead) {
        throw new AppError("Không có thông báo để cập nhật", 401);
      }

      // Populate thông tin người dùng và sau đó gửi sự kiện Socket.io
      const populatedNotify = await Comment.populate(updatedNotifyRead, [
        {
          path: "sender",
          select: "username avatar",
        },
        {
          path: "recipient",
          select: "username avatar",
        },
        {
          path: "movie",
          select: "photo slug",
        },
      ]);

      res.status(200).json({
        message: "Chỉnh sửa thành công",
        data: populatedNotify,
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
  deleteNotify: async (req, res) => {
    console.log(">>> deleteNotify <<<", req.params.notifyId);
    try {
      const notifyDelele = await Notification.findByIdAndDelete(
        req.params.notifyId
      );
      console.log(notifyDelele);
      if (!notifyDelele) {
        throw new AppError("Không có thông báo để xóa", 401);
      }

      return res.status(200).json({
        message: "Đã xóa thông báo",
        data: req.params.notifyId,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
};

module.exports = commentController;
