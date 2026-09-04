const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "12mb" }));

// Public website and browser app.
app.use(express.static(__dirname));
app.use("/app", express.static(path.join(__dirname, "app")));

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    : null;

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/app", (req, res) => res.sendFile(path.join(__dirname, "app", "index.html")));

app.get("/api/config", (req, res) => {
  res.json({
    serviceName: "Luka",
    version: "10.0.1",
    supabase: {
      enabled: !!supabase,
      url: process.env.SUPABASE_URL || null,
      publishableKey: process.env.SUPABASE_KEY || null
    },
    features: {
      auth: !!supabase,
      database: !!supabase,
      realtime: !!supabase,
      storage: !!supabase,
      ai: !!process.env.OPENAI_API_KEY,
      webrtc: true
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Luka",
    version: "10.0.1",
    database: supabase ? "supabase" : "not-configured",
    realtime: true,
    storage: !!supabase,
    ai: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/db/status", async (req, res) => {
  if (!supabase) return res.json({ ok: true, driver: "not-configured", production: false });
  const { error } = await supabase.from("profiles").select("id").limit(1);
  res.json({
    ok: !error,
    driver: "supabase",
    production: true,
    error: error?.message || null
  });
});

app.get("/api/luka-ai/status", (req, res) => {
  res.json({
    ok: true,
    service: "Luka AI",
    configured: !!process.env.OPENAI_API_KEY,
    model: process.env.LUKA_AI_MODEL || "gpt-5-mini",
    serverVersion: "10.0.1"
  });
});

app.post("/api/luka-ai", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Message is empty." });
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "Luka AI is not configured on the server.",
        code: "AI_KEY_MISSING"
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const history = Array.isArray(req.body?.conversation)
      ? req.body.conversation.slice(-12)
      : [];

    const input = [
      {
        role: "developer",
        content:
          "You are Luka, the official AI assistant of a communication platform. Be friendly, concise, honest, and reply in the user's language. Never claim an unimplemented platform feature exists."
      },
      ...history.map((x) => ({
        role: x.role === "assistant" ? "assistant" : "user",
        content: String(x.content || "")
      })),
      { role: "user", content: message }
    ];

    const response = await client.responses.create({
      model: process.env.LUKA_AI_MODEL || "gpt-5-mini",
      input
    });

    res.json({
      ok: true,
      reply: (response.output_text || "").trim() || "I couldn't generate a reply."
    });
  } catch (error) {
    console.error("Luka AI error:", error);
    res.status(500).json({ error: "Luka AI request failed", code: "AI_REQUEST_FAILED" });
  }
});

// Download the source bundle generated during packaging.
app.get("/api/download/source", (req, res) => {
  const file = path.join(__dirname, "downloads", "Luka-Web-Source.zip");
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: "The download bundle has not been built." });
  }
  res.download(file, "Luka-Web-Source.zip");
});

io.on("connection", (socket) => {
  socket.emit("luka:ready", { version: "10.0.1" });
  socket.on("luka:ping", () => socket.emit("luka:pong"));
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Luka V10.0.1 listening on ${PORT}`);
});
