const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TEST_OTP = '123456';
const normalizeMobile = value => String(value || '').replace(/\D/g, '');

const requestOtp = async (req, res) => {
  const mobileNumber = normalizeMobile(req.body.mobileNumber);
  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({success: false, message: 'Enter a valid 10-digit mobile number'});
  }
  return res.json({success: true, message: 'OTP sent successfully'});
};

const verifyOtp = async (req, res) => {
  try {
    const mobileNumber = normalizeMobile(req.body.mobileNumber);
    const otp = String(req.body.otp || '');
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({success: false, message: 'Enter a valid 10-digit mobile number'});
    }
    if (otp !== TEST_OTP) {
      return res.status(401).json({success: false, message: 'The OTP you entered is incorrect'});
    }
    const user = await User.findOneAndUpdate(
      {mobileNumber}, {$setOnInsert: {mobileNumber}}, {new: true, upsert: true, runValidators: true},
    );
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '30d'});
    return res.json({success: true, message: 'OTP verified successfully', token, user});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};

module.exports = {requestOtp, verifyOtp};
