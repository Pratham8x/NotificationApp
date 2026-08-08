const User = require("../models/User");

const {
  sendNotification,
} = require("../services/notificationService");

const registerFcmToken = async (req, res) => {
  try {
    const {
      userId,
      token,
      deviceType = "android",
    } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "userId and FCM token are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const tokenExists = user.fcmTokens.some(
      item => item.token === token
    );

    if (!tokenExists) {
      user.fcmTokens.push({
        token,
        deviceType,
      });

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "FCM token registered successfully",
    });
  } catch (error) {
    console.error("Register FCM token error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register FCM token",
      error: error.message,
    });
  }
};

const sendUserNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      body,
      data = {},
    } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "userId, title and body are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No FCM tokens found for this user",
      });
    }

    const results = [];

    for (const device of user.fcmTokens) {
      try {
        const response = await sendNotification({
          token: device.token,
          title,
          body,
          data,
        });

        results.push({
          token: device.token,
          success: true,
          response,
        });
      } catch (error) {
        results.push({
          token: device.token,
          success: false,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Notification processing completed",
      results,
    });
  } catch (error) {
    console.error("Send notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

module.exports = {
  registerFcmToken,
  sendUserNotification,
};