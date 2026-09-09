const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  text: {type: String, required: true, trim: true, maxlength: 2000},
  answer: {type: String, default: null},
}, {timestamps: true});

aiMessageSchema.index({user: 1, createdAt: -1, _id: -1});

module.exports = mongoose.model('AiMessage', aiMessageSchema);
