const { CREATED, SuccessResponse } = require("../core/success.response");
const MovieService = require("../services/movie.service");

class MovieController {
  updateViewsV2 = async (req, res) => {
    // const ipUser =
    //   req.headers["cf-connecting-ip"] ||
    //   req.headers["x-real-ip"] ||
    //   req.headers["x-forwarded-for"] ||
    //   req.socket.remoteAddress ||
    //   "";

    new SuccessResponse({
      message: "update view V2 movie Success",
      metadata: await MovieService.updateViewsV2(req.body),
    }).send(res);
  };

  updateViews = async (req, res) => {
    new SuccessResponse({
      message: "update view movie Success",
      metadata: await MovieService.updateViews(req.body),
    }).send(res);
  };

  getAllMovies = async (req, res) => {
    new SuccessResponse({
      message: "Get all movies Success",
      metadata: await MovieService.getAllMovies(),
    }).send(res);
  };

  getAllMoviesSiteMap = async (req, res) => {
    new SuccessResponse({
      message: "Get all movies sitemap Success",
      metadata: await MovieService.getAllMoviesSiteMap(),
    }).send(res);
  };

  getMoreMovies = async (req, res) => {
    new SuccessResponse({
      message: "Get more movies Success",
      metadata: await MovieService.getMoreMovies(req.query),
    }).send(res);
  };

  adminGetMovies = async (req, res) => {
    new SuccessResponse({
      message: "Get all admin movies Success",
      metadata: await MovieService.adminGetMovies(req.query),
    }).send(res);
  };

  getSearchMovies = async (req, res) => {
    new SuccessResponse({
      message: "Get search movies Success",
      metadata: await MovieService.getSearchMovies(req.query),
    }).send(res);
  };

  getMoviesByCate = async (req, res) => {
    new SuccessResponse({
      message: "Get movies by categaory Success",
      metadata: await MovieService.getMoviesByCate(req.query),
    }).send(res);
  };

  getSingleUser = async (req, res) => {
    new SuccessResponse({
      message: "Get single movie Success",
      metadata: await MovieService.getSingleUser(req.params),
    }).send(res);
  };

  getSingleAdmin = async (req, res) => {
    new SuccessResponse({
      message: "Get single movie Success",
      metadata: await MovieService.getSingleUser(req.params),
    }).send(res);
  };

  addMovie = async (req, res) => {
    new SuccessResponse({
      message: "add movie Success",
      metadata: await MovieService.addMovie(req.body),
    }).send(res);
  };

  addFavoriteMovie = async (req, res) => {
    new SuccessResponse({
      message: "add favorite movie Success",
      metadata: await MovieService.addFavoriteMovie(req.body),
    }).send(res);
  };

  addBookmarkMovie = async (req, res) => {
    new SuccessResponse({
      message: "add bookmark movie Success",
      metadata: await MovieService.addBookmarkMovie(req.body),
    }).send(res);
  };

  deleteFavoriteMovie = async (req, res) => {
    new SuccessResponse({
      message: "delete favorite movie Success",
      metadata: await MovieService.deleteFavoriteMovie(req.body),
    }).send(res);
  };

  deleteBookmarkMovie = async (req, res) => {
    new SuccessResponse({
      message: "delete bookmark movie Success",
      metadata: await MovieService.deleteBookmarkMovie(req.body),
    }).send(res);
  };

  rating = async (req, res) => {
    new SuccessResponse({
      message: "rating movie Success",
      metadata: await MovieService.rating(req.body),
    }).send(res);
  };

  updateMovie = async (req, res) => {
    new SuccessResponse({
      message: "update movie Success",
      metadata: await MovieService.updateMovie(req.body),
    }).send(res);
  };

  disabledMovie = async (req, res) => {
    new SuccessResponse({
      message: "disabled movie Success",
      metadata: await MovieService.disabledMovie(req.body),
    }).send(res);
  };

  deleteMovie = async (req, res) => {
    console.log(">>> movieService deleteMovie <<<", req.params.id);

    new SuccessResponse({
      message: "delete movie Success",
      metadata: await MovieService.deleteMovie(req.params.id),
    }).send(res);
  };
}

module.exports = new MovieController();
