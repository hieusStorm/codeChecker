const express = require('express');
const router = express.Router();
const {readSession} = require('../session');

router.get('/', (req, res) => {
  if (readSession(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

module.exports = router;