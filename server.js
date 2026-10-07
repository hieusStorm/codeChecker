//server constants
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const createError = require('http-errors');
const {parseCookies, createSession, readSession, requireAuth} = require('./session');

require('dotenv').config();

// routers
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const loginrouter = require('./routes/login');


function createApp(users, sessionSecret) {
const app = express();
app.use(express.json());
app.get('/index.html', (req, res, next) => {
  if (!readSession(req)) return res.redirect('/login');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

//make session information readable to the whole app
app.set('requireAuth', requireAuth);

//set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//routes to use
app.use('/login', loginrouter);
app.use('/api', apiRouter);
app.use('/', app.get('requireAuth'), indexRouter);

return app;
}

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!process.env.MONGODB_URI || !process.env.DB_NAME || !sessionSecret) {
    throw new Error('Missing MONGODB_URI, DB_NAME, or SESSION_SECRET in .env');
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    // connect to the databasew
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const users = db.collection(process.env.USERS_COLLECTION || 'CSE');
    const storedCode = db.collection('storedCode');

    const app = createApp(users, sessionSecret);
    //add access to the app to read and write to the tables
    app.set('storedCode', storedCode);
    app.set('users', users);

    console.log('Connected to MongoDB');

    app.listen(port, () => {
      console.log(
        `Server running at http://localhost:${port}`
      );
    });
  } catch (error) {
    await client.close();
    throw error;
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Server startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { createApp };
