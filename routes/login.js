const express = require('express');
const router = express.Router();
const {readSession} = require('../session')
const path = require('path');
const { title } = require('process');

router.get('/', (req, res) => {
  const session = readSession(req);
  if (session) return res.redirect('/');
  res.render('login', {title});
});

module.exports = router;