const userControllerV2 = require("../../controllers/user.controller");

const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../../middleware/verifyToken");
const multer = require("multer");
const { asyncHandler } = require("../../middleware/asyncHandler");
const router = require("express").Router();

router.use("/admin", require("./admin"));

//GET ALL USERS
router.get(
  "/get-favorite-movie",
  verifyToken,
  asyncHandler(userControllerV2.getFavoriteMovie)
);
router.get(
  "/get-bookmark-movie",
  verifyToken,
  asyncHandler(userControllerV2.getBookmarkMovie)
);
router.get(
  "/get-favorite-bookmark-movie",
  verifyToken,
  asyncHandler(userControllerV2.getFavoriteAndBookmarkMovie)
);
router.get(
  "/check-fav-mark/:userId/:movieId",
  verifyToken,
  asyncHandler(userControllerV2.getCheckFavMark)
);

//UPDATE USER
router.use(verifyToken);
const upload = multer({ storage: multer.memoryStorage() });
router.put(
  "/update-info-user",
  upload.single("avatar2"),
  asyncHandler(userControllerV2.updateInfoUser)
);

module.exports = router;
