const express = require('express');
const router = express.Router();
const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

router.post('/', async (req, res) => {
  const { to, body } = req.body;

  try {
    const message = await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to,
      body,
    });

    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Twilio Hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
