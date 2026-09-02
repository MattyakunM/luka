
"use strict";

const KEY="luka_v4_local_complete";
const DEVICE_KEY="luka_v4_device_account";
const EMOJIS=["👍","❤️","😂","🎉","😮","👏"];

const seed={
  version:4,
  accounts:[
    {id:"sora",name:"そら",handle:"sora",type:"user",isAdmin:true,suspended:false,bio:"Luka管理者"},
    {id:"luka_official",name:"Luka公式",handle:"luka_official",type:"ai",isAdmin:false,suspended:false,bio:"Lukaの公式サポートAI"},
    {id:"luka_update",name:"Luka Update",handle:"luka_update",type:"update",isAdmin:false,suspended:false,bio:"Lukaの更新情報"},
    {id:"luka_admin",name:"Luka管理者",handle:"luka_admin",type:"admin_ai",isAdmin:false,suspended:false,bio:"管理者向けLuka AI"},
    {id:"sample",name:"サンプルユーザー",handle:"sample",type:"user",isAdmin:false,suspended:false,bio:"テスト用アカウント"}
  ],
  friends:[],
  friendRequests:[],
  blocks:[],
  dms:[],
  messages:[],
  spaces:[
    {id:"official",name:"Luka Official",owner:"sora",inviteOnly:false,members:["sora","sample","luka_official"],rooms:[
      {id:"lobby",name:"ロビー"},
      {id:"help",name:"ヘルプ"}
    ]},
    {id:"test",name:"テストスペース",owner:"sora",inviteOnly:true,members:["sora","sample"],rooms:[
      {id:"lobby2",name:"ロビー"}
    ]}
  ],
  notifications:[],
  reports:[],
  pinned:[],
  settings:{theme:"system",notifications:true},
  activeSpace:"official",
  activeRoom:"lobby"
};

let state=load();
let modalEl=null;
let toastTimer=null;

function uid(prefix="id"){return prefix+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
let syncTimer=null;
function clone(x){return JSON.parse(JSON.stringify(x))}
function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>pushServerState(),60);
}
function saveStateDirect(x){localStorage.setItem(KEY,JSON.stringify(x))}
function localUserId(){return localStorage.getItem(DEVICE_KEY)||localStorage.getItem("luka_active_user")||"sora"}
function stateForServer(){
  const x=clone(state);
  delete x.userId;
  return x;
}
async function pushServerState(){
  try{
    await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(stateForServer())});
  }catch(e){ console.warn("Luka server sync failed",e); }
}
async function pullServerState(){
  try{
    const r=await fetch("/api/state",{cache:"no-store"});
    if(!r.ok) throw new Error("state fetch failed");
    const x=normalize(await r.json());
    const wanted=localUserId();
    state=x;
    state.userId=state.accounts.some(a=>a.id===wanted&&!a.suspended)?wanted:"sora";
    saveStateDirect(state);
    render();
  }catch(e){
    state=normalize(state);
    state.userId=state.accounts.some(a=>a.id===localUserId()&&!a.suspended)?localUserId():"sora";
    render();
    toast("サーバーに接続できないためローカル状態で起動しました");
  }
}
function normalize(x){
  x.accounts ||= []; x.friends ||= []; x.friendRequests ||= []; x.blocks ||= [];
  x.dms ||= []; x.messages ||= []; x.spaces ||= []; x.notifications ||= [];
  x.reports ||= []; x.pinned ||= []; x.settings ||= {theme:"system",notifications:true};
  x.spaces.forEach(s=>{s.members ||= []; s.rooms ||= [];});
  return x;
}
function me(){return state.accounts.find(a=>a.id===state.userId)||state.accounts[0]}
function setUser(id){
  const a=state.accounts.find(x=>x.id===id);
  if(!a || a.suspended){toast("このアカウントは使用できません");return}
  state.userId=id; localStorage.setItem(DEVICE_KEY,id); localStorage.setItem("luka_active_user",id); save(); render();
}
if(!state.userId) state.userId="sora";

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function acct(id){return state.accounts.find(a=>a.id===id)}
function isAdmin(){return me()?.id==="sora" && me()?.isAdmin===true}
function toast(t){clearTimeout(toastTimer);const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);toastTimer=setTimeout(()=>d.remove(),2200)}
function openModal(title,body,onOpen){
  closeModal();
  modalEl=document.createElement("div"); modalEl.className="modal-bg";
  modalEl.innerHTML=`<div class="modal"><h2>${esc(title)}</h2>${body}</div>`;
  document.body.appendChild(modalEl); if(onOpen) onOpen(modalEl);
}
function closeModal(){if(modalEl){modalEl.remove();modalEl=null}}

