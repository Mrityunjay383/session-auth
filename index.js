const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB, connection } = require('./src/db');
const authRouter = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/auth', authRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function start() {
  await connectDB();

  // Set up session middleware after connecting so MongoStore reuses
  // the existing Mongoose connection instead of opening a second one
  app.use(
    session({
      name: 'sid',
      secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongooseConnection: connection,
        collectionName: 'sessions',
        ttl: 60 * 60 * 24,
        autoRemove: 'native',
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );

  app.listen(PORT, () => {
    console.log(`Auth server running on http://localhost:${PORT}`);
  });
}

start();
