const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const DATA = path.join(__dirname, "luka.json");
const UPLOADS = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, {recursive:true});

app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname));
app.use("/uploads", express.static(UPLOADS));

function load(){
  if(!fs.existsSync(DATA)) return {users:{}, spaces:{}, sessions:{}, invites:{}, reports:{}, notifications:{}};
  try {
    const d = JSON.parse(fs.readFileSync(DATA,"utf8"));
    d.users ||= {}; d.spaces ||= {}; d.sessions ||= {}; d.invites ||= {}; d.reports ||= {}; d.notifications ||= {};
    return d;
  } catch { return {users:{},spaces:{},sessions:{},invites:{},reports:{},notifications:{}}; }
}
let db = load();

function save(){ fs.writeFileSync(DATA, JSON.stringify(db,null,2)); }
function id(prefix="id"){ return prefix+"_"+crypto.randomBytes(8).toString("hex"); }
function hash(p){ return crypto.createHash("sha256").update(String(p)).digest("hex"); }
function now(){ return new Date().toISOString(); }

function migrate(){
  const users = Object.values(db.users);
  users.forEach(u=>{
    u.isAdmin = !!u.isAdmin;
    u.createdAt ||= now();
    u.friends ||= [];
  });
  // Preserve the old project convention: first account becomes the initial admin.
  if(users.length && !users.some(u=>u.isAdmin)) {
    users.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)))[0].isAdmin = true;
  }
  Object.values(db.spaces).forEach(s=>{
    s.members ||= {};
    if(s.owner && !s.members[s.owner]) s.members[s.owner] = {joinedAt:s.createdAt||now()};
    s.rooms ||= {};
    s.inviteOnly = true;
    Object.values(s.rooms).forEach(r=>{ r.messages ||= []; });
  });
  save();
}
migrate();

function auth(req,res,next){
  const token = req.headers.authorization?.replace(/^Bearer\s+/,"");
  const uid = token && db.sessions[token];
  if(!uid || !db.users[uid]) return res.status(401).json({error:"ログインが必要です"});
  req.uid=uid; req.user=db.users[uid]; next();
}
function admin(req,res,next){
  if(!req.user?.isAdmin) return res.status(403).json({error:"管理者権限が必要です"});
  next();
}
function publicUser(u){
  return {id:u.id, username:u.username, displayName:u.displayName||u.username, isAdmin:!!u.isAdmin};
}
function canSeeSpace(s, uid){
  return !!s && (s.owner===uid || !!s.members?.[uid] || !!db.users[uid]?.isAdmin);
}
function ensureRoom(s,rid){
  const r=s.rooms?.[rid];
  if(!r) return null;
  r.messages ||= [];
  return r;
}

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));

app.post("/api/register",(req,res)=>{
  const username=String(req.body.username||"").trim();
  const password=String(req.body.password||"");
  if(username.length<2 || password.length<4) return res.status(400).json({error:"ユーザー名2文字以上・パスワード4文字以上"});
  if(Object.values(db.users).some(u=>u.username.toLowerCase()===username.toLowerCase()))
    return res.status(409).json({error:"そのユーザー名は使用されています"});
  const uid=id("u");
  db.users[uid]={id:uid,username,displayName:username,password:hash(password),friends:[],createdAt:now(),isAdmin:Object.keys(db.users).length===0};
  db.notifications[uid]=[];
  save();
  const token=id("tok"); db.sessions[token]=uid; save();
  res.json({token,user:publicUser(db.users[uid])});
});

app.post("/api/login",(req,res)=>{
  const username=String(req.body.username||"").trim();
  const u=Object.values(db.users).find(x=>x.username.toLowerCase()===username.toLowerCase());
  if(!u || u.password!==hash(req.body.password||"")) return res.status(401).json({error:"ユーザー名またはパスワードが違います"});
  const token=id("tok"); db.sessions[token]=u.id; save();
  res.json({token,user:publicUser(u)});
});

app.get("/api/me",auth,(req,res)=>res.json({user:publicUser(req.user)}));

app.get("/api/users/search",auth,(req,res)=>{
  const q=String(req.query.q||"").toLowerCase();
  res.json({users:Object.values(db.users).filter(u=>u.id!==req.uid && u.username.toLowerCase().includes(q)).slice(0,20).map(publicUser)});
});

