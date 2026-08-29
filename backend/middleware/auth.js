const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({success: false, message: 'Authentication required'});
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('_id mobileNumber');
    if (!user) return res.status(401).json({success: false, message: 'User no longer exists'});
    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({success: false, message: 'Invalid or expired token'});
  }
};

module.exports = authenticate;
