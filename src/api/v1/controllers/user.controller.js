const { CREATED, SuccessResponse } = require("../core/success.response");
const UserService = require("../services/user.service");

class UserController {
  getAllUsers = async (req, res) => {
    new SuccessResponse({
      message: "get all users Success",
      metadata: await UserService.getAllUsers(req.query),
    }).send(res);
  };

  disabledUser = async (req, res) => {
    new SuccessResponse({
      message: "disabled user Success",
      metadata: await UserService.disabledUser(req.body),
    }).send(res);
  };

  deleteUser = async (req, res) => {
    new SuccessResponse({
      message: "delete user Success",
      metadata: await UserService.deleteUser(req.params),
    }).send(res);
  };

  getFavoriteMovie = async (req, res) => {
    new SuccessResponse({
      message: "get favorite movie user Success",
      metadata: await UserService.getFavoriteMovie(req.user.userId),
    }).send(res);
  };

  getBookmarkMovie = async (req, res) => {
    new SuccessResponse({
      message: "get bookmark movie user Success",
      metadata: await UserService.getBookmarkMovie(req.user.userId),
    }).send(res);
  };

  getSingleUser = async (req, res) => {
    new SuccessResponse({
      message: "get single info user Success",
      metadata: await UserService.getSingleUser(req.params),
    }).send(res);
  };

  getFavoriteAndBookmarkMovie = async (req, res) => {
    new SuccessResponse({
      message: "get favorite and bookmark movie Success",
      metadata: await UserService.getFavoriteAndBookmarkMovie(req.user.userId),
    }).send(res);
  };

  getCheckFavMark = async (req, res) => {
    new SuccessResponse({
      message: "get check favorite and bookmark movie Success",
      metadata: await UserService.getCheckFavMark(req.params),
    }).send(res);
  };

  updateInfoUser = async (req, res) => {
    new SuccessResponse({
      message: "update Info User Success",
      metadata: await UserService.updateInfoUser(
        req.body,
        req.file,
        req.user.userId
      ),
    }).send(res);
  };
}

module.exports = new UserController();