app.get("/api/spaces",auth,(req,res)=>{
  const spaces=Object.values(db.spaces).filter(s=>canSeeSpace(s,req.uid)).map(s=>({
    id:s.id,name:s.name,owner:s.owner,memberCount:Object.keys(s.members||{}).length,
    isAdmin:!!req.user.isAdmin, inviteOnly:true
  }));
  res.json({spaces});
});

app.post("/api/spaces",auth,(req,res)=>{
  const name=String(req.body.name||"").trim();
  if(!name) return res.status(400).json({error:"スペース名を入力してください"});
  const sid=id("sp");
  db.spaces[sid]={id:sid,name,owner:req.uid,createdAt:now(),inviteOnly:true,members:{[req.uid]:{joinedAt:now()}},
    rooms:{[id("r")]:{name:"ロビー",messages:[]}}};
  save(); io.emit("spaceUpdate",{sid});
  res.json({space:db.spaces[sid]});
});

app.get("/api/spaces/:sid",auth,(req,res)=>{
  const s=db.spaces[req.params.sid];
  if(!s || !canSeeSpace(s,req.uid)) return res.status(404).json({error:"スペースが見つかりません"});
  res.json({space:{...s, members:Object.keys(s.members||{}).map(uid=>publicUser(db.users[uid])).filter(Boolean)}});
});

app.post("/api/spaces/:sid/rooms",auth,(req,res)=>{
  const s=db.spaces[req.params.sid];
  if(!s || !canSeeSpace(s,req.uid)) return res.status(404).json({error:"スペースが見つかりません"});
  const name=String(req.body.name||"").trim();
  if(!name) return res.status(400).json({error:"部屋名を入力してください"});
  const rid=id("r"); s.rooms[rid]={name,messages:[]}; save(); io.emit("spaceUpdate",{sid:s.id});
  res.json({room:{id:rid,...s.rooms[rid]}});
});

app.delete("/api/spaces/:sid/rooms/:rid",auth,(req,res)=>{
  const s=db.spaces[req.params.sid];
  if(!s || !canSeeSpace(s,req.uid)) return res.status(404).json({error:"スペースが見つかりません"});
  if(s.owner!==req.uid && !req.user.isAdmin) return res.status(403).json({error:"管理者権限が必要です"});
  const r=s.rooms?.[req.params.rid];
  if(!r) return res.status(404).json({error:"部屋がありません"});
  if(r.name==="ロビー") return res.status(400).json({error:"ロビーは削除できません"});
  delete s.rooms[req.params.rid]; save(); io.emit("spaceUpdate",{sid:s.id}); res.json({ok:true});
});

app.delete("/api/spaces/:sid",auth,(req,res)=>{
  const s=db.spaces[req.params.sid];
  if(!s) return res.status(404).json({error:"スペースがありません"});
  if(s.owner!==req.uid && !req.user.isAdmin) return res.status(403).json({error:"このスペースを削除する権限がありません"});
  delete db.spaces[req.params.sid]; save(); io.emit("spaceUpdate",{sid:req.params.sid}); res.json({ok:true});
});

app.post("/api/spaces/:sid/invites",auth,(req,res)=>{
  const s=db.spaces[req.params.sid];
  if(!s || !canSeeSpace(s,req.uid)) return res.status(404).json({error:"スペースが見つかりません"});
  if(s.owner!==req.uid && !req.user.isAdmin) return res.status(403).json({error:"招待権限がありません"});
  const code=crypto.randomBytes(5).toString("hex").toUpperCase();
  db.invites[code]={code,sid:s.id,createdBy:req.uid,createdAt:now()};
  save(); res.json({code});
});

app.post("/api/invites/join",auth,(req,res)=>{
  const code=String(req.body.code||"").trim().toUpperCase();
  const inv=db.invites[code], s=inv && db.spaces[inv.sid];
  if(!s) return res.status(404).json({error:"招待コードが無効です"});
  s.members[req.uid]={joinedAt:now()}; save(); io.emit("spaceUpdate",{sid:s.id});
  res.json({space:{id:s.id,name:s.name}});
});

app.get("/api/spaces/:sid/rooms/:rid/messages",auth,(req,res)=>{
  const s=db.spaces[req.params.sid];
  if(!s || !canSeeSpace(s,req.uid)) return res.status(403).json({error:"このスペースには参加していません"});
  const r=ensureRoom(s,req.params.rid); if(!r) return res.status(404).json({error:"部屋がありません"});
  res.json({messages:r.messages});
});

