const categoryControllerV2 = require("../../controllers/category.controller");
const {
  verifyTokenAndUserAuthorization,
  verifyTokenAndAdmin,
} = require("../../middleware/verifyToken");
const { asyncHandler } = require("../../middleware/asyncHandler");

const router = require("express").Router();

router.get(
  "/admin-get-cate",
  verifyTokenAndAdmin,
  asyncHandler(categoryControllerV2.getAllCateByAdmin)
);

router.get(
  "/single-cate/:slug",
  verifyTokenAndAdmin,
  asyncHandler(categoryControllerV2.getSingleAdmin)
);

router.post(
  "/add-category",
  verifyTokenAndUserAuthorization,
  asyncHandler(categoryControllerV2.addCategory)
);

//UPDATE MOVIE
router.put(
  "/update-category",
  verifyTokenAndUserAuthorization,
  asyncHandler(categoryControllerV2.updateCategory)
);

router.put(
  "/disabled-category",
  verifyTokenAndUserAuthorization,
  asyncHandler(categoryControllerV2.disabledCategory)
);

//DELETE CATEGORY
router.delete(
  "/delete-category/:id",
  verifyTokenAndUserAuthorization,
  asyncHandler(categoryControllerV2.deleteCategory)
);

module.exports = router;
