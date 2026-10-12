const express = require('express');
const {readSession} = require('../session');
const router = express.Router();

router.get("/", (req, res) => {
  if (readSession(req)) return res.redirect("/");
  res.render('signUp', {title: 'sign up'});
});

module.exports = router;