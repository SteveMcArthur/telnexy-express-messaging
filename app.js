require('dotenv').config()

const express = require('express');
const config = require('./config');
const telnyx = require('telnyx')(config.TELNYX_API_KEY);
console.log(config.TELNYX_API_KEY);

const home = require('./routes/index');
const messaging = require('./routes/messaging');

const app = express();

const webhookValidator = (req, res, next) => {
  console.log(`req.path ${req.path}`);
  if (req.path == "/messaging") {
    try {
      telnyx.webhooks.constructEvent(
        JSON.stringify(req.body, null, 2),
        req.header('telnyx-signature-ed25519'),
        req.header('telnyx-timestamp'),
        config.TELNYX_PUBLIC_KEY
      )
      next();
      return;
    }
    catch (e) {
      console.log(`Invalid webhook: ${e.message}`);
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }
  }{
    console.log("calling next...");
    next();
    return;
  }
}

app.use(express.json());
app.use(webhookValidator);
app.use('/', home);

app.use('/messaging', messaging);

module.exports = app;