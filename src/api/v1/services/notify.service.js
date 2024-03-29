"use strict";
const Notify = require("../models/notify.model");
const Comment = require("../models/comment.model");
const _ = require("lodash");

const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");

class NotifyService {
  static getAllNotifyByUserId = async (
    { recipientId },
    { page, batchSize }
  ) => {
    console.log(">>> NotifyService getAllNotifyByUserId <<<", recipientId);
    console.log(">>> NotifyService getAllNotifyByUserId <<<", page, batchSize);

    let query = {};
    if (recipientId) {
      query.recipient = recipientId;
    }

    const skip = (parseInt(page) - 1) * parseInt(batchSize);

    const notifyByRecipientId = await Notify.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(batchSize))
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

    const unreadNotifyCount = await Notify.countDocuments({
      recipient: recipientId,
      read: false,
    });
    const totalCount = await Notify.countDocuments(query);

    return {
      data: notifyByRecipientId,
      count: { unreadNotifyCount, totalCount },
    };
  };

  static getAllUnreadNotifyByUserId = async (
    { recipientId },
    { page, batchSize }
  ) => {
    console.log(
      ">>> NotifyService getAllUnreadNotifyByUserId <<<",
      recipientId
    );
    console.log(
      ">>> NotifyService getAllUnreadNotifyByUserId <<<",
      page,
      batchSize
    );

    let query = {};
    if (recipientId) {
      query.recipient = recipientId;
    }

    const unreadNotifyCount = await Notify.countDocuments({
      recipient: recipientId,
      read: false,
    });
    const unseenNotifyCount = await Notify.countDocuments({
      recipient: recipientId,
      seen: false,
    });
    const totalCount = await Notify.countDocuments(query);

    return {
      data: { unreadNotifyCount, unseenNotifyCount, totalCount },
    };
  };

  static addNotify = async ({
    sender,
    recipient,
    movieId: movie,
    commentId: comment,
    text: content,
  }) => {
    console.log(">>> NotifyService addNotify: <<<", {
      sender,
      recipient,
      movie,
      comment,
      content,
    });

    // Tạo thông báo
    const notification = new Notify({
      movie,
      comment,
      sender, // Người gửi thông báo
      recipient, // Người nhận thông báo
      content,
    });

    // // Lưu thông báo vào MongoDB
    if (!notification) {
      throw new BadRequestError("not have new notification");
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

    return {
      data: populatedNotify,
    };
  };

  static updateNotifyRead = async ({ notifyId }) => {
    console.log(">>> NotifyService updateNotifyRead: <<<", notifyId);

    const updatedNotifyRead = await Notify.findByIdAndUpdate(
      { _id: notifyId },
      { read: true },
      { new: true }
    );

    console.log(updatedNotifyRead);

    if (!updatedNotifyRead) {
      throw new BadRequestError("Không có thông báo để cập nhật");
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

    return {
      data: populatedNotify,
    };
  };

  static updateNotifySeen = async ({ userId }) => {
    console.log(">>> NotifyService updateNotifySeen: <<<", userId);

    const updatedNotifySeen = await Notify.updateMany(
      { recipient: userId },
      { $set: { seen: true } },
      { new: true }
    );

    console.log(updatedNotifySeen);

    if (!updatedNotifySeen) {
      throw new BadRequestError("Không có thông báo để cập nhật");
    }

    return {
      message: "Chỉnh sửa thành công",
    };
  };

  static deleteNotify = async ({ notifyId }) => {
    console.log(">>> NotifyService deleteNotify <<<", notifyId);

    const notifyDelele = await Notify.findByIdAndDelete(notifyId);
    console.log(notifyDelele);
    if (!notifyDelele) {
      throw new BadRequestError("Không có thông báo để xóa");
    }

    return {
      data: notifyId,
    };
  };
}

module.exports = NotifyService;