function inputModal(title,label,placeholder,okLabel,cb){
  openModal(title,`<label>${esc(label)}<input id="modalInput" placeholder="${esc(placeholder)}"></label><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">キャンセル</button><button class="primary" id="modalOk">${esc(okLabel)}</button></div>`,m=>{
    m.querySelector("#modalInput").focus();
    m.querySelector("#modalOk").onclick=()=>{const v=m.querySelector("#modalInput").value.trim();if(!v){toast("入力してください");return}cb(v);closeModal()};
  });
}

function addNotification(to,text,type="info"){
  state.notifications.push({id:uid("n"),to,text,type,read:false,createdAt:new Date().toISOString()}); save();
}

function ensureDM(a,b){
  const key=[a,b].sort().join(":");
  let d=state.dms.find(x=>x.key===key);
  if(!d){d={id:uid("dm"),key,a,b};state.dms.push(d);save()}
  return d;
}
function dmMessages(dmId){return state.messages.filter(m=>m.kind==="dm"&&m.dmId===dmId).sort((a,b)=>a.createdAt-b.createdAt)}

function sendDM(text){
  const target=window.currentDM;
  if(!target)return;
  const d=ensureDM(me().id,target);
  const m={id:uid("m"),kind:"dm",dmId:d.id,author:me().id,text,createdAt:Date.now(),edited:false,deleted:false,reactions:{}};
  state.messages.push(m);
  save(); render();
  if(target==="luka_official") setTimeout(()=>lukaReply(text,d.id),300);
}
function lukaReply(text,dmId){
  const t=text.toLowerCase();
  let reply="こんにちは！Luka公式だよ。何か手伝えることがあれば教えてね！";
  if(t.includes("こんにちは")||t.includes("こん")||t.includes("hello")) reply="こんにちは！今日もLukaへようこそ！";
  else if(t.includes("使い方")||t.includes("使い方")) reply="左のメニューからホーム、ユーザー、DM、スペース、設定などを開けるよ。分からないところをそのまま聞いてくれてOK！";
  else if(t.includes("管理者")||t.includes("管理")) reply="管理者のそらは、管理画面からスペースやユーザー、通報などを確認できるよ。";
  else if(t.includes("ありがとう")) reply="どういたしまして！いつでも呼んでね。";
  else if(t.includes("何")||t.includes("できる")) reply="ユーザー検索、フレンド、DM、スペース、リアクション、返信、ピン、検索、通報、管理機能などをサポートしてるよ。";
  state.messages.push({id:uid("m"),kind:"dm",dmId,author:"luka_official",text:reply,createdAt:Date.now(),edited:false,deleted:false,reactions:{}});
  addNotification(me().id,"Luka公式から返信が届きました","dm");
  save(); render();
}

function render(){
  const user=me();
  document.getElementById("app").innerHTML=`
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">Luka</div>
      ${nav("home","ホーム","⌂")}
      ${nav("profile","プロフィール","👤")}
      ${nav("users","ユーザー","🔎")}
      ${nav("friends","フレンド","👥")}
      ${nav("dm","DM","💬")}
      ${nav("spaces","スペース","▣")}
      ${nav("notifications","通知","🔔")}
      ${isAdmin()?nav("admin","管理者","👑","admin"): ""}
      ${nav("settings","設定","⚙")}
      <div class="userbox">
        <b>${esc(user.name)}</b><div class="muted">@${esc(user.handle||user.id)}</div>
        <button class="ghost" onclick="accountSwitch()">アカウント切替</button>
      </div>
    </aside>
    <main class="main">
      <div class="topbar"><b>${esc(pageTitle())}</b><span class="muted">${isAdmin()?"管理者モード":"通常モード"}</span></div>
      <div class="content">${pageHTML()}</div>
    </main>
  </div>`;
}
function nav(id,label,icon,cls=""){return `<button class="nav ${cls} ${window.page===id?"active":""}" onclick="view('${id}')">${icon} ${label}</button>`}
function pageTitle(){return ({home:"ホーム",profile:"プロフィール",users:"ユーザー",friends:"フレンド",dm:"ダイレクトメッセージ",spaces:"スペース",notifications:"通知",admin:"管理者",settings:"設定"}[window.page||"home"]||"ホーム")}
function view(p){window.page=p;render()}

