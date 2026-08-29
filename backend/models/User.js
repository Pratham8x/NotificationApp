const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobileNumber: {type: String, required: true, unique: true, trim: true, match: [/^\d{10}$/, 'Mobile number must contain 10 digits']},
  fcmTokens: [{
    token: {type: String, required: true},
    deviceType: {type: String, enum: ['android', 'ios'], required: true},
    createdAt: {type: Date, default: Date.now},
  }],
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);
