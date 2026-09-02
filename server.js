/*
  v3.9 server-prep shell.
  現段階では既存JSONを安全に維持し、将来DB adapterへ差し替えるための
  最小サーバーです。
*/
const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const path=require("path");

const app=express();
const server=http.createServer(app);
const io=new Server(server);
const PORT=process.env.PORT||3000;

app.use(express.json({limit:"12mb"}));
app.use(express.static(__dirname));

app.get("/api/health",(req,res)=>{
  res.json({
    ok:true,
    version:"3.9.0",
    mode:"server-prep",
    database:"not-connected",
    timestamp:new Date().toISOString()
  });
});

app.get("/api/config",(req,res)=>{
  res.json({
    serviceName:"Luka",
    stage:"server-preparation",
    features:{
      databaseReady:true,
      migrationReady:true,
      realtimeReady:true,
      fileStorageReady:false,
      webrtcReady:false
    }
  });
});

io.on("connection",socket=>{
  socket.on("joinRoom",p=>{
    if(p?.roomId) socket.join(`room:${p.roomId}`);
  });
});

server.listen(PORT,"0.0.0.0",()=>{
  console.log(`Luka v3.9 server-prep listening on ${PORT}`);
});
