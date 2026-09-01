const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const {v4:uuid}=require("uuid");
const fs=require("fs"), path=require("path"), crypto=require("crypto");

const app=express();
const server=http.createServer(app);
const io=new Server(server);

app.use(express.json({limit:"5mb"}));

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.get("/app.js",(req,res)=>res.sendFile(path.join(__dirname,"app.js")));
app.get("/style.css",(req,res)=>res.sendFile(path.join(__dirname,"style.css")));

const DATA=path.join(__dirname,"luka.json");

if(!fs.existsSync(DATA)){
  fs.writeFileSync(DATA,JSON.stringify({
    users:{},
    spaces:{
      general:{
        id:"general",
        name:"Luka Space",
        owner:"system",
        rooms:{
          lobby:{
            id:"lobby",
            name:"ロビー",
            messages:[]
          }
        }
      }
    },
    friendRequests:[],
    friendships:[],
    dms:{}
  },null,2));
}

const load=()=>JSON.parse(fs.readFileSync(DATA,"utf8"));
const save=d=>fs.writeFileSync(DATA,JSON.stringify(d,null,2));
const hash=p=>crypto.createHash("sha256").update(p).digest("hex");

const sessions=new Map();
const online=new Map();

function safeUser(u){
  return {
    id:u.id,
    username:u.username,
    displayName:u.displayName||u.username,
    bio:u.bio||"",
    avatar:u.avatar||"",
    status:u.status||"online"
  };
}

function auth(req,res,next){
  const t=req.headers.authorization?.replace("Bearer ","");
  const uid=sessions.get(t);

  if(!uid){
    return res.status(401).json({error:"ログインが必要です"});
  }

  const d=load();

  if(!d.users[uid]){
    return res.status(401).json({error:"ユーザーが見つかりません"});
  }

  req.uid=uid;
  req.db=d;
  next();
}

app.post("/api/register",(req,res)=>{
  const {username,password,displayName}=req.body||{};

  if(!username||!password||password.length<6){
    return res.status(400).json({
      error:"ユーザー名と6文字以上のパスワードが必要です"
    });
  }

  const d=load();

  if(Object.values(d.users).some(
    u=>u.username.toLowerCase()===username.toLowerCase()
  )){
    return res.status(409).json({
      error:"そのユーザー名は使用されています"
    });
  }

  const id=uuid();

  d.users[id]={
    id,
    username,
    password:hash(password),
    displayName:displayName||username,
    bio:"",
    avatar:"",
    createdAt:Date.now()
  };

  save(d);

  const token=uuid();

  sessions.set(token,id);
  online.set(id,true);

  res.json({
    token,
    user:safeUser(d.users[id])
  });
});

app.post("/api/login",(req,res)=>{
  const d=load();
  const {username,password}=req.body||{};

  const u=Object.values(d.users).find(
    x=>x.username.toLowerCase()===String(username).toLowerCase()
    &&x.password===hash(String(password))
  );

  if(!u){
    return res.status(401).json({
      error:"ユーザー名またはパスワードが違います"
    });
  }

  const token=uuid();

  sessions.set(token,u.id);
  online.set(u.id,true);

  res.json({
    token,
    user:safeUser(u)
  });
});

app.post("/api/logout",auth,(req,res)=>{
  for(const [t,id] of sessions){
    if(id===req.uid){
      sessions.delete(t);
    }
  }

  online.delete(req.uid);

  io.emit("presence",{
    id:req.uid,
    online:false
  });

  res.json({ok:true});
});

app.get("/api/me",auth,(req,res)=>{
  res.json({
    user:safeUser(req.db.users[req.uid])
  });
});

