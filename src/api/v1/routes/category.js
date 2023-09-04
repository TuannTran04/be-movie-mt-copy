const categoryController = require("../controllers/categoryController");
const {
  verifyTokenAndUserAuthorization,
  verifyTokenAndAdmin,
} = require("../controllers/verifyToken");

const router = require("express").Router();
// router.get("/",  movieController.getAllMovies);
router.get("/", categoryController.getAllCategory);
router.get("/admin-get-cate", categoryController.getAllCateByAdmin);
router.get(
  "/admin/:slug",
  verifyTokenAndAdmin,
  categoryController.getSingleAdmin
);

router.post(
  "/add-category",
  verifyTokenAndUserAuthorization,
  categoryController.addCategory
);

//UPDATE MOVIE
router.put(
  "/update-category",
  verifyTokenAndUserAuthorization,
  categoryController.updateCategory
);

router.put(
  "/disabled-category",
  verifyTokenAndUserAuthorization,
  categoryController.disabledCategory
);

//DELETE CATEGORY
router.delete(
  "/delete-category/:id",
  verifyTokenAndUserAuthorization,
  categoryController.deleteCategory
);

module.exports = router;
