const movieController = require("../controllers/movieController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");

const router = require("express").Router();
//GET ALL movies
// router.get("/", verifyToken, movieController.getAllMovies);
router.get("/", movieController.getAllMovies);
router.get("/admin-get-movies", movieController.adminGetMovies);
router.get("/search-movie", movieController.getSearchMovies);
router.get("/get-category-movie", movieController.getMoviesByCate);
router.get("/admin/:slug", verifyTokenAndAdmin, movieController.getSingleAdmin);
router.get("/user/:slug", movieController.getSingleUser);

router.post(
  "/add-movie",
  verifyTokenAndUserAuthorization,
  movieController.addMovie
);
router.post("/add-favorite-movie", movieController.addFavoriteMovie);
router.post("/delete-favorite-movie", movieController.deleteFavoriteMovie);
router.post("/add-bookmark-movie", movieController.addBookmarkMovie);
router.post("/delete-bookmark-movie", movieController.deleteBookmarkMovie);
router.post("/rating", verifyToken, movieController.rating);

//UPDATE MOVIE
router.put(
  "/update-movie",
  verifyTokenAndUserAuthorization,
  movieController.updateMovie
);
router.put(
  "/disabled-movie",
  verifyTokenAndUserAuthorization,
  movieController.disabledMovie
);

//DELETE MOVIE
router.delete(
  "/delete-movie/:id",
  verifyTokenAndUserAuthorization,
  movieController.deleteMovie
);

router.put("/update-views", movieController.updateViews);

module.exports = router;
