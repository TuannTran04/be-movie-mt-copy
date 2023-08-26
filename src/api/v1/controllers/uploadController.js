// import { initializeApp } from "firebase/app";
// import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
// import multer from "multer";
// import config from "../../../config/firebase.config";

const express = require("express");
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const multer = require("multer");
const config = require("../../../config/firebase.config");

const router = express.Router();

//Initialize a firebase application
const app = initializeApp(config.firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() });
router.post(
  "/photos/upload",
  upload.array("photos", 12),
  async function (req, res, next) {
    try {
      // console.log("check req multiple",req.files)
      // console.log(req.body)
      // req.files là một mảng của các file `photos`
      // req.body sẽ giữ thông tin gắn kèm (vd: text fields), nếu có
      const dateTime = giveCurrentDateTime();
      let result = [];
      for (const file of req.files) {
        console.log(file);
        const storageRef = ref(
          storage,
          `many_img/${file.originalname + "       " + dateTime}`
        );
        const metadata = {
          contentType: file.mimetype,
        };
        const snapshot = await uploadBytesResumable(
          storageRef,
          file.buffer,
          metadata
        );

        const downloadURL = await getDownloadURL(snapshot.ref);
        result.push({
          name: file.originalname,
          type: file.mimetype,
          downloadURL: downloadURL,
        });
      }

      return res.json({
        message: "file uploaded to firebase storage",
        data: result,
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  }
);

router.post("/", upload.single("filename"), async (req, res) => {
  console.log(">>> Req File Upload: <<<", req.file);
  try {
    const dateTime = giveCurrentDateTime();

    const storageRef = ref(
      storage,
      `files/${req.file.originalname + "       " + dateTime}`
    );
    console.log("storage", storageRef);
    // Create file metadata including the content type
    const metadata = {
      contentType: req.file.mimetype,
    };

    // Upload the file in the bucket storage
    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel
    console.log(
      "print snapshot",
      snapshot.bytesTransferred,
      "----",
      snapshot.totalBytes
    );

    // Grab the public url
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("File successfully uploaded.");
    return res.json({
      message: "file uploaded to firebase storage",
      name: req.file.originalname,
      type: req.file.mimetype,
      downloadURL: downloadURL,
    });
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

// lấy ngày và giờ hiện tại
const giveCurrentDateTime = () => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + " " + time;
  return dateTime;
};

module.exports = router;
