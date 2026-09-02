const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");

const app=express();
const server=http.createServer(app);
const io=new Server(server);
const PORT=process.env.PORT||3000;
const DATA=path.join(__dirname,"luka.json");
const SECRET=process.env.JWT_SECRET||"change-this-secret";

app.use(express.json({limit:"12mb"}));
app.use(express.static(__dirname));

function load(){
  try{return JSON.parse(fs.readFileSync(DATA,"utf8"));}catch(e){
    return {users:[],spaces:{},sessions:[],messages:[],friendRequests:[],friends:[],blocks:[],notifications:[],reports:[],pins:[],reactions:[]};
  }
}
function save(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2));}
function uid(){return crypto.randomBytes(8).toString("hex");}
function hash(p){return crypto.createHash("sha256").update(String(p)).digest("hex");}
function token(u){return require("jsonwebtoken").sign({uid:u.id},SECRET,{expiresIn:"30d"});}
function auth(req,res,next){
  try{
    const t=(req.headers.authorization||"").replace(/^Bearer /,"");
    const p=require("jsonwebtoken").verify(t,SECRET);
    const d=load(),u=d.users.find(x=>x.id===p.uid);
    if(!u)return res.status(401).json({error:"認証が必要です"});
    req.uid=u.id;req.user=u;req.db=d;next();
  }catch(e){res.status(401).json({error:"認証が必要です"});}
}
function publicUser(u){
  return u&&{id:u.id,username:u.username,displayName:u.displayName||u.username,avatar:u.avatar||"",bio:u.bio||"",status:u.status||"",isAdmin:!!u.isAdmin};
}

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));

app.post("/api/register",(req,res)=>{
  const d=load(); const username=String(req.body.username||"").trim(); const password=String(req.body.password||"");
  if(username.length<2||password.length<4)return res.status(400).json({error:"ユーザー名2文字以上、パスワード4文字以上"});
  if(d.users.some(u=>u.username===username))return res.status(409).json({error:"そのユーザー名は使用されています"});
  const u={id:uid(),username,passwordHash:hash(password),displayName:username,avatar:"",bio:"",status:"",isAdmin:!d.users.some(x=>x.isAdmin),createdAt:Date.now()};
  d.users.push(u);save(d);res.json({token:token(u),user:publicUser(u)});
});
app.post("/api/login",(req,res)=>{
  const d=load();const username=String(req.body.username||"").trim();const password=String(req.body.password||"");
  const u=d.users.find(x=>x.username===username);
  if(!u||u.passwordHash!==hash(password))return res.status(401).json({error:"ログイン情報が違います"});
  res.json({token:token(u),user:publicUser(u)});
});
app.get("/api/me",auth,(req,res)=>res.json({user:publicUser(req.user)}));

app.put("/api/profile",auth,(req,res)=>{
  const d=req.db,u=d.users.find(x=>x.id===req.uid);
  for(const k of ["displayName","avatar","bio","status"]) if(req.body[k]!==undefined) u[k]=String(req.body[k]).slice(0,1000);
  save(d);res.json({user:publicUser(u)});
});

app.get("/api/users/search",auth,(req,res)=>{
  const q=String(req.query.q||"").toLowerCase().trim(); const d=req.db;
  res.json(d.users.filter(u=>u.id!==req.uid&&(u.username.toLowerCase().includes(q)||(u.displayName||"").toLowerCase().includes(q))).slice(0,30).map(publicUser));
});

app.get("/api/spaces",auth,(req,res)=>{
  const d=req.db;
  const out=Object.values(d.spaces||{}).filter(s=>req.user.isAdmin||s.owner===req.uid||((s.members||[]).includes(req.uid))).map(s=>({id:s.id,name:s.name,owner:s.owner,inviteCode:s.inviteCode,rooms:s.rooms||{}}));
  res.json(out);
});

app.get("/api/space/:sid/room/:rid/messages",auth,(req,res)=>{
  const d=req.db,s=d.spaces?.[req.params.sid];
  if(!s)return res.status(404).json({error:"スペースがありません"});
  if(!req.user.isAdmin&&!((s.members||[]).includes(req.uid))&&!s.owner===req.uid)return res.status(403).json({error:"アクセスできません"});
  const list=(d.messages||[]).filter(m=>m.sid===req.params.sid&&m.rid===req.params.rid);
  res.json(list.slice(-300));
});

