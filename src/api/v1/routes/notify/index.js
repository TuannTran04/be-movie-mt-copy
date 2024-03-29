const notifyControllerV2 = require("../../controllers/notify.controller");
const { asyncHandler } = require("../../middleware/asyncHandler");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../../middleware/verifyToken");
const router = require("express").Router();

//GET ALL NOTIFY BY USER ID
router.get(
  "/:recipientId",
  verifyToken,
  asyncHandler(notifyControllerV2.getAllNotifyByUserId)
);
router.get(
  "/get-unread-notify/:recipientId",
  verifyToken,
  asyncHandler(notifyControllerV2.getAllUnreadNotifyByUserId)
);

router.post(
  "/add-notify",
  verifyToken,
  asyncHandler(notifyControllerV2.addNotify)
);
// router.post("/add-reply-comment", notifyController.addReplyComment);

// //UPDATE NOTIFY
router.put(
  "/update-notify-read",
  verifyToken,
  asyncHandler(notifyControllerV2.updateNotifyRead)
);
router.put(
  "/update-notify-seen",
  verifyToken,
  asyncHandler(notifyControllerV2.updateNotifySeen)
);
// router.put("/update-reply-comment", notifyController.updateReplyComment);

// //DELETE COMMENT
router.delete(
  "/delete-notify/:notifyId",
  verifyToken,
  asyncHandler(notifyControllerV2.deleteNotify)
);

module.exports = router;
