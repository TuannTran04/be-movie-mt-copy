const Movie = require("../models/Movie");
const User = require("../models/User");
const AppError = require("../utils/appError");
const _ = require("lodash");
const { ObjectId } = require("mongodb");
const logEvents = require("../helpers/logEvents")

const movieController = {
  updateViews: async (req, res) => {
    const { movieId } = req.body;
    try {
      const film = await Movie.findById({ _id: movieId });
      if (film) {
        // console.log(typeof(film.views))
        let newViews = film.views + 1;
        await Movie.updateOne({ views: newViews });
        return res
          .status(200)
          .json({ code: 200, mes: "update views successfully" });
      } else throw AppError("do not have film", 404);
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
  getAllMovies: async (req, res) => {
    try {
      
      let movie;

      movie = await Movie.find({
        disabled: false,
      }).populate("category");
      // console.log(">>> getAllMovies <<<", movie);

      // Lọc phim trending theo lượt views giảm dần
      const trending = [...movie]
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
      // console.log(trending);

      // Lọc 10 phim cho watchToday
      const watchToday = [...movie]
        .map((item) => {
          if (item.isPaid === true) {
            return item;
          }
        })
        .slice(0, 10);
      console.log(">>> watchToday <<<", watchToday);
      console.log(">>> watchToday <<<", watchToday.length);

      // Lọc phim mới nhất theo createAt giảm dần
      const latest = [...movie]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);

      // Lọc phim có top rating trong tuần (đang có bug, phim mới create cũng dc trả về vì updated mới nhất)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const topRatingofWeek = [...movie]
        .filter((item) => new Date(item.updatedAt) > oneWeekAgo)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);

      res.status(200).json({
        code: 200,
        mes: "lấy movie thành công",
        data: {
          // countTotalObject: movie.length,
          // movie,
          trending,
          watchToday,
          latest,
          topRatingofWeek,
        },
      });
    } catch (err) {
      console.log(err);
      logEvents(`${req.url} -  ${req.method}` + "err catch get all movies " + err)
      res.status(500).json(err);
    }
  },
  adminGetMovies: async (req, res) => {
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
          { title: { $regex: querySearch, $options: "i" } },
          { titleWithoutAccent: { $regex: querySearch, $options: "i" } },
          { author: { $regex: querySearch, $options: "i" } },
          { authorWithoutAccent: { $regex: querySearch, $options: "i" } },
          { actors: { $regex: querySearch, $options: "i" } },
          { actorsWithoutAccent: { $regex: querySearch, $options: "i" } },
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

      const movie = await Movie.find(query)
        .skip(skip)
        .limit(parseInt(pageSize))
        .sort(sortOption)
        .populate("category");
      // console.log(">>> SORT <<<", movie);

      const totalCount = await Movie.countDocuments(query);
      // console.log(totalCount);

      res.status(200).json({
        code: 200,
        mes: "Lấy danh sách phim thành công",
        data: {
          // countTotalObject: movie.length,
          totalCount,
          movie,
        },
      });
    } catch (err) {
      console.log(err);
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
          { titleWithoutAccent: { $regex: query, $options: "i" } }, // Tìm theo tên phim ko dấu
          { author: { $regex: query, $options: "i" } }, // Tìm theo tên đạo diễn
          { authorWithoutAccent: { $regex: query, $options: "i" } }, // Tìm theo tên đạo diễn ko dấu
          { actors: { $regex: query, $options: "i" } }, // Tìm theo tên diễn viên
          { actorsWithoutAccent: { $regex: query, $options: "i" } }, // Tìm theo tên diễn viên ko dấu
        ],
      }).limit(10);
      console.log(">>> getSearchMovies <<<", movies);

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
      console.log(err);
      res.status(500).json(err);
    }
  },
  getMoviesByCate: async (req, res) => {
    const { cateId, page, pageSize } = req.query;
    console.log(">>> getMoviesByCate <<<", cateId, page, pageSize);
    try {
      // if (!ObjectId.isValid(cateId)) {
      //   // Nếu cateId không hợp lệ, trả về lỗi Bad Request
      //   return res.status(400).json({ error: "Invalid cateId" });
      // }
      let query = {};
      if (cateId) {
        query.category = new ObjectId(cateId);
      }

      const skip = (parseInt(page) - 1) * parseInt(pageSize);

      const movies = await Movie.find(query)
        .skip(skip)
        .limit(parseInt(pageSize));
      // console.log(">>> getMoviesByCate <<<", movies);

      const totalCount = await Movie.countDocuments(query);
      // console.log(totalCount);

      res.status(200).json({
        code: 200,
        mes: "Lấy danh sách phim thành công",
        data: {
          // countTotalObject: movie.length,
          totalCount,
          movies,
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  addMovie: async (req, res) => {
    console.log(">>> addMovie: <<<", req.body);
    const author = req.body.author.split(",");
    const actors = req.body.actors.split(",");
    const video = req.body.video.split(",");
    const photo = req.body.photo.split(",");
    const awards = req.body.awards.split(",");
    const category = req.body.category.map((item) => item.value);
    // console.log(author, actors, video, photo);
    console.log(category);
    try {
      const newMovie = await new Movie({
        ...req.body,
        author,
        actors,
        awards,
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
    console.log(">>> updateMovie: <<<", req.body);
    const author = req.body.author.split(",");
    const actors = req.body.actors.split(",");
    const video = req.body.video.split(",");
    const photo = req.body.photo.split(",");
    const category = req.body.category.map((item) => item.value);
    console.log(author, actors, video, photo);
    console.log(category);
    try {
      const updatedMovie = await Movie.findOneAndUpdate(
        { _id: req.body.id },
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
        // data: updatedMovie,
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
  disabledMovie: async (req, res) => {
    console.log(">>> disabledMovie: <<<", req.body);
    const { movieId, toggleDisable } = req.body;
    try {
      const disabledMovie = await Movie.findByIdAndUpdate(
        { _id: movieId },
        {
          disabled: toggleDisable,
        }
      );
      // console.log(disabledMovie);
      if (!disabledMovie) {
        throw new AppError("Không có phim để cập nhật", 401);
      }
      res.status(200).json({
        message: "Cập nhật trường disabled thành công",
        // data: disabledMovie,
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
    console.log(">>> deleteMovie <<<", req.params.id);
    try {
      const movieDeleted = await Movie.findByIdAndDelete(req.params.id);
      console.log(movieDeleted);
      if (!movieDeleted) {
        throw new AppError("Không có phim để xóa", 401);
      }
      return res.status(200).json("Movie deleted");
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  addFavoriteMovie: async (req, res) => {
    let { userId, movieId, isLove } = req.body;
    console.log(">>> addFavoriteMovie: <<<", req.body);
    try {
      let result;
      let message;

      const user = await User.findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const movieExists = user.loveMovie.some((movie) => movie.equals(movieId));
      console.log(">>> movieExists addFavoriteMovie <<<", movieExists);
      if (!movieExists) {
        result = await User.updateOne(
          { _id: userId },
          { $push: { loveMovie: movieId } }
        );
        message = "Thêm vào danh sách yêu thích thành công";
      } else if (movieExists) {
        // result = await User.updateOne(
        //   { _id: userId },
        //   { $pull: { loveMovie: movieId } }
        // );
        message = "Phim này đã có trong danh sách yêu thích";
      }

      return res.status(200).json({
        result,
        message,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  deleteFavoriteMovie: async (req, res) => {
    let { userId, movieId, isLove } = req.body;
    console.log(">>> deleteFavoriteMovie: <<<", req.body);
    try {
      let result;
      let message;

      const user = await User.findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const movieExists = user.loveMovie.some((movie) => movie.equals(movieId));
      console.log(">>> movieExists deleteFavoriteMovie <<<", movieExists);
      if (movieExists) {
        result = await User.updateOne(
          { _id: userId },
          { $pull: { loveMovie: movieId } }
        );
        message = "Xóa khỏi danh sách yêu thích thành công";
      } else if (!movieExists) {
        message = "Phim này không tồn tại";
      }

      return res.status(200).json({
        result,
        message,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  addBookmarkMovie: async (req, res) => {
    let { userId, movieId, isBookmark } = req.body;
    console.log(">>> addBookmarkMovie: <<<", req.body);
    try {
      let result;
      let message;

      const user = await User.findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const movieExists = user.markBookMovie.some((movie) =>
        movie.equals(movieId)
      );
      console.log(">>> movieExists addBookmarkMovie <<<", movieExists);
      if (!movieExists) {
        result = await User.updateOne(
          { _id: userId },
          { $push: { markBookMovie: movieId } }
        );
        message = "Thêm vào danh sách xem sau thành công";
      } else if (movieExists) {
        // result = await User.updateOne(
        //   { _id: userId },
        //   { $pull: { markBookMovie: movieId } }
        // );
        message = "Phim này đã có trong danh sách xem sau";
      }

      return res.status(200).json({
        result,
        message,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },
  deleteBookmarkMovie: async (req, res) => {
    let { userId, movieId, isBookmark } = req.body;
    console.log(">>> deleteBookmarkMovie: <<<", req.body);
    try {
      let result;
      let message;

      const user = await User.findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const movieExists = user.markBookMovie.some((movie) =>
        movie.equals(movieId)
      );
      console.log(">>> movieExists deleteBookmarkMovie <<<", movieExists);
      if (movieExists) {
        result = await User.updateOne(
          { _id: userId },
          { $pull: { markBookMovie: movieId } }
        );
        message = "Xóa khỏi danh sách xem sau thành công";
      } else if (!movieExists) {
        message = "Phim này không tồn tại";
      }

      return res.status(200).json({
        result,
        message,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },
  rating: async (req, res) => {
    // slow one step, but not problem
    try {
      let { name: nameRoot, point: pointRoot } = req.body;
      console.log(">>> rating <<<", req.body);
      if (_.isNull(nameRoot) && _.isNull(pointRoot))
        throw new AppError("error params input", 404);
      let movie = await Movie.findById(req.body.movieId);
      if (movie) {
        if (
          movie.listUserRating.length == 0 ||
          movie.listUserRating.findIndex((item) => item.name == nameRoot) == -1
        ) {
          // this case run when no one rating yet
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
          let updatedMovie = await Movie.findById(req.body.movieId);

          return res.status(200).json({
            code: 200,
            updatedMovie
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
           let updatedMovie = await Movie.findById(req.body.movieId);
          return res.status(200).json({
            code: 200,
            updatedMovie,
            mes2:"case already has userList",
            mes:"Đánh giá phim thành công"
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
  getSingleAdmin: async (req, res) => {
    console.log(req.params.slug);
    try {
      const movieSingle = await Movie.find({
        slug: req.params.slug,
      }).populate("category");
      console.log(">>> getSingle: <<<", movieSingle);

      if (!movieSingle) {
        throw new AppError("Không có phim này", 404);
      }

      return res.status(200).json({
        code: 200,
        mes: "ok",
        data: {
          countTotalObject: movieSingle.length,
          movieSingle,
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  getSingleUser: async (req, res) => {
    console.log(req.params.slug);
    try {
      const movieSingle = await Movie.find({
        slug: req.params.slug,
      }).populate("category");
      // console.log(">>> getSingle: <<<", movieSingle);

      if (!movieSingle) {
        throw new AppError("Không có phim này", 404);
      }

      return res.status(200).json({
        code: 200,
        mes: "ok",
        data: {
          countTotalObject: movieSingle.length,
          movieSingle,
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
};

module.exports = movieController;
