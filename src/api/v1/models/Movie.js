const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
      min: 6,
    },
    desc: {
      type: String,
      require: true,
      min: 6,
    },
    author: {
      type: String,
      require: true,
      min: 6,
    },
    photo: [String],
    // category: [String],
    category: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
        required: [true, "Phải có category"],
      },
    ], // store array of id of category collections
    // follows: [
    //   {
    //     type: Schema.Types.ObjectId, //HERE
    //     ref: "User",
    //   },
    // ],
    video: [String],
    trailer: [String],
    rating: {
      type: Number,
      default: 0,
    },
    quality: {
      type: String,
      enum: {
        values: ["hd", "cam", "fullhd"],
        message: "Difficulty is either: hd, cam, fullhd",
      },
    },
    yearPublish: Number,
    timeVideo: String,
    country: String,
    actors: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
