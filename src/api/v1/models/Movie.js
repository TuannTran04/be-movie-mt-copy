const mongoose = require("mongoose");
require("@mongoosejs/double");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
    },
    titleWithoutAccent: { type: String, require: true },
    slug: String,
    desc: {
      type: String,
      require: true,
      min: 6,
    },
    author: [String],
    authorWithoutAccent: [String],
    actors: [String],
    actorsWithoutAccent: [String],
    photo: [String],
    awards: {
      type: [String],
      default: [],
    },
    category: [{ type: mongoose.Types.ObjectId, ref: "Category" }],
    folderOnFirebase: String,
    video: [String],
    trailer: [String],
    rating: {
      type: mongoose.Schema.Types.Double,
      default: 0,
      min: 0,
      max: 10,
    },
    views: {
      type: Number,
      default: 0,
    },
    listUserRating: [{ name: String, point: Number }],
    quality: {
      type: String,
      enum: {
        values: ["hd", "cam", "fullhd"],
        message: "Difficulty is either: hd, cam, fullhd",
      },
    },
    subtitles: [{ src: String, srcLang: String }],
    yearPublish: Number,
    timeVideo: String,
    country: String,
    disabled: {
      type: Boolean,
      default: false,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    // follows: [
    //   {
    //     type: Schema.Types.ObjectId, //HERE
    //     ref: "User",
    //   },
    // ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