app.get("/api/bootstrap",auth,(req,res)=>{
  const d=req.db;
  const me=d.users[req.uid];

  const spaces=Object.values(d.spaces).map(s=>({
    ...s,
    rooms:Object.values(s.rooms).map(r=>({
      id:r.id,
      name:r.name,
      messageCount:r.messages.length
    }))
  }));

  const friends=d.friendships
    .filter(x=>x.a===req.uid||x.b===req.uid)
    .map(x=>safeUser(
      d.users[x.a===req.uid?x.b:x.a]
    ))
    .filter(Boolean);

  const incoming=d.friendRequests
    .filter(x=>x.to===req.uid&&x.status==="pending")
    .map(x=>({
      id:x.id,
      user:safeUser(d.users[x.from])
    }));

  const outgoing=d.friendRequests
    .filter(x=>x.from===req.uid&&x.status==="pending")
    .map(x=>({
      id:x.id,
      user:safeUser(d.users[x.to])
    }));

  res.json({
    me:safeUser(me),
    spaces,
    friends,
    incoming,
    outgoing,
    online:[...online.keys()]
  });
});

app.get("/api/room/:sid/:rid",auth,(req,res)=>{
  const r=req.db.spaces[req.params.sid]?.rooms[req.params.rid];

  if(!r){
    return res.status(404).json({
      error:"部屋がありません"
    });
  }

  res.json({
    messages:r.messages.slice(-300)
  });
});

app.post("/api/space",auth,(req,res)=>{
  const {name}=req.body||{};

  if(!name){
    return res.status(400).json({
      error:"名前が必要です"
    });
  }

  const d=req.db;
  const id=uuid();
  const rid=uuid();

  d.spaces[id]={
    id,
    name,
    owner:req.uid,
    rooms:{
      [rid]:{
        id:rid,
        name:"ロビー",
        messages:[]
      }
    }
  };

  save(d);

  res.json({
    space:d.spaces[id]
  });
});

app.post("/api/space/:sid/room",auth,(req,res)=>{
  const d=req.db;
  const s=d.spaces[req.params.sid];

  if(!s){
    return res.status(404).json({
      error:"スペースがありません"
    });
  }

  const id=uuid();
  const {name}=req.body||{};

  s.rooms[id]={
    id,
    name:name||"新しい部屋",
    messages:[]
  };

  save(d);

  res.json({
    room:s.rooms[id]
  });
});

app.get("/api/search",auth,(req,res)=>{
  const q=String(req.query.q||"").toLowerCase();
  const d=req.db;

  res.json(
    Object.values(d.users)
      .filter(u=>
        u.id!==req.uid &&
        (
          u.username.toLowerCase().includes(q) ||
          (u.displayName||"").toLowerCase().includes(q)
        )
      )
      .slice(0,20)
      .map(safeUser)
  );
});

app.post("/api/friend/request",auth,(req,res)=>{
  const d=req.db;
  const to=req.body.to;

  if(!d.users[to]||to===req.uid){
    return res.status(400).json({
      error:"対象が不正です"
    });
  }

  if(d.friendships.some(x=>
    (x.a===req.uid&&x.b===to) ||
    (x.a===to&&x.b===req.uid)
  )){
    return res.status(409).json({
      error:"すでに友達です"
    });
  }

  if(d.friendRequests.some(x=>
    x.status==="pending" &&
    x.from===req.uid &&
    x.to===to
  )){
    return res.status(409).json({
      error:"申請済みです"
    });
  }

  const rev=d.friendRequests.find(x=>
    x.status==="pending" &&
    x.from===to &&
    x.to===req.uid
  );

  if(rev){
    rev.status="accepted";
    d.friendships.push({
      a:req.uid,
      b:to
    });

    save(d);

    io.to("user:"+to).emit("friendUpdate");

    return res.json({
      accepted:true
    });
  }

  d.friendRequests.push({
    id:uuid(),
    from:req.uid,
    to,
    status:"pending"
  });

  save(d);

  io.to("user:"+to).emit("friendRequest");

  res.json({
    ok:true
  });
});

app.post("/api/friend/respond",auth,(req,res)=>{
  const d=req.db;

  const f=d.friendRequests.find(x=>
    x.id===req.body.id &&
    x.to===req.uid &&
    x.status==="pending"
  );

  if(!f){
    return res.status(404).json({
      error:"申請がありません"
    });
  }

  f.status=req.body.accept
    ?"accepted"
    :"rejected";

  if(req.body.accept){
    d.friendships.push({
      a:f.from,
      b:f.to
    });
  }

  save(d);

  io.to("user:"+f.from).emit("friendUpdate");

  res.json({
    ok:true
  });
});

