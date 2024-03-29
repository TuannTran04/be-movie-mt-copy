"use strict";
const Category = require("../models/category.model");

const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");
const { getRedis } = require("../connections/init.redis");
const { getKeyString, setKeyString } = require("./redis.service");
const { instanceConnect: redisClient } = getRedis();

class CategoryService {
  static getAllCategory = async () => {
    let cateCache = await getKeyString(`dataCatesCache`);

    if (cateCache !== null) {
      const dataCateParse = JSON.parse(cateCache);
      console.log("dataCateParse >>", typeof dataCateParse);

      return {
        data: dataCateParse,
      };
    }

    const cate = await Category.find({ disabled: false }).limit(10);
    // console.log(cate);
    if (!cate) {
      throw new BadRequestError("Not have new category", 401);
    }

    await setKeyString({
      key: "dataCatesCache",
      value: cate,
      expire: 300,
    });

    return {
      data: cate,
    };
  };

  static getAllCateByAdmin = async ({
    q: querySearch,
    page: currentPage,
    pageSize,
    filter,
  }) => {
    const { filterDisabled, filterSort } = JSON.parse(filter);
    console.log(currentPage, pageSize, querySearch);
    console.log(">>> filterDisabled: <<<", filterDisabled);
    console.log(">>> filterSort: <<<", filterSort);

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
    if (!cate) {
      throw new BadRequestError("Not have new category", 401);
    }

    const totalCount = await Category.countDocuments(query);

    return {
      message: "Lấy danh sách thể loại thành công",
      totalCount,
      cate,
    };
  };

  static getSingleAdmin = async (slug) => {
    console.log(">>> CategoryService getSingleAdmin:::", slug);

    const cateSingle = await Category.find({
      slug,
    });
    console.log(">>> getSingle: <<<", cateSingle);

    if (!cateSingle) {
      throw new BadRequestError("Không có phim này", 401);
    }

    return {
      countTotalObject: cateSingle.length,
      cateSingle,
    };
  };

  static addCategory = async (data) => {
    console.log(">>> CategoryService addCategory:::", data);

    const cate = new Category({ ...data });
    if (!cate) {
      throw new BadRequestError("not have new cate", 401);
    }
    const savedCate = await cate.save();
    return {
      data: savedCate,
    };
  };

  static updateCategory = async (data) => {
    console.log(">>> CategoryService updateCategory:::", data);

    const updatedCate = await Category.findOneAndUpdate(
      { _id: data.id },
      {
        ...data,
      },
      { new: true }
    );

    if (!updatedCate) {
      throw new BadRequestError("Không có thể loại để cập nhật", 401);
    }
    return {
      message: "Cập nhật thể loại thành công",
      data: updatedCate,
    };
  };

  static disabledCategory = async ({ cateId, toggleDisable }) => {
    console.log(
      ">>> CategoryService disabledCategory::: <<<",
      cateId,
      toggleDisable
    );

    const disabledCategory = await Category.findByIdAndUpdate(
      { _id: cateId },
      {
        disabled: toggleDisable,
      }
    );
    // console.log(disabledCategory);
    if (!disabledCategory) {
      throw new BadRequestError("Không có thể loại để cập nhật", 401);
    }

    return {
      message: "Cập nhật trường disabled thành công",
      data: disabledCategory,
    };
  };

  static deleteCategory = async (cateId) => {
    console.log(">>> CategoryService deleteCategory::: <<<", cateId);

    const cateDeleted = await Category.findByIdAndDelete(cateId);
    console.log(cateDeleted);
    if (!cateDeleted) {
      throw new BadRequestError("Không có thể loại để xóa", 401);
    }
    return { message: "Category Deleted" };
  };
}

module.exports = CategoryService;
