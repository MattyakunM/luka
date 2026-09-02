const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const jwt=require("jsonwebtoken");

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
    return {users:[],spaces:{},messages:[],notifications:[],reports:[],reactions:[],pins:[]};
  }
}
function save(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2));}
function id(){return crypto.randomBytes(8).toString("hex");}
function hash(v){return crypto.createHash("sha256").update(String(v)).digest("hex");}
function makeToken(u){return jwt.sign({uid:u.id},SECRET,{expiresIn:"30d"});}
function pub(u){return {id:u.id,username:u.username,displayName:u.displayName||u.username,avatar:u.avatar||"",bio:u.bio||"",status:u.status||"",isAdmin:!!u.isAdmin,suspended:!!u.suspended};}

function auth(req,res,next){
  try{
    const t=(req.headers.authorization||"").replace(/^Bearer /,"");
    const p=jwt.verify(t,SECRET),d=load(),u=(d.users||[]).find(x=>x.id===p.uid);
    if(!u)return res.status(401).json({error:"認証が必要です"});
    if(u.suspended)return res.status(403).json({error:"このアカウントは現在利用停止中です"});
    req.uid=u.id;req.user=u;req.db=d;next();
  }catch(e){res.status(401).json({error:"認証が必要です"});}
}
function admin(req,res,next){if(!req.user?.isAdmin)return res.status(403).json({error:"管理者専用です"});next();}

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));

app.post("/api/register",(req,res)=>{
  const d=load();const username=String(req.body.username||"").trim();const password=String(req.body.password||"");
  if(username.length<2||password.length<4)return res.status(400).json({error:"ユーザー名2文字以上、パスワード4文字以上"});
  if((d.users||[]).some(u=>u.username===username))return res.status(409).json({error:"そのユーザー名は使用されています"});
  d.users=d.users||[];
  const u={id:id(),username,passwordHash:hash(password),displayName:username,avatar:"",bio:"",status:"",isAdmin:!d.users.some(x=>x.isAdmin),suspended:false,createdAt:Date.now()};
  d.users.push(u);save(d);res.json({token:makeToken(u),user:pub(u)});
});
app.post("/api/login",(req,res)=>{
  const d=load();const u=(d.users||[]).find(x=>x.username===String(req.body.username||"").trim());
  if(!u||u.passwordHash!==hash(req.body.password||""))return res.status(401).json({error:"ログイン情報が違います"});
  if(u.suspended)return res.status(403).json({error:"このアカウントは現在利用停止中です"});
  res.json({token:makeToken(u),user:pub(u)});
});
app.get("/api/me",auth,(req,res)=>res.json({user:pub(req.user)}));

app.put("/api/profile",auth,(req,res)=>{
  const d=req.db,u=d.users.find(x=>x.id===req.uid);
  ["displayName","avatar","bio","status"].forEach(k=>{if(req.body[k]!==undefined)u[k]=String(req.body[k]).slice(0,1000)});
  save(d);res.json({user:pub(u)});
});

app.get("/api/spaces",auth,(req,res)=>{
  const d=req.db;
  res.json(Object.values(d.spaces||{}).filter(s=>req.user.isAdmin||s.owner===req.uid||(s.members||[]).includes(req.uid)).map(s=>({
    id:s.id,name:s.name,owner:s.owner,inviteCode:s.inviteCode,rooms:s.rooms||{},memberCount:(s.members||[]).length
  })));
});

app.get("/api/space/:sid/room/:rid/messages",auth,(req,res)=>{
  const d=req.db,s=d.spaces?.[req.params.sid];
  if(!s)return res.status(404).json({error:"スペースがありません"});
  const allowed=req.user.isAdmin||s.owner===req.uid||(s.members||[]).includes(req.uid);
  if(!allowed)return res.status(403).json({error:"アクセスできません"});
  res.json((d.messages||[]).filter(m=>m.sid===req.params.sid&&m.rid===req.params.rid).slice(-500));
});