function dmKey(a,b){
  return [a,b].sort().join(":");
}

app.get("/api/dm/:uid",auth,(req,res)=>{
  res.json({
    messages:(
      req.db.dms[
        dmKey(req.uid,req.params.uid)
      ]||[]
    ).slice(-300)
  });
});

app.get("/api/online/:uid",auth,(req,res)=>{
  res.json({
    online:!!online.get(req.params.uid)
  });
});

io.on("connection",socket=>{

  socket.on("identify",token=>{
    const uid=sessions.get(token);

    if(!uid)return;

    socket.uid=uid;

    online.set(uid,true);

    socket.join("user:"+uid);

    io.emit("presence",{
      id:uid,
      online:true
    });
  });

  socket.on("joinRoom",({sid,rid})=>{
    if(!socket.uid)return;

    socket.rooms.forEach(x=>{
      if(x.startsWith("room:")){
        socket.leave(x);
      }
    });

    socket.join(`room:${sid}:${rid}`);
  });

  socket.on("message",({sid,rid,text})=>{
    if(!socket.uid||!text?.trim())return;

    const d=load();
    const r=d.spaces[sid]?.rooms[rid];

    if(!r)return;

    const m={
      id:uuid(),
      userId:socket.uid,
      text:text.trim(),
      createdAt:Date.now(),
      reactions:{}
    };

    r.messages.push(m);

    if(r.messages.length>1000){
      r.messages=r.messages.slice(-1000);
    }

    save(d);

    io.to(`room:${sid}:${rid}`).emit(
      "message",
      m
    );
  });

  socket.on("reaction",({sid,rid,messageId,emoji})=>{
    const d=load();
    const r=d.spaces[sid]?.rooms[rid];

    if(!r)return;

    const m=r.messages.find(
      x=>x.id===messageId
    );

    if(!m)return;

    m.reactions=m.reactions||{};
    m.reactions[emoji]=m.reactions[emoji]||[];

    const a=m.reactions[emoji];
    const i=a.indexOf(socket.uid);

    if(i>=0){
      a.splice(i,1);
    }else{
      a.push(socket.uid);
    }

    save(d);

    io.to(`room:${sid}:${rid}`).emit(
      "reaction",
      {
        messageId,
        reactions:m.reactions
      }
    );
  });

  socket.on("dm",({to,text})=>{
    if(!socket.uid||!text?.trim())return;

    const d=load();
    const k=dmKey(socket.uid,to);

    const m={
      id:uuid(),
      from:socket.uid,
      text:text.trim(),
      createdAt:Date.now()
    };

    d.dms[k]=d.dms[k]||[];

    d.dms[k].push(m);

    if(d.dms[k].length>1000){
      d.dms[k]=d.dms[k].slice(-1000);
    }

    save(d);

    io.to("user:"+to).emit("dm",m);
    socket.emit("dm",m);
  });

  socket.on("disconnect",()=>{
    if(socket.uid){
      online.delete(socket.uid);

      io.emit("presence",{
        id:socket.uid,
        online:false
      });
    }
  });
});
// ルーム削除
app.delete("/api/space/:sid/room/:rid",auth,(req,res)=>{
  const d=req.db;
  const s=d.spaces[req.params.sid];

  if(!s){
    return res.status(404).json({
      error:"スペースがありません"
    });
  }

  if(s.owner!==req.uid){
    return res.status(403).json({
      error:"このスペースの管理者ではありません"
    });
  }

  const rid=req.params.rid;
  const room=s.rooms[rid];

  if(!room){
    return res.status(404).json({
      error:"部屋がありません"
    });
  }

  if(room.name==="ロビー"){
    return res.status(400).json({
      error:"ロビーは削除できません"
    });
  }

  delete s.rooms[rid];

  save(d);

  io.emit("spaceUpdate",{
    sid:s.id
  });

  res.json({
    ok:true
  });
});

const port=process.env.PORT||3000;

server.listen(
  port,
  "0.0.0.0",
  ()=>{
    console.log(
      "Luka v1.6 running on "+port
    );
  }
);
