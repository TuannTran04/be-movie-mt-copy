"use strict";

const Movie = require("../models/movie.model");
const User = require("../models/User");
const _ = require("lodash");
const { ObjectId } = require("mongodb");
const { promisify } = require("util");
const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");

const { getRedis } = require("../connections/init.redis");
const { setKeyString, getKeyString } = require("./redis.service");
const { instanceConnect: redisClient } = getRedis();

class MovieService {
  static updateViewsV2 = async ({ movieId, userId, duration }, ipUser) => {
    console.log(">>> updateViews movieId <<<", movieId);
    console.log(">>> updateViews userId <<<", userId);
    console.log(">>> updateViews durationVideo <<<", duration);
    // console.log(">>> updateViews ipUser <<<", ipUser);

    const key = userId
      ? `user:${userId}-${movieId}`
      : `ip:${ipUser}-${movieId}`;
    console.log("key >>", key);

    let movieCache = await getKeyString(key);
    if (movieCache !== null) {
      console.log("Key tồn tại trong Redis");
      const dataFilmParse = JSON.parse(movieCache);
      console.log("dataFilmParse >>", dataFilmParse, typeof dataFilmParse);

      return { message: "update views not successfully" };
    }

    const isOk = await setKeyString({
      key: key,
      value: "hits",
      expire: 30,
    });
    console.log("isOk >>", isOk);

    if (isOk == "OK") {
      const updatedViewsMovie = await Movie.findOneAndUpdate(
        { _id: movieId },
        {
          // $set: { views: viewsRedis },
          $inc: { views: 1 },
        },
        { new: true } // Trả về bản ghi đã được cập nhật
      );

      console.log(">>> updatedViewsMovie <<<");
    }

    return { message: "update views successfully" };
  };

  // static updateViewsV2 = async ({ movieId, userId, duration }, ipUser) => {
  //   console.log(">>> updateViews movieId <<<", movieId);
  //   console.log(">>> updateViews userId <<<", userId);
  //   console.log(">>> updateViews durationVideo <<<", duration);
  //   // console.log(">>> updateViews ipUser <<<", ipUser);

  //   // const keyVideoId = await redisClient.set(`video:${movieId}`, 0);
  //   // console.log(">>> keyVideoId <<<", keyVideoId);
  //   // const key = `video:${movieId}`;
  //   // console.log(key);

  //   const key = userId
  //     ? `user:${userId}-${movieId}`
  //     : `ip:${ipUser}-${movieId}`;
  //   console.log("key >>", key);
  //   const checkExist = await redisClient.exists(key);
  //   console.log("checkExist", checkExist);
  //   if (!checkExist) {
  //     console.log("Key không tồn tại trong Redis");
  //     // throw new BadRequestError("Không có phim để cập nhật", 401);
  //   }
  //   // Kiểm tra sự tồn tại của key trong Redis
  //   if (checkExist === 1) {
  //     console.log("Key tồn tại trong Redis");

  //     // const keyUserId = `user:${userId}-${key}`; // ko login thi k co userId, xem xet userIP
  //     // console.log(">>> keyUserId <<<", keyUserId);

  //     const isOk = await setKeyString({
  //       key: key,
  //       value: "hits",
  //       expire: 30,
  //     });

  //     if (isOk == "OK") {
  //       // await redisClient.incr(`${key}`);
  //       // let viewsRedis = await redisClient.get(`${key}`);
  //       // console.log(">>> keyVideoId after OK <<<", viewsRedis);
  //       // viewsRedis = parseInt(viewsRedis);

  //       const updatedViewsMovie = await Movie.findOneAndUpdate(
  //         { _id: movieId },
  //         {
  //           // $set: { views: viewsRedis },
  //           $inc: { views: 1 },
  //         },
  //         { new: true } // Trả về bản ghi đã được cập nhật
  //       );

  //       console.log(">>> updatedViewsMovie <<<");
  //     } else {
  //       return { message: "update views not successfully" };
  //     }

  //     return { message: "update views successfully" };
  //   }
  // };

