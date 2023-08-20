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
router.post("/add-movie", verifyToken, movieController.addMovie);
router.post("/add-love-movie", movieController.addLoveMovie);
router.post("/add-bookmark-movie", movieController.addBookmarkMovie);
//DELETE USER
// router.delete("/:id", verifyTokenAndUserAuthorization, userController.deleteUser);

module.exports = router;
