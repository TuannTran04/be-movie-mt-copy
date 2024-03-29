const { CREATED, SuccessResponse } = require("../core/success.response");
const CategoryService = require("../services/category.service");

class CategoryController {
  getAllCategory = async (req, res) => {
    new SuccessResponse({
      message: "Get all category Success",
      metadata: await CategoryService.getAllCategory(),
    }).send(res);
  };

  getAllCateByAdmin = async (req, res) => {
    new SuccessResponse({
      message: "Get getAllCateByAdmin Success",
      metadata: await CategoryService.getAllCateByAdmin(req.query),
    }).send(res);
  };

  getSingleAdmin = async (req, res) => {
    new SuccessResponse({
      message: "Get getSingleAdmin Success",
      metadata: await CategoryService.getSingleAdmin(req.params.slug),
    }).send(res);
  };

  addCategory = async (req, res) => {
    new SuccessResponse({
      message: "addCategory Success",
      metadata: await CategoryService.addCategory(req.body),
    }).send(res);
  };

  updateCategory = async (req, res) => {
    new SuccessResponse({
      message: "updateCategory Success",
      metadata: await CategoryService.updateCategory(req.body),
    }).send(res);
  };

  disabledCategory = async (req, res) => {
    new SuccessResponse({
      message: "disabledCategory Success",
      metadata: await CategoryService.disabledCategory(req.body),
    }).send(res);
  };

  deleteCategory = async (req, res) => {
    new SuccessResponse({
      message: "deleteCategory Success",
      metadata: await CategoryService.deleteCategory(req.params.id),
    }).send(res);
  };
}

module.exports = new CategoryController();