/* 管理者 */
app.get("/api/admin/overview",auth,admin,(req,res)=>{
  const d=req.db;
  const users=d.users||[],spaces=Object.values(d.spaces||{}),messages=d.messages||[],reports=d.reports||[];
  res.json({
    users:users.length,
    activeUsers:users.filter(u=>!u.suspended).length,
    suspendedUsers:users.filter(u=>u.suspended).length,
    spaces:spaces.length,
    rooms:spaces.reduce((n,s)=>n+Object.keys(s.rooms||{}).length,0),
    messages:messages.length,
    openReports:reports.filter(r=>r.status!=="resolved").length
  });
});
app.get("/api/admin/users",auth,admin,(req,res)=>{
  const d=req.db;
  res.json((d.users||[]).map(pub));
});
app.post("/api/admin/users/:uid/suspend",auth,admin,(req,res)=>{
  const d=req.db,u=d.users.find(x=>x.id===req.params.uid);
  if(!u)return res.status(404).json({error:"ユーザーがありません"});
  if(u.id===req.uid)return res.status(400).json({error:"自分自身は停止できません"});
  u.suspended=true;save(d);
  res.json({user:pub(u)});
});
app.post("/api/admin/users/:uid/unsuspend",auth,admin,(req,res)=>{
  const d=req.db,u=d.users.find(x=>x.id===req.params.uid);
  if(!u)return res.status(404).json({error:"ユーザーがありません"});
  u.suspended=false;save(d);res.json({user:pub(u)});
});
app.get("/api/admin/spaces",auth,admin,(req,res)=>{
  const d=req.db;
  res.json(Object.values(d.spaces||{}).map(s=>({
    id:s.id,name:s.name,owner:s.owner,memberCount:(s.members||[]).length,
    rooms:Object.values(s.rooms||{}).map(r=>({id:r.id,name:r.name}))
  })));
});
app.get("/api/admin/space/:sid/room/:rid/messages",auth,admin,(req,res)=>{
  const d=req.db,s=d.spaces?.[req.params.sid];
  if(!s)return res.status(404).json({error:"スペースがありません"});
  res.json((d.messages||[]).filter(m=>m.sid===req.params.sid&&m.rid===req.params.rid).slice(-1000));
});
app.get("/api/admin/reports",auth,admin,(req,res)=>{
  res.json((req.db.reports||[]).slice().reverse());
});
app.post("/api/admin/reports/:id/resolve",auth,admin,(req,res)=>{
  const d=req.db,r=(d.reports||[]).find(x=>x.id===req.params.id);
  if(!r)return res.status(404).json({error:"通報がありません"});
  r.status="resolved";r.resolvedAt=Date.now();save(d);res.json(r);
});

/* メッセージ */
app.post("/api/message/:id/edit",auth,(req,res)=>{
  const d=req.db,m=(d.messages||[]).find(x=>x.id===req.params.id);
  if(!m||m.author!==req.uid)return res.status(403).json({error:"編集できません"});
  m.content=String(req.body.content||"").slice(0,10000);m.editedAt=Date.now();save(d);io.emit("messageUpdate",m);res.json(m);
});
app.delete("/api/message/:id",auth,(req,res)=>{
  const d=req.db,m=(d.messages||[]).find(x=>x.id===req.params.id);
  if(!m||(!req.user.isAdmin&&m.author!==req.uid))return res.status(403).json({error:"削除できません"});
  m.deleted=true;m.content="このメッセージは削除されました";m.deletedAt=Date.now();save(d);io.emit("messageUpdate",m);res.json({ok:true});
});
app.post("/api/message/:id/reaction",auth,(req,res)=>{
  const d=req.db;d.reactions=d.reactions||[];const emoji=String(req.body.emoji||"👍").slice(0,8);
  const i=d.reactions.findIndex(r=>r.messageId===req.params.id&&r.userId===req.uid&&r.emoji===emoji);
  if(i>=0)d.reactions.splice(i,1);else d.reactions.push({id:id(),messageId:req.params.id,userId:req.uid,emoji,createdAt:Date.now()});
  save(d);res.json({reactions:d.reactions.filter(r=>r.messageId===req.params.id)});
});
app.post("/api/message/:id/pin",auth,(req,res)=>{
  const d=req.db,m=(d.messages||[]).find(x=>x.id===req.params.id);if(!m)return res.status(404).json({error:"メッセージがありません"});
  const s=d.spaces?.[m.sid];if(!s||(!req.user.isAdmin&&s.owner!==req.uid))return res.status(403).json({error:"ピン留め権限がありません"});
  d.pins=d.pins||[];const i=d.pins.findIndex(x=>x.messageId===m.id);if(i>=0)d.pins.splice(i,1);else d.pins.push({messageId:m.id,pinnedBy:req.uid,pinnedAt:Date.now()});
  save(d);res.json({pinned:d.pins.some(x=>x.messageId===m.id)});
});

/* 通報 */
app.post("/api/report",auth,(req,res)=>{
  const d=req.db;d.reports=d.reports||[];d.notifications=d.notifications||[];
  const r={id:id(),reporter:req.uid,target:String(req.body.target||""),reason:String(req.body.reason||"").slice(0,2000),status:"open",createdAt:Date.now()};
  d.reports.push(r);d.users.filter(u=>u.isAdmin).forEach(u=>d.notifications.push({id:id(),userId:u.id,type:"report",title:"新しい通報",body:r.reason,reportId:r.id,read:false,createdAt:Date.now()}));
  save(d);res.json({ok:true});
});
app.get("/api/notifications",auth,(req,res)=>res.json((req.db.notifications||[]).filter(n=>n.userId===req.uid).slice(-100).reverse()));

io.on("connection",socket=>{
  socket.on("joinRoom",p=>{if(p?.sid&&p?.rid)socket.join(`room:${p.sid}:${p.rid}`)});
  socket.on("sendMessage",p=>{
    if(!p?.sid||!p?.rid||!p?.content)return;
    const d=load(),m={id:id(),sid:p.sid,rid:p.rid,author:String(p.author||""),content:String(p.content).slice(0,10000),createdAt:Date.now()};
    d.messages=d.messages||[];d.messages.push(m);save(d);io.to(`room:${m.sid}:${m.rid}`).emit("message",m);
  });
  /* 管理者の接続先へtypingを送らないため、管理者識別は将来のSocket認証で強化 */
  socket.on("typing",p=>socket.to(`room:${p.sid}:${p.rid}`).emit("typing",p));
});

server.listen(PORT,"0.0.0.0",()=>console.log("Luka v3.3 listening on "+PORT));
