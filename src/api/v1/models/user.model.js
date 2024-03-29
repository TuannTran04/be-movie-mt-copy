// const mongoose = require("mongoose");
const { model, Types, Schema } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "UserV2";
const COLLECTION_NAME = "users";

const userSchema = new Schema(
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
    loveMovie: [{ type: Types.ObjectId, ref: "Movie" }],
    markBookMovie: [{ type: Types.ObjectId, ref: "Movie" }],
    disabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
      default: "inactive",
    },
    verify: {
      type: Schema.Types.Boolean,
      default: false,
    },
    roles: {
      type: Array,
      default: [],
    },
    refreshToken: [String],
  },
  { collection: COLLECTION_NAME, timestamps: true }
);

module.exports = model(DOCUMENT_NAME, userSchema);