function pageHTML(){
  switch(window.page||"home"){
    case "profile":return profilePage();
    case "users":return usersPage();
    case "friends":return friendsPage();
    case "dm":return dmPage();
    case "spaces":return spacesPage();
    case "notifications":return notificationsPage();
    case "admin":return isAdmin()?adminPage():"<div class='card'>管理者権限が必要です。</div>";
    case "settings":return settingsPage();
    default:return homePage();
  }
}
function homePage(){
  const unread=state.notifications.filter(n=>n.to===me().id&&!n.read).length;
  const official=["luka_official","luka_update","luka_admin"].map(id=>{const a=acct(id);return `<div class="item row"><b>${esc(a.name)}</b> <span class="badge">${esc(a.type)}</span><button onclick="openDM('${id}')">DMを開く</button></div>`}).join("");
  return `<div class="card"><h1>ようこそ、${esc(me().name)}！</h1><p>Lukaのローカル完全版です。</p><div class="grid"><div class="card"><div class="kpi">${state.spaces.length}</div>スペース</div><div class="card"><div class="kpi">${state.accounts.length}</div>アカウント</div><div class="card"><div class="kpi">${unread}</div>未読通知</div></div></div><div class="card"><h2>公式アカウント</h2><div class="list">${official}</div></div>`;
}
function profilePage(){
  return `<div class="card"><h2>プロフィール</h2><label>表示名<input id="pName" value="${esc(me().name)}"></label><label>自己紹介<textarea id="pBio">${esc(me().bio||"")}</textarea></label><button class="primary" onclick="saveProfile()">保存</button></div>`;
}
function saveProfile(){me().name=document.getElementById("pName").value.trim()||me().name;me().bio=document.getElementById("pBio").value;save();render();toast("保存しました")}
function usersPage(){
  const q=window.userQuery||"";
  const list=state.accounts.filter(a=>a.id!==me().id && (a.name.includes(q)||a.handle.includes(q)));
  return `<div class="card"><h2>ユーザー検索</h2><input id="userSearch" value="${esc(q)}" placeholder="名前・IDで検索" oninput="window.userQuery=this.value;render()"><div class="list">${list.map(a=>`<div class="item row"><div style="flex:1"><b>${esc(a.name)}</b> <span class="badge">${esc(a.type)}</span><div class="muted">@${esc(a.handle)}</div></div><button onclick="openDM('${a.id}')">DM</button>${a.type==="user"?`<button onclick="sendFriend('${a.id}')">フレンド申請</button>`:""}</div>`).join("")||"<div class='muted'>該当ユーザーなし</div>"}</div></div>`;
}
function sendFriend(id){
  if(state.friendRequests.some(r=>r.from===me().id&&r.to===id&&r.status==="pending")){toast("申請済み");return}
  state.friendRequests.push({id:uid("fr"),from:me().id,to:id,status:"pending"});addNotification(id,`${me().name}からフレンド申請が届きました`,"friend");save();toast("申請しました");
}
function friendsPage(){
  const mine=state.friends.filter(f=>f.includes(me().id)).map(f=>f.split(":").find(x=>x!==me().id));
  const incoming=state.friendRequests.filter(r=>r.to===me().id&&r.status==="pending");
  return `<div class="card"><h2>フレンド</h2><div class="list">${mine.map(id=>`<div class="item row"><b>${esc(acct(id)?.name||id)}</b><button onclick="openDM('${id}')">DM</button></div>`).join("")||"<div class='muted'>まだフレンドはいません</div>"}</div></div>
  <div class="card"><h2>申請</h2>${incoming.map(r=>`<div class="item row"><b>${esc(acct(r.from)?.name)}</b><button class="primary" onclick="acceptFriend('${r.id}')">承認</button><button onclick="rejectFriend('${r.id}')">拒否</button></div>`).join("")||"<div class='muted'>ありません</div>"}</div>`;
}
function acceptFriend(rid){const r=state.friendRequests.find(x=>x.id===rid);if(!r)return;r.status="accepted";const key=[r.from,r.to].sort().join(":");if(!state.friends.includes(key))state.friends.push(key);addNotification(r.from,`${me().name}がフレンド申請を承認しました`);save();render()}
function rejectFriend(rid){const r=state.friendRequests.find(x=>x.id===rid);if(r)r.status="rejected";save();render()}

