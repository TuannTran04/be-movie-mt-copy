const mongoose = require("mongoose");

const replyCommentSchema = new mongoose.Schema(
  {
    text: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", replyCommentSchema);