  static updateViews = async ({ movieId, userId, durationVideo }) => {
    console.log(">>> updateViews movieId <<<", movieId);
    console.log(">>> updateViews userId <<<", userId);
    console.log(">>> updateViews durationVideo <<<", durationVideo);

    // Tìm bản ghi phim theo ID và tăng trường views lên 1
    const updatedViewsMovie = await Movie.findOneAndUpdate(
      { _id: movieId },
      { $inc: { views: 1 } }, // Tăng trường views lên 1
      { new: true } // Trả về bản ghi đã được cập nhật
    );

    if (!updatedViewsMovie) {
      throw new BadRequestError("Không tìm thấy bản ghi phim", 404);
    }

    return { message: "Cập nhật lượt xem thành công" };
  };

  static getAllMovies = async () => {
    let movie;

    let movieCache = await getKeyString(`dataMoviesCache`);
    if (movieCache !== null) {
      const dataFilmParse = JSON.parse(movieCache);
      console.log("dataFilmParse >>", typeof dataFilmParse);

      return {
        data: dataFilmParse,
      };
    }

    movie = await Movie.find({
      disabled: false,
    }).populate("category");
    // console.log(">>> getAllMovies <<<", movie);

    // Lọc phim trending theo lượt views giảm dần
    const trending = [...movie].sort((a, b) => b.views - a.views).slice(0, 10);
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

    await setKeyString({
      key: "dataMoviesCache",
      value: { trending, watchToday, latest, awards, topRatingofWeek },
      expire: 300,
    });

    return {
      data: {
        // countTotalObject: movie.length,
        // movie,
        trending,
        watchToday,
        latest,
        awards,
        topRatingofWeek,
      },
    };
  };

  static getAllMoviesSiteMap = async () => {
    let dataAllMoviesSiteMapCache = await getKeyString(
      `dataAllMoviesSiteMapCache`
    );
    if (dataAllMoviesSiteMapCache !== null) {
      const dataAllMoviesSiteMapParse = JSON.parse(dataAllMoviesSiteMapCache);
      console.log(
        "dataAllMoviesSiteMapParse >>",
        typeof dataAllMoviesSiteMapParse
      );

      return {
        movie: dataAllMoviesSiteMapParse,
      };
    }

    let movie = await Movie.find({
      disabled: false,
    }).select("slug");
    // console.log(">>> getAllMovies <<<", movie);

    await setKeyString({
      key: "dataAllMoviesSiteMapCache",
      value: movie,
      expire: 300,
    });

    return {
      movie,
    };
  };

  static getMoreMovies = async ({ moreFilm, page, pageSize }) => {
    console.log(">>> MovieService getMoreMovies <<<", moreFilm, page, pageSize);

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

    return {
      totalCount,
      data: movie,
    };
  };

  static adminGetMovies = async ({
    q: querySearch,
    page: currentPage,
    pageSize,
    filter,
  }) => {
    const { filterDisabled, filterSort } = JSON.parse(filter);
    console.log(currentPage, pageSize, querySearch);
    console.log(">>>MovieService filterDisabled: <<<", filterDisabled);
    console.log(">>>MovieService filterSort: <<<", filterSort);

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

    return {
      data: {
        // countTotalObject: movie.length,
        totalCount,
        movie,
      },
    };
  };

  static getSearchMovies = async ({ q: query }) => {
    console.log(">>> MovieService search query: <<<", query);

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
    console.log(">>> MovieService getSearchMovies <<<", movies);

    if (movies.length === 0) {
      return { message: "Không có kết quả tìm kiếm" };
    }

    return {
      data: {
        countTotalObject: movies.length,
        movies,
      },
    };
  };

