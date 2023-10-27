const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: [true, "Please tell us your username"],
      min: 6,
      max: 20,
      unique: true,
    },
    email: {
      type: String,
      max: 50,
      unique: true,
      required: [true, "Please provide your email"],
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      require: true,
      min: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    givenName: {
      type: String,
    },
    familyName: {
      type: String,
    },
    national: {
      type: String,
    },
    avatar: {
      type: String,
    },
    loveMovie: [{ type: mongoose.Types.ObjectId, ref: "Movie" }],
    markBookMovie: [{ type: mongoose.Types.ObjectId, ref: "Movie" }],
    disabled: {
      type: Boolean,
      default: false,
    },
    refreshToken: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
