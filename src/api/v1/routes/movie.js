const movieController = require("../controllers/movieController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");
const router = require("express").Router();

const admin = require("firebase-admin");
const serviceAccount = require("../../../config/service-firebase-admin.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: "movie-the-stone-d9f38.appspot.com", // Thay thế bằng ID ứng dụng Firebase của bạn
//   // databaseURL: "https://movie-the-stone-d9f38-default-rtdb.firebaseio.com",
// });

//GET ALL movies
// router.get("/", verifyToken, movieController.getAllMovies);
router.get("/", movieController.getAllMovies);
router.get("/get-more-movies", movieController.getMoreMovies);
router.get("/admin-get-movies", movieController.adminGetMovies);
router.get("/search-movie", movieController.getSearchMovies);
router.get("/get-category-movie", movieController.getMoviesByCate);
router.get("/admin/:slug", verifyTokenAndAdmin, movieController.getSingleAdmin);
router.get("/user/:slug", movieController.getSingleUser);

router.post(
  "/add-movie",
  verifyTokenAndUserAuthorization,
  movieController.addMovie
);
router.post("/add-favorite-movie", movieController.addFavoriteMovie);
router.post("/delete-favorite-movie", movieController.deleteFavoriteMovie);
router.post("/add-bookmark-movie", movieController.addBookmarkMovie);
router.post("/delete-bookmark-movie", movieController.deleteBookmarkMovie);
router.post("/rating", verifyToken, movieController.rating);

//UPDATE MOVIE
router.put(
  "/update-movie",
  verifyTokenAndUserAuthorization,
  movieController.updateMovie
);
router.put(
  "/disabled-movie",
  verifyTokenAndUserAuthorization,
  movieController.disabledMovie
);
router.put("/update-views", movieController.updateViews);

//DELETE MOVIE
router.delete(
  "/delete-movie/:id",
  verifyTokenAndUserAuthorization,
  movieController.deleteMovie
);

router.get("/video/:videoName", async (req, res) => {
  const range = req.headers.range;
  console.log(">>> check range <<<", range);
  if (!range) {
    res.status(400).send("requires range header");
    return;
  }

  const videoName = req.params.videoName; // Thay thế bằng tên tệp video trên Firebase Storage
  const specificFolder = req.query.specificFolder;
  console.log(">>> videoName <<<", videoName);
  console.log(">>> specificFolder <<<", specificFolder);

  // Tạo một đường dẫn tới thư mục ảo 'files'
  const folder = `files/${specificFolder}/`;
  const videoPath = folder + videoName;
  console.log(">>> videoPath <<<", videoPath);

  const bucket = admin.storage().bucket();
  // console.log(">>>check bucket", bucket);
  // console.log(">>>check bucket", bucket.name);

  const videoFile = bucket.file(videoPath);
  // console.log(">>> videoFile <<<", videoFile);

  try {
    const [fileExists] = await videoFile.exists();
    console.log(">>> fileExists <<<", fileExists);
    if (!fileExists) {
      // console.log(">>> fileExists <<<", fileExists);
      res.status(404).send("File not found");
      return;
    }

    const [metadata] = await videoFile.getMetadata();
    const videoSize = metadata.size;
    const videoType = metadata.contentType;
    console.log(">>> videoType <<<", videoType);
    console.log(">>> range <<<", range);

    // const CHUNK_SIZE = 10 ** 6; //1mb
    // const start = Number(range.replace(/\D/g, ""));
    // console.log(">>> start <<<", start);
    // const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    // console.log(">>> end <<<", end);
    // const contentLength = end - start + 1;

    // const headers = {
    //   "Access-Control-Allow-Origin": "*",
    //   "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    //   "Accept-Ranges": "bytes",
    //   "Content-Length": contentLength,
    //   "Content-Type": videoType,
    // };

    // res.writeHead(206, headers);

    // const stream = videoFile.createReadStream({ start, end });

    // stream.pipe(res);
    // stream.on("error", (err) => {
    //   console.log(">>> err <<<", err);
    //   console.error("Error streaming video:", err);
    //   res.status(500).end();
    // });

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      console.log(">>> parts <<<", parts);
      const start = parseInt(parts[0], 10);
      console.log(">>> start <<<", start);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
      console.log(">>> end <<<", end);

      const chunkSize = end - start + 1;
      const file = videoFile.createReadStream({ start, end });
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      };

      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      const headers = {
        "Content-Length": videoSize,
        "Content-Type": "video/mp4",
      };

      res.writeHead(200, headers);
      videoFile.createReadStream().pipe(res);
    }
  } catch (error) {
    console.error("Error getting video metadata:", error);
    res.status(500).end();
  }
});

router.get("/subtitles/:subName", async (req, res) => {
  // const range = req.headers.range;
  // if (!range) {
  //   res.status(400).send("requires range header");
  //   return;
  // }

  const subName = req.params.subName; // Thay thế bằng tên tệp video trên Firebase Storage
  const specificFolder = req.query.specificFolder;
  // console.log(">>> subName <<<", subName);

  // Tạo một đường dẫn tới thư mục ảo 'files'
  const folder = `files/${specificFolder}/`;
  const subPath = folder + subName;
  // console.log(">>> subPath <<<", subPath);

  const bucket = admin.storage().bucket();
  // console.log(">>>check bucket", bucket);
  // console.log(">>>check bucket", bucket.name);

  const subFile = bucket.file(subPath);
  // console.log(">>> subFile <<<", subFile);

  try {
    const [fileExists] = await subFile.exists();
    // console.log(">>> fileExists sub <<<", fileExists);
    if (!fileExists) {
      res.status(404).send("File not found");
      return;
    }
    // Lấy URL tới tệp .vtt
    // const [url] = await subFile.getSignedUrl({
    //   action: "read",
    //   expires: "03-17-2025",
    // });
    // console.log("URL to VTT file:", url);

    // Đọc nội dung của tệp VTT
    // const fileStream = subFile.createReadStream();
    // let fileContent = "";

    // fileStream.on("data", (chunk) => {
    //   fileContent += chunk;
    // });

    // fileStream.on("end", () => {
    //   // Thiết lập header cho phép trình duyệt hiểu được định dạng VTT
    //   res.header("Content-Type", "text/vtt;charset=utf-8");

    //   // Gửi nội dung của tệp VTT về trình duyệt
    //   res.send(fileContent);
    // });

    // Đọc nội dung của tệp .vtt
    const fileStream = subFile.createReadStream();
    res.setHeader("Content-Type", "text/vtt;charset=utf-8");
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error getting video metadata:", error);
    res.status(500).end();
  }
});

module.exports = router;