app.post("/api/message/:id/edit",auth,(req,res)=>{
  const d=req.db,m=(d.messages||[]).find(x=>x.id===req.params.id);
  if(!m||m.author!==req.uid)return res.status(403).json({error:"編集できません"});
  m.content=String(req.body.content||"").slice(0,10000);m.editedAt=Date.now();save(d);
  io.emit("messageUpdate",m);res.json(m);
});
app.delete("/api/message/:id",auth,(req,res)=>{
  const d=req.db,m=(d.messages||[]).find(x=>x.id===req.params.id);
  if(!m||(!req.user.isAdmin&&m.author!==req.uid))return res.status(403).json({error:"削除できません"});
  m.deleted=true;m.content="このメッセージは削除されました";m.deletedAt=Date.now();save(d);
  io.emit("messageUpdate",m);res.json({ok:true});
});

app.post("/api/message/:id/reaction",auth,(req,res)=>{
  const d=req.db;
  d.reactions=d.reactions||[];
  const emoji=String(req.body.emoji||"👍").slice(0,8);
  const i=d.reactions.findIndex(r=>r.messageId===req.params.id&&r.userId===req.uid&&r.emoji===emoji);
  if(i>=0)d.reactions.splice(i,1);else d.reactions.push({id:uid(),messageId:req.params.id,userId:req.uid,emoji,createdAt:Date.now()});
  save(d);
  io.emit("reactionUpdate",{messageId:req.params.id,reactions:d.reactions.filter(r=>r.messageId===req.params.id)});
  res.json({reactions:d.reactions.filter(r=>r.messageId===req.params.id)});
});

app.post("/api/message/:id/pin",auth,(req,res)=>{
  const d=req.db,m=(d.messages||[]).find(x=>x.id===req.params.id);
  if(!m)return res.status(404).json({error:"メッセージがありません"});
  const s=d.spaces?.[m.sid];
  if(!s||(!req.user.isAdmin&&s.owner!==req.uid))return res.status(403).json({error:"ピン留め権限がありません"});
  d.pins=d.pins||[];
  const i=d.pins.findIndex(x=>x.messageId===m.id);
  if(i>=0)d.pins.splice(i,1);else d.pins.push({messageId:m.id,pinnedBy:req.uid,pinnedAt:Date.now()});
  save(d);io.emit("pinUpdate",{messageId:m.id,pinned:d.pins.some(x=>x.messageId===m.id)});
  res.json({pinned:d.pins.some(x=>x.messageId===m.id)});
});

app.get("/api/notifications",auth,(req,res)=>{
  const d=req.db;d.notifications=d.notifications||[];
  res.json(d.notifications.filter(n=>n.userId===req.uid).slice(-100).reverse());
});
app.post("/api/notifications/read",auth,(req,res)=>{
  const d=req.db;d.notifications=d.notifications||[];
  d.notifications.filter(n=>n.userId===req.uid).forEach(n=>n.read=true);save(d);res.json({ok:true});
});

app.post("/api/report",auth,(req,res)=>{
  const d=req.db;d.reports=d.reports||[];
  const r={id:uid(),reporter:req.uid,target:String(req.body.target||""),reason:String(req.body.reason||"").slice(0,2000),status:"open",createdAt:Date.now()};
  d.reports.push(r);
  d.users.filter(u=>u.isAdmin).forEach(u=>{d.notifications=d.notifications||[];d.notifications.push({id:uid(),userId:u.id,type:"report",title:"新しい通報",body:r.reason,reportId:r.id,read:false,createdAt:Date.now()});});
  save(d);res.json({ok:true});
});
app.get("/api/admin/reports",auth,(req,res)=>{
  if(!req.user.isAdmin)return res.status(403).json({error:"管理者専用"});
  res.json((req.db.reports||[]).slice().reverse());
});
app.post("/api/admin/reports/:id/resolve",auth,(req,res)=>{
  if(!req.user.isAdmin)return res.status(403).json({error:"管理者専用"});
  const r=(req.db.reports||[]).find(x=>x.id===req.params.id);if(!r)return res.status(404).json({error:"通報がありません"});
  r.status="resolved";r.resolvedAt=Date.now();save(req.db);res.json(r);
});

io.on("connection",socket=>{
  socket.on("joinRoom",({sid,rid})=>socket.join(`room:${sid}:${rid}`));
  socket.on("sendMessage",payload=>{
    const d=load(); if(!payload||!payload.sid||!payload.rid||!payload.content)return;
    const m={id:uid(),sid:payload.sid,rid:payload.rid,author:String(payload.author||""),content:String(payload.content).slice(0,10000),createdAt:Date.now()};
    d.messages=d.messages||[];d.messages.push(m);save(d);io.to(`room:${m.sid}:${m.rid}`).emit("message",m);
  });
  socket.on("typing",payload=>socket.to(`room:${payload.sid}:${payload.rid}`).emit("typing",payload));
});

server.listen(PORT,"0.0.0.0",()=>console.log("Luka v3.2 listening on "+PORT));
