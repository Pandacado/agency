const express = require('express');
const router = express.Router();

// Twilio'dan gelen mesajları burada yakalıyoruz
router.post('/', (req, res) => {
  const { From, Body } = req.body;

  console.log('📥 Yeni mesaj geldi!');
  console.log('Kimden:', From);
  console.log('İçerik:', Body);

  // Gelen mesajı logladıktan sonra frontend için ileride buradan veritabanına kaydedebilirsin
  res.status(200).send('Webhook alındı ve işlendi.');
});

module.exports = router;
