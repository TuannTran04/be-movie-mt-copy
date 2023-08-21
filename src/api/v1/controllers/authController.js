const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

let refreshTokens = [];
console.log("arr refresh token currenly", refreshTokens);

const authController = {
  //REGISTER
  registerUser: async (req, res) => {
    let { username, password, email } = req.body;
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      //Create new user
      const newUser = await new User({
        username,
        email,
        password: hashed,
      });
      if (!username) throw new AppError("lỗi ko có newUser", 401);
      if (!email) throw new AppError("lỗi ko có email", 401);
      //Save user to DB
      const user = await newUser.save();
      res.status(200).json({
        code: 200,
        mes: "ok",
        data: user,
      });
    } catch (err) {
      res.status(404).json({
        code: 404,
        mes: "error catch",
      });
      // return throw new AppError("lỗi 505", 505);
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
        throw new AppError("incorrect", 404);
      }
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      console.log(">>> validPassword: <<<", validPassword);
      if (!validPassword) {
        console.log(">>> WRONG PASSWORD <<<");
        throw new AppError("incorrect", 404);
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
          mes: "ok",
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
};

module.exports = authController;
