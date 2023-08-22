const User = require("../models/User");

const userController = {
  //GET ALL USER
  getAllUsers: async (req, res) => {
    try {
      const user = await User.find();
      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  //UPDATE INFO USER
  updateInfoUser: async (req, res) => {
    const { username, givenName, familyName, email, national, avatar } =
      req.body;

    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user.id },
        {
          username,
          givenName,
          familyName,
          email,
          national,
          avatar,
        },
        { new: true } // Trả về người dùng sau khi cập nhật
      );

      if (!updatedUser) {
        return res.status(404).json({ mes: "User not found" });
      }

      const { password, ...others } = updatedUser._doc;

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

  //DELETE A USER
  deleteUser: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User deleted");
    } catch (err) {
      res.status(500).json(err);
    }
  },
  getLoveMovie: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate("loveMovie")
        .select("loveMovie");
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
      console.log(">>> GET BOOKMARK MOVIE: <<<", user);
      return res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = userController;
