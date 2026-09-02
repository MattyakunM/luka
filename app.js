
const KEY="luka_local_complete_v4";
const DEVICE_KEY="luka_device_account_v4";
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const now=()=>new Date().toISOString();
const EMOJIS=["👍","❤️","😂","😮","😢","😡","🎉","🔥","👏","🙏","💯","🤔","👀","🤣","🥳","😭","✨","⭐","🚀","☕","🎮","🎵","📌","✅","❌","❤️‍🔥","🫶","😎","🙌","💡","🎊","💪","🥹","😆","😴","🤯","😍","😇","😱","🤝","🫡","💬","🌟"];

const seed={
 accounts:[{id:"sora",username:"sora",displayName:"そら",bio:"",status:"オンライン",avatar:"👤",isAdmin:true}],
 userId:"sora",
 users:[
  {id:"sora",username:"sora",displayName:"そら",bio:"",status:"オンライン",avatar:"👤",isAdmin:true},
  {id:"official",username:"luka_official",displayName:"Luka公式",bio:"Lukaの使い方・困りごとの案内",status:"サポート中",avatar:"🤖",type:"ai"},
  {id:"update",username:"luka_update",displayName:"Luka Update",bio:"アップデート専用アカウント",status:"更新情報",avatar:"📢",type:"update"},
  {id:"adminai",username:"luka_admin",displayName:"Luka管理者",bio:"開発・設計支援用AI",status:"開発モード",avatar:"🧠",type:"admin_ai"},
  {id:"sample",username:"sample_user",displayName:"サンプルユーザー",bio:"テスト用ユーザー",status:"よろしく！",avatar:"🙂"}
 ],
 friends:[],requests:[],blocks:[],notifications:[{id:"welcome",title:"Lukaへようこそ！",body:"左のメニューから機能を試してみてね。",read:false,createdAt:now()}],
 spaces:[
  {id:"official-space",name:"Luka Official",description:"Luka公式スペース",owner:"system",inviteCode:"LUKA",rooms:[{id:"lobby",name:"ロビー",messages:[{id:"welcome-msg",author:"official",content:"Lukaへようこそ！分からないことがあればいつでも聞いてください。",createdAt:now()}]}]},
  {id:"test-space",name:"テストスペース",description:"ローカルテスト用",owner:"sora",inviteCode:"TEST",rooms:[{id:"general",name:"一般",messages:[]},{id:"ideas",name:"アイデア",messages:[]}]}
 ],
 dms:[{id:"dm-official",with:"official",messages:[{id:"dm-welcome",author:"official",content:"こんにちは！Luka公式です。使い方や困ったことを案内できます。",createdAt:now()}]}],
 reactions:{},pinned:[],reports:[],bans:[],settings:{theme:"light",notifications:true}
};

let state=load();
let currentView="home", currentRoom=null, currentDm=null, replyTo=null, editing=null;

