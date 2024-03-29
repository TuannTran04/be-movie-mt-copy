const movieControllerV2 = require("../../controllers/movie.controller");

const {
  verifyTokenAndUserAuthorization,
  verifyTokenAndAdmin,
} = require("../../middleware/verifyToken");
const { asyncHandler } = require("../../middleware/asyncHandler");

const router = require("express").Router();

router.get(
  "/admin-get-movies",
  verifyTokenAndUserAuthorization,
  asyncHandler(movieControllerV2.adminGetMovies)
);

router.get(
  "/single-movie/:slug",
  verifyTokenAndAdmin,
  asyncHandler(movieControllerV2.getSingleAdmin)
);

router.post(
  "/add-movie",
  verifyTokenAndUserAuthorization,
  asyncHandler(movieControllerV2.addMovie)
);

router.put(
  "/update-movie",
  verifyTokenAndUserAuthorization,
  asyncHandler(movieControllerV2.updateMovie)
);

router.put(
  "/disabled-movie",
  verifyTokenAndUserAuthorization,
  asyncHandler(movieControllerV2.disabledMovie)
);

router.delete(
  "/delete-movie/:id",
  verifyTokenAndUserAuthorization,
  asyncHandler(movieControllerV2.deleteMovie)
);

module.exports = router;
