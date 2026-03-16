// routes/lineRoutes.js
const express    = require('express');
const router     = express.Router();
const { middleware } = require('@line/bot-sdk');
const ctrl       = require('../controllers/lineController');

const lineCfg = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret:      process.env.LINE_CHANNEL_SECRET,
};

// Webhook หลัก — Line ส่ง Events ทุกอย่างมาที่นี่
router.post('/webhook', middleware(lineCfg), ctrl.handleWebhook);

// Link Line Account กับ ECMS Account (เรียกจาก Web Frontend)
router.post('/link', ctrl.linkAccount);

module.exports = router;