function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x||structuredClone(seed)}catch{return structuredClone(seed)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function me(){return state.users.find(u=>u.id===state.userId)||state.users[0]}
function user(id){return state.users.find(u=>u.id===id)||{id,displayName:id,username:id,avatar:"👤"}}
function avatar(u){return u?.avatar||"👤"}
function totalMessages(){return state.spaces.reduce((n,s)=>n+s.rooms.reduce((x,r)=>x+r.messages.length,0),0)+state.dms.reduce((n,d)=>n+d.messages.length,0)}
function findMessage(id){
 for(const s of state.spaces)for(const r of s.rooms){const m=r.messages.find(x=>x.id===id);if(m)return m}
 for(const d of state.dms){const m=d.messages.find(x=>x.id===id);if(m)return m}
 return null
}
function modal(title,body,actions='<button onclick="closeModal()">閉じる</button>'){
 closeModal();const d=document.createElement("div");d.className="luka-modal-backdrop";
 d.innerHTML=`<div class="luka-modal"><h2>${title}</h2>${body}<div class="modal-actions">${actions}</div></div>`;
 d.onclick=e=>{if(e.target===d)closeModal()};document.body.appendChild(d)
}
function closeModal(){document.querySelector(".luka-modal-backdrop")?.remove();document.querySelector(".emoji-picker")?.remove()}
window.closeModal=closeModal;

function shell(){
 document.getElementById("app").innerHTML=`<header><div class="brand">◈ <b>Luka</b><small>Local Complete</small></div>
 <div class="top-actions"><button onclick="view('notifications')">🔔 ${state.notifications.filter(n=>!n.read).length||""}</button><button onclick="view('profile')">${avatar(me())} ${esc(me().displayName)}</button></div></header>
 <main><aside>
 <button class="nav" onclick="view('home')">🏠 ホーム</button>
 <button class="nav" onclick="view('profile')">👤 プロフィール</button>
 <button class="nav" onclick="view('account')">🔄 アカウント</button>
 <button class="nav" onclick="view('friends')">👥 友達・ユーザー</button>
 <button class="nav" onclick="view('dms')">💬 DM</button>
 <button class="nav" onclick="view('notifications')">🔔 通知</button><hr><h4>スペース</h4><div id="spaceList"></div>
 <button class="newspace" onclick="createSpaceUI()">＋ スペースを作成</button><hr>
 <button class="nav" onclick="view('call')">📞 通話</button>
 ${me().isAdmin?'<button class="nav admin" onclick="view(\'admin\')">👑 管理者</button>':""}
 <button class="nav" onclick="view('settings')">⚙️ 設定</button>
 </aside><section id="content"></section></main></div>`;
 renderSpaces();home()
}
function renderSpaces(){const e=document.getElementById("spaceList");if(e)e.innerHTML=state.spaces.map(s=>`<button class="spaceBtn" onclick="openSpace('${s.id}')">${esc(s.name)}</button>`).join("")}
function view(v){currentView=v;({home,profile,account,friends,dms,notifications,call,admin,settings}[v]||home)()}
function content(h){document.getElementById("content").innerHTML=h}

function home(){
 const can=!me().isAdmin&&!localStorage.getItem(DEVICE_KEY);
 content(`<div class="hero card"><div class="heroIcon">◈</div><div><h1>Luka</h1><p>友達、スペース、DM、AI、通話まで。ひとつにつながるコミュニケーションツール。</p></div></div>
 <div class="grid"><div class="card"><h3>👤 アカウント</h3><p>現在：<b>${esc(me().displayName)}</b>${me().isAdmin?" 👑":""}</p><button onclick="view('account')">アカウント管理</button>${can?'<button class="primary" onclick="createPersonalUI()">＋ 個人アカウントを作成</button>':""}</div>
 <div class="card"><h3>🤖 Luka公式</h3><p>使い方や困ったことを相談できます。</p><button onclick="openDm('official')">Luka公式を開く</button></div>
 <div class="card"><h3>🌐 スペース</h3><p>${state.spaces.length}個のスペースがあります。</p><button onclick="createSpaceUI()">＋ 新しいスペース</button></div></div>`)
}

function profile(){
 const u=me();content(`<div class="card narrow"><h2>👤 プロフィール</h2><div class="avatarBig">${avatar(u)}</div>
 <label>表示名<input id="pname" value="${esc(u.displayName)}"></label><label>アイコン<input id="pavatar" value="${esc(u.avatar)}"></label>
 <label>ステータス<input id="pstatus" value="${esc(u.status)}"></label><label>自己紹介<textarea id="pbio">${esc(u.bio)}</textarea></label>
 <button class="primary" onclick="saveProfile()">保存</button></div>`)
}
function saveProfile(){const u=me();u.displayName=document.getElementById("pname").value.trim()||u.username;u.avatar=document.getElementById("pavatar").value;u.status=document.getElementById("pstatus").value;u.bio=document.getElementById("pbio").value;save();shell()}

function account(){
 const has=!!localStorage.getItem(DEVICE_KEY);
 content(`<div class="card narrow"><h2>🔄 アカウント</h2><p>現在：<b>${esc(me().displayName)}</b>${me().isAdmin?" 👑 管理者":""}</p>
 <h3>アカウント切替</h3>${state.accounts.map(a=>`<div class="row"><span>${avatar(a)} <b>${esc(a.displayName)}</b> <small>@${esc(a.username)}</small>${a.isAdmin?" 👑":""}</span><button onclick="switchAccount('${a.id}')">${a.id===state.userId?"使用中":"切替"}</button></div>`).join("")}
 <hr><h3>個人アカウント</h3><p class="muted">通常ユーザーはこのブラウザで1つまで作成できます。管理者アカウントは制限対象外です。</p>
 ${me().isAdmin?'<button class="primary" onclick="createManagedAccountUI()">＋ 通常アカウントを作成</button>':(has?'<div class="notice read">このブラウザでは個人アカウント作成済みです。</div>':'<button class="primary" onclick="createPersonalUI()">＋ 個人アカウントを作成</button>')}</div>`)
}
function createPersonalUI(){if(me().isAdmin)return; if(localStorage.getItem(DEVICE_KEY))return modal("作成できません","<p>このブラウザではすでに通常アカウントがあります。</p>");
 modal("👤 個人アカウントを作成",'<p class="muted">通常アカウントはこのブラウザで1つまでです。</p><label>ユーザー名<input id="newUser" maxlength="24"></label><label>表示名<input id="newName" maxlength="32"></label>','<button onclick="closeModal()">キャンセル</button><button class="primary" onclick="createPersonal()">作成する</button>')}
function createPersonal(){
 const un=document.getElementById("newUser").value.trim(),dn=document.getElementById("newName").value.trim()||un;if(!un)return;
 if(state.accounts.some(a=>a.username===un))return alert("そのユーザー名は使用済みです。");
 const id="acct_"+uid(),a={id,username:un,displayName:dn,bio:"",status:"オンライン",avatar:"👤",isAdmin:false};
 state.accounts.push(a);state.users.push(a);state.userId=id;localStorage.setItem(DEVICE_KEY,id);save();closeModal();shell()
}
function createManagedAccountUI(){if(!me().isAdmin)return;modal("👤 通常アカウントを作成",'<label>ユーザー名<input id="newUser" maxlength="24"></label><label>表示名<input id="newName" maxlength="32"></label>','<button onclick="closeModal()">キャンセル</button><button class="primary" onclick="createManagedAccount()">作成する</button>')}
function createManagedAccount(){
 const un=document.getElementById("newUser").value.trim(),dn=document.getElementById("newName").value.trim()||un;if(!un)return;
 if(state.accounts.some(a=>a.username===un))return alert("そのユーザー名は使用済みです。");
 const id="acct_"+uid(),a={id,username:un,displayName:dn,bio:"",status:"オフライン",avatar:"👤",isAdmin:false};state.accounts.push(a);state.users.push(a);save();closeModal();admin()
}
function switchAccount(id){const a=state.accounts.find(x=>x.id===id);if(!a)return;if(!a.isAdmin&&localStorage.getItem(DEVICE_KEY)&&localStorage.getItem(DEVICE_KEY)!==id)return alert("このブラウザの通常アカウントは1つまでです。");state.userId=id;save();shell()}

function friends(){
 content(`<div class="card"><h2>👥 友達・ユーザー</h2><input id="userSearch" placeholder="ユーザー名・表示名を検索" oninput="searchUsers()"><div id="users"></div><h3>友達</h3>${state.friends.map(id=>`<div class="row">${avatar(user(id))} ${esc(user(id).displayName)} <button onclick="openDm('${id}')">DM</button></div>`).join("")||"<p>まだ友達はいません。</p>"}</div>`);searchUsers()
}
function searchUsers(){const q=(document.getElementById("userSearch")?.value||"").toLowerCase();const a=state.users.filter(u=>u.id!==state.userId&&!state.blocks.includes(u.id)&&(u.username+" "+u.displayName).toLowerCase().includes(q));document.getElementById("users").innerHTML=a.map(u=>`<div class="row"><span>${avatar(u)} <b>${esc(u.displayName)}</b> <small>@${esc(u.username)}</small></span><span><button onclick="openDm('${u.id}')">DM</button>${u.type?"":`<button onclick="friend('${u.id}')">友達</button>`}</span></div>`).join("")||"<p>見つかりません。</p>"}
function friend(id){if(!state.friends.includes(id))state.friends.push(id);notify("友達","友達に追加しました："+user(id).displayName);save();friends()}

function dms(){content(`<div class="card"><div class="sectionHead"><h2>💬 DM</h2><button class="primary" onclick="newDmUI()">＋ 新しいDM</button></div>${state.dms.map(d=>`<button class="dmItem" onclick="openDm('${d.with}')">${avatar(user(d.with))}<b>${esc(user(d.with).displayName)}</b><small>${esc(d.messages.at(-1)?.content||"")}</small></button>`).join("")||"<p>DMはありません。</p>"}</div>`)}
function newDmUI(){const a=state.users.filter(u=>u.id!==state.userId&&!u.suspended);modal("💬 新しいDM",`<label>相手<select id="dmWho">${a.map(u=>`<option value="${u.id}">${esc(u.displayName)} (@${esc(u.username)})</option>`).join("")}</select></label>`,'<button onclick="closeModal()">キャンセル</button><button class="primary" onclick="newDm()">開く</button>')}
function newDm(){const id=document.getElementById("dmWho").value;closeModal();openDm(id)}
function openDm(id){currentDm=id;let d=state.dms.find(x=>x.with===id);if(!d){d={id:"dm_"+uid(),with:id,messages:[]};state.dms.push(d);save()}renderDm(d)}
function renderDm(d){
 content(`<div class="card"><div class="roomHead"><button onclick="view('dms')">← DM</button><h2>${avatar(user(d.with))} ${esc(user(d.with).displayName)}</h2></div>
 <div class="messages">${d.messages.map(messageHTML).join("")||"<div class='muted'>ここから会話を始めよう！</div>"}</div>${composer("dm",d.with)}</div>`);
 bindComposer("dm",d.with)
}
function sendDm(id){sendMessage("dm",id)}

function openSpace(sid){const s=state.spaces.find(x=>x.id===sid);if(s)openRoom(sid,s.rooms[0].id)}
function openRoom(sid,rid){currentRoom={sid,rid};const s=state.spaces.find(x=>x.id===sid),r=s?.rooms.find(x=>x.id===rid);if(!r)return;
 content(`<div class="card"><div class="roomHead"><div><button onclick="view('home')">←</button><b>${esc(s.name)}</b> / ${esc(r.name)}</div><div><button onclick="searchUI('${sid}','${rid}')">🔎</button><button onclick="createRoomUI('${sid}')">＋</button></div></div>
 <div class="roomTabs">${s.rooms.map(x=>`<button class="${x.id===rid?"active":""}" onclick="openRoom('${sid}','${x.id}')"># ${esc(x.name)}</button>`).join("")}</div>
 <div class="messages">${r.messages.map(messageHTML).join("")||"<div class='muted'>まだメッセージはありません。</div>"}</div>${composer("room",sid+"|"+rid)}</div>`);bindComposer("room",sid+"|"+rid)
}
function composer(kind,id){
 return `${replyTo?`<div class="replybar">↩️ <b>${esc(user(replyTo.author).displayName)}</b>：${esc(replyTo.content).slice(0,100)}<button onclick="cancelReply()">✕</button></div>`:""}
 <div class="composer"><button onclick="emojiForComposer('${kind}')">😀</button><input id="${kind}Input" placeholder="${editing?"メッセージを編集…":"メッセージを入力…"}"><button onclick="sendMessage('${kind}','${id}')">${editing?"保存":"送信"}</button></div>`
}
function bindComposer(kind,id){const i=document.getElementById(kind+"Input");if(i)i.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(kind,id)}}}
function sendMessage(kind,id){
 const i=document.getElementById(kind+"Input"),v=i?.value.trim();if(!v)return;
 if(editing){const m=findMessage(editing);if(m&&m.author===state.userId){m.content=v;m.edited=true}editing=null;replyTo=null;save();if(kind==="room"){const [sid,rid]=id.split("|");openRoom(sid,rid)}else openDm(id);return}
 const m={id:uid(),author:state.userId,content:v,createdAt:now()};if(replyTo)m.replyTo=replyTo.id;
 if(kind==="room"){const [sid,rid]=id.split("|");state.spaces.find(s=>s.id===sid).rooms.find(r=>r.id===rid).messages.push(m);save();replyTo=null;openRoom(sid,rid)}
 else{state.dms.find(d=>d.with===id).messages.push(m);save();replyTo=null;openDm(id);if(id==="official")officialReply(v)}
}
function officialReply(v){setTimeout(()=>{const d=state.dms.find(x=>x.with==="official");if(!d)return;let t="メッセージありがとう！Luka公式です。使い方や困ったことを案内できるよ。";const q=v.toLowerCase();if(q.includes("アカウント"))t="アカウントは左メニューの「🔄 アカウント」から作成・切替できます。通常アカウントはこのブラウザで1つまでです。";else if(q.includes("スペース"))t="スペースは左の「＋ スペースを作成」から作れます。ルームも専用ボックスで追加できます。";else if(q.includes("リアクション"))t="メッセージの😀から好きな絵文字を選べます。複数種類も付けられます。";else if(q.includes("返信"))t="メッセージの↩️を押すと、そのメッセージへの返信モードになります。";d.messages.push({id:uid(),author:"official",content:t,createdAt:now()});save();if(currentDm==="official")openDm("official")},300)}
function messageHTML(m){
 const u=user(m.author),rr=m.replyTo?findMessage(m.replyTo):null,r=state.reactions[m.id]||{};
 return `<div class="message"><div><b>${avatar(u)} ${esc(u.displayName)}</b><small>${new Date(m.createdAt).toLocaleString()}${m.edited?"・編集済み":""}</small></div>${rr?`<div class="muted">↩ ${esc(user(rr.author).displayName)}：${esc(rr.content).slice(0,90)}</div>`:""}<div>${esc(m.content)}</div>
 <div class="reactions">${Object.entries(r).filter(([,a])=>a.length).map(([e,a])=>`<button class="reaction ${a.includes(state.userId)?"active":""}" onclick="toggleReaction('${m.id}','${e}')">${e} ${a.length}</button>`).join("")}</div>
 <div class="messageTools"><button onclick="reactionPicker('${m.id}',this)">😀</button><button onclick="startReply('${m.id}')">↩️</button><button onclick="togglePin('${m.id}')">${state.pinned.includes(m.id)?"📌":"📍"}</button>${m.author===state.userId?`<button onclick="startEdit('${m.id}')">✏️</button><button onclick="deleteMessage('${m.id}')">🗑️</button>`:""}</div></div>`
}
function reactionPicker(mid,btn){closeModal();const p=document.createElement("div");p.className="emoji-picker";p.innerHTML=EMOJIS.map(e=>`<button onclick="toggleReaction('${mid}','${e}')">${e}</button>`).join("");document.body.appendChild(p);const r=btn.getBoundingClientRect();p.style.left=Math.min(innerWidth-270,Math.max(5,r.left))+"px";p.style.top=Math.max(5,r.top-p.offsetHeight-5)+"px"}
function toggleReaction(mid,e){state.reactions[mid]=state.reactions[mid]||{};state.reactions[mid][e]=state.reactions[mid][e]||[];const a=state.reactions[mid][e],i=a.indexOf(state.userId);if(i>=0)a.splice(i,1);else a.push(state.userId);save();closeModal();refreshConversation()}
function startReply(mid){const m=findMessage(mid);if(!m)return;replyTo=m;editing=null;refreshConversation()}
function cancelReply(){replyTo=null;refreshConversation()}
function startEdit(mid){const m=findMessage(mid);if(m?.author!==state.userId)return;editing=mid;replyTo=null;refreshConversation();setTimeout(()=>{const i=document.querySelector("#roomInput,#dmInput");if(i){i.value=m.content;i.focus()}},20)}
function deleteMessage(mid){const m=findMessage(mid);if(!m||m.author!==state.userId)return;modal("メッセージを削除","<p>このメッセージを削除しますか？</p>",`<button onclick="closeModal()">キャンセル</button><button class="danger" onclick="confirmDelete('${mid}')">削除</button>`)}
function confirmDelete(mid){for(const s of state.spaces)for(const r of s.rooms)r.messages=r.messages.filter(m=>m.id!==mid);for(const d of state.dms)d.messages=d.messages.filter(m=>m.id!==mid);delete state.reactions[mid];state.pinned=state.pinned.filter(x=>x!==mid);save();closeModal();refreshConversation()}
function togglePin(mid){if(state.pinned.includes(mid))state.pinned=state.pinned.filter(x=>x!==mid);else state.pinned.push(mid);save();refreshConversation()}
function refreshConversation(){if(currentDm)openDm(currentDm);else if(currentRoom)openRoom(currentRoom.sid,currentRoom.rid)}
function emojiForComposer(kind){const p=document.createElement("div");p.className="emoji-picker";p.innerHTML=EMOJIS.map(e=>`<button onclick="insertEmoji('${kind}','${e}')">${e}</button>`).join("");document.body.appendChild(p);const b=document.querySelector(".composer button");const r=b.getBoundingClientRect();p.style.left=r.left+"px";p.style.bottom=(innerHeight-r.top+5)+"px"}
function insertEmoji(kind,e){const i=document.getElementById(kind+"Input");if(i){i.value+=e;i.focus()}document.querySelector(".emoji-picker")?.remove()}

function createSpaceUI(){modal("🌐 スペースを作成",'<label>スペース名<input id="spaceName" maxlength="40"></label><label>説明<textarea id="spaceDesc" maxlength="120"></textarea></label>','<button onclick="closeModal()">キャンセル</button><button class="primary" onclick="createSpace()">作成</button>')}
function createSpace(){const n=document.getElementById("spaceName")?.value.trim();if(!n)return;const s={id:uid(),name:n,description:document.getElementById("spaceDesc")?.value.trim()||"",owner:state.userId,inviteCode:Math.random().toString(36).slice(2,8).toUpperCase(),rooms:[{id:uid(),name:"ロビー",messages:[]}]};state.spaces.push(s);save();closeModal();shell();openSpace(s.id)}
function createRoomUI(sid){if(state.spaces.find(s=>s.id===sid)?.owner!==state.userId&&!me().isAdmin)return modal("作成できません","<p>このスペースの管理権限がありません。</p>");modal("＃ ルームを作成",'<label>ルーム名<input id="roomName" maxlength="40"></label><label>種類<select id="roomType"><option>text</option><option>voice</option></select></label>','<button onclick="closeModal()">キャンセル</button><button class="primary" onclick="createRoom()">作成</button>')}
function createRoom(){const s=state.spaces.find(s=>s.id===currentRoom?.sid||s.id===document.querySelector(".room")?.dataset?.sid);const sid=currentRoom?.sid;if(!sid)return;const n=document.getElementById("roomName")?.value.trim();if(!n)return;const sp=state.spaces.find(x=>x.id===sid);const r={id:uid(),name:n,type:document.getElementById("roomType").value,messages:[]};sp.rooms.push(r);save();closeModal();openRoom(sid,r.id)}
function searchUI(sid,rid){modal("🔎 メッセージ検索",'<label>キーワード<input id="searchText"></label>','<button onclick="closeModal()">キャンセル</button><button class="primary" onclick="searchMessages()">検索</button>');window._searchTarget={sid,rid}}
function searchMessages(){const q=document.getElementById("searchText").value.trim().toLowerCase(),{sid,rid}=window._searchTarget,r=state.spaces.find(s=>s.id===sid).rooms.find(x=>x.id===rid),a=r.messages.filter(m=>m.content.toLowerCase().includes(q));closeModal();content(`<div class="card"><button onclick="openRoom('${sid}','${rid}')">← 戻る</button><h2>🔎 検索結果</h2>${a.map(m=>`<div class="searchResult">${messageHTML(m)}</div>`).join("")||"<p>見つかりません。</p>"}</div>`)}

function notifications(){content(`<div class="card"><div class="sectionHead"><h2>🔔 通知</h2><button onclick="readAll()">すべて既読</button></div>${state.notifications.slice().reverse().map(n=>`<div class="notice ${n.read?"read":""}"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${new Date(n.createdAt).toLocaleString()}</small></div>`).join("")||"<p>通知はありません。</p>"}</div>`)}
function readAll(){state.notifications.forEach(n=>n.read=true);save();notifications()}
function notify(title,body){state.notifications.push({id:uid(),title,body,read:false,createdAt:now()})}

function reportsUI(){modal("🚨 通報",'<label>理由<textarea id="reportReason"></textarea></label>','<button onclick="closeModal()">キャンセル</button><button class="danger" onclick="sendReport()">送信</button>')}
function sendReport(){const r=document.getElementById("reportReason").value.trim();if(!r)return;state.reports.push({id:uid(),reporter:state.userId,reason:r,resolved:false,createdAt:now()});notify("通報を受け付けました","管理者が確認します。");save();closeModal()}
function admin(){
 if(!me().isAdmin)return content("<div class='card'><h2>管理者</h2><p>管理者専用です。</p></div>");
 content(`<div class="card"><h2>👑 管理者ダッシュボード</h2><p class="muted">管理者モードではオンライン/入力中情報を表示しません。</p><div class="stats"><div><b>${state.users.length}</b><small>ユーザー</small></div><div><b>${state.spaces.length}</b><small>スペース</small></div><div><b>${state.spaces.reduce((n,s)=>n+s.rooms.length,0)}</b><small>ルーム</small></div><div><b>${totalMessages()}</b><small>メッセージ</small></div><div><b>${state.reports.filter(r=>!r.resolved).length}</b><small>未解決通報</small></div></div></div>
 <div class="card"><h3>👤 アカウント管理</h3><p>唯一の管理者：<b>そら</b></p><button class="primary" onclick="createManagedAccountUI()">＋ 通常アカウントを作成</button><button onclick="view('account')">🔄 アカウント切替</button></div>
 <div class="card"><h3>🌐 全スペース</h3>${state.spaces.map(s=>`<div class="adminSpace"><b>${esc(s.name)}</b> <small>招待コード：${esc(s.inviteCode)}</small>${s.rooms.map(r=>`<button onclick="adminRoom('${s.id}','${r.id}')"># ${esc(r.name)}</button>`).join(" ")}</div>`).join("")}</div>
 <div class="card"><h3>👥 ユーザー管理</h3>${state.users.map(u=>`<div class="row"><span>${avatar(u)} <b>${esc(u.displayName)}</b> <small>@${esc(u.username)}</small></span><span>${u.id==="sora"?"👑":`<button onclick="adminUser('${u.id}')">${u.suspended?"利用停止中":"停止"}</button>`}</span></div>`).join("")}</div>
 <div class="card"><h3>🚨 通報</h3>${state.reports.map(r=>`<div class="row"><span>${esc(r.reason)}<small>・${new Date(r.createdAt).toLocaleString()}</small></span><button onclick="resolveReport('${r.id}')">${r.resolved?"解決済":"解決"}</button></div>`).join("")||"通報はありません。"}</div>
 <div class="card"><h3>🤖 公式アカウント</h3><div class="row">🤖 Luka公式 <button onclick="openDm('official')">開く</button></div><div class="row">📢 Luka Update</div><div class="row">🧠 Luka管理者</div></div>`)
}
function adminUser(id){const u=user(id);u.suspended=!u.suspended;save();admin()}
function resolveReport(id){const r=state.reports.find(x=>x.id===id);if(r)r.resolved=true;save();admin()}
function adminRoom(sid,rid){const s=state.spaces.find(x=>x.id===sid),r=s.rooms.find(x=>x.id===rid);content(`<div class="card"><button onclick="admin()">← 管理者へ戻る</button><h2>${esc(s.name)} / # ${esc(r.name)}</h2><p class="muted">管理者閲覧モード。オンライン/入力中情報は表示しません。</p><div class="messages">${r.messages.map(messageHTML).join("")||"履歴なし"}</div></div>`)}

function call(){content(`<div class="card"><h2>📞 Luka通話</h2><div class="callStage"><div class="camera">📹<span>カメラプレビュー</span></div><div class="participants"><b>参加者</b><p>👤 ${esc(me().displayName)}</p><p>＋ 参加者</p></div></div><div class="callControls"><button>🎙️ マイク</button><button>📹 カメラ</button><button>🔊 音量</button><button>🖥️ 画面共有</button><button>💬 チャット</button><button class="danger">通話を終了</button></div><p class="muted">ローカル版ではUIまで。実通信はサーバー/WebRTC化で接続します。</p></div>`)}
function settings(){content(`<div class="card narrow"><h2>⚙️ 設定</h2><label><input type="checkbox" ${state.settings.notifications?"checked":""} onchange="state.settings.notifications=this.checked;save()"> 通知</label><label>テーマ<select onchange="state.settings.theme=this.value;save()"><option value="light">ライト</option><option value="dark">ダーク（準備中）</option></select></label><hr><button onclick="exportData()">💾 データを書き出す</button><button onclick="importDataUI()">📥 データを読み込む</button><button class="danger" onclick="resetLocal()">ローカルデータを初期化</button></div>`)}
function exportData(){const b=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="luka-backup.json";a.click();URL.revokeObjectURL(a.href)}
function importDataUI(){modal("📥 データを読み込む",'<label>バックアップJSON<textarea id="importJson" rows="10"></textarea></label>','<button onclick="closeModal()">キャンセル</button><button class="primary" onclick="importData()">読み込む</button>')}
function importData(){try{state=JSON.parse(document.getElementById("importJson").value);save();closeModal();shell()}catch{alert("JSONが正しくありません。")}}
function resetLocal(){if(confirm("このブラウザのLukaデータを初期化しますか？")){localStorage.removeItem(KEY);localStorage.removeItem(DEVICE_KEY);location.reload()}}

window.addEventListener("storage",()=>{state=load();shell()});
shell();
