const Category = require("../models/Category");
const Movie = require("../models/Movie");
const User = require("../models/User");
const AppError = require("../utils/appError");

const categoryController = {
  addCategory: async (req, res) => {
    try {
      const cate = new Category({ ...req.body });
      if (!cate) {
        throw new AppError("not have new cate", 401);
      }
      const savedCate = await cate.save();
      res.status(200).json({
        code: 200,
        message: "Thêm thể loại thành công",
        data: savedCate,
      });
    } catch (err) {
      console.log("check err", err);
      throw new AppError(err.message, err.status);
    }
  },

  getAllCategory: async (req, res) => {
    try {
      const cate = await Category.find({ disabled: false }).limit(10);
      // console.log(cate);
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
  getAllCateByAdmin: async (req, res) => {
    let { q: querySearch } = req.query;
    const { page: currentPage, pageSize } = req.query;
    const { filter } = req.query;
    const { filterDisabled, filterSort } = JSON.parse(filter);
    console.log(currentPage, pageSize, querySearch);
    console.log(">>> filterDisabled: <<<", filterDisabled);
    console.log(">>> filterSort: <<<", filterSort);
    try {
      let query = {};
      if (querySearch) {
        query.$or = [
          { name: { $regex: querySearch, $options: "i" } },
          { slug: { $regex: querySearch, $options: "i" } },
        ];
      }

      if (filterDisabled) {
        query.disabled = filterDisabled;
      }

      const skip = (parseInt(currentPage) - 1) * parseInt(pageSize);

      const sortOption = {};
      if (Number(filterSort) === 0) {
        sortOption.createdAt = -1; // Sắp xếp theo thời gian tạo mới nhất
      } else if (Number(filterSort) === 1) {
        sortOption.createdAt = 1; // Sắp xếp theo thời gian tạo cũ nhất
      }

      const cate = await Category.find(query)
        .skip(skip)
        .limit(parseInt(pageSize))
        .sort(sortOption);
      // console.log(">>> SORT <<<", cate);
      if (!cate) {
        throw new AppError("not have new cate", 401);
      }

      const totalCount = await Category.countDocuments(query);
      // console.log(totalCount);

      res.status(200).json({
        code: 200,
        mes: "Lấy danh sách thể loại thành công",
        data: {
          totalCount,
          cate,
        },
      });
    } catch (err) {
      console.log("check err", err);
      throw new AppError(err.message, err.status);
    }
  },
  updateCategory: async (req, res) => {
    console.log(">>> updateCategory: <<<", req.body);
    try {
      const updatedCate = await Category.findOneAndUpdate(
        { _id: req.body.id },
        {
          ...req.body,
        },
        { new: true }
      );

      if (!updatedCate) {
        throw new AppError("Không có thể loại để cập nhật", 401);
      }
      res.status(200).json({
        message: "Cập nhật thể loại thành công",
        // data: updatedCate,
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
  disabledCategory: async (req, res) => {
    console.log(">>> disabledCategory: <<<", req.body);
    const { cateId, toggleDisable } = req.body;
    try {
      const disabledCategory = await Category.findByIdAndUpdate(
        { _id: cateId },
        {
          disabled: toggleDisable,
        }
      );
      // console.log(disabledCategory);
      if (!disabledCategory) {
        throw new AppError("Không có phim để cập nhật", 401);
      }
      res.status(200).json({
        message: "Cập nhật trường disabled thành công",
        // data: disabledCategory,
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
  //DELETE CATEGORY
  deleteCategory: async (req, res) => {
    console.log(">>> deleteCategory <<<", req.params.id);
    try {
      const cateDeleted = await Category.findByIdAndDelete(req.params.id);
      console.log(cateDeleted);
      if (!cateDeleted) {
        throw new AppError("Không có thể loại để xóa", 401);
      }
      return res.status(200).json("Category deleted");
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  getSingleAdmin: async (req, res) => {
    console.log(req.params.slug);
    try {
      const cateSingle = await Category.find({
        slug: req.params.slug,
      });
      console.log(">>> getSingle: <<<", cateSingle);

      if (!cateSingle) {
        throw new AppError("Không có phim này", 404);
      }

      return res.status(200).json({
        code: 200,
        mes: "ok",
        data: {
          countTotalObject: cateSingle.length,
          cateSingle,
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
};

module.exports = categoryController;
