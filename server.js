app.use("/app", express.static(path.join(__dirname, "app")));
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

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
app.get("/app",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

app.get("/api/db/status", (req,res)=>{
  res.json({
    ok:true,
    driver: supabase ? "supabase" : "json-dev",
    production: !!supabase
  });
});

app.get("/api/db/profiles", async (req,res)=>{
  if(!supabase) return res.json({ok:false,error:"Supabase not configured"});
  const { data, error } = await supabase.from("profiles").select("*").limit(20);
  if(error) return res.status(500).json({ok:false,error:error.message});
  res.json({ok:true,data});
});

app.get("/api/health",(req,res)=>res.json({
  ok:true,service:"Luka",version:"9.0.0",mode:"supabase-ready",
  database:supabase ? "supabase" : "server-data.json",realtime:true,ai:!!process.env.OPENAI_API_KEY,
  timestamp:new Date().toISOString()
}));
app.get("/api/config",(req,res)=>res.json({
  serviceName:"Luka",stage:"v5-ai",
  features:{sharedState:true,realtimeSocket:true,database:false,ai:!!process.env.OPENAI_API_KEY,webrtc:false}
}));

app.get("/api/state",(req,res)=>res.json(readState()));

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

function makeOpenAI(){
  if(!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({apiKey:process.env.OPENAI_API_KEY});
}

app.get("/api/luka-ai/status",(req,res)=>{
  const configured=Boolean(process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim());
  res.json({
    ok:true,
    service:"Luka AI",
    configured,
    model:process.env.LUKA_AI_MODEL||"gpt-5-mini",
    serverVersion:"5.1.2"
  });
});

app.get("/api/luka-ai/test",(req,res)=>{
  res.json({ok:true,service:"Luka AI endpoint",message:"AI endpoint is reachable",configured:Boolean(process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim())});
});

app.post("/api/luka-ai",async(req,res)=>{
  try{
    const message=String(req.body?.message||"").trim();
    if(!message) return res.status(400).json({error:"メッセージが空です"});
    const client=makeOpenAI();
    if(!client) return res.status(503).json({error:"Luka AIのAPIキーがRenderに設定されていません。RenderのEnvironment Variablesを確認してください。",code:"AI_KEY_MISSING"});

    const history=Array.isArray(req.body?.conversation)?req.body.conversation.slice(-12):[];
    const input=[
      {role:"developer",content:"あなたはLukaというWebツールの公式AIアシスタントです。日本語で、親しみやすく簡潔に答えてください。Lukaの機能について質問されたら、分かっている範囲だけを説明してください。分からないことを作らないでください。個人情報や危険な行為を助長する依頼には対応せず、安全な代替案を案内してください。"},
      ...history.map(x=>({role:x.role==="assistant"?"assistant":"user",content:String(x.content||"")})),
      {role:"user",content:message}
    ];
    const response=await client.responses.create({
      model:process.env.LUKA_AI_MODEL || "gpt-5-mini",
      input
    });
    const reply=(response.output_text||"ごめん、今うまく答えを作れなかったよ。").trim();
    res.json({ok:true,reply});
  }catch(e){
    console.error("Luka AI error:",e);
    const msg=String(e?.message||"unknown error");
    res.status(500).json({error:"Luka AIの応答に失敗しました",code:"AI_REQUEST_FAILED",detail:msg.slice(0,300)});
  }
});

io.on("connection",(socket)=>{
  socket.emit("stateUpdated");
  socket.on("pingLuka",()=>socket.emit("pongLuka"));
});

server.listen(PORT,"0.0.0.0",()=>console.log(`Luka V9 DB listening on ${PORT}`));
