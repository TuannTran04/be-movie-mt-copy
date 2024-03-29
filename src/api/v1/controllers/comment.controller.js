const { CREATED, SuccessResponse } = require("../core/success.response");
const CommentService = require("../services/comment.service");
const CommentServiceV2 = require("../services/commentV2.service");

class CommentController {
  getAllCommentV2 = async (req, res) => {
    new SuccessResponse({
      message: "get all comment v2 by movie id Success",
      metadata: await CommentServiceV2.getAllCommentV3(req.params, req.query),
    }).send(res);
  };

  getCommentInBranchV2 = async (req, res) => {
    new SuccessResponse({
      message: "get comment in branch v2 by movie id Success",
      metadata: await CommentServiceV2.getCommentInBranchV3(
        req.params,
        req.query
      ),
    }).send(res);
  };

  getAllCommentByMovieId = async (req, res) => {
    new SuccessResponse({
      message: "get all comment by movie id Success",
      metadata: await CommentService.getAllCommentByMovieId(
        req.params,
        req.query
      ),
    }).send(res);
  };

  getReplyCommentByCommentId = async (req, res) => {
    new SuccessResponse({
      message: "get reply comment by comment id Success",
      metadata: await CommentService.getReplyCommentByCommentId(
        req.params,
        req.query
      ),
    }).send(res);
  };

  addCommentV2 = async (req, res) => {
    new SuccessResponse({
      message: "add comment V2 Success",
      metadata: await CommentServiceV2.addCommentV2(req.body),
    }).send(res);
  };

  addComment = async (req, res) => {
    new SuccessResponse({
      message: "add comment Success",
      metadata: await CommentService.addComment(req.body),
    }).send(res);
  };

  addReplyComment = async (req, res) => {
    new SuccessResponse({
      message: "add reply comment Success",
      metadata: await CommentService.addReplyComment(req.body),
    }).send(res);
  };

  updateCommentV2 = async (req, res) => {
    new SuccessResponse({
      message: "update comment V2 Success",
      metadata: await CommentServiceV2.updateCommentV2(req.body),
    }).send(res);
  };

  updateComment = async (req, res) => {
    new SuccessResponse({
      message: "update comment Success",
      metadata: await CommentService.updateComment(req.body),
    }).send(res);
  };

  updateReplyComment = async (req, res) => {
    new SuccessResponse({
      message: "update reply comment Success",
      metadata: await CommentService.updateReplyComment(req.body),
    }).send(res);
  };

  deleteCommentV2 = async (req, res) => {
    new SuccessResponse({
      message: "delete comment v2 Success",
      metadata: await CommentServiceV2.deleteCommentV2(req.params),
    }).send(res);
  };

  deleteComment = async (req, res) => {
    new SuccessResponse({
      message: "delete comment Success",
      metadata: await CommentService.deleteComment(req.params),
    }).send(res);
  };

  deleteReplyComment = async (req, res) => {
    new SuccessResponse({
      message: "delete reply comment Success",
      metadata: await CommentService.deleteReplyComment(req.params),
    }).send(res);
  };
}

module.exports = new CommentController();
