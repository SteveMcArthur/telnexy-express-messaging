const express  = require('express');
const router = module.exports = express.Router();

router.route('/').get((req, res) => {
    res.send('Hello World!')
});