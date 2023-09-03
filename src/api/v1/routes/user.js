const userController = require("../controllers/userController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");

const router = require("express").Router();
//GET ALL USERS
router.get("/", verifyTokenAndAdmin, userController.getAllUsers);
router.get("/get-favorite-movie", verifyToken, userController.getFavoriteMovie);
router.get("/get-bookmark-movie", verifyToken, userController.getBookmarkMovie);
router.get("/:username", userController.getSingleUser); // => trùng route nếu để ở trên các route có 1 cấp /

//UPDATE USER
router.put("/update-info-user", verifyToken, userController.updateInfoUser);
router.put(
  "/disabled-user",
  verifyTokenAndUserAuthorization,
  userController.disabledUser
);

//DELETE USER
router.delete(
  "/delete-user/:id",
  verifyTokenAndUserAuthorization,
  userController.deleteUser
);

module.exports = router;
