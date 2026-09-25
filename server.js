const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config();

function createApp(users, sessionSecret) {
const app = express();
app.use(express.json());
app.get("/index.html", (req, res, next) => {
  if (!readSession(req)) return res.redirect("/login");
  next();
});
app.use(express.static(path.join(__dirname, "public"), { index: false }));

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "").split(";").filter(Boolean).map((cookie) => {
      const separator = cookie.indexOf("=");
      return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1))];
    })
  );
}

function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({ userId: String(userId), expiresAt: Date.now() + 86400000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(req) {
  try {
    const [payload, signature] = (parseCookies(req).session || "").split(".");
    const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ message: "Please log in" });
  req.session = session;
  next();
}

app.get("/", (req, res) => {
  if (!readSession(req)) return res.redirect("/login");
  const page = "index.html";
  res.sendFile(path.join(__dirname, "public", page));
});

app.get("/login", (req, res) => {
  if (readSession(req)) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/api/login", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await users.findOne({
      email
    });

    if (!user || user.isActive === false) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const storedPassword = user.passwordHash;
    let passwordMatches = false;
    if (typeof storedPassword === "string" && storedPassword.startsWith("$2")) {
      passwordMatches = await bcrypt.compare(password, storedPassword);
    } else if (typeof storedPassword === "string" && storedPassword.length > 0) {
      // Upgrade legacy plaintext records only after verifying the supplied password.
      const supplied = crypto.createHash("sha256").update(password).digest();
      const stored = crypto.createHash("sha256").update(storedPassword).digest();
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
        message: "Invalid email or password"
      });
    }

    res.cookie("session", createSession(user._id), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000
    });

    res.json({
      message: "Login successful",
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
      message: "Server error"
    });
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  const { ObjectId } = require("mongodb");
  const user = await users.findOne(
    { _id: new ObjectId(req.session.userId) },
    { projection: { passwordHash: 0 } }
  );
  if (!user || user.isActive === false) return res.status(401).json({ message: "Please log in" });
  res.set("Cache-Control", "no-store");
  res.json({ user: { id: user._id, username: user.username, email: user.email,
    firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie("session", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  res.json({ message: "Logged out" });
});

return app;
}

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!process.env.MONGODB_URI || !process.env.DB_NAME || !sessionSecret) {
    throw new Error("Missing MONGODB_URI, DB_NAME, or SESSION_SECRET in .env");
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();

    const db = client.db(process.env.DB_NAME);

    const users = db.collection(process.env.USERS_COLLECTION || "CSE");
    const app = createApp(users, sessionSecret);

    console.log("Connected to MongoDB");

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
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { createApp };
