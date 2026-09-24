const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const sessionSecret = process.env.SESSION_SECRET;

if (!process.env.MONGODB_URI || !process.env.DB_NAME || !sessionSecret) {
  console.error("Missing MONGODB_URI, DB_NAME, or SESSION_SECRET in .env");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

let users;

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
  const page = readSession(req) ? "index.html" : "login.html";
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

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

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
  if (!user) return res.status(401).json({ message: "Account not found" });
  res.json({ user });
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie("session", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  res.json({ message: "Logged out" });
});

async function startServer() {
  try {
    await client.connect();

    const db = client.db(process.env.DB_NAME);

    users = db.collection("users");

    console.log("Connected to MongoDB");

    app.listen(port, () => {
      console.log(
        `Server running at http://localhost:${port}`
      );
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

startServer();
