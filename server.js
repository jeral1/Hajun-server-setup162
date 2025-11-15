const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MESSAGES_FILE = path.join(__dirname, "messages.json");
let messages = [];

// Load saved messages
if (fs.existsSync(MESSAGES_FILE)) {
  const data = fs.readFileSync(MESSAGES_FILE, "utf-8");
  try {
    messages = JSON.parse(data);
  } catch (e) {
    messages = [];
  }
}

// Save messages
function saveMessages() {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// POST /send
app.post("/send", (req, res) => {
  const b = req.body;
  const m = {
    id: Date.now(),
    name: b.name || "Anonymous",
    text: b.text || "",
    ts: new Date().toISOString()
  };
  messages.push(m);
  if (messages.length > 500) messages.shift();
  saveMessages();
  console.log(`[Eternal Nights | FNaF Coop] ${m.name}: ${m.text}`);
  res.json({ ok: true });
});

// GET /fetch
app.get("/fetch", (req, res) => {
  const since = Number(req.query.since) || 0;
  const newMessages = messages.filter(m => m.id > since);
  res.json({ messages: newMessages });
});

// Root
app.get("/", (req, res) => {
  res.send("🌌 Eternal Nights | FNaF Coop Chat Server is running!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌙 Eternal Nights | FNaF Coop Chat Server running on port ${PORT}`);
});

let onlineUsers = {};

// POST /join
app.post("/join", (req, res) => {
  const name = req.body.name || "Anonymous";
  onlineUsers[name] = Date.now(); // store timestamp
  res.json({ ok: true });
});

// POST /leave
app.post("/leave", (req, res) => {
  const name = req.body.name || "Anonymous";
  delete onlineUsers[name];
  res.json({ ok: true });
});

// GET /online
app.get("/online", (req, res) => {
  const now = Date.now();
  // Only count users active in last 5 minutes
  const activeUsers = Object.entries(onlineUsers)
    .filter(([_, ts]) => now - ts < 1000 * 60 * 5)
    .map(([name, _]) => name);

  res.json({ count: activeUsers.length, users: activeUsers });
});
