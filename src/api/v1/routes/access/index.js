const accessController = require("../../controllers/access.controller");

const router = require("express").Router();
const { asyncHandler } = require("../../middleware/asyncHandler");
const { authentication, authenticationV2 } = require("../../auth/authUtils");

//REGISTER
router.post("/signup", asyncHandler(accessController.signUp));
router.post("/loginTIPJS", asyncHandler(accessController.login));

router.post("/register", asyncHandler(accessController.registerUser));
router.post(
  "/register/verify",
  asyncHandler(accessController.registerVerifyUser)
);

//LOG IN
/**
 *
 */
router.post("/login", asyncHandler(accessController.loginUser));

//LOG OUT
router.get("/logout", asyncHandler(accessController.logOut));

//ChANGE PASS USER
router.put("/forgot-pwd-user", asyncHandler(accessController.forgotPwdUser));
router.put(
  "/forgot-pwd-user-verify",
  asyncHandler(accessController.forgotPwdUserVerifyOTP)
);

// authenticaition
// router.use(authenticationV2);
//LOG OUT TIPJS
router.get("/logoutTIPJS", asyncHandler(accessController.logout));
router.post(
  "/handlerRTTIPJS",
  asyncHandler(accessController.handleRefreshToken)
);

// router.use(authentication);
//REFRESH TOKEN
router.get("/refresh", asyncHandler(accessController.requestRefreshToken));

module.exports = router;
