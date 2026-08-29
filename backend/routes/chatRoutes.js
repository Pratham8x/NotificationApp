const express = require('express');
const authenticate = require('../middleware/auth');
const {createMessage, getConversation} = require('../controllers/chatController');

const router = express.Router();
router.use(authenticate);
router.get('/:userId/messages', getConversation);
router.post('/:userId/messages', createMessage);

module.exports = router;
