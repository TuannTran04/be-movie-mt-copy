const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const AppError = require("../utils/appError");

let refreshTokens = [];
console.log("arr refresh token currenly", refreshTokens);

// Tạo một đối tượng transporter với các thông tin cấu hình SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tuantrann0402@gmail.com", // Địa chỉ email của bạn
    pass: "ykmzmkwgdoxvoaos", // Mật khẩu của bạn
  },
});
// Lưu các mã OTP tạm thời
const otpMap = new Map();
const OTP_EXPIRATION_SECONDS = 1000;
console.log(">>> OTP MAP: <<<", otpMap);

const authController = {
  //REGISTER
  registerUser: async (req, res) => {
    let { username, password, email } = req.body;
    try {
      if (!username) throw new AppError("lỗi không có username", 401);
      if (!email) throw new AppError("lỗi không có email", 401);
      if (!password) throw new AppError("lỗi không có password", 401);

      // check email, username exist
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        console.log("Email đã tồn tại");
        throw new AppError("Email đã tồn tại", 401);
      }
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        console.log("Username đã tồn tại");
        throw new AppError("Username đã tồn tại", 401);
      }

      //////////////////////////////////////////////////
      const otp = crypto.randomInt(100000, 999999).toString();
      // otpMap.set(email, otp);
      otpMap.set(email, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRATION_SECONDS * 1000,
      });

      await new Promise((resolve, reject) => {
        // verify connection configuration
        transporter.verify(function (error, success) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("Server is ready to take our messages");
            resolve(success);
          }
        });
      });

      // Cấu hình email thông báo đến người dùng
      const mailOptions = {
        from: "tuantrann0402@gmail.com",
        to: email, // Địa chỉ email của người dùng
        subject: "Your OTP for Registration", // Tiêu đề email
        html: `
        <p>Xin chào ${username}</p>
        <p>Cảm ơn bạn đã sử dụng web xem phim của chúng tôi – đỜ Tôn.</p>
        <p>Mã OTP của bạn là: ${otp}</p>
        <p>Thời gian tồn tại OTP: ${OTP_EXPIRATION_SECONDS}s</p>
        <p>Chúng tôi mong bạn có cuộc trải nghiệm xem phim vui vẻ.</p>
        <p>Trân trọng.</p>
        `, // Nội dung email
      };

      // Gửi email thông báo đến người dùng
      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            console.log(info);
            console.log("Email sent: " + info.response);
            resolve(info);
          }
        });
      });
      //////////////////////////////////////////////////

      console.log(">>> OTP MAP: <<<", otpMap);
      res.status(200).json({ otp: otp, message: "OTP gửi thành công" });
    } catch (err) {
      console.log(err);
      res.status(404).json({
        code: 404,
        mes: err,
      });
    }
  },
  registerVerifyUser: async (req, res) => {
    let { username, password, email, otp: userOtp } = req.body;
    console.log(username, password, email, userOtp);
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      console.log(">>> OTP MAP VERIFY: <<<", otpMap);

      const storedOTPInfo = otpMap.get(email);
      if (!storedOTPInfo) {
        throw new AppError("Không tìm thấy mã OTP cho email này", 400);
      }
      console.log(">>> saveOtp: <<<", storedOTPInfo);
      const { otp, expiresAt } = storedOTPInfo;
      const currentTime = Date.now();

      if (userOtp === otp && currentTime <= expiresAt) {
        //Create new user
        const newUser = new User({
          username,
          email,
          password: hashed,
        });
        const user = await newUser.save();
        otpMap.delete(email);

        //Save user to DB
        res.status(200).json({
          code: 200,
          mes: "Đăng ký thành công",
          data: user,
        });
      } else {
        // Mã OTP không khớp
        throw new AppError("Mã OTP đã hết hạn hoặc không hợp lệ", 400);
      }
    } catch (err) {
      console.log(err);
      res.status(404).json({
        code: 404,
        mes: err,
      });
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "10d" }
    );
  },

  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "365d" }
    );
  },

  //LOGIN
  loginUser: async (req, res) => {
    try {
      const user = await User.findOne({ username: req.body.username });
      console.log(">>> USER: <<<", user);
      if (!user) {
        console.log(">>> USER DOESN'T EXIST <<<");
        // return res.status(404).json("Incorrect username");
        throw new AppError("Tên đăng nhập không đúng", 404);
      }
      if (user.disabled) {
        console.log(">>> Tài khoản user bị khóa <<<");
        throw new AppError("Tài khoản của bạn đã bị khóa", 403);
      }
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      console.log(">>> validPassword: <<<", validPassword);
      if (!validPassword) {
        console.log(">>> WRONG PASSWORD <<<");
        throw new AppError("Mật khẩu không đúng", 404);
      }
      if (user && validPassword) {
        //Generate access token
        const accessToken = authController.generateAccessToken(user);
        //Generate refresh token
        const refreshToken = authController.generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        //STORE REFRESH TOKEN IN COOKIE
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });
        console.log(">>> USER _DOC: <<<", user._doc);
        const { password, ...others } = user._doc;
        return res.status(200).json({
          code: 200,
          mes: "Đăng nhập thành công",
          data: {
            ...others,
            accessToken,
            refreshToken,
          },
        });
      }
    } catch (err) {
      console.log(err);
      res.status(404).json({
        code: 404,
        mes: "error catch",
        err,
      });
    }
  },

  requestRefreshToken: async (req, res) => {
    //Take refresh token from user
    const refreshToken = req.cookies.refreshToken;
    //Send error if token is not valid
    if (!refreshToken) return res.status(401).json("You're not authenticated");
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json("Refresh token is not valid, not my token");
    }
    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
      if (err) {
        console.log(err);
      }
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
      //create new access token, refresh token and send to user
      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);
      refreshTokens.push(newRefreshToken);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });
      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });
  },

  //LOG OUT
  logOut: async (req, res) => {
    //Clear cookies when user logs out
    refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
    res.clearCookie("refreshToken");
    res.status(200).json("Logged out successfully!");
  },

  //CHANGE PWD USER
  forgotPwdUser: async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    console.log(">>> updatePwdUser :<<<", req.body);
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    try {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ code: 404, mes: "Email không tồn tại" });
      }

      //////////////////////////////////////////////////
      const otp = crypto.randomInt(100000, 999999).toString();
      // otpMap.set(email, otp);
      otpMap.set(email, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRATION_SECONDS * 1000,
      });

      await new Promise((resolve, reject) => {
        // verify connection configuration
        transporter.verify(function (error, success) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("Server is ready to take our messages");
            resolve(success);
          }
        });
      });

      // Cấu hình email thông báo đến người dùng
      const mailOptions = {
        from: "tuantrann0402@gmail.com",
        to: email, // Địa chỉ email của người dùng
        subject: "Your OTP for Registration", // Tiêu đề email
        html: `
          <p>Cảm ơn bạn đã sử dụng web xem phim của chúng tôi – đỜ Tôn.</p>
          <p>Mã OTP của bạn là: ${otp}</p>
          <p>Thời gian tồn tại OTP: ${OTP_EXPIRATION_SECONDS}s</p>
          <p>Chúng tôi mong bạn có cuộc trải nghiệm xem phim vui vẻ.</p>
          <p>Trân trọng.</p>
        `, // Nội dung email
      };

      // Gửi email thông báo đến người dùng
      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            console.log(info);
            console.log("Email sent: " + info.response);
            resolve(info);
          }
        });
      });
      //////////////////////////////////////////////////

      console.log(">>> OTP MAP: <<<", otpMap);
      res.status(200).json({ otp: otp, message: "OTP gửi thành công" });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  },
  forgotPwdUserVerifyOTP: async (req, res) => {
    const { email, password, otp: userOtp } = req.body;
    console.log(">>> forgotPwdUserVerifyOTP :<<<", req.body);
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    try {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ code: 404, mes: "Email không tồn tại" });
      }
      console.log(">>> OTP MAP VERIFY: <<<", otpMap);

      const storedOTPInfo = otpMap.get(email);
      if (!storedOTPInfo) {
        throw new AppError("Không tìm thấy mã OTP cho email này", 400);
      }
      console.log(">>> saveOtp: <<<", storedOTPInfo);
      const { otp, expiresAt } = storedOTPInfo;
      const currentTime = Date.now();

      if (userOtp === otp && currentTime <= expiresAt) {
        //change pwd
        await User.updateOne({ email }, { password: hashed });
        otpMap.delete(email);

        return res.status(200).json({
          code: 200,
          mes: "Thay đổi mật khẩu thành công",
        });
      } else {
        // Mã OTP không khớp
        throw new AppError("Mã OTP đã hết hạn hoặc không hợp lệ", 400);
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  },
};

module.exports = authController;
