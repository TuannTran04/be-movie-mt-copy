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
router.get("/search-movie", movieController.getSearchMovies);
router.get("/:slug", movieController.getSingle);

router.post(
  "/add-movie",
  verifyTokenAndUserAuthorization,
  movieController.addMovie
);
router.post("/add-love-movie", movieController.addLoveMovie);
router.post("/add-bookmark-movie", movieController.addBookmarkMovie);
router.post("/rating", verifyToken, movieController.rating);

//EDIT MOVIE
router.put("/update-movie", movieController.updateMovie);

//DELETE MOVIE
router.delete(
  "/delete-movie/:id",
  verifyTokenAndUserAuthorization,
  movieController.deleteMovie
);

module.exports = router;
