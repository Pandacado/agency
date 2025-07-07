// backend/routes/webhook.js
const express = require('express');
const router = express.Router();

// Geçici mesaj listesi bellekte (db yerine)
const messages = [];

router.post('/', (req, res) => {
  const { Body, From } = req.body;

  console.log(`Yeni mesaj: ${Body} - Kimden: ${From}`);

  messages.push({
    direction: 'inbound',
    message: Body,
    from: From,
    created_at: new Date().toISOString()
  });

  res.status(200).send('OK');
});

router.get('/:phone', (req, res) => {
  const phone = `whatsapp:${req.params.phone}`;
  const customerMessages = messages.filter(msg => msg.from === phone);
  res.json(customerMessages);
});

module.exports = router;
