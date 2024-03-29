const _Otp = require("../models/otp.model");
const bcrypt = require("bcrypt");
// const logEvents = require("../helpers/logEvents");

const otpService = {
  validOtp: async ({ otp, hashOtp }) => {
    const isValid = await bcrypt.compare(otp, hashOtp);

    return isValid;
  },
  insertOtp: async ({ otp, email }) => {
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp, salt);

    const Otp = await _Otp.create({ email, otp: hashOtp });
    return Otp ? 1 : 0;
  },
};

module.exports = otpService;
