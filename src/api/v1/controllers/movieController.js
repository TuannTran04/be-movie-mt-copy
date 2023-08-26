const Movie = require("../models/Movie");
const User = require("../models/User");
const AppError = require("../utils/appError");
const _ = require("lodash");
const movieController = {
  getAllMovies: async (req, res) => {
    let { slug: slugName } = req.query;
    console.log(slugName);
    try {
      // 1. get all with limit
      //2. populate category

      //   const movie = await Movie.find({})
      //     .limit(req.query?.li || 10)
      //     .populate("category");
      let movie;
      if (slugName) {
        movie = await Movie.find({
          slug: { $regex: ".*" + slugName.replace(/-/g, " ") + ".*" },
        })
          .limit(req.query?.li || 10)
          .populate("category");
      } else {
        movie = await Movie.find()
          .limit(req.query?.li || 10)
          .populate("category");

        // console.log(">>> All Movies: <<<", movie[1].category);
      }
      res.status(200).json({
        code: 200,
        mes: "ok",
        data: {
          countTotalObject: movie.length,
          movie,
        },
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getSearchMovies: async (req, res) => {
    const query = req.query.q; // Chuỗi tìm kiếm
    console.log(">>> search query: <<<", query);
    try {
      const movies = await Movie.find({
        $or: [
          { title: { $regex: query, $options: "i" } }, // Tìm theo tên phim
          { author: { $regex: query, $options: "i" } }, // Tìm theo tên đạo diễn
          { actors: { $regex: query, $options: "i" } }, // Tìm theo tên diễn viên
        ],
      });

      if (movies.length === 0) {
        return res.json({ message: "Không có kết quả tìm kiếm" });
      }

      res.status(200).json({
        code: 200,
        mes: "Tìm kiếm thành công",
        data: {
          countTotalObject: movies.length,
          movies,
        },
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  addMovie: async (req, res) => {
    console.log(">>> addMovie: <<<", req.body);
    const author = req.body.author.split(",");
    const actors = req.body.actors.split(",");
    const video = req.body.video.split(",");
    const photo = req.body.photo.split(",");
    const category = req.body.category.map((item) => item.value);
    // console.log(author, actors, video, photo);
    console.log(category);
    try {
      const newMovie = await new Movie({
        ...req.body,
        author,
        actors,
        video,
        photo,
        category,
      });
      if (!newMovie) {
        throw new AppError("not have new movie", 401);
      }
      const movie = await newMovie.save();
      res.status(200).json({
        message: "Thêm phim thành công",
        data: movie,
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
  updateMovie: async (req, res) => {
    console.log(">>> addMovie: <<<", req.body);
    const author = req.body.author.split(",");
    const actors = req.body.actors.split(",");
    const video = req.body.video.split(",");
    const photo = req.body.photo.split(",");
    const category = req.body.category.map((item) => item.value);
    // console.log(author, actors, video, photo);
    console.log(category);
    try {
      const updatedMovie = await Movie.findOneAndUpdate(
        { title: req.user.id },
        {
          ...req.body,
          author,
          actors,
          video,
          photo,
          category,
        },
        { new: true } // Trả về người dùng sau khi cập nhật
      );

      if (!updatedMovie) {
        throw new AppError("Không có phim để cập nhật", 401);
      }
      res.status(200).json({
        message: "Cập nhật phim thành công",
        data: updatedMovie,
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
  //DELETE MOVIE
  deleteMovie: async (req, res) => {
    console.log(req.params);
    console.log(req.body);
    try {
      const res = await Movie.findByIdAndDelete(req.body.id);
      // console.log(res);
      if (!res) {
        throw new AppError("Không có phim để xóa", 401);
      }
      res.status(200).json("Movie deleted");
    } catch (err) {
      // console.log(err);
      res.status(500).json(err);
    }
  },
  addLoveMovie: async (req, res) => {
    let { userId, movieId, isLove } = req.body;
    console.log(">>> addLoveMovie: <<<", req.body);
    try {
      let result;
      if (isLove) {
        result = await User.updateOne(
          { _id: userId },
          { $push: { loveMovie: movieId } }
        );
      } else {
        result = await User.updateOne(
          { _id: userId },
          { $pull: { loveMovie: movieId } }
        );
      }
      return res.status(200).json({
        result,
      });
    } catch (err) {
      res.status(500).json(err);
    }
    console.log(req.body);
  },
  addBookmarkMovie: async (req, res) => {
    let { userId, movieId, isBookmark } = req.body;
    console.log(">>> addBookmarkMovie: <<<", req.body);
    try {
      let result;
      if (isBookmark) {
        result = await User.updateOne(
          { _id: userId },
          { $push: { markBookMovie: movieId } }
        );
      } else {
        result = await User.updateOne(
          { _id: userId },
          { $pull: { markBookMovie: movieId } }
        );
      }
      return res.status(200).json({
        result,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },
  rating: async (req, res) => {
    // slow one step, but not problem
    try {
      let { name: nameRoot, point: pointRoot } = req.body;
      if (_.isNull(nameRoot) && _.isNull(pointRoot))
        throw new AppError("error params input", 404);
      let movie = await Movie.findById(req.body.movieId);
      if (movie) {
        if (
          movie.listUserRating.length == 0 ||
          movie.listUserRating.findIndex((item) => item.name == nameRoot) == -1
        ) {
          await Movie.updateOne(
            { _id: movie._id },
            { $push: { listUserRating: { name: nameRoot, point: pointRoot } } }
          );
          let avgPoint = movie.listUserRating.reduce(
            (acc, cur) => acc + cur.point,
            0
          );
          await Movie.updateOne(
            { _id: movie._id },
            { rating: avgPoint / movie.listUserRating.length }
          );
          return res.status(200).json({
            code: 200,
          });
        } else {
          let result = await Movie.updateOne(
            { "listUserRating.name": nameRoot },
            {
              $set: {
                "listUserRating.$.point": pointRoot,
              },
            }
          );
          console.log(">>> result: <<<", result);
          let avgPoint = movie.listUserRating.reduce(
            (acc, cur) => acc + cur.point,
            0
          );
          console.log(">>> avgPoint: <<<", avgPoint);
          await Movie.updateOne(
            { _id: movie._id },
            { rating: avgPoint / movie.listUserRating.length }
          );
          return res.status(200).json({
            code: 200,
          });
        }
      }
      return res.status(400).json({
        mes: "err 2",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },
  getSingle: async (req, res) => {
    try {
    } catch (err) {
      console.log(err);
    }
  },
};

module.exports = movieController;
