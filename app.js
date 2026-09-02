const KEY="luka_v4_state";
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const now=()=>new Date().toISOString();
const seed={
 user:{id:"me",username:"sora",displayName:"そら",bio:"",status:"オンライン",avatar:"",isAdmin:true},
 users:[
  {id:"me",username:"sora",displayName:"そら",bio:"",status:"オンライン",avatar:"",isAdmin:true},
  {id:"official",username:"luka_official",displayName:"Luka公式",bio:"Lukaの使い方や困ったことを案内します。",status:"サポート中",avatar:"🤖",type:"ai"},
  {id:"update",username:"luka_update",displayName:"Luka Update",bio:"アップデート・重要なお知らせ専用アカウント。",status:"更新情報",avatar:"📢",type:"update"},
  {id:"adminai",username:"luka_admin",displayName:"Luka管理者",bio:"Lukaの開発・設計を支援する管理者AI。",status:"開発モード",avatar:"🧠",type:"admin_ai"},
  {id:"sample",username:"sample_user",displayName:"サンプルユーザー",bio:"Lukaのテストユーザーです。",status:"よろしく！",avatar:"🙂"}
 ],
 friends:[],
 requests:[],
 blocks:[],
 notifications:[
  {id:"n1",title:"Lukaへようこそ！",body:"左のメニューからいろいろ試してみてください。",read:false,createdAt:now()}
 ],
 spaces:[
  {id:"general",name:"Luka Official",owner:"system",inviteCode:"LUKA",rooms:[
   {id:"lobby",name:"ロビー",messages:[
    {id:"m1",author:"official",content:"Lukaへようこそ！分からないことがあればいつでも聞いてください。",createdAt:now()}
   ]}
  ]},
  {id:"test",name:"テストスペース",owner:"me",inviteCode:"TEST",rooms:[
   {id:"general",name:"一般",messages:[]},
   {id:"ideas",name:"アイデア",messages:[]}
  ]}
 ],
 dms:[
  {id:"dm-official",with:"official",messages:[
   {id:"dm1",author:"official",content:"こんにちは！Luka公式です。使い方を案内できます。",createdAt:now()}
  ]}
 ],
 calls:[],
 reports:[],
 pinned:[],
 settings:{theme:"light",notifications:true}
};

