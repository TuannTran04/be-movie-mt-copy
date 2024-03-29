const { CREATED, SuccessResponse } = require("../core/success.response");
const NotifyService = require("../services/notify.service");

class NotifyController {
  getAllNotifyByUserId = async (req, res) => {
    new SuccessResponse({
      message: "get all notify Success",
      metadata: await NotifyService.getAllNotifyByUserId(req.params, req.query),
    }).send(res);
  };

  getAllUnreadNotifyByUserId = async (req, res) => {
    new SuccessResponse({
      message: "get all unread notify Success",
      metadata: await NotifyService.getAllUnreadNotifyByUserId(
        req.params,
        req.query
      ),
    }).send(res);
  };

  addNotify = async (req, res) => {
    new SuccessResponse({
      message: "add notify Success",
      metadata: await NotifyService.addNotify(req.body),
    }).send(res);
  };

  updateNotifyRead = async (req, res) => {
    new SuccessResponse({
      message: "update notify read Success",
      metadata: await NotifyService.updateNotifyRead(req.body),
    }).send(res);
  };

  updateNotifySeen = async (req, res) => {
    new SuccessResponse({
      message: "update notify seen Success",
      metadata: await NotifyService.updateNotifySeen(req.body),
    }).send(res);
  };

  deleteNotify = async (req, res) => {
    new SuccessResponse({
      message: "delete notify seen Success",
      metadata: await NotifyService.deleteNotify(req.params),
    }).send(res);
  };
}

module.exports = new NotifyController();
