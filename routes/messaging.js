const express  = require('express');
const config = require('../config');
const fs = require('fs');


const telnyx = require('telnyx')(config.TELNYX_API_KEY);
const router = module.exports = express.Router();
const url = require('url');

const toBase64 = data => (new Buffer.from(data)).toString('base64');
const fromBase64 = data => (new Buffer.from(data, 'base64')).toString();


const outboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received message DLR with ID: ${event.payload.id}`)
}


const inboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log("Message: "+event.payload.text)
  const toNumber = event.payload.to[0].phone_number;
  const fromNumber = event.payload['from'].phone_number;

}

router.route('/inbound')
    .post(inboundMessageController)

router.route('/outbound')
    .post(outboundMessageController)