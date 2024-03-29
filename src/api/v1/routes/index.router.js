const express = require("express");
const router = express.Router();
// const { apiKey, permissions } = require("../auth/checkAuth");

//check api key
// router.use(apiKey);

//check permission
// router.use(permissions("0000"));

router.get("/", (req, res) => {
  return res.status(200).json({ message: "OK" });
});

router.use("/api/v1/auth", require("./access/index"));
router.use("/api/v1/user", require("./user/index"));
router.use("/api/v1/movie", require("./movie/index"));
router.use("/api/v1/category", require("./category/index"));
router.use("/api/v1/comment", require("./comment/index"));
router.use("/api/v1/notify", require("./notify/index"));
router.use("/api/v1/info_shotflix", require("./infoShotflix/index"));
router.use("/upload", require("../controllers/uploadController"));

module.exports = router;
