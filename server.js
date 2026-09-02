const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json({limit:"12mb"}));
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, "server-data.json");
const SEED_FILE = path.join(__dirname, "luka.json");

function readState(){
  try{
    if(fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE,"utf8"));
    return JSON.parse(fs.readFileSync(SEED_FILE,"utf8"));
  }catch(e){
    return {version:5,accounts:[],friends:[],friendRequests:[],blocks:[],dms:[],messages:[],spaces:[],notifications:[],reports:[],pinned:[],settings:{theme:"system",notifications:true}};
  }
}
function writeState(data){
  const tmp=DATA_FILE+".tmp";
  fs.writeFileSync(tmp,JSON.stringify(data,null,2),"utf8");
  fs.renameSync(tmp,DATA_FILE);
}
function sanitize(data){
  const x=JSON.parse(JSON.stringify(data||{}));
  delete x.userId;
  return x;
}

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.get("/api/health",(req,res)=>res.json({
  ok:true,service:"Luka",version:"5.0.0",mode:"server-json",database:"server-data.json",
  realtime:true,timestamp:new Date().toISOString()
}));
app.get("/api/config",(req,res)=>res.json({
  serviceName:"Luka",stage:"v5-server",
  features:{sharedState:true,realtimeSocket:true,database:false,ai:false,webrtc:false}
}));

app.get("/api/state",(req,res)=>{
  res.json(readState());
});

app.put("/api/state",(req,res)=>{
  try{
    const data=sanitize(req.body);
    writeState(data);
    io.emit("stateUpdated");
    res.json({ok:true});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"サーバーへの保存に失敗しました"});
  }
});

io.on("connection",(socket)=>{
  socket.emit("stateUpdated");
  socket.on("pingLuka",()=>socket.emit("pongLuka"));
});

server.listen(PORT,"0.0.0.0",()=>console.log(`Luka V5 listening on ${PORT}`));
