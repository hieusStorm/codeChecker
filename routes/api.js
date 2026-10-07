const express = require('express');
const { ObjectId, MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const {parseCookies, createSession, readSession, requireAuth} = require('../session');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const users = req.app.get('users');
    const user = await users.findOne({
      email
    });

    if (!user || user.isActive === false) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const storedPassword = user.passwordHash;
    let passwordMatches = false;
    if (typeof storedPassword === 'string' && storedPassword.startsWith('$2')) {
      passwordMatches = await bcrypt.compare(password, storedPassword);
    } else if (typeof storedPassword === 'string' && storedPassword.length > 0) {
      // Upgrade legacy plaintext records only after verifying the supplied password.
      const supplied = crypto.createHash('sha256').update(password).digest();
      const stored = crypto.createHash('sha256').update(storedPassword).digest();
      passwordMatches = crypto.timingSafeEqual(supplied, stored);
      if (passwordMatches) {
        const passwordHash = await bcrypt.hash(password, 12);
        const update = await users.updateOne(
          { _id: user._id, passwordHash: storedPassword },
          { $set: { passwordHash } }
        );
        if (update.matchedCount !== 1) passwordMatches = false;
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    res.cookie('session', createSession(user._id), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await users.findOne(
    { _id: new ObjectId(req.session.userId) },
    { projection: { passwordHash: 0 } }
  );
  if (!user || user.isActive === false) return res.status(401).json({ message: 'Please log in' });
  res.set('Cache-Control', 'no-store');
  res.json({ user: { id: user._id, username: user.username, email: user.email,
    firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('session', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out' });
});

router.post('/saveCode', async(req, res) => {
  // collect post data
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const functionName = typeof body.codeName === 'string' ? body.codeName : '';
  const usserCode = typeof body.code === 'string' ? body.code : '';
  // make sure post data isn't empty
  if((functionName == '') || (userCode == '')) throw new Error('Could not collect the function name or the code');
  //collect user data
  const user = new ObjectId(req.session.userId);
  // make sure a function with the same name under the current user already exist
  const savedCodes = req.app.get('savedCode');
  const userSavedCodes = await savedCodes.findOne({userID : user, codeName: functionName});
  if (userSavedCodes) {
    // update code entry
    try{
      const result = await savedCodes.updateOne(
        {userID : user, codeName: functionName},
        {$set: {code: userCode}}
      );
      res.status(200).json({message:'Code Changes Saved'});
    }catch(error){
      res.status(500).json({message:'Server Error', error: error.message});
    }
  } else {
    //add code entry
    try {
      const codeEntry = {
        _id: new ObjectId(),
        userID: user,
        code: userCode,
        codeName: functionName
      };
      const result = savedCodes.insertOne(codeEntry);
      res.status(201).json({message: 'code saved successfully', savedCode: result});
    } catch(error) {
      res.status(500).json({message:'Server Error', error: error.message});
    }
  }
});

module.exports = router;