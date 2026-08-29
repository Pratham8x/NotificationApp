const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const {sendChatNotificationIfOffline} = require('../services/notificationService');

const listUsers = async (req, res) => {
  try {
    const users = await User.find({_id: {$ne: req.user._id}})
      .select('_id mobileNumber createdAt')
      .sort({createdAt: -1})
      .lean();
    return res.json({success: true, users});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};

const getConversation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({success: false, message: 'Invalid user'});
    }
    const otherUser = await User.findById(req.params.userId).select('_id');
    if (!otherUser) return res.status(404).json({success: false, message: 'User not found'});
    const messages = await Message.find({
      $or: [
        {sender: req.user._id, recipient: otherUser._id},
        {sender: otherUser._id, recipient: req.user._id},
      ],
    }).sort({createdAt: 1}).limit(500).lean();
    await Message.updateMany(
      {sender: otherUser._id, recipient: req.user._id, readAt: null},
      {$set: {readAt: new Date()}},
    );
    return res.json({success: true, messages});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};

const createMessage = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    const recipientId = req.params.userId;
    if (!mongoose.isValidObjectId(recipientId) || !text) {
      return res.status(400).json({success: false, message: 'Recipient and message are required'});
    }
    const recipient = await User.findById(recipientId).select('_id');
    if (!recipient) return res.status(404).json({success: false, message: 'User not found'});
    const message = await Message.create({sender: req.user._id, recipient: recipient._id, text});
    const payload = message.toObject();
    const io = req.app.get('io');
    io?.to(`user:${recipientId}`).to(`user:${req.user._id}`).emit('message:new', payload);
    sendChatNotificationIfOffline({
      io,
      recipientId,
      senderId: req.user._id,
      senderMobileNumber: req.user.mobileNumber,
      text,
    }).catch(error => console.error('Chat notification error:', error.message));
    return res.status(201).json({success: true, message: payload});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};

module.exports = {listUsers, getConversation, createMessage};
