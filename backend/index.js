const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const whatsappWebhookRoute = require('./routes/whatsappWebhook');

dotenv.config();

const app = express();
const PORT = 3001;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/whatsapp/webhook', whatsappWebhookRoute);

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running at http://localhost:${PORT}`);
});
