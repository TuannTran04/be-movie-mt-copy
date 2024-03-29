"use strict";
const userModel = require("../models/user.model");
const User = require("../models/User");
const _Otp = require("../models/otp.model");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils/index");
const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");
const { insertOtp, validOtp } = require("./otp.service");
const { sendEmail } = require("../common/emailService");

const RoleUser = {
  USER: "00000",
  WRITER: "00001",
  EDITOR: "00002",
  ADMIN: "00003",
};

class AccessService {
  static signUp = async ({ username, email, password }) => {
    const existingUser = await userModel
      .findOne({
        $or: [{ email }, { username }],
      })
      .lean();

    if (existingUser) {
      // return { code: "xxxx", message: "User already registered!" };
      throw new BadRequestError("Error: User already registered!");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      username,
      email,
      password: passwordHash,
      roles: [RoleUser.USER],
    });

    if (newUser) {
      // created privateKey, publicKey
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      console.log({ privateKey, publicKey });

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newUser._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) {
        return {
          code: "xxxx",
          message: "keyStore error",
        };
      }

      // create token pair
      const tokens = await createTokenPair(
        {
          userId: newUser._id,
          username: newUser.username,
          email: foundUser.email,
          isAdmin: newUser.isAdmin,
        },
        publicKey,
        privateKey
      );

      console.log("created token success:", tokens);

