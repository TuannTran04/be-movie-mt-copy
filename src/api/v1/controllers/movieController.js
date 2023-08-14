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
          slug: { $regex: ".*" + slugName + ".*" },
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
