const mongoose = require("mongoose");
const validator = require("validator");

const shotflixSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true,
      min: 6,
    },
    email: {
      type: String,
      max: 50,
      unique: true,
      required: [true, "Please provide your email"],
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    author: [String],
    photo: [String],
    logo: [String],

    keyword: [String],
    folderOnFirebase: String,
    yearEstablish: Number,
    locale: String,
    typeWeb: String,
    urlWeb: String,
    siteName: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shotflix", shotflixSchema);
