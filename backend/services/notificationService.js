require("../config/firebase");

const { getMessaging } = require("firebase-admin/messaging");
const User = require('../models/User');

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
    android: {
      priority: 'high',
      notification: {sound: 'default'},
    },
    apns: {
      payload: {aps: {sound: 'default'}},
    },
  };

  const response = await getMessaging().send(message);

  console.log("Notification sent:", response);

  return response;
};

const sendChatNotificationIfOffline = async ({io, recipientId, senderId, senderMobileNumber, text}) => {
  const recipientRoom = io?.sockets?.adapter?.rooms?.get(`user:${recipientId}`);
  if (recipientRoom?.size) return {sent: false, reason: 'recipient-online'};

  const recipient = await User.findById(recipientId).select('fcmTokens').lean();
  const tokens = [...new Set((recipient?.fcmTokens || []).map(item => item.token).filter(Boolean))];
  if (!tokens.length) return {sent: false, reason: 'no-fcm-token'};

  const notification = {
    title: `+91 ${senderMobileNumber}`,
    body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
    data: {
      type: 'chat_message',
      senderId: String(senderId),
    },
  };

  // FCM data values must be strings. Include the sender number so the app
  // can show useful context even before it fetches the conversation.
  notification.data.senderMobileNumber = String(senderMobileNumber);
  const results = await Promise.allSettled(tokens.map(token => sendNotification({...notification, token})));
  return {sent: results.some(result => result.status === 'fulfilled'), results};
};

module.exports = {
  sendNotification,
  sendChatNotificationIfOffline,
};