  static getMoviesByCate = async ({ cateId, page, pageSize }) => {
    console.log(">>> MovieSerive getMoviesByCate <<<", cateId, page, pageSize);
    const keyMovieByCate = `movieByCateId:${cateId}`;

    let moviesByCateCache = await getKeyString(keyMovieByCate);
    if (moviesByCateCache !== null) {
      const dataParse = JSON.parse(moviesByCateCache);
      console.log("dataParse >>", typeof dataParse);

      return {
        data: dataParse,
      };
    }

    // if (!ObjectId.isValid(cateId)) {
    //   // Nếu cateId không hợp lệ, trả về lỗi Bad Request
    //   return res.status(400).json({ error: "Invalid cateId" });
    // }
    let query = {
      disabled: false,
    };
    if (cateId) {
      // query.category = new ObjectId(cateId);
      query.category = cateId;
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const movies = await Movie.find(query).skip(skip).limit(parseInt(pageSize));
    // console.log(">>> getMoviesByCate <<<", movies);

    const totalCount = await Movie.countDocuments(query);
    // console.log(totalCount);

    await setKeyString({
      key: keyMovieByCate,
      value: {
        // countTotalObject: movie.length,
        totalCount,
        movies,
      },
      expire: 300,
    });

    return {
      data: {
        // countTotalObject: movie.length,
        totalCount,
        movies,
      },
    };
  };

  static getSingleUser = async ({ slug }) => {
    const keyMovieBySlug = `movieSingle:${slug}`;

    let singleFilmCache = await getKeyString(keyMovieBySlug);
    if (singleFilmCache !== null) {
      const datasingleFilmParse = JSON.parse(singleFilmCache);
      console.log("datasingleFilmParse >>", typeof datasingleFilmParse);

      return {
        data: datasingleFilmParse,
      };
    }

    const movieSingle = await Movie.find({
      slug,
      disabled: false,
    }).populate("category");
    console.log(">>> getSingle: <<<", movieSingle);
    console.log(">>> getSingle: <<<", Boolean(movieSingle));

    if (movieSingle.length === 0) {
      console.log("Không có phim này");
      throw new BadRequestError("Không có phim này", 404);
    }

    await setKeyString({
      key: keyMovieBySlug,
      value: {
        countTotalObject: movieSingle.length,
        movieSingle,
      },
      expire: 300,
    });

    return {
      data: {
        countTotalObject: movieSingle.length,
        movieSingle,
      },
    };
  };

  static getSingleAdmin = async ({ slug }) => {
    console.log(slug);

    const movieSingle = await Movie.find({
      slug,
    }).populate("category");
    console.log(">>> getSingle: <<<", movieSingle);

    if (movieSingle.length === 0) {
      throw new BadRequestError("Không có phim này", 404);
    }

    return {
      data: {
        countTotalObject: movieSingle.length,
        movieSingle,
      },
    };
  };

  static addMovie = async (data) => {
    // const { author, actors, photo, video, awards, category } = data;
    console.log(">>> MovieService addMovie: <<<", data);

    const author = data.author.split(",");
    const actors = data.actors.split(",");
    const photo = data.photo.split(",");
    let video;
    if (video) {
      video = data.video.split(",");
    } else {
      video = [];
    }
    let awards;
    if (awards) {
      awards = data.awards.split(",");
    } else {
      awards = [];
    }
    // console.log(">>> awards <<<", awards);
    // let subtitles;
    // if (subtitles) {
    //   subtitles = subtitles.split(",");
    // } else {
    //   subtitles = [];
    // }
    const category = data.category.map((item) => item.value);
    // console.log(author, actors, video, photo);
    console.log(category);

    const newMovie = new Movie({
      ...data,
      author,
      actors,
      awards,
      video,
      photo,
      category,
    });
    console.log("newMovie", newMovie);
    if (!newMovie) {
      throw new BadRequestError("not have new movie", 401);
    }

    const movie = await newMovie.save();
    console.log("movie Save", movie);

    // const keyVideoId = await redis.set(`video::${movie._id}`, 0);
    // console.log(">>> keyVideoId <<<", keyVideoId);
    return {
      message: "Thêm phim thành công",
      // data: movie,
    };
  };

  static addFavoriteMovie = async ({ userId, movieId }) => {
    console.log(">>> MovieService addFavoriteMovie: <<<", userId, movieId);

    let result;
    let message;
    // let newMovie;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new BadRequestError("User Not Registered");
    }

    const movieExists = user.loveMovie.some((movie) => movie.equals(movieId));
    console.log(">>> movieExists addFavoriteMovie <<<", movieExists);
    if (!movieExists) {
      result = await User.updateOne(
        { _id: userId },
        { $push: { loveMovie: movieId } }
      );
      // newMovie = await Movie.findOne({ _id: movieId });
      message = "Thêm vào danh sách yêu thích thành công";
    } else if (movieExists) {
      // result = await User.updateOne(
      //   { _id: userId },
      //   { $pull: { loveMovie: movieId } }
      // );
      message = "Phim này đã có trong danh sách yêu thích";
    }

    return {
      // newMovie,
      result,
      message,
    };
  };

