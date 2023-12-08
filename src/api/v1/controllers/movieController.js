const Movie = require("../models/Movie");
const User = require("../models/User");
const AppError = require("../utils/appError");
const _ = require("lodash");
const { ObjectId } = require("mongodb");
const logEvents = require("../helpers/logEvents");
// const redis = require("../connections/init.redis");

const movieController = {
  updateViews: async (req, res) => {
    const { movieId, userId, durationVideo } = req.body;
    console.log(">>> updateViews movieId <<<", movieId);
    console.log(">>> updateViews userId <<<", userId);
    console.log(">>> updateViews durationVideo <<<", durationVideo);

    try {
      // Tìm bản ghi phim theo ID và tăng trường views lên 1
      const updatedViewsMovie = await Movie.findOneAndUpdate(
        { _id: movieId },
        { $inc: { views: 1 } }, // Tăng trường views lên 1
        { new: true } // Trả về bản ghi đã được cập nhật
      );

      if (!updatedViewsMovie) {
        throw new Error("Không tìm thấy bản ghi phim");
      }

      return res
        .status(200)
        .json({ code: 200, mes: "Cập nhật lượt xem thành công" });
    } catch (err) {
      console.log("Lỗi khi cập nhật lượt xem:", err);
      res.status(404).json({
        code: 404,
        mes: "Lỗi khi cập nhật lượt xem",
        err: err.message,
      });
    }
  },
  // updateViews: async (req, res) => {
  //   const { movieId, userId, durationVideo } = req.body;
  //   console.log(">>> updateViews movieId <<<", movieId);
  //   console.log(">>> updateViews userId <<<", userId);
  //   console.log(">>> updateViews durationVideo <<<", durationVideo);
  //   const key = `video::${movieId}`;
  //   try {
  //     // Kiểm tra sự tồn tại của key trong Redis
  //     redis.exists(key, async (err, result) => {
  //       if (err) {
  //         console.log("Lỗi khi kiểm tra sự tồn tại của key:", err);
  //         throw new AppError(err, 401);
  //       } else {
  //         if (result === 1) {
  //           console.log("Key tồn tại trong Redis");

  //           const keyUserId = `user:${userId}-${key}`;
  //           const isOk = await redis.set(
  //             keyUserId,
  //             "hits",
  //             "NX",
  //             "EX",
  //             parseInt(durationVideo / 2)
  //             // 60
  //           );

  //           console.log(">>> keyUserId <<<", isOk);

  //           if (isOk === "OK") {
  //             await redis.incrby(`${key}`, 1);
  //             let viewsRedis = await redis.get(`${key}`);
  //             console.log(">>> keyVideoId after OK <<<", viewsRedis);
  //             viewsRedis = parseInt(viewsRedis);

  //             const updatedViewsMovie = await Movie.findOneAndUpdate(
  //               { _id: movieId },
  //               {
  //                 $set: { views: viewsRedis },
  //               }
  //             );
  //             console.log(">>> updatedViewsMovie <<<", updatedViewsMovie);
  //           }

  //           return res
  //             .status(200)
  //             .json({ code: 200, mes: "update views successfully" });
  //         } else {
  //           console.log("Key không tồn tại trong Redis");
  //           throw new AppError("Không có phim để cập nhật", 401);
  //         }
  //       }
  //     });
  //   } catch (err) {
  //     console.log("check err", err);
  //     // throw new AppError(err.message, err.status);
  //     res.status(404).json({
  //       code: 404,
  //       mes: "Lỗi!!!!",
  //       err,
  //     });
  //   }
  // },

  getAllMoviesSiteMap: async (req, res) => {
    try {
      let movie = await Movie.find({
        disabled: false,
      });
      // console.log(">>> getAllMovies <<<", movie);

      res.status(200).json({
        code: 200,
        mes: "lấy movie thành công",
        movie,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
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
        .filter((item) => item.isPaid === true)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);

      // Lọc phim mới nhất theo createAt giảm dần
      const latest = [...movie]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);

      // Lọc phim có giải thưởng
      const awards = [...movie]
        .filter((item) => Array.isArray(item.awards) && item.awards.length != 0)
        .slice(0, 10);

      // Lọc phim có top rating trong tuần (đang có bug, phim mới create cũng dc trả về vì updated mới nhất)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const topRatingofWeek = [...movie]
        .filter(
          (item) => new Date(item.updatedAt) > oneWeekAgo && item.rating != 0
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);
      // console.log(">>> topRatingofWeek <<<", topRatingofWeek);

      res.status(200).json({
        code: 200,
        mes: "lấy movie thành công",
        data: {
          // countTotalObject: movie.length,
          // movie,
          trending,
          watchToday,
          latest,
          awards,
          topRatingofWeek,
        },
      });
    } catch (err) {
      console.log(err);
      // logEvents(
      //   `${req.url} -  ${req.method}` + "err catch get all movies " + err
      // );
      res.status(500).json(err);
    }
  },
  getMoreMovies: async (req, res) => {
    const { moreFilm, page, pageSize } = req.query;
    console.log(">>> getMoreMovies <<<", moreFilm, page, pageSize);
    try {
      let movie;
      let query = { disabled: false };
      let shouldReturnResults = false;

      if (moreFilm === "xem-gi-hom-nay") {
        query.isPaid = true;
        shouldReturnResults = true;
      }

      const skip = (parseInt(page) - 1) * parseInt(pageSize);

      const sortOption = {};
      if (moreFilm === "phim-moi-nhat") {
        sortOption.createdAt = -1; // Sắp xếp theo thời gian tạo mới nhất
        shouldReturnResults = true;
      }

      if (!shouldReturnResults) {
        // Nếu không có điều kiện nào đúng, không trả về kết quả, báo lỗi không có
        return res.status(404).json({
          code: 404,
          mes: "Không có trang này",
        });
      }

      movie = await Movie.find(query)
        .skip(skip)
        .limit(parseInt(pageSize))
        .sort(sortOption)
        .populate("category");

      const totalCount = await Movie.countDocuments(query);

      res.status(200).json({
        code: 200,
        mes: "lấy movie thành công",
        totalCount,
        data: movie,
      });
    } catch (err) {
      console.log(err);
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
        disabled: false,
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
      let query = {
        disabled: false,
      };
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
    const photo = req.body.photo.split(",");
    let video;
    if (req.body.video) {
      video = req.body.video.split(",");
    } else {
      video = [];
    }
    let awards;
    if (req.body.awards) {
      awards = req.body.awards.split(",");
    } else {
      awards = [];
    }
    // console.log(">>> awards <<<", awards);
    // let subtitles;
    // if (req.body.subtitles) {
    //   subtitles = req.body.subtitles.split(",");
    // } else {
    //   subtitles = [];
    // }
    const category = req.body.category.map((item) => item.value);
    // console.log(author, actors, video, photo);
    // console.log(category);
    try {
      const newMovie = new Movie({
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
      // const keyVideoId = await redis.set(`video::${movie._id}`, 0);

      console.log(">>> keyVideoId <<<", keyVideoId);
      res.status(200).json({
        message: "Thêm phim thành công",
        // data: movie,
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
    const photo = req.body.photo.split(",");
    let video;
    if (req.body.video) {
      video = req.body.video.split(",");
    } else {
      video = [];
    }
    let awards;
    if (req.body.awards) {
      awards = req.body.awards.split(",");
    } else {
      awards = [];
    }
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
          awards,
          category,
        },
        { new: true }
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
    let { userId, movieId } = req.body;
    console.log(">>> addFavoriteMovie: <<<", req.body);
    try {
      let result;
      let message;
      let newMovie;

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
        newMovie = await Movie.findOne({ _id: movieId });
        message = "Thêm vào danh sách yêu thích thành công";
      } else if (movieExists) {
        // result = await User.updateOne(
        //   { _id: userId },
        //   { $pull: { loveMovie: movieId } }
        // );
        message = "Phim này đã có trong danh sách yêu thích";
      }

      return res.status(200).json({
        newMovie,
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
        message = "Phim này đã được xóa khỏi danh sách yêu thích";
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
      let newMovie;

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
        newMovie = await Movie.findOne({ _id: movieId });
        message = "Thêm vào danh sách xem sau thành công";
      } else if (movieExists) {
        // result = await User.updateOne(
        //   { _id: userId },
        //   { $pull: { markBookMovie: movieId } }
        // );
        message = "Phim này đã có trong danh sách xem sau";
      }

      return res.status(200).json({
        newMovie,
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
        message = "Phim này đã được xóa khỏi danh sách xem sau";
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
    try {
      const { name: nameRoot, point: pointRoot, movieId } = req.body;
      console.log(">>> rating <<<", req.body);

      if (_.isNull(nameRoot) || _.isNull(pointRoot)) {
        throw new AppError("error params input", 400);
      }

      let movie = await Movie.findById(movieId);

      if (!movie) {
        return res.status(400).json({
          message: "Đánh giá phim không thành công, không có phim này",
        });
      }

      const userRatingIndex = movie.listUserRating.findIndex(
        (item) => item.name === nameRoot
      );

      // Xử lý khi người dùng chưa rating hoặc đã rating trước đó
      if (userRatingIndex === -1) {
        // Người dùng chưa rating
        movie.listUserRating.push({ name: nameRoot, point: pointRoot });
      } else {
        // Người dùng đã rating trước đó
        movie.listUserRating[userRatingIndex].point = pointRoot;
      }

      // Tính lại điểm trung bình
      const totalPoints = movie.listUserRating.reduce(
        (acc, cur) => acc + cur.point,
        0
      );
      const averageRating = parseFloat(
        totalPoints / movie.listUserRating.length
      );

      // Cập nhật điểm trung bình vào trường `rating` của phim
      movie.rating = averageRating;

      await movie.save();

      const updatedMovie = await Movie.findById(movieId);

      return res.status(200).json({
        code: 200,
        message: "Đánh giá phim thành công",
        updatedMovie,
      });
    } catch (err) {
      console.log(err);
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

      if (movieSingle.length === 0) {
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
    console.log(">>>getSingleUser<<<", req.params.slug);
    try {
      const movieSingle = await Movie.find({
        slug: req.params.slug,
        disabled: false,
      }).populate("category");
      console.log(">>> getSingle: <<<", movieSingle);
      console.log(">>> getSingle: <<<", Boolean(movieSingle));

      if (movieSingle.length === 0) {
        console.log("Không có phim này");
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
