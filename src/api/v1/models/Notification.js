const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    content: String, // Nội dung thông báo
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến mô hình User (người gửi)
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến mô hình User (người nhận)
    },
    read: {
      type: Boolean,
      default: false, // Ban đầu thông báo chưa đọc
    },
    seen: {
      type: Boolean,
      default: false, // Ban đầu thông báo chưa xem
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
