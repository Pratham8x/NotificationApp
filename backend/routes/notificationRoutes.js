const express = require("express");

const {
  registerFcmToken,
  sendUserNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.post(
  "/register-token",
  registerFcmToken
);

router.post(
  "/send",
  sendUserNotification
);

module.exports = router;