function openDM(id){window.currentDM=id;window.page="dm";render()}
function dmPage(){
  const target=window.currentDM||"luka_official";window.currentDM=target;
  const a=acct(target), d=ensureDM(me().id,target), msgs=dmMessages(d.id);
  return `<div class="card" style="padding:0;overflow:hidden"><div class="chat"><div class="chatrooms"><b>DM</b><div class="list" style="margin-top:10px">${state.accounts.filter(a=>a.id!==me().id).map(x=>`<button class="nav ${x.id===target?"active":""}" onclick="openDM('${x.id}')">${esc(x.name)}</button>`).join("")}</div></div>
  <div class="messages"><div class="message-list" id="messageList">${msgs.map(renderMessage).join("")}</div><div class="composer"><textarea id="dmText" placeholder="${a.type==="ai"?"Luka公式にメッセージ":"メッセージを入力"}" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendDMFromBox()}"></textarea><button class="primary" onclick="sendDMFromBox()">送信</button></div></div></div></div>`;
}
function sendDMFromBox(){const el=document.getElementById("dmText");const t=el.value.trim();if(!t)return;sendDM(t)}

function spaceObj(){return state.spaces.find(s=>s.id===state.activeSpace)||state.spaces[0]}
function roomObj(){const s=spaceObj();return s?.rooms.find(r=>r.id===state.activeRoom)||s?.rooms[0]}
function spacesPage(){
  const s=spaceObj(),r=roomObj(),msgs=state.messages.filter(m=>m.kind==="room"&&m.spaceId===s?.id&&m.roomId===r?.id).sort((a,b)=>a.createdAt-b.createdAt);
  const spaces=state.spaces.map(x=>`<button class="${x.id===s?.id?"primary":""}" onclick="selectSpace('${x.id}')">${esc(x.name)}</button>`).join("");
  const rooms=s?s.rooms.map(x=>`<button class="${x.id===r?.id?"primary":""}" onclick="selectRoom('${x.id}')">${esc(x.name)}</button>`).join(""):"";
  const body=s?`<div class="card"><div class="row" style="justify-content:space-between"><b>${esc(s.name)} / ${esc(r?.name||"")}</b><div><button onclick="createRoom()">＋部屋</button>${isAdmin()||s.owner===me().id?`<button class="danger" onclick="deleteSpace('${s.id}')">スペース削除</button>`:""}</div></div><div class="row" style="margin-top:10px">${rooms}</div></div><div class="card" style="padding:0;overflow:hidden"><div class="messages"><div class="message-list">${msgs.map(renderMessage).join("")}</div><div class="composer"><textarea id="roomText" placeholder="メッセージを入力" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendRoomFromBox()}"></textarea><button class="primary" onclick="sendRoomFromBox()">送信</button></div></div></div>`:"";
  return `<div class="row" style="justify-content:space-between"><h2>スペース</h2><button class="primary" onclick="createSpace()">＋スペース</button></div><div class="card"><div class="row">${spaces}</div></div>${body}`;
}
function selectSpace(id){state.activeSpace=id;const s=spaceObj();state.activeRoom=s?.rooms[0]?.id;save();render()}
function selectRoom(id){state.activeRoom=id;save();render()}
function createSpace(){
  openModal("スペースを作成",`<label>名前<input id="xName" placeholder="例：ゲーム部"></label><label><input id="xInvite" type="checkbox"> 招待制にする</label><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">キャンセル</button><button class="primary" id="ok">作成</button></div>`,m=>{
    m.querySelector("#ok").onclick=()=>{const name=m.querySelector("#xName").value.trim();if(!name){toast("名前を入力");return}const s={id:uid("sp"),name,owner:me().id,inviteOnly:m.querySelector("#xInvite").checked,members:[me().id],rooms:[{id:uid("room"),name:"ロビー"}]};state.spaces.push(s);state.activeSpace=s.id;state.activeRoom=s.rooms[0].id;save();closeModal();render()};
  });
}
function createRoom(){
  const s=spaceObj();if(!s)return;
  openModal("部屋を作成",`<label>部屋名<input id="rName" placeholder="例：雑談"></label><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">キャンセル</button><button class="primary" id="ok">作成</button></div>`,m=>{
    m.querySelector("#ok").onclick=()=>{const n=m.querySelector("#rName").value.trim();if(!n)return;const r={id:uid("room"),name:n};s.rooms.push(r);state.activeRoom=r.id;save();closeModal();render()};
  });
}
function deleteSpace(id){if(!confirm("このスペースを削除しますか？"))return;const s=state.spaces.find(x=>x.id===id);if(!s)return;if(!(isAdmin()||s.owner===me().id)){toast("権限がありません");return}state.spaces=state.spaces.filter(x=>x.id!==id);state.activeSpace=state.spaces[0]?.id;state.activeRoom=state.spaces[0]?.rooms[0]?.id;save();render()}
function sendRoomFromBox(){const el=document.getElementById("roomText"),t=el.value.trim();if(!t)return;const s=spaceObj(),r=roomObj();state.messages.push({id:uid("m"),kind:"room",spaceId:s.id,roomId:r.id,author:me().id,text:t,createdAt:Date.now(),edited:false,deleted:false,reactions:{}});save();render()}

