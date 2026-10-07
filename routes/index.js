const express = require('express');
const { ObjectId } = require('mongodb');
const {readSession} = require('../session');

const router = express.Router();


/* GET home page. */
router.get('/', async (req, res) => {
  //make sure that the user is logged in
  const session = readSession(req);
  if (!session) return res.redirect('/login');
  //pull the user info from the server
  try {
    // pull the saved code of the logged in user
    const storedCode = req.app.get('storedCode');
    const CurrentUserID = req.session.userId;
    const savedCode = await storedCode.find({userID: new ObjectId(CurrentUserID)}).toArray();
    //check to see if loading previously saved code
    let userCodeName = '';
    let userFunction = '';
    if(req.query.codename) {
      userCodeName = req.query.codename;
      userFunction = await storedCode.find({userID: new ObjectId(CurrentUserID), codeName: userCodeName}).toArray();
    }
    res.render('index', { title: 'Home', savedCode, userCodeName, userFunction});
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading saved code');
  }
});

module.exports = router;
