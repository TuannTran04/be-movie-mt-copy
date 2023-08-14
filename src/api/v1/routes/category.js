const categoryController = require("../controllers/categoryController");

const router = require("express").Router();
// router.get("/",  movieController.getAllMovies);
router.post("/add-category", categoryController.addCategory);
router.get("/", categoryController.getAllCategory);

module.exports = router;