function renderMessage(m){
  const a=acct(m.author), mine=m.author===me().id;
  const reactions=Object.entries(m.reactions||{}).map(([e,n])=>`<button class="reaction" onclick="react('${m.id}','${e}')">${e} ${n}</button>`).join("");
  const body=m.deleted?"<i>このメッセージは削除されました</i>":esc(m.text).replace(/\n/g,"<br>");
  return `<div class="msg ${mine?"mine":""}"><div class="meta">${esc(a?.name||m.author)} ・ ${new Date(m.createdAt).toLocaleString("ja-JP")}${m.edited?" ・ 編集済み":""}</div><div>${body}</div>${reactions?`<div class="reactions">${reactions}</div>`:""}<div class="actions">
  ${EMOJIS.map(e=>`<button class="reaction" onclick="react('${m.id}','${e}')">${e}</button>`).join("")}
  <button class="reaction" onclick="replyTo('${m.id}')">↩ 返信</button>
  <button class="reaction" onclick="togglePin('${m.id}')">📌</button>
  ${mine&&!m.deleted?`<button class="reaction" onclick="editMessage('${m.id}')">編集</button><button class="reaction" onclick="deleteMessage('${m.id}')">削除</button>`:""}
  </div></div>`;
}
function findMsg(id){return state.messages.find(m=>m.id===id)}
function react(id,e){const m=findMsg(id);if(!m)return;m.reactions ||= {};m.reactions[e]=(m.reactions[e]||0)+1;save();render()}
function togglePin(id){const i=state.pinned.indexOf(id);if(i>=0)state.pinned.splice(i,1);else state.pinned.push(id);save();toast(i>=0?"ピン解除":"ピン留めしました");render()}
function editMessage(id){const m=findMsg(id);if(!m||m.author!==me().id)return;openModal("メッセージを編集",`<textarea id="editText">${esc(m.text)}</textarea><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">キャンセル</button><button class="primary" id="ok">保存</button></div>`,x=>x.querySelector("#ok").onclick=()=>{m.text=x.querySelector("#editText").value.trim()||m.text;m.edited=true;save();closeModal();render()})}
function deleteMessage(id){const m=findMsg(id);if(!m||m.author!==me().id)return;if(!confirm("削除しますか？"))return;m.deleted=true;save();render()}
function replyTo(id){const m=findMsg(id);if(!m)return;inputModal("返信","返信内容","返信を入力","送信",v=>{const copy={...m};state.messages.push({id:uid("m"),kind:m.kind,dmId:m.dmId,spaceId:m.spaceId,roomId:m.roomId,author:me().id,text:`↪ ${copy.text}\n${v}`,createdAt:Date.now(),edited:false,deleted:false,reactions:{}});save();render()})}