let state=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(seed)}catch{return structuredClone(seed)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function user(id){return state.users.find(x=>x.id===id)||{displayName:id,username:id}}
function avatar(u){return u.avatar||"👤"}

function shell(){
 document.getElementById("app").innerHTML=`
 <header><div class="brand">◈ <b>Luka</b><small>Local Complete</small></div>
 <div class="top-actions"><button onclick="view('notifications')">🔔 <span id="badge"></span></button><button onclick="view('profile')">${avatar(state.user)} ${esc(state.user.displayName)}</button></div></header>
 <main><aside>
  <button class="nav" onclick="view('home')">🏠 ホーム</button>
  <button class="nav" onclick="view('profile')">👤 プロフィール</button>
  <button class="nav" onclick="view('friends')">👥 友達・ユーザー</button>
  <button class="nav" onclick="view('dms')">💬 DM</button>
  <button class="nav" onclick="view('notifications')">🔔 通知</button>
  <hr>
  <h4>スペース</h4><div id="spaceList"></div>
  <button class="newspace" onclick="createSpace()">＋ スペースを作成</button>
  <hr>
  <button class="nav" onclick="view('call')">📞 通話</button>
  ${state.user.isAdmin?'<button class="nav admin" onclick="view(\\'admin\\')">👑 管理者</button>':''}
  <button class="nav" onclick="view('settings')">⚙️ 設定</button>
 </aside><section id="content"></section></main>`;
 renderSpaces(); updateBadge(); view("home");
}
function renderSpaces(){const e=document.getElementById("spaceList");if(!e)return;e.innerHTML=state.spaces.map(s=>`<button class="spaceBtn" onclick="space('${s.id}')">${esc(s.name)}</button>`).join("")}
function updateBadge(){const n=state.notifications.filter(x=>!x.read).length;const b=document.getElementById("badge");if(b)b.textContent=n?`(${n})`:""}

function view(type){
 if(type==="home") home();
 if(type==="profile") profile();
 if(type==="friends") friends();
 if(type==="dms") dms();
 if(type==="notifications") notifications();
 if(type==="admin") admin();
 if(type==="call") call();
 if(type==="settings") settings();
}
function home(){content(`<div class="hero card"><div class="heroIcon">◈</div><div><h1>Luka</h1><p>友達、スペース、DM、AI、通話まで。ひとつにつながるコミュニケーションツール。</p></div></div><div class="grid"><div class="card"><h3>最近の場所</h3><p>スペースを選ぶとルームを開けます。</p></div><div class="card"><h3>Luka公式</h3><p>使い方や困ったことを相談できます。</p><button onclick="dm('official')">Luka公式を開く</button></div></div>`)}
function profile(){const u=state.user;content(`<div class="card narrow"><h2>👤 プロフィール</h2><div class="avatarBig">${avatar(u)}</div><label>表示名<input id="display" value="${esc(u.displayName)}"></label><label>アイコン（絵文字/URL）<input id="avatar" value="${esc(u.avatar)}"></label><label>ステータス<input id="status" value="${esc(u.status)}"></label><label>自己紹介<textarea id="bio">${esc(u.bio)}</textarea></label><button onclick="saveProfile()">保存</button></div>`)}
function saveProfile(){state.user.displayName=document.getElementById("display").value||state.user.username;state.user.avatar=document.getElementById("avatar").value;state.user.status=document.getElementById("status").value;state.user.bio=document.getElementById("bio").value;const me=state.users.find(x=>x.id==="me");Object.assign(me,state.user);save();shell()}
function friends(){content(`<div class="card"><h2>👥 友達・ユーザー</h2><input id="search" placeholder="ユーザー名・表示名を検索" oninput="searchUsers()"><div id="userResults"></div><h3>友達</h3><div>${state.friends.map(id=>`<div class="row">${avatar(user(id))} ${esc(user(id).displayName)} <button onclick="dm('${id}')">DM</button></div>`).join("")||"まだ友達はいません。"}</div></div>`);searchUsers()}
function searchUsers(){const q=(document.getElementById("search")?.value||"").toLowerCase();const a=state.users.filter(u=>u.id!=="me"&&(u.username.toLowerCase().includes(q)||(u.displayName||"").toLowerCase().includes(q)));const e=document.getElementById("userResults");if(e)e.innerHTML=a.map(u=>`<div class="row"><span>${avatar(u)} <b>${esc(u.displayName)}</b> <small>@${esc(u.username)}</small></span><span><button onclick="dm('${u.id}')">DM</button>${u.type?"":"<button onclick=\"addFriend('"+u.id+"')\">友達申請</button>"}</span></div>`).join("")||"見つかりませんでした。"}
function addFriend(id){if(!state.friends.includes(id))state.friends.push(id);state.notifications.push({id:uid(),title:"友達に追加しました",body:user(id).displayName,read:false,createdAt:now()});save();friends();updateBadge()}
function dms(){content(`<div class="card"><h2>💬 DM</h2>${state.dms.map(d=>`<button class="dmItem" onclick="dm('${d.with}')">${avatar(user(d.with))} ${esc(user(d.with).displayName)} <small>${esc(d.messages.at(-1)?.content||"")}</small></button>`).join("")||"DMはありません"}<hr><button onclick="newDm()">＋ 新しいDM</button></div>`)}
function newDm(){const list=state.users.filter(u=>u.id!=="me");const id=prompt("DMするユーザーの番号:\n"+list.map((u,i)=>`${i+1}. ${u.displayName}`).join("\n"));const u=list[Number(id)-1];if(u)dm(u.id)}
function dm(id){let d=state.dms.find(x=>x.with===id);if(!d){d={id:"dm-"+uid(),with:id,messages:[]};state.dms.push(d);save()}content(`<div class="card dm"><button onclick="view('dms')">← DM一覧</button><h2>${avatar(user(id))} ${esc(user(id).displayName)}</h2><div id="dmMsgs" class="messages">${d.messages.map(messageHTML).join("")}</div><div class="composer"><input id="dmInput" placeholder="メッセージ"><button onclick="sendDM('${id}')">送信</button></div></div>`);document.getElementById("dmInput").onkeydown=e=>{if(e.key==="Enter")sendDM(id)}}
function sendDM(id){const i=document.getElementById("dmInput"),v=i.value.trim();if(!v)return;const d=state.dms.find(x=>x.with===id);d.messages.push({id:uid(),author:"me",content:v,createdAt:now()});save();dm(id)}
function messageHTML(m){return `<div class="message"><div><b>${esc(user(m.author).displayName||m.author)}</b><small>${new Date(m.createdAt).toLocaleString()}</small></div><div>${esc(m.content)}</div><div class="messageTools"><button onclick="react('${m.id}')">👍</button><button onclick="pin('${m.id}')">📌</button><button onclick="reply('${m.id}')">↩️</button></div></div>`}
function notifications(){state.notifications.forEach(n=>{});content(`<div class="card"><h2>🔔 通知</h2>${state.notifications.slice().reverse().map(n=>`<div class="notice ${n.read?"read":""}"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${new Date(n.createdAt).toLocaleString()}</small></div>`).join("")||"通知はありません"}<button onclick="readAll()">すべて既読</button></div>`)}
function readAll(){state.notifications.forEach(n=>n.read=true);save();notifications();updateBadge()}

function space(id){const s=state.spaces.find(x=>x.id===id);if(!s)return;const r=s.rooms[0];room(id,r.id)}
function room(sid,rid){const s=state.spaces.find(x=>x.id===sid),r=s.rooms.find(x=>x.id===rid);content(`<div class="card room"><div class="roomHead"><div><button onclick="space('${sid}')">←</button><b>${esc(s.name)}</b> / ${esc(r.name)}</div><button onclick="roomSearch('${sid}','${rid}')">🔎</button></div><div class="roomTabs">${s.rooms.map(x=>`<button class="${x.id===rid?"active":""}" onclick="room('${sid}','${x.id}')">${esc(x.name)}</button>`).join("")}</div><div id="roomMsgs" class="messages">${r.messages.map(messageHTML).join("")||'<div class="empty">まだメッセージはありません。</div>'}</div><div class="composer"><input id="roomInput" placeholder="メッセージ"><button onclick="sendRoom('${sid}','${rid}')">送信</button></div></div>`);document.getElementById("roomInput").onkeydown=e=>{if(e.key==="Enter")sendRoom(sid,rid)}}
function sendRoom(sid,rid){const i=document.getElementById("roomInput"),v=i.value.trim();if(!v)return;const r=state.spaces.find(s=>s.id===sid).rooms.find(x=>x.id===rid);r.messages.push({id:uid(),author:"me",content:v,createdAt:now()});save();room(sid,rid)}
function react(mid){state.notifications.push({id:uid(),title:"リアクション",body:"👍 を付けました",read:false,createdAt:now()});save();updateBadge();alert("👍 リアクションを追加しました（ローカル版）")}
function pin(mid){if(!state.pinned.includes(mid))state.pinned.push(mid);save();alert("📌 ピン留めしました")}
function reply(mid){const v=prompt("返信内容");if(v){state.notifications.push({id:uid(),title:"返信",body:v,read:false,createdAt:now()});save();updateBadge()}}
function roomSearch(sid,rid){const q=prompt("検索する文字");if(!q)return;const r=state.spaces.find(s=>s.id===sid).rooms.find(x=>x.id===rid);const a=r.messages.filter(m=>m.content.toLowerCase().includes(q.toLowerCase()));content(`<div class="card"><button onclick="room('${sid}','${rid}')">← ルームへ戻る</button><h2>🔎 検索結果</h2>${a.map(messageHTML).join("")||"見つかりませんでした。"}</div>`)}

function createSpace(){const n=prompt("スペース名");if(!n)return;const s={id:uid(),name:n,owner:"me",inviteCode:Math.random().toString(36).slice(2,8).toUpperCase(),rooms:[{id:uid(),name:"ロビー",messages:[]}]};state.spaces.push(s);save();shell();space(s.id)}
function admin(){if(!state.user.isAdmin)return content(`<div class="card"><h2>管理者</h2><p>管理者専用です。</p></div>`);content(`<div class="adminDash"><div class="card"><h2>👑 管理者ダッシュボード</h2><p class="muted">管理者モードではオンライン/入力中情報を表示しません。</p><div class="stats"><div><b>${state.users.length}</b><small>ユーザー</small></div><div><b>${state.spaces.length}</b><small>スペース</small></div><div><b>${state.spaces.reduce((n,s)=>n+s.rooms.length,0)}</b><small>ルーム</small></div><div><b>${totalMessages()}</b><small>メッセージ</small></div><div><b>${state.reports.filter(r=>!r.resolved).length}</b><small>未解決通報</small></div></div></div><div class="card"><h3>🌐 全スペース</h3>${state.spaces.map(s=>`<div class="adminSpace"><b>${esc(s.name)}</b><small>邀请码：${esc(s.inviteCode||"-")}</small><div>${s.rooms.map(r=>`<button onclick="adminRoom('${s.id}','${r.id}')">${esc(r.name)}</button>`).join("")}</div></div>`).join("")}</div><div class="card"><h3>👥 ユーザー管理</h3>${state.users.map(u=>`<div class="row">${avatar(u)} <span><b>${esc(u.displayName)}</b> <small>@${esc(u.username)}</small></span><span>${u.id==="me"?"👑 自分":`<button onclick="adminUser('${u.id}')">管理</button>`}</span></div>`).join("")}</div><div class="card"><h3>🚨 通報</h3>${state.reports.map(r=>`<div class="row"><span>${esc(r.reason)}</span><button onclick="resolveReport('${r.id}')">${r.resolved?"解決済":"解決"}</button></div>`).join("")||"通報はありません。"}</div><div class="card"><h3>🤖 Luka公式アカウント</h3><div class="row">${avatar(user("official"))} <span>Luka公式<br><small>一般ユーザー向けAIサポート</small></span><button onclick="dm('official')">開く</button></div><div class="row">${avatar(user("update"))} <span>Luka Update<br><small>アップデート専用</small></span></div><div class="row">${avatar(user("adminai"))} <span>Luka管理者<br><small>開発・設計用AI</small></span></div></div></div>`)}
function totalMessages(){return state.spaces.reduce((n,s)=>n+s.rooms.reduce((x,r)=>x+r.messages.length,0),0)+state.dms.reduce((n,d)=>n+d.messages.length,0)}
function adminRoom(sid,rid){const s=state.spaces.find(x=>x.id===sid),r=s.rooms.find(x=>x.id===rid);content(`<div class="card"><button onclick="admin()">← ダッシュボード</button><h2>${esc(s.name)} / ${esc(r.name)}</h2><p class="muted">管理者閲覧モード。オンライン/入力中情報はありません。</p><div class="messages">${r.messages.map(messageHTML).join("")||"履歴なし"}</div></div>`)}
function adminUser(id){const u=user(id);const action=confirm(`${u.displayName} を利用停止状態にしますか？`);if(action){u.suspended=true;save();admin()}}
function resolveReport(id){const r=state.reports.find(x=>x.id===id);if(r){r.resolved=true;save();admin()}}
function call(){content(`<div class="card call"><h2>📞 Luka通話</h2><div class="callStage"><div class="camera">📹<br><span>カメラプレビュー</span></div><div class="participants"><div>👤 そら</div><div>＋ 参加者</div></div></div><div class="callControls"><button>🎙️ マイク</button><button>📹 カメラ</button><button>🔊 音量</button><button>🖥️ 画面共有</button><button>💬 チャット</button><button class="end">通話を終了</button></div><p class="muted">v4.0では通話UIまで。実際の通信はサーバー/WebRTC接続工程で有効化します。</p></div>`)}
function settings(){content(`<div class="card narrow"><h2>⚙️ 設定</h2><label><input type="checkbox" ${state.settings.notifications?"checked":""} onchange="state.settings.notifications=this.checked;save()"> 通知を有効にする</label><label>テーマ<select onchange="state.settings.theme=this.value;save();document.body.dataset.theme=this.value"><option>light</option><option>dark</option></select></label><hr><button onclick="if(confirm('ローカルデータを初期化しますか？')){localStorage.removeItem(KEY);location.reload()}">ローカルデータを初期化</button></div>`)}
function report(){const reason=prompt("通報理由");if(reason){state.reports.push({id:uid(),reason,resolved:false,createdAt:now()});state.notifications.push({id:uid(),title:"通報を受け付けました",body:"管理者が確認します。",read:false,createdAt:now()});save();updateBadge();alert("通報を送信しました")}}
function content(html){document.getElementById("content").innerHTML=html}
shell();
