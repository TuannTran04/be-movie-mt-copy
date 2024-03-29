const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema(
  {
    email: String,
    otp: String,
    time: { type: Date, default: Date.now, index: { expires: 60 } },
  },
  { collection: "otp" }
);

module.exports = mongoose.model("otp", otpSchema);