function notificationsPage(){
  const ns=state.notifications.filter(n=>n.to===me().id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  ns.forEach(n=>n.read=true);save();
  return `<div class="card"><h2>通知</h2><div class="list">${ns.map(n=>`<div class="item"><b>${esc(n.type)}</b><div>${esc(n.text)}</div><div class="muted">${new Date(n.createdAt).toLocaleString("ja-JP")}</div></div>`).join("")||"<div class='muted'>通知はありません</div>"}</div>`;
}

function adminPage(){
  const reports=state.reports.filter(r=>!r.resolved).length;
  const accounts=state.accounts.map(a=>`<div class="item row"><div style="flex:1"><b>${esc(a.name)}</b> <span class="badge">${a.isAdmin?"管理者":a.type}</span><div class="muted">@${esc(a.handle)}</div></div>${a.suspended?"<span class='badge'>停止中</span>":""}<button onclick="switchAccount('${a.id}')">切替</button>${a.id!=="sora"&&a.type==="user"?`<button onclick="toggleSuspend('${a.id}')">${a.suspended?"再開":"停止"}</button>`:""}</div>`).join("");
  const spaces=state.spaces.map(sp=>`<div class="item"><b>${esc(sp.name)}</b><div class="muted">所有者: ${esc(acct(sp.owner)?.name||sp.owner)} / ${sp.members.length}人</div><div class="row">${sp.rooms.map(r=>`<button onclick="adminOpenRoom('${sp.id}','${r.id}')">${esc(r.name)}</button>`).join("")}</div></div>`).join("");
  const reps=state.reports.map(r=>`<div class="item"><b>${esc(r.reason)}</b><div>${esc(r.text||"")}</div><div class="muted">対象: ${esc(acct(r.target)?.name||r.target)}</div>${!r.resolved?`<button class="primary" onclick="resolveReport('${r.id}')">対応済みにする</button>`:"<span class='badge'>対応済み</span>"}</div>`).join("")||"<div class='muted'>通報はありません</div>";
  return `<div class="grid"><div class="card"><div class="kpi">${state.accounts.length}</div>アカウント</div><div class="card"><div class="kpi">${state.spaces.length}</div>スペース</div><div class="card"><div class="kpi">${reports}</div>未処理通報</div></div><div class="card"><h2>アカウント切替・管理</h2><p class="muted">管理者は「そら」固定。ここから通常アカウントを作成・切替できます。</p><div class="row"><button class="primary" onclick="createAccount()">＋通常アカウント作成</button><button onclick="exportBackup()">バックアップ書き出し</button><button onclick="importBackup()">バックアップ復元</button></div><div class="list" style="margin-top:10px">${accounts}</div></div><div class="card"><h2>全スペース・全ルーム</h2><div class="list">${spaces}</div></div><div class="card"><h2>通報</h2><div class="list">${reps}</div></div>`;
}
function createAccount(){
  openModal("通常アカウントを作成",`<label>表示名<input id="an" placeholder="例：ゲーム用"></label><label>ユーザーID<input id="ah" placeholder="英数字"></label><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">キャンセル</button><button class="primary" id="ok">作成</button></div>`,m=>m.querySelector("#ok").onclick=()=>{const n=m.querySelector("#an").value.trim(),h=m.querySelector("#ah").value.trim();if(!n||!h){toast("両方入力してください");return}if(state.accounts.some(a=>a.handle===h)){toast("そのIDは使用済み");return}const a={id:uid("u"),name:n,handle:h,type:"user",isAdmin:false,suspended:false,bio:""};state.accounts.push(a);save();closeModal();switchAccount(a.id)});
}
function switchAccount(id){setUser(id)}
function accountSwitch(){
  openModal("アカウント切替",`<div class="list">${state.accounts.filter(a=>!a.suspended).map(a=>`<button class="nav" onclick="switchAccount('${a.id}');closeModal()"><b>${esc(a.name)}</b> <span class="badge">${a.isAdmin?"管理者":a.type}</span><div class="muted">@${esc(a.handle)}</div></button>`).join("")}</div><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">閉じる</button></div>`);
}
function toggleSuspend(id){const a=acct(id);if(!a)return;a.suspended=!a.suspended;save();render()}
function adminOpenRoom(sid,rid){
  const s=state.spaces.find(x=>x.id===sid),r=s?.rooms.find(x=>x.id===rid);if(!s||!r)return;
  const msgs=state.messages.filter(m=>m.kind==="room"&&m.spaceId===sid&&m.roomId===rid).sort((a,b)=>a.createdAt-b.createdAt);
  openModal(`${s.name} / ${r.name}`,`<div class="message-list" style="max-height:60vh">${msgs.map(renderMessage).join("")||"<div class='muted'>メッセージなし</div>"}</div><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">閉じる</button></div>`);
}
function resolveReport(id){const r=state.reports.find(x=>x.id===id);if(r)r.resolved=true;save();render()}
function reportUser(id){
  openModal("通報",`<label>理由<select id="rr"><option>迷惑行為</option><option>不適切な投稿</option><option>その他</option></select></label><label>内容<textarea id="rt"></textarea></label><div class="row" style="justify-content:flex-end"><button onclick="closeModal()">キャンセル</button><button class="danger" id="ok">通報する</button></div>`,m=>m.querySelector("#ok").onclick=()=>{state.reports.push({id:uid("rep"),from:me().id,target:id,reason:m.querySelector("#rr").value,text:m.querySelector("#rt").value,resolved:false,createdAt:new Date().toISOString()});addNotification("sora",`${me().name}から通報が届きました`,"report");save();closeModal();toast("通報しました")});
}
function settingsPage(){
  return `<div class="card"><h2>設定</h2><label>表示<input value="${esc(state.settings.theme)}" disabled></label><label><input type="checkbox" id="notifySet" ${state.settings.notifications?"checked":""}> 通知を有効にする</label><button class="primary" onclick="saveSettings()">保存</button></div>
  <div class="card"><h2>データ</h2><button onclick="exportBackup()">バックアップ書き出し</button> <button onclick="importBackup()">バックアップ復元</button><button class="danger" onclick="resetLocal()">ローカルデータを初期化</button></div>`;
}
function saveSettings(){state.settings.notifications=document.getElementById("notifySet").checked;save();toast("設定を保存しました")}
function exportBackup(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="luka-backup.json";a.click();URL.revokeObjectURL(url);toast("バックアップを書き出しました");
}
function importBackup(){
  const i=document.createElement("input");i.type="file";i.accept=".json,application/json";i.onchange=()=>{const f=i.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const x=normalize(JSON.parse(rd.result));if(!x.accounts||!x.spaces)throw new Error();state=x;state.userId="sora";save();render();toast("復元しました")}catch(e){toast("バックアップ形式が正しくありません")}};rd.readAsText(f)};i.click();
}
function resetLocal(){if(!confirm("このブラウザのLukaデータを初期化します。よろしいですか？"))return;localStorage.removeItem(KEY);localStorage.removeItem(DEVICE_KEY);location.reload()}

window.view=view;window.closeModal=closeModal;window.accountSwitch=accountSwitch;window.openDM=openDM;
window.sendDMFromBox=sendDMFromBox;window.saveProfile=saveProfile;window.sendFriend=sendFriend;window.acceptFriend=acceptFriend;window.rejectFriend=rejectFriend;
window.selectSpace=selectSpace;window.selectRoom=selectRoom;window.createSpace=createSpace;window.createRoom=createRoom;window.deleteSpace=deleteSpace;window.sendRoomFromBox=sendRoomFromBox;
window.react=react;window.togglePin=togglePin;window.editMessage=editMessage;window.deleteMessage=deleteMessage;window.replyTo=replyTo;
window.createAccount=createAccount;window.switchAccount=switchAccount;window.toggleSuspend=toggleSuspend;window.adminOpenRoom=adminOpenRoom;window.resolveReport=resolveReport;window.reportUser=reportUser;
window.saveSettings=saveSettings;window.exportBackup=exportBackup;window.importBackup=importBackup;window.resetLocal=resetLocal;

window.page="home";
state.userId=localUserId();
render();
pullServerState();
