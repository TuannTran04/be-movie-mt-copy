"use strict";

const User = require("../models/User");
const { initializeApp } = require("firebase/app");
// const sharp = require("sharp");
const config = require("../../../configs/firebase.config");
const admin = require("firebase-admin");
const app = initializeApp(config.firebaseConfig);
const bucket = admin.storage().bucket();

const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");

class UserService {
  static getAllUsers = async ({
    q: querySearch,
    page: currentPage,
    pageSize,
    filter,
  }) => {
    const { filterDisabled, filterSort, filterIsAdmin } = JSON.parse(filter);
    console.log(currentPage, pageSize, querySearch);
    console.log(">>> UserService filterDisabled: <<<", filterDisabled);
    console.log(">>> UserService filterSort: <<<", filterSort);
    console.log(">>> UserService filterSort: <<<", filterIsAdmin);

    let query = {};
    if (querySearch) {
      query.$or = [
        { username: { $regex: querySearch, $options: "i" } },
        { email: { $regex: querySearch, $options: "i" } },
        { familyName: { $regex: querySearch, $options: "i" } },
        { givenName: { $regex: querySearch, $options: "i" } },
      ];
    }

    if (filterDisabled) {
      query.disabled = filterDisabled;
    }
    if (filterIsAdmin) {
      query.isAdmin = filterIsAdmin;
    }

    const skip = (parseInt(currentPage) - 1) * parseInt(pageSize);

    const sortOption = {};
    if (Number(filterSort) === 0) {
      sortOption.createdAt = -1; // Sắp xếp theo thời gian tạo mới nhất
    } else if (Number(filterSort) === 1) {
      sortOption.createdAt = 1; // Sắp xếp theo thời gian tạo cũ nhất
    }

    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(pageSize))
      .sort(sortOption);
    // console.log(">>> SORT <<<", users);

    const totalCount = await User.countDocuments(query);
    // console.log(totalCount);

    return {
      data: {
        // countTotalObject: users.length,
        totalCount,
        users,
      },
    };
  };

  static disabledUser = async ({ accountId, toggleDisable }) => {
    console.log(">>> UserService disabledUser: <<<", accountId, toggleDisable);

    const disabledUser = await User.findByIdAndUpdate(
      { _id: accountId },
      {
        disabled: toggleDisable,
      }
    );
    // console.log(disabledUser);
    if (!disabledUser) {
      throw new BadRequestError("Không có user để cập nhật", 404);
    }
    return {
      message: "Cập nhật trường disabled thành công",
      // data: disabledUser,
    };
  };

  static deleteUser = async ({ id }) => {
    const userDeleted = await User.findByIdAndDelete(id);
    if (!userDeleted) {
      throw new BadRequestError("Không có user để xóa", 404);
    }
    return { message: "User deleted" };
  };

  static getFavoriteMovie = async (userId) => {
    const user = await User.findById(userId)
      .populate("loveMovie")
      .select("loveMovie");

    if (!user) {
      throw new BadRequestError("User not registered", 404);
    }
    return { user };
  };

  static getBookmarkMovie = async (userId) => {
    const user = await User.findById(userId)
      .populate("markBookMovie")
      .select("markBookMovie");

    if (!user) {
      throw new BadRequestError("User not registered", 404);
    }
    return { user };
  };

  static getSingleUser = async ({ username }) => {
    console.log(">>> getSingleUser <<<", username);

    const user = await User.find({
      username,
    });
    console.log(">>> getSingle: <<<", user);

    if (!user) {
      throw new BadRequestError("Không có user này", 404);
    }

    return {
      data: {
        countTotalObject: user.length,
        user,
      },
    };
  };

  static getFavoriteAndBookmarkMovie = async ({ userId }) => {
    console.log(">>> getFavoriteAndBookmarkMovie <<<", userId);
    const user = await User.findById(userId)
      .populate(["loveMovie", "markBookMovie"])
      .select("loveMovie markBookMovie");

    if (!user) {
      throw new BadRequestError("User not registered", 404);
    }
    return { user };
  };

  static getCheckFavMark = async ({ movieId, userId }) => {
    console.log(">>> UserService getTest <<<", movieId);
    console.log(">>> UserService getTest <<<", userId);

    const user = await User.find({
      _id: userId,
    });
    console.log(">>> getCheckFavMark: <<<", user);

    if (!user || !user.length > 0) {
      throw new BadRequestError("Không có user này", 404);
    }

    // Kiểm tra xem movieId có nằm trong loveMovie hoặc markBookMovie hay không
    const isMovieInFavorites = user[0].loveMovie.includes(movieId);
    const isMovieInMarkedBooks = user[0].markBookMovie.includes(movieId);

    return {
      data: {
        isMovieInFavorites,
        isMovieInMarkedBooks,
      },
    };
  };

  static updateInfoUser = async (
    { username, givenName, familyName, email, national, avatar },
    file,
    userId
  ) => {
    // console.log("test log update", req.body);
    // console.log(">>> check req multiple: <<<", file);

    let avatarURL = null;

    // if (avatar) {
    //   const newFileName = `imgUser/${username}/${avatar}`;

    //   const existingFile = bucket.file(newFileName);
    //   // Delete the existing file from Firebase Storage
    //   await existingFile.delete();
    // }

    if (file) {
      // Upload file to Firebase Storage
      const newFileName = `imgUser/${username}/${file.originalname}`;
      const file = bucket.file(newFileName);

      // Sử dụng sharp để giảm dung lượng của ảnh
      // const resizedBuffer = await sharp(file.buffer)
      //   .resize({ width: 500, height: 700 }) // Điều chỉnh kích thước theo ý muốn
      //   .toBuffer();

      await file.save(file.buffer, { contentType: file.mimetype });
      avatarURL = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      });
    }
    console.log("test log update", avatarURL);
    console.log("test log update", avatarURL?.[0] ?? avatar);

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        username,
        givenName,
        familyName,
        email,
        national,
        avatar: avatarURL?.[0] ?? avatar,
      },
      { new: true } // Trả về người dùng sau khi cập nhật
    );

    if (!updatedUser) {
      throw new BadRequestError("User not registered", 404);
    }

    // const { password, ...others } = updatedUser._doc;
    const { password, refreshToken, loveMovie, markBookMovie, ...others } =
      updatedUser._doc;

    return {
      data: {
        ...others,
      },
    };
  };
}

module.exports = UserService;
