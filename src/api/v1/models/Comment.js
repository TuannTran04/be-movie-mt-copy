const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    text: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },
    replies: [
      {
        text: String,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: { type: Date },
      },
    ],
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
