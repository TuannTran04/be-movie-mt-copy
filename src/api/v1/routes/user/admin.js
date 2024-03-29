const userControllerV2 = require("../../controllers/user.controller");
const { asyncHandler } = require("../../middleware/asyncHandler");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../../middleware/verifyToken");
const router = require("express").Router();

router.get(
  "/",
  verifyTokenAndAdmin,
  asyncHandler(userControllerV2.getAllUsers)
);

router.get(
  "/single-info/:username",
  asyncHandler(userControllerV2.getSingleUser)
); // => trùng route nếu để ở trên các route có 1 cấp /

//UPDATE USER
router.put(
  "/disabled-user",
  verifyTokenAndUserAuthorization,
  asyncHandler(userControllerV2.disabledUser)
);

//DELETE USER
router.delete(
  "/delete-user/:id",
  verifyTokenAndUserAuthorization,
  asyncHandler(userControllerV2.deleteUser)
);

module.exports = router;
