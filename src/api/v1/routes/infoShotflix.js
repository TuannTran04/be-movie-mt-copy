const infoShotflixController = require("../controllers/infoShotflixController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");
const router = require("express").Router();

//GET ALL NOTIFY BY USER ID
router.get("/", infoShotflixController.getInfoShotflix);
// router.get(
//   "/get-unread-notify/:recipientId",
//   infoShotflixController.getAllUnreadNotifyByUserId
// );

// router.post("/add-notify", infoShotflixController.addNotify);
router.post("/add-info-shotflix", infoShotflixController.addInfoShotflix);

// // //UPDATE NOTIFY
// router.put("/update-notify-read", infoShotflixController.updateNotifyRead);
// router.put("/update-notify-seen", infoShotflixController.updateNotifySeen);
// // router.put("/update-reply-comment", infoShotflixController.updateReplyComment);

// // //DELETE COMMENT
// router.delete("/delete-notify/:notifyId", infoShotflixController.deleteNotify);

module.exports = router;