      return {
        user: getInfoData({
          fields: ["_id", "username", "email"],
          object: newUser,
        }),
        tokens,
      };
    }

    return {
      code: 200,
      metadata: null,
    };
  };

  static login = async ({ email, password, rt = null }) => {
    //1 find shop

    const foundUser = await User.findOne({ email }).lean();
    if (!foundUser) throw new BadRequestError("User Not Registered");

    //2 match pass
    const match = await bcrypt.compare(password, foundUser.password);
    console.log("is match", match);
    if (!match) throw new AuthFailureError("Authentication Error");

    //3 created private, public
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    //4 geneate tokens
    const tokens = await createTokenPair(
      {
        userId: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        isAdmin: foundUser.isAdmin,
      },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      userId: foundUser._id,
      publicKey,
      privateKey,
      refreshToken: tokens.refreshtoken,
    });

    return {
      user: getInfoData({
        fields: ["_id", "username", "email"],
        object: foundUser,
      }),
      tokens,
    };
  };

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeTokenById({
      id: keyStore._id,
    });
    console.log("del key", delKey);
    return delKey;
  };

  static handlerRefreshToken = async ({ refreshToken, user, keyStore }) => {
    console.log("handlerRefreshToken refreshToken:::", refreshToken);
    console.log("handlerRefreshToken user:::", user);

    const { userId, email } = user;

    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong, warning!");
    }

    if (keyStore.refreshToken !== refreshToken) {
      // rt người dùng đưa vào và rt trong db đang dùng k giống nhau
      throw new AuthFailureError("User not registered");
    }

    // check userId
    const foundUser = await User.findOne({ email }).lean();
    if (!foundUser) {
      throw new AuthFailureError("User not registered 2");
    }

    // create 1 cap moi
    const tokens = await createTokenPair(
      {
        userId: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        isAdmin: foundUser.isAdmin,
      },
      keyStore.publicKey,
      keyStore.privateKey
    );

    // update token
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshtoken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, // da duoc su dung de lay token moi roi
      },
    });

    return {
      user,
      tokens,
    };
  };

  //////////////////////////////////////////////////////////////////////////

  static registerUser = async ({ username, password, email }) => {
    if (!username || !email || !password)
      throw new BadRequestError("Missing Params", 401);

    console.log("registerUser service::", username, password, email);
    // Check if email or username already exist
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existingUser) {
      throw new BadRequestError("Error: User already registered!", 401);
    }

    // init random otp
    const otp = crypto.randomInt(100000, 999999).toString();
    // insert otp in db
    const insertOtpService = await insertOtp({ otp, email });
    // send mail otp to user
    await sendEmail(email, username, otp);

    return {
      message: "OTP gửi thành công",
      otp,
      insertOtpService,
    };
  };

  static registerVerifyUser = async ({
    username,
    password,
    email,
    otp: userOtp,
  }) => {
    const otpHolder = await _Otp.find({ email });
    console.log("otpHolder boolean::", !!otpHolder);
    console.log("otpHolder boolean::", otpHolder);

    if (!otpHolder.length) {
      throw new BadRequestError("Mã OTP đã hết hạn hoặc không hợp lệ", 404);
    }
    const lastOtp = otpHolder[otpHolder.length - 1];
    const isValid = await validOtp({ otp: userOtp, hashOtp: lastOtp.otp });
    if (!isValid) {
      throw new BadRequestError("Không tìm thấy mã OTP cho email này", 401);
    }

    if (isValid && email === lastOtp.email) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      //Create new user
      const newUser = new User({
        username,
        email,
        password: hashed,
      });
      const user = await newUser.save();

      if (user) {
        await _Otp.deleteMany({ email });
      }

      return {
        message: "Đăng ký thành công",
      };
    }

    return null;
  };

  static loginUser = async ({ cookies, email, password, res }) => {
    console.log(`cookie available at login: ${JSON.stringify(cookies)}`);

    const foundUser = await User.findOne({ email }).exec();
    if (!foundUser) {
      throw new BadRequestError("Tài khoản không tồn tại");
    }
    if (foundUser.disabled) {
      throw new BadRequestError("Tài khoản của bạn đã bị khóa");
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    console.log(">>> validPassword: <<<", validPassword);
    if (!validPassword) {
      throw new AuthFailureError("Authentication Error");
    }

    //3 created private, public
    const publicKey = crypto.randomBytes(64).toString("hex");
    const privateKey = crypto.randomBytes(64).toString("hex");

    //4 geneate tokens
    const tokens = await createTokenPair(
      {
        userId: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        isAdmin: foundUser.isAdmin,
      },
      // publicKey,
      // privateKey
      process.env.JWT_ACCESS_KEY,
      process.env.JWT_REFRESH_KEY
    );

    const accessToken = tokens.accesstoken;
    const newRefreshToken = tokens.refreshtoken;
    console.log(">>> createTokenPair accessToken <<<", accessToken);
    console.log(">>> createTokenPair newRefreshToken <<<", newRefreshToken);

    // Changed to let keyword
    let newRefreshTokenArray = !cookies?.refreshTokenJWT
      ? foundUser.refreshToken
      : foundUser.refreshToken.filter((rt) => rt !== cookies.refreshTokenJWT);
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

      console.log("foundToken", refreshToken);
      console.log(
        "foundToken",
        foundToken?.refreshToken[foundToken.refreshToken.length - 1]
      );
      console.log(
        "foundToken",
        refreshToken !==
          foundToken?.refreshToken[foundToken.refreshToken.length - 1]
      );

      // Detected refresh token reuse!
      if (!foundToken) {
        console.log("attempted refresh token reuse at login!");
        // clear out ALL previous refresh tokens
        newRefreshTokenArray = [];
      }
      if (
        foundToken &&
        refreshToken !==
          foundToken.refreshToken[foundToken.refreshToken.length - 1]
      )
        console.log("attempted old refresh token reuse at login!");
      newRefreshTokenArray = [];

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

    // create key token save in dbs
    await KeyTokenService.createKeyToken({
      userId: foundUser._id,
      publicKey,
      privateKey,
      refreshToken: newRefreshToken,
    });

    //STORE REFRESH TOKEN IN COOKIE
    res.cookie("refreshTokenJWT", newRefreshToken, {
      httpOnly: true,
      secure: true,
      // path: "/",
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // console.log(">>> USER _DOC: <<<", user._doc);
    const {
      password: pwd,
      // refreshToken,
      loveMovie,
      markBookMovie,
      createdAt,
      updatedAt,
      __v,
      ...others
    } = foundUser._doc;

    return {
      ...others,
      accessToken,
    };
  };

  static requestRefreshToken = async ({ cookies, res, user, keyStore }) => {
    console.log(">>> requestRefreshToken cookie: <<<", JSON.stringify(cookies));

    //Send error if token is not valid
    if (!cookies) {
      console.log("You're not authenticated");
      throw new AuthFailureError("You're not authenticated");
    }
    const refreshToken = cookies;
    res.clearCookie("refreshTokenJWT", {
      // xem lai
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    const foundUser = await User.findOne({
      refreshToken,
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
      await jwt.verify(
        refreshToken,
        // keyStore.privateKey,
        process.env.JWT_REFRESH_KEY,
        async (err, decoded) => {
          if (err) {
            console.log("Fobidden requestRefreshToken");

            throw new BadRequestError("Forbidden 1");
          }
          console.log("attempted refresh token reuse!");
          const hackedUser = await User.findOne({
            _id: decoded.userId,
          }).exec();
          hackedUser.refreshToken = [];
          const result = await hackedUser.save();
          console.log(">>> hackedUser result: <<<", result);
        }
      );

      throw new BadRequestError("Forbidden 2");
    }

    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );
    console.log(">>> Filter old RT 339: <<<", newRefreshTokenArray);

    const AT = await jwt.verify(
      refreshToken,
      // keyStore.privateKey,
      process.env.JWT_REFRESH_KEY,
      async (err, user) => {
        console.log(">>> user when verify RF <<<", user);
        console.log(
          ">>> DK when verify RF foundUser._id <<<",
          foundUser._id.toString()
        );
        console.log(">>> DK when verify RF user._id <<<", user?.userId);
        console.log(
          ">>> DK when verify RF <<<",
          foundUser._id.toString() !== user?.userId
        );
        if (err) {
          console.log("expired refresh token");
          console.log(">>> err when verify RF <<<", err);
          foundUser.refreshToken = [...newRefreshTokenArray];
          const result = await foundUser.save();
          console.log(">>> result when delete all RT <<<", result);
        }
        if (err || foundUser._id.toString() !== user.userId) {
          console.log("fobidden last line");
          // return res.sendStatus(403);
          throw new BadRequestError("Fobidden last line");
        }

        console.log(">>> requestRefreshToken 369: <<<", user);

        // created private, public
        const publicKey = crypto.randomBytes(64).toString("hex");
        const privateKey = crypto.randomBytes(64).toString("hex");

        // create new access token, refresh token and send to user
        const tokens = await createTokenPair(
          {
            userId: foundUser._id,
            username: foundUser.username,
            email: foundUser.email,
            isAdmin: foundUser.isAdmin,
          },
          // keyStore.publicKey,
          // keyStore.privateKey
          process.env.JWT_ACCESS_KEY,
          process.env.JWT_REFRESH_KEY
        );
        const newAccessToken = tokens.accesstoken;
        const newRefreshToken = tokens.refreshtoken;
        console.log(">>> requestRefreshToken 393: <<<", newRefreshToken);

        // Saving refreshToken with current user
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

        console.log(">>> Saving refreshToken 398 <<<", [
          ...newRefreshTokenArray,
          newRefreshToken,
        ]);
        const result = await foundUser.save();

        console.log(">>> result 401 <<<", result);

        res.cookie("refreshTokenJWT", newRefreshToken, {
          httpOnly: true,
          secure: true,
          // path: "/",
          sameSite: "None",
          maxAge: 24 * 60 * 60 * 1000,
        });

        return {
          accessToken: newAccessToken,
        };
      }
    );

    console.log(">>> AT", AT);

    if (AT.accessToken) {
      return {
        ...AT,
      };
    }

    return {
      accessToken: null,
    };
  };

  static logOut = async ({ cookies, res, keyStore }) => {
    console.log(">>> COOKIES LOGOUT: <<<", JSON.stringify(cookies));
    if (!cookies) {
      // return {
      //   code: 204,
      //   message: "No content",
      // };
      console.log("You're not authenticated");
      throw new AuthFailureError("You're not authenticated");
    }

    const refreshToken = cookies;

    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
      res.clearCookie("refreshTokenJWT", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

      throw new BadRequestError("Fobidden");
      // return {
      //   code: 204,
      //   message: "No content",
      // };
    }

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );
    const result = await foundUser.save();
    console.log(result);
    // Delete keyStore in db
    // const delKey = await KeyTokenService.removeTokenById({
    //   id: keyStore._id,
    // });
    // Clear cookie at client browser
    res.clearCookie("refreshTokenJWT", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return null;
  };

  static forgotPwdUser = async ({ email, password, confirmPassword }) => {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError("User Not Registered");
    }

    // init random otp
    const otp = crypto.randomInt(100000, 999999).toString();
    // insert otp in db
    const insertOtpService = await insertOtp({ otp, email });
    // send mail otp to user
    await sendEmail(email, existingUser.username, otp);

    return {
      message: "OTP gửi thành công",
      otp,
      insertOtpService,
    };
  };

  static forgotPwdUserVerifyOTP = async ({ email, password, otp: userOtp }) => {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError("User Not Registered");
    }

    console.log(">>> existingUser", existingUser);

    const otpHolder = await _Otp.find({ email });

    console.log(">>> otpHolder", otpHolder);

    if (!otpHolder.length) {
      throw new BadRequestError("Mã OTP đã hết hạn hoặc không hợp lệ", 404);
    }
    const lastOtp = otpHolder[otpHolder.length - 1];
    const isValid = await validOtp({ otp: userOtp, hashOtp: lastOtp.otp });
    if (!isValid) {
      throw new BadRequestError("Không tìm thấy mã OTP cho email này", 401);
    }

    if (isValid && email === lastOtp.email) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      //change pwd
      await User.updateOne({ email }, { password: hashed });
      await _Otp.deleteMany({ email });

      return {
        message: "Thay đổi mật khẩu thành công",
      };
    }

    return null;
  };
}

module.exports = AccessService;
