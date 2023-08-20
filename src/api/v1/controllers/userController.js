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
      return res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = userController;
