const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const logEvents = require("../helpers/logEvents");
// let refreshTokens = [];
// console.log("arr refresh token currenly", refreshTokens);

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
      // logEvents("err in catch register user " + err);
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
    // console.log(">>> generateAccessToken <<<", user);
    return jwt.sign(
      {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "24000s" }
    );
  },

  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "1d" }
    );
  },

  //LOGIN
  loginUser: async (req, res) => {
    try {
      const cookies = req.cookies;
      console.log(`cookie available at login: ${JSON.stringify(cookies)}`);

      const foundUser = await User.findOne({ email: req.body.email }).exec();
      // console.log(">>> USER: <<<", user);
      // logEvents("pass user login:" + req.body.password)
      if (!foundUser) {
        console.log(">>> USER DOESN'T EXIST <<<");
        // return res.status(404).json("Incorrect username");
        throw new AppError("Tài khoản không tồn tại", 404);
      }
      if (foundUser.disabled) {
        console.log(">>> Tài khoản user bị khóa <<<");
        throw new AppError("Tài khoản của bạn đã bị khóa", 403);
      }
      const validPassword = await bcrypt.compare(
        req.body.password,
        foundUser.password
      );
      console.log(">>> validPassword: <<<", validPassword);
      if (!validPassword) {
        console.log(">>> WRONG PASSWORD <<<");
        throw new AppError("Mật khẩu không đúng", 404);
      }
      if (foundUser && validPassword) {
        //Generate access token
        const accessToken = authController.generateAccessToken(foundUser);
        console.log(">>> login accessToken <<<", accessToken);
        //Generate refresh token
        const newRefreshToken = authController.generateRefreshToken(foundUser);
        console.log(">>> login newRefreshToken <<<", newRefreshToken);

        // console.log(">>> loginUser refreshToken <<<", refreshToken);
        // refreshTokens.push(refreshToken);

        // Changed to let keyword
        let newRefreshTokenArray = !cookies?.refreshTokenJWT
          ? foundUser.refreshToken
          : foundUser.refreshToken.filter(
              (rt) => rt !== cookies.refreshTokenJWT
            );
        console.log(">>> newRefreshTokenArray <<<", newRefreshTokenArray);

        if (cookies?.refreshTokenJWT) {
          console.log(">>> Scenario added here: <<<");
          /*
                Scenario added here:
                    1) User logs in but never uses RT and does not logout
                    2) RT is stolen
                    3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
                */
          const refreshToken = cookies.refreshTokenJWT;
          const foundToken = await User.findOne({ refreshToken }).exec();

          // Detected refresh token reuse!
          if (!foundToken) {
            console.log("attempted refresh token reuse at login!");
            // clear out ALL previous refresh tokens
            newRefreshTokenArray = [];
          }

          res.clearCookie("refreshTokenJWT", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
          });
        }

        // Saving refreshToken with current user
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        const result = await foundUser.save();
        console.log(">>> RESULT AUTH: <<<", result);

        //STORE REFRESH TOKEN IN COOKIE
        res.cookie("refreshTokenJWT", newRefreshToken, {
          httpOnly: true,
          secure: true,
          // path: "/",
          sameSite: "None",
          maxAge: 24 * 60 * 60 * 1000,
        });

        // console.log(">>> USER _DOC: <<<", user._doc);
        const { password, refreshToken, loveMovie, markBookMovie, ...others } =
          foundUser._doc;
        return res.status(200).json({
          code: 200,
          mes: "Đăng nhập thành công",
          data: {
            ...others,
            accessToken,
            // newRefreshToken,
          },
        });
      }
    } catch (err) {
      console.log(err);
      // logEvents(err + "err in catch login user");
      res.status(404).json({
        code: 404,
        mes: "error catch",
        err,
      });
    }
  },

  requestRefreshToken: async (req, res) => {
    //Take refresh token from user
    const cookies = req.cookies;
    console.log(">>> requestRefreshToken cookie: <<<", JSON.stringify(cookies));

    //Send error if token is not valid
    if (!cookies?.refreshTokenJWT) {
      console.log("You're not authenticated");
      return res.status(401).json("You're not authenticated");
    }
    const refreshToken = cookies.refreshTokenJWT;
    res.clearCookie("refreshTokenJWT", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    const foundUser = await User.findOne({
      refreshToken: refreshToken,
    }).exec();
    console.log(" >>> foundUser BEFORE check exist client <<<", refreshToken);
    console.log(" >>> foundUser BEFORE check exist <<<", foundUser);

    // Detected refresh token reuse!
    if (!foundUser) {
      console.log(
        ">>> refreshToken in not found user <<<",
        typeof refreshToken
      );
      console.log("Not found user via refreshToken Cookies");
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_KEY,
        async (err, decoded) => {
          if (err) {
            console.log("Fobidden requestRefreshToken");
            return res.sendStatus(403); //Forbidden
          }
          console.log("attempted refresh token reuse!");
          const hackedUser = await User.findOne({
            _id: decoded.id,
          }).exec();
          hackedUser.refreshToken = [];
          const result = await hackedUser.save();
          console.log(">>> hackedUser result: <<<", result);
        }
      );
      return res.sendStatus(403); //Forbidden
    }

    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );
    console.log(">>> Filter old RT 339: <<<", newRefreshTokenArray);

    // if (!refreshTokens.includes(refreshToken)) {
    //   console.log("Refresh token is not valid, not my token");
    //   return res.status(403).json("Refresh token is not valid, not my token");
    // }
    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, async (err, user) => {
      console.log(">>> user when verify RF <<<", user);
      console.log(
        ">>> DK when verify RF foundUser._id <<<",
        foundUser._id.toString()
      );
      console.log(">>> DK when verify RF user._id <<<", user?.id);
      console.log(
        ">>> DK when verify RF <<<",
        foundUser._id.toString() !== user?.id
      );
      console.log(">>> err when verify RF <<<", err);
      if (err) {
        console.log("expired refresh token");
        console.log(err);
        foundUser.refreshToken = [...newRefreshTokenArray];
        const result = await foundUser.save();
        console.log(result);
      }
      if (err || foundUser._id.toString() !== user.id) {
        console.log("fobidden last line");
        return res.sendStatus(403);
      }
      // refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

      console.log(">>> requestRefreshToken 369: <<<", user);
      //create new access token, refresh token and send to user

      const newAccessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
        },
        process.env.JWT_ACCESS_KEY,
        { expiresIn: "24000s" }
      );

      // const newRefreshToken = authController.generateRefreshToken(user);

      const newRefreshToken = jwt.sign(
        {
          id: foundUser._id,
          username: foundUser.username,
          isAdmin: foundUser.isAdmin,
        },
        process.env.JWT_REFRESH_KEY,
        { expiresIn: "1d" }
      );
      console.log(">>> requestRefreshToken 393: <<<", newRefreshToken);

      // Saving refreshToken with current user
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

      console.log(">>> Saving refreshToken 398 <<<", [
        ...newRefreshTokenArray,
        newRefreshToken,
      ]);
      const result = await foundUser.save();

      // refreshTokens.push(newRefreshToken);
      if (result) {
        console.log(">>> result 401 <<<", result);

        res.cookie("refreshTokenJWT", newRefreshToken, {
          httpOnly: true,
          secure: true,
          // path: "/",
          sameSite: "None",
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
          accessToken: newAccessToken,
          // refreshToken: newRefreshToken,
        });
      }
    });
  },

  //LOG OUT
  logOut: async (req, res) => {
    //Clear cookies when user logs out
    // refreshTokens = refreshTokens.filter((token) => token !== req.body.token);

    const cookies = req.cookies;
    console.log(">>> COOKIES LOGOUT: <<<", JSON.stringify(cookies));
    if (!cookies?.refreshTokenJWT) return res.sendStatus(204); //No content
    const refreshToken = cookies.refreshTokenJWT;

    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
      res.clearCookie("refreshTokenJWT", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });
      return res.sendStatus(204);
    }

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );
    const result = await foundUser.save();
    console.log(result);

    res.clearCookie("refreshTokenJWT", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

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
