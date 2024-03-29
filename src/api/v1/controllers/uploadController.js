// import { initializeApp } from "firebase/app";
// import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
// import multer from "multer";
// import config from "../../../config/firebase.config";

const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { initializeApp } = require("firebase/app");
// const { Storage } = require("@google-cloud/storage");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  updateMetadata,
} = require("firebase/storage");
const router = express.Router();
const multer = require("multer");
const config = require("../../../configs/firebase.config");
// const serviceAccount = require("../../../configs/service-firebase-admin.json");
const admin = require("firebase-admin");
//Initialize a firebase application
const app = initializeApp(config.firebaseConfig);
// const analytics = getAnalytics(app);
const bucket = admin.storage().bucket();
// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() });
router.post(
  "/photos/upload",
  upload.array("photos", 30),
  async function (req, res, next) {
    try {
      console.log(">>> check req multiple: <<<", req.files);
      console.log(">>> check req multiple: <<<", req.body);
      const { folderOnFirebase } = req.body;
      // console.log(req.body)
      // req.files là một mảng của các file `photos`
      // req.body sẽ giữ thông tin gắn kèm (vd: text fields), nếu có
      const dateTime = giveCurrentDateTime();
      let result = [];
      for (const file of req.files) {
        console.log(">>> file: <<<", file);
        const newFileName =
          file.originalname.replace(/\.[^/.]+$/, "") + "_" + dateTime + ".jpg";
        const storageRef = ref(
          storage,
          `images/${folderOnFirebase}/${newFileName}`
        );

        const metadata = {
          contentType: file.mimetype,
        };

        const snapshot = await uploadBytesResumable(
          storageRef,
          file.buffer,
          metadata
        );

        console.log(
          "print snapshot",
          snapshot.bytesTransferred,
          "----",
          snapshot.totalBytes
        );

        const downloadURL = await getDownloadURL(snapshot.ref);
        result.push({
          name: file.originalname,
          type: file.mimetype,
          downloadURL: downloadURL,
        });
      }

      return res.json({
        message: "file photos uploaded to firebase storage",
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error.message);
    }
  }
);

router.post("/", upload.single("filename"), async (req, res) => {
  console.log(">>> Req File Upload: <<<", req.file);
  const { folderOnFirebase } = req.body;

  // console.log(">>> req.file.originalname: <<<", req.file.originalname);
  try {
    const dateTime = giveCurrentDateTime();
    let folderSpecificFilm;
    if (folderOnFirebase) {
      folderSpecificFilm = folderOnFirebase;
    } else {
      folderSpecificFilm =
        req.file.originalname.replace(/\.[^/.]+$/, "") + "_" + dateTime;
    }

    // const newFileName =
    //   req.file.originalname.replace(/\.[^/.]+$/, "") + "_" + dateTime + ".mp4";

    const fileNameEncode = decodeURIComponent(req.file.originalname);

    const storageRef = ref(
      storage,
      `files/${folderSpecificFilm}/${fileNameEncode}`
    );
    // console.log("storage", storageRef);
    // Create file metadata including the content type
    const metadata = {
      contentType: req.file.mimetype,
      // contentType: "video/webm",
    };

    // Upload the file in the bucket storage
    const uploadTask = uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        console.log("Handle unsuccessful uploads", err);
        return res.status(400).send(error);
      },
      async () => {
        // Handle successful uploads on complete
        // Grab the public url of the original file
        // console.log(">>> upload task <<<", uploadTask);
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Trả về thông tin tệp gốc và tệp HLS
        return res.json({
          message: "Original files uploaded to Firebase Storage",
          name: fileNameEncode,
          folderSpecificFilm,
          type: req.file.mimetype,
          downloadURL: downloadURL,
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(400).send(error.message);
  }
});

router.post("/uploadHLS", upload.single("filename"), async (req, res) => {
  console.log(">>> Req File Upload: <<<", req.file);
  const { folderOnFirebase } = req.body;

  try {
    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    // Lưu tệp MP4 lên Firebase Storage
    const storagePath = path.join("files", folderOnFirebase, fileName);
    const fileRef = bucket.file(storagePath);
    await fileRef.save(fileBuffer, { contentType: "video/mp4" });

    // Chuyển đổi tệp MP4 thành HLS
    const outputDir = path.join(__dirname, "temp_hls");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const hlsOutput = path.join(outputDir, "output.m3u8");
    const hlsSegmentPattern = path.join(outputDir, "segment_%03d.ts");

    const ffmpegProcess = spawn("ffmpeg", [
      "-i",
      `riengminhanh.mp4`, // Đường dẫn đến tệp MP4 trên Firebase
      "-profile:v",
      "baseline",
      "-level",
      "3.0",
      "-start_number",
      "0",
      "-hls_time",
      "10", // Độ dài của mỗi phân đoạn .ts (ví dụ: 10 giây)
      "-hls_list_size",
      "0", // Số lượng tệp .ts trong danh sách phát
      "-hls_segment_filename",
      hlsSegmentPattern,
      hlsOutput,
    ]);

    ffmpegProcess.on("close", async () => {
      console.log("Chuyển đổi video thành công.");

      // Tải tệp M3U8 và các tệp .ts lên Firebase Storage
      const hlsFilesToUpload = fs.readdirSync(outputDir);

      const uploadPromises = hlsFilesToUpload.map(async (file) => {
        const filePath = path.join(outputDir, file);
        const hlsStoragePath = path.join("files", folderOnFirebase, file);
        const hlsFileRef = bucket.file(hlsStoragePath);
        await hlsFileRef.save(fs.readFileSync(filePath), {
          contentType: "application/vnd.apple.mpegurl",
        });
        fs.unlinkSync(filePath); // Xóa tệp cục bộ sau khi tải lên Firebase
        return hlsStoragePath;
      });

      // Khi tất cả các tệp đã được tải lên Firebase Storage
      const uploadedHLSFiles = await Promise.all(uploadPromises);
      console.log("Tải tệp lên Firebase Storage thành công.");

      // Trả về thông tin tệp gốc và tệp HLS đã tạo
      res.json({
        message: "Original and HLS files uploaded to Firebase Storage",
        originalFileName: fileName,
        folderOnFirebase,
        downloadURL: fileRef.publicUrl(), // Đường dẫn công khai đến tệp gốc
        hlsFiles: uploadedHLSFiles, // Mảng chứa đường dẫn đến các tệp HLS đã tạo
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// UPLOAD SUBTITLES
router.post(
  "/subtitles",
  upload.array("subtitles", 30),
  async function (req, res, next) {
    try {
      console.log(">>> check req multiple: <<<", req.files);
      console.log(">>> check req multiple: <<<", req.body);
      const { folderOnFirebase } = req.body;
      // console.log(req.body)
      // req.files là một mảng của các file `photos`
      // req.body sẽ giữ thông tin gắn kèm (vd: text fields), nếu có
      const dateTime = giveCurrentDateTime();
      let result = [];
      for (const file of req.files) {
        console.log(">>> file: <<<", file);

        const newFileName =
          file.originalname.replace(/\.[^/.]+$/, "") + "_" + dateTime + ".vtt";
        const storageRef = ref(
          storage,
          `files/${folderOnFirebase}/${file.originalname}`
        );

        // const metadata = {
        //   contentType: file.mimetype,
        // };
        const metadata = {
          contentType: "text/vtt; charset=utf-8",
        };

        // const snapshot = await uploadBytesResumable(
        //   storageRef,
        //   file.buffer,
        //   metadata
        // );
        const snapshot = await uploadBytesResumable(
          storageRef,
          Buffer.from(file.buffer, "utf-8"),
          metadata
        );

        console.log(
          "print snapshot",
          snapshot.bytesTransferred,
          "----",
          snapshot.totalBytes
        );

        const downloadURL = await getDownloadURL(snapshot.ref);
        result.push({
          name: file.originalname,
          type: file.mimetype,
          downloadURL: downloadURL,
        });
      }

      return res.json({
        message: "file subtitles uploaded to firebase storage",
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error.message);
    }
  }
);

// lấy ngày và giờ hiện tại
const giveCurrentDateTime = () => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + "_" + time;
  return dateTime;
};

module.exports = router;
