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

//DELETE USER
// router.delete("/:id", verifyTokenAndUserAuthorization, userController.deleteUser);

module.exports = router;
