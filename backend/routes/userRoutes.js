const express = require("express");

const router = express.Router();

const {requestOtp, verifyOtp} = require('../controllers/userController');
const {listUsers} = require('../controllers/chatController');
const authenticate = require('../middleware/auth');

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.get('/', authenticate, listUsers);

module.exports = router;
