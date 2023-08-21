const Category = require("../models/Category");
const Movie = require("../models/Movie");
const User = require("../models/User");
const AppError = require("../utils/appError");

const categoryController = {
  addCategory: async (req, res) => {
    try {
      const cate = await new Category({ ...req.body });
      if (!cate) {
        throw new AppError("not have new cate", 401);
      }
      const savedCate = await cate.save();
      res.status(200).json({
        code: "ok",
        data: savedCate,
      });
    } catch (err) {
      console.log("check err", err);
      throw new AppError(err.message, err.status);
    }
  },

  getAllCategory: async (req, res) => {
    try {
      const cate = await Category.find().limit(10);
      if (!cate) {
        throw new AppError("not have new cate", 401);
      }
      res.status(200).json({
        code: "ok",
        data: cate,
      });
    } catch (err) {
      console.log("check err", err);
      throw new AppError(err.message, err.status);
    }
  },
};

module.exports = categoryController;
