const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "12mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Luka",
    version: "4.0.0",
    mode: "v4-web",
    database: "localStorage",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/config", (req, res) => {
  res.json({
    serviceName: "Luka",
    stage: "v4-web",
    features: {
      v4Ui: true,
      localStorage: true,
      realtimeSocket: true,
      database: false,
      fileStorage: false,
      webrtc: false
    }
  });
});

io.on("connection", (socket) => {
  socket.on("joinRoom", (p) => {
    if (p && p.roomId) socket.join(`room:${p.roomId}`);
  });

  socket.on("roomMessage", (p) => {
    if (!p || !p.roomId || !p.message) return;
    socket.to(`room:${p.roomId}`).emit("roomMessage", p);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Luka V4 listening on ${PORT}`);
});
