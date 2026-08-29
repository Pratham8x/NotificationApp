const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const {sendChatNotificationIfOffline} = require('./notificationService');

const configureSocket = io => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select('_id mobileNumber');
      if (!user) return next(new Error('Authentication failed'));
      socket.user = user;
      return next();
    } catch (_error) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', socket => {
    socket.join(`user:${socket.user._id}`);
    socket.emit('socket:ready', {userId: String(socket.user._id)});

    socket.on('message:send', async (data, acknowledge = () => {}) => {
      try {
        const recipientId = String(data?.recipientId || '');
        const text = String(data?.text || '').trim();
        if (!mongoose.isValidObjectId(recipientId) || !text || text.length > 2000) {
          return acknowledge({success: false, message: 'Invalid message'});
        }
        const recipient = await User.findById(recipientId).select('_id');
        if (!recipient) return acknowledge({success: false, message: 'User not found'});
        const message = await Message.create({sender: socket.user._id, recipient: recipient._id, text});
        const payload = message.toObject();
        io.to(`user:${recipientId}`).to(`user:${socket.user._id}`).emit('message:new', payload);
        sendChatNotificationIfOffline({
          io,
          recipientId,
          senderId: socket.user._id,
          senderMobileNumber: socket.user.mobileNumber,
          text,
        }).catch(error => console.error('Chat notification error:', error.message));
        return acknowledge({success: true, message: payload});
      } catch (error) {
        return acknowledge({success: false, message: error.message});
      }
    });
  });
};

module.exports = configureSocket;
