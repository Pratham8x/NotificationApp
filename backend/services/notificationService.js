require("../config/firebase");

const { getMessaging } = require("firebase-admin/messaging");

const sendNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  const message = {
    token,

    notification: {
      title,
      body,
    },

    data,
  };

  const response = await getMessaging().send(message);

  console.log("Notification sent:", response);

  return response;
};

module.exports = {
  sendNotification,
};