  static addBookmarkMovie = async ({ userId, movieId }) => {
    console.log(">>> MovieService addBookmarkMovie: <<<", userId, movieId);

    let result;
    let message;
    // let newMovie;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new BadRequestError("User Not Registered");
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
      // newMovie = await Movie.findOne({ _id: movieId });
      message = "Thêm vào danh sách xem sau thành công";
    } else if (movieExists) {
      // result = await User.updateOne(
      //   { _id: userId },
      //   { $pull: { markBookMovie: movieId } }
      // );
      message = "Phim này đã có trong danh sách xem sau";
    }

    return {
      // newMovie,
      result,
      message,
    };
  };

  static deleteFavoriteMovie = async ({ userId, movieId }) => {
    console.log(">>> MovieService deleteFavoriteMovie: <<<", userId, movieId);

    let result;
    let message;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new BadRequestError("User Not Registered");
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

    return {
      result,
      message,
    };
  };

  static deleteBookmarkMovie = async ({ userId, movieId }) => {
    console.log(">>> MovieService deleteBookmarkMovie: <<<", userId, movieId);

    let result;
    let message;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new BadRequestError("User Not Registered");
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

    return {
      result,
      message,
    };
  };

  static rating = async ({ name: nameRoot, point: pointRoot, movieId }) => {
    console.log(">>> MovieService rating <<<", nameRoot, pointRoot, movieId);

    if (_.isNull(nameRoot) || _.isNull(pointRoot)) {
      throw new BadRequestError("Error params input", 401);
    }

    let movie = await Movie.findById(movieId);

    if (!movie) {
      throw new BadRequestError(
        "Đánh giá phim không thành công, không có phim này",
        404
      );
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
    const averageRating = parseFloat(totalPoints / movie.listUserRating.length);

    // Cập nhật điểm trung bình vào trường `rating` của phim
    movie.rating = averageRating;

    await movie.save();

    const updatedMovie = await Movie.findById(movieId);

    return {
      message: "Đánh giá phim thành công",
      updatedMovie,
    };
  };

  static updateMovie = async (data) => {
    console.log(">>> MovieService updateMovie: <<<", data);
    const author = data.author.split(",");
    const actors = data.actors.split(",");
    const photo = data.photo.split(",");
    let video;
    if (data.video) {
      video = data.video.split(",");
    } else {
      video = [];
    }
    let awards;
    if (data.awards) {
      awards = data.awards.split(",");
    } else {
      awards = [];
    }
    const category = data.category.map((item) => item.value);
    console.log(author, actors, video, photo);
    console.log(category);

    const updatedMovie = await Movie.findOneAndUpdate(
      { _id: data.id },
      {
        ...data,
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
      throw new BadRequestError("Không có phim để cập nhật", 401);
    }

    return {
      message: "Cập nhật phim thành công",
      // data: updatedMovie,
    };
  };

  static disabledMovie = async ({ movieId, toggleDisable }) => {
    console.log(">>> movieService disabledMovie: <<<", movieId, toggleDisable);

    const disabledMovie = await Movie.findByIdAndUpdate(
      { _id: movieId },
      {
        disabled: toggleDisable,
      }
    );
    // console.log(disabledMovie);
    if (!disabledMovie) {
      throw new BadRequestError("Không có phim để cập nhật", 401);
    }
    return {
      message: "Cập nhật trường disabled thành công",
      // data: disabledMovie,
    };
  };

  static deleteMovie = async (movieId) => {
    console.log(">>> movieService deleteMovie <<<", movieId);

    const movieDeleted = await Movie.findByIdAndDelete(movieId);
    console.log(movieDeleted);
    if (!movieDeleted) {
      throw new BadRequestError("Không có phim để xóa", 401);
    }
    return { message: "movie deleted" };
  };
}

module.exports = MovieService;
