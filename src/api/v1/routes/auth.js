const authController = require("../controllers/authController");

const router = require("express").Router();
const { verifyToken } = require("../controllers/verifyToken");

//REGISTER
router.post("/register", authController.registerUser);
router.post("/register/verify", authController.registerVerifyUser);

//REFRESH TOKEN
router.post("/refresh", authController.requestRefreshToken);
//LOG IN
router.post("/login", authController.loginUser);
//LOG OUT
router.post("/logout", authController.logOut);

//ChANGE PASS USER
router.put("/forgot-pwd-user", authController.forgotPwdUser);
router.put("/forgot-pwd-user-verify", authController.forgotPwdUserVerifyOTP);

module.exports = router;
