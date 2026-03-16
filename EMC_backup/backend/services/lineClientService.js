// services/lineClientService.js
const { Client } = require('@line/bot-sdk');

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret:      process.env.LINE_CHANNEL_SECRET,
});

// Reply — ฟรี ใช้ replyToken (หมดอายุใน 30 วินาที)
async function reply(replyToken, messages) {
  const msgs = Array.isArray(messages) ? messages : [messages];
  return client.replyMessage(replyToken, msgs);
}

// Push — ส่งหา User ตอนไหนก็ได้ (ใช้ quota)
async function push(lineUserId, messages) {
  const msgs = Array.isArray(messages) ? messages : [messages];
  return client.pushMessage(lineUserId, msgs);
}

// Multicast — push หลาย User พร้อมกัน (สูงสุด 500 คน)
async function multicast(lineUserIds, messages) {
  const msgs = Array.isArray(messages) ? messages : [messages];
  return client.multicast(lineUserIds, msgs);
}

// ดึง Profile
async function getProfile(lineUserId) {
  return client.getProfile(lineUserId);
}

// ดาวน์โหลดรูป/ไฟล์จาก Line Server
async function getContent(messageId) {
  return client.getMessageContent(messageId);
}

module.exports = { reply, push, multicast, getProfile, getContent };
