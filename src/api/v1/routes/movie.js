const movieController = require("../controllers/movieController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");
const router = require("express").Router();

const admin = require("firebase-admin");
const serviceAccount = require("../../../config/service-firebase-admin.json");

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
    // console.log(">>> metadata <<<", metadata);
    const videoSize = metadata.size;
    const videoType = metadata.contentType;
    console.log(">>> videoType <<<", videoType);
    console.log(">>> videoSize <<<", videoSize);
    console.log(">>> range <<<", range);

    if (range) {
      const CHUNK_SIZE = 2 * 1024 * 1024;

      const parts = range.replace(/bytes=/, "").split("-");
      console.log(">>> parts <<<", parts);
      const start = parseInt(parts[0], 10);
      console.log(">>> start <<<", start);
      // const end = parts[1]
      //   ? parseInt(parts[1], 10)
      //   : Math.min(start + CHUNK_SIZE, videoSize - 1);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
      console.log(">>> end <<<", end);

      const chunkSize = Math.min(end - start + 1, CHUNK_SIZE);
      // const chunkSize = end - start + 1;

      const headers = {
        "Content-Range": `bytes ${start}-${start + chunkSize - 1}/${videoSize}`,
        // "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      };

      const file = videoFile.createReadStream({ start, end });
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

router.get("/videoHLS/:specificFolder/:videoName", async (req, res) => {
  const videoName = req.params.videoName; // Thay thế bằng tên tệp video trên Firebase Storage
  // const specificFolder = req.query.specificFolder;
  const specificFolder = req.params.specificFolder;
  console.log(">>> videoName <<<", videoName);
  console.log(">>> specificFolder <<<", specificFolder);

  // Tạo một đường dẫn tới thư mục ảo 'files'
  const folder = `files/${specificFolder}/`;
  // const folder = `${specificFolder}/`;
  const videoPath = folder + videoName;
  // const videoPath = "test_hls/" + videoName;
  console.log(">>> videoPath <<<", videoPath);

  const bucket = admin.storage().bucket();
  const videoFile = bucket.file(videoPath);

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

    if (true) {
      res.writeHead(200, {
        "Content-Type": "application/x-mpegURL",
        "Content-Length": videoSize.toString(),
      });

      const readStream = videoFile.createReadStream();
      readStream.pipe(res);
    } else {
      const headers = {
        "Content-Length": videoSize,
        "Content-Type": videoType,
      };

      res.writeHead(200, headers);
      videoFile.createReadStream().pipe(res);
    }
  } catch (error) {
    console.error("Lỗi khi tải tệp HLS từ Firebase Storage:", error);
    res.status(500).send("Lỗi khi tải tệp HLS từ Firebase Storage");
  }
});

router.get(
  "/videoHLS/:specificFolder/:childFolder/:videoName",
  async (req, res) => {
    // const range = req.headers.range;
    // console.log(">>> check range <<<", range);
    // if (!range) {
    //   res.status(400).send("requires range header");
    //   return;
    // }
    const videoName = req.params.videoName; // Thay thế bằng tên tệp video trên Firebase Storage
    // const specificFolder = req.query.specificFolder;
    const childFolder = req.params.childFolder;
    const specificFolder = req.params.specificFolder;
    console.log(">>> videoName <<<", videoName);
    console.log(">>> specificFolder <<<", specificFolder);

    // Tạo một đường dẫn tới thư mục ảo 'files'
    const folder = `files/${specificFolder}/${childFolder}/`;
    // const folder = `${specificFolder}/${childFolder}/`;
    const videoPath = folder + videoName;
    // const videoPath = "test_hls/" + videoName;
    console.log(">>> videoPath <<<", videoPath);

    const bucket = admin.storage().bucket();
    const videoFile = bucket.file(videoPath);

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

      if (true) {
        res.writeHead(200, {
          "Content-Type": "application/x-mpegURL",
          "Content-Length": videoSize.toString(),
        });

        const readStream = videoFile.createReadStream();
        readStream.pipe(res);
      } else {
        const headers = {
          "Content-Length": videoSize,
          "Content-Type": videoType,
        };

        res.writeHead(200, headers);
        videoFile.createReadStream().pipe(res);
      }
    } catch (error) {
      console.error("Lỗi khi tải tệp HLS từ Firebase Storage:", error);
      res.status(500).send("Lỗi khi tải tệp HLS từ Firebase Storage");
    }
  }
);

router.get(
  "/videoHLS/:specificFolder/:childFolder/:childFolder_2/:videoName",
  async (req, res) => {
    // const range = req.headers.range;
    // console.log(">>> check range <<<", range);
    // if (!range) {
    //   res.status(400).send("requires range header");
    //   return;
    // }
    const videoName = req.params.videoName; // Thay thế bằng tên tệp video trên Firebase Storage
    // const specificFolder = req.query.specificFolder;
    const childFolder = req.params.childFolder;
    const childFolder_2 = req.params.childFolder_2;
    const specificFolder = req.params.specificFolder;
    console.log(">>> videoName <<<", videoName);
    console.log(">>> specificFolder <<<", specificFolder);

    // Tạo một đường dẫn tới thư mục ảo 'files'
    const folder = `files/${specificFolder}/${childFolder}/${childFolder_2}/`;
    // const folder = `${specificFolder}/${childFolder}/`;
    const videoPath = folder + videoName;
    // const videoPath = "test_hls/" + videoName;
    console.log(">>> videoPath <<<", videoPath);

    const bucket = admin.storage().bucket();
    const videoFile = bucket.file(videoPath);

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

      if (true) {
        res.writeHead(200, {
          "Content-Type": "application/x-mpegURL",
          "Content-Length": videoSize.toString(),
        });

        const readStream = videoFile.createReadStream();
        readStream.pipe(res);
      } else {
        const headers = {
          "Content-Length": videoSize,
          "Content-Type": videoType,
        };

        res.writeHead(200, headers);
        videoFile.createReadStream().pipe(res);
      }
    } catch (error) {
      console.error("Lỗi khi tải tệp HLS từ Firebase Storage:", error);
      res.status(500).send("Lỗi khi tải tệp HLS từ Firebase Storage");
    }
  }
);

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
