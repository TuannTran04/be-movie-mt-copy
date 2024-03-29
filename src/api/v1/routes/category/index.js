const categoryControllerV2 = require("../../controllers/category.controller");
const { asyncHandler } = require("../../middleware/asyncHandler");

const router = require("express").Router();

router.use("/admin", require("./admin"));

// router.get("/", categoryController.getAllCategory);
router.get("/", asyncHandler(categoryControllerV2.getAllCategory));

module.exports = router;