io.use((socket,next)=>{
  const token=socket.handshake.auth?.token, uid=token && db.sessions[token];
  if(!uid) return next(new Error("unauthorized"));
  socket.uid=uid; next();
});
io.on("connection",socket=>{
  socket.on("joinRoom",({sid,rid})=>{
    const s=db.spaces[sid]; if(!s || !canSeeSpace(s,socket.uid)) return;
    socket.join(`${sid}:${rid}`);
  });
  socket.on("message",({sid,rid,text})=>{
    const s=db.spaces[sid]; if(!s || !canSeeSpace(s,socket.uid)) return;
    const r=ensureRoom(s,rid); if(!r) return;
    const m={id:id("m"),uid:socket.uid,username:db.users[socket.uid].username,text:String(text||"").slice(0,5000),createdAt:now(),edited:false};
    r.messages.push(m); save(); io.to(`${sid}:${rid}`).emit("message",m);
  });
  socket.on("editMessage",({sid,rid,mid,text})=>{
    const s=db.spaces[sid]; if(!s || !canSeeSpace(s,socket.uid)) return;
    const r=ensureRoom(s,rid), m=r?.messages.find(x=>x.id===mid); if(!m) return;
    if(m.uid!==socket.uid && !db.users[socket.uid].isAdmin) return;
    m.text=String(text||"").slice(0,5000); m.edited=true; m.editedAt=now(); save();
    io.to(`${sid}:${rid}`).emit("messageEdited",m);
  });
  socket.on("deleteMessage",({sid,rid,mid})=>{
    const s=db.spaces[sid]; if(!s || !canSeeSpace(s,socket.uid)) return;
    const r=ensureRoom(s,rid), i=r?.messages.findIndex(x=>x.id===mid); if(i<0) return;
    if(r.messages[i].uid!==socket.uid && !db.users[socket.uid].isAdmin) return;
    r.messages.splice(i,1); save(); io.to(`${sid}:${rid}`).emit("messageDeleted",{mid});
  });
});

const upload=multer({storage:multer.diskStorage({
  destination:(_,__,cb)=>cb(null,UPLOADS),
  filename:(_,file,cb)=>cb(null,id("f")+"_"+file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_"))
}),limits:{fileSize:10*1024*1024}});

app.post("/api/upload",auth,upload.single("file"),(req,res)=>{
  if(!req.file) return res.status(400).json({error:"ファイルがありません"});
  res.json({url:`/uploads/${req.file.filename}`,name:req.file.originalname,size:req.file.size});
});

app.post("/api/reports",auth,(req,res)=>{
  const target=String(req.body.target||"");
  const reason=String(req.body.reason||"").trim();
  if(!reason) return res.status(400).json({error:"通報理由を入力してください"});
  const rid=id("rep");
  db.reports[rid]={id:rid,reporter:req.uid,target,reason,status:"open",createdAt:now()};
  Object.values(db.users).filter(u=>u.isAdmin).forEach(u=>{
    db.notifications[u.id] ||= [];
    db.notifications[u.id].push({id:id("n"),type:"report",reportId:rid,text:"新しい通報があります",createdAt:now(),read:false});
  });
  save(); res.json({ok:true});
});

app.get("/api/admin/dashboard",auth,admin,(req,res)=>{
  const reports=Object.values(db.reports).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(r=>({
    ...r,reporter:publicUser(db.users[r.reporter]), targetUser:db.users[r.target]?publicUser(db.users[r.target]):null
  }));
  res.json({reports,spaces:Object.values(db.spaces).map(s=>({id:s.id,name:s.name,owner:publicUser(db.users[s.owner]),memberCount:Object.keys(s.members||{}).length}))});
});
app.post("/api/admin/reports/:id/resolve",auth,admin,(req,res)=>{
  const r=db.reports[req.params.id]; if(!r) return res.status(404).json({error:"通報がありません"});
  r.status="resolved"; r.resolvedBy=req.uid; r.resolvedAt=now(); save(); res.json({ok:true});
});
app.get("/api/notifications",auth,(req,res)=>res.json({notifications:db.notifications[req.uid]||[]}));
app.post("/api/notifications/read",auth,(req,res)=>{
  (db.notifications[req.uid]||[]).forEach(n=>n.read=true); save(); res.json({ok:true});
});

server.listen(PORT,"0.0.0.0",()=>console.log(`Luka v2 running on ${PORT}`));
