const notifyController = require("../controllers/notifyController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");
const router = require("express").Router();

//GET ALL NOTIFY BY USER ID
router.get("/:recipientId", notifyController.getAllNotifyByUserId);

router.post("/add-notify", notifyController.addNotify);
// router.post("/add-reply-comment", notifyController.addReplyComment);

// //UPDATE NOTIFY
router.put("/update-notify-read", notifyController.updateNotifyRead);
// router.put("/update-reply-comment", notifyController.updateReplyComment);

// //DELETE COMMENT
router.delete("/delete-notify/:notifyId", notifyController.deleteNotify);

module.exports = router;
