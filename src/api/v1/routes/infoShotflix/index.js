const infoShotflixControllerV2 = require("../../controllers/infoShotflix.controller");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../../middleware/verifyToken");
const { asyncHandler } = require("../../middleware/asyncHandler");
const router = require("express").Router();

router.get("/", asyncHandler(infoShotflixControllerV2.getInfoShotflix));

router.post(
  "/add-info-shotflix",
  verifyTokenAndAdmin,
  asyncHandler(infoShotflixControllerV2.addInfoShotflix)
);

module.exports = router;
