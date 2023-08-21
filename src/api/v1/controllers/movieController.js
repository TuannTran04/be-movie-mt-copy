const Movie = require("../models/Movie");
const User = require("../models/User");
const AppError = require("../utils/appError");

const movieController = {
  getAllMovies: async (req, res) => {
    let { slug: slugName } = req.query;
    console.log(req.query);
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

  addMovie: async (req, res) => {
    try {
      const newMovie = await new Movie({ ...req.body });
      if (!newMovie) {
        throw new AppError("not have new movie", 401);
      }
      const movie = await newMovie.save();
      res.status(200).json({
        code: "ok",
        data: movie,
      });
    } catch (err) {
      console.log("check err", err);
      throw new AppError(err.message, err.status);
    }
  },
  rating: async (req, res) => {
    let arr = [5, 4, 3];
    let tbinh = 0;
    await Movie.updateOne({
      rating: tbinh,
    });
  },
  addLoveMovie: async (req, res) => {
    let { userId, movieId, isLove } = req.body;
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
    console.log(req.body);
  },

  //   //DELETE A USER
  //   deleteUser: async (req, res) => {
  //     try {
  //       await User.findByIdAndDelete(req.params.id);
  //       res.status(200).json("User deleted");
  //     } catch (err) {
  //       res.status(500).json(err);
  //     }
  //   },
};

module.exports = movieController;
