const User = require("../models/User");
const { initializeApp } = require("firebase/app");
const sharp = require("sharp");
const config = require("../../../config/firebase.config");
const admin = require("firebase-admin");
const app = initializeApp(config.firebaseConfig);
const bucket = admin.storage().bucket();

const userController = {
  //GET ALL USER
  getAllUsers: async (req, res) => {
    let { q: querySearch } = req.query;
    const { page: currentPage, pageSize } = req.query;
    const { filter } = req.query;
    const { filterDisabled, filterSort, filterIsAdmin } = JSON.parse(filter);
    console.log(currentPage, pageSize, querySearch);
    console.log(">>> filterDisabled: <<<", filterDisabled);
    console.log(">>> filterSort: <<<", filterSort);
    console.log(">>> filterSort: <<<", filterIsAdmin);
    try {
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

      res.status(200).json({
        code: 200,
        mes: "Lấy danh sách user thành công",
        data: {
          // countTotalObject: users.length,
          totalCount,
          users,
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  //UPDATE INFO USER
  updateInfoUser: async (req, res) => {
    const { username, givenName, familyName, email, national, avatar } =
      req.body;
    // console.log("test log update", req.body);
    // console.log(">>> check req multiple: <<<", req.file);

    try {
      let avatarURL = null;

      // if (avatar) {
      //   const newFileName = `imgUser/${username}/${avatar}`;

      //   const existingFile = bucket.file(newFileName);
      //   // Delete the existing file from Firebase Storage
      //   await existingFile.delete();
      // }

      if (req.file) {
        // Upload file to Firebase Storage
        const newFileName = `imgUser/${username}/${req.file.originalname}`;
        const file = bucket.file(newFileName);

        // Sử dụng sharp để giảm dung lượng của ảnh
        const resizedBuffer = await sharp(req.file.buffer)
          .resize({ width: 500, height: 700 }) // Điều chỉnh kích thước theo ý muốn
          .toBuffer();

        await file.save(resizedBuffer, { contentType: req.file.mimetype });
        avatarURL = await file.getSignedUrl({
          action: "read",
          expires: "03-09-2491",
        });
      }
      console.log("test log update", avatarURL);
      console.log("test log update", avatarURL?.[0] ?? avatar);

      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user.id },
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
        return res.status(404).json({ mes: "User not found" });
      }

      // const { password, ...others } = updatedUser._doc;
      const { password, refreshToken, loveMovie, markBookMovie, ...others } =
        updatedUser._doc;

      return res.status(200).json({
        code: 200,
        mes: "update success",
        data: {
          ...others,
        },
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  },

  disabledUser: async (req, res) => {
    console.log(">>> disabledUser: <<<", req.body);
    const { accountId, toggleDisable } = req.body;
    try {
      const disabledUser = await User.findByIdAndUpdate(
        { _id: accountId },
        {
          disabled: toggleDisable,
        }
      );
      // console.log(disabledUser);
      if (!disabledUser) {
        throw new AppError("Không có user để cập nhật", 401);
      }
      res.status(200).json({
        message: "Cập nhật trường disabled thành công",
        // data: disabledUser,
      });
    } catch (err) {
      console.log("check err", err);
      // throw new AppError(err.message, err.status);
      res.status(404).json({
        code: 404,
        mes: "Lỗi!!!!",
        err,
      });
    }
  },

  //DELETE A USER
  deleteUser: async (req, res) => {
    try {
      const userDeleted = await User.findByIdAndDelete(req.params.id);
      if (!userDeleted) {
        throw new AppError("Không có user để xóa", 401);
      }
      res.status(200).json("User deleted");
    } catch (err) {
      res.status(500).json(err);
    }
  },
  getFavoriteMovie: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate("loveMovie")
        .select("loveMovie");
      // console.log(">>> getLoveMovie <<<", user);
      return res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },
  getBookmarkMovie: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate("markBookMovie")
        .select("markBookMovie");
      // console.log(">>> GET BOOKMARK MOVIE: <<<", user);
      return res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },
  getFavoriteAndBookmarkMovie: async (req, res) => {
    try {
      console.log(">>> getFavoriteAndBookmarkMovie <<<", req.user.id);
      const user = await User.findById(req.user.id)
        .populate(["loveMovie", "markBookMovie"])
        .select("loveMovie markBookMovie");
      // console.log(">>> GET BOOKMARK MOVIE: <<<", user);
      return res.status(200).json(user);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  getSingleUser: async (req, res) => {
    console.log(">>> getSingleUser <<<", req.params.username);
    try {
      const user = await User.find({
        username: req.params.username,
      });
      console.log(">>> getSingle: <<<", user);

      if (!user) {
        throw new AppError("Không có user này", 404);
      }

      return res.status(200).json({
        code: 200,
        mes: "ok",
        data: {
          countTotalObject: user.length,
          user,
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
};

module.exports = userController;
