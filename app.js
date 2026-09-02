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
  <button class="nav" onclick="view('account')">🔄 アカウント</button>
  <button class="nav" onclick="view('friends')">👥 友達・ユーザー</button>
  <button class="nav" onclick="view('dms')">💬 DM</button>
  <button class="nav" onclick="view('notifications')">🔔 通知</button>
  <hr>
  <h4>スペース</h4><div id="spaceList"></div>
  <button class="newspace" onclick="createSpace()">＋ スペースを作成</button>
  <hr>
  <button class="nav" onclick="view('call')">📞 通話</button>
  ${state.user.isAdmin ? "<button class=\"nav admin\" onclick=\"view('admin')\">👑 管理者</button>" : ""}
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
 if(type==="account") account();
}
function home(){
 const canCreate=!state.user.isAdmin&&!localStorage.getItem("luka_v4_personal_account");
 content(`<div class="hero card"><div class="heroIcon">◈</div><div><h1>Luka</h1><p>友達、スペース、DM、AI、通話まで。ひとつにつながるコミュニケーションツール。</p></div></div><div class="grid"><div class="card"><h3>👤 アカウント</h3><p>現在：<b>${esc(state.user.displayName)}</b>${state.user.isAdmin?" 👑 管理者":""}</p><button onclick="view('account')">アカウント設定・切替</button>${canCreate?'<button class="primary" onclick="view(\'account\')">＋ 個人アカウントを作成</button>':""}</div><div class="card"><h3>Luka公式</h3><p>Lukaの使い方や困ったことを相談できます。</p><button onclick="dm('official')">Luka公式を開く</button></div><div class="card"><h3>最近の場所</h3><p>左のメニューからスペースを選ぶとルームを開けます。</p></div></div>`);
}
function profile(){const u=state.user;content(`<div class="card narrow"><h2>👤 プロフィール</h2><div class="avatarBig">${avatar(u)}</div><label>表示名<input id="display" value="${esc(u.displayName)}"></label><label>アイコン（絵文字/URL）<input id="avatar" value="${esc(u.avatar)}"></label><label>ステータス<input id="status" value="${esc(u.status)}"></label><label>自己紹介<textarea id="bio">${esc(u.bio)}</textarea></label><button onclick="saveProfile()">保存</button></div>`)}
function saveProfile(){state.user.displayName=document.getElementById("display").value||state.user.username;state.user.avatar=document.getElementById("avatar").value;state.user.status=document.getElementById("status").value;state.user.bio=document.getElementById("bio").value;const me=state.users.find(x=>x.id==="me");Object.assign(me,state.user);save();shell()}
function friends(){content(`<div class="card"><h2>👥 友達・ユーザー</h2><input id="search" placeholder="ユーザー名・表示名を検索" oninput="searchUsers()"><div id="userResults"></div><h3>友達</h3><div>${state.friends.map(id=>`<div class="row">${avatar(user(id))} ${esc(user(id).displayName)} <button onclick="dm('${id}')">DM</button></div>`).join("")||"まだ友達はいません。"}</div></div>`);searchUsers()}
function searchUsers(){const q=(document.getElementById("search")?.value||"").toLowerCase();const a=state.users.filter(u=>u.id!=="me"&&(u.username.toLowerCase().includes(q)||(u.displayName||"").toLowerCase().includes(q)));const e=document.getElementById("userResults");if(e)e.innerHTML=a.map(u=>`<div class="row"><span>${avatar(u)} <b>${esc(u.displayName)}</b> <small>@${esc(u.username)}</small></span><span><button onclick="dm('${u.id}')">DM</button>${u.type?"":"<button onclick=\"addFriend('"+u.id+"')\">友達申請</button>"}</span></div>`).join("")||"見つかりませんでした。"}
function addFriend(id){if(!state.friends.includes(id))state.friends.push(id);state.notifications.push({id:uid(),title:"友達に追加しました",body:user(id).displayName,read:false,createdAt:now()});save();friends();updateBadge()}
function dms(){content(`<div class="card"><h2>💬 DM</h2>${state.dms.map(d=>`<button class="dmItem" onclick="dm('${d.with}')">${avatar(user(d.with))} ${esc(user(d.with).displayName)} <small>${esc(d.messages.at(-1)?.content||"")}</small></button>`).join("")||"DMはありません"}<hr><button onclick="newDm()">＋ 新しいDM</button></div>`)}
function newDm(){const list=state.users.filter(u=>u.id!=="me");const id=prompt("DMするユーザーの番号:\n"+list.map((u,i)=>`${i+1}. ${u.displayName}`).join("\n"));const u=list[Number(id)-1];if(u)dm(u.id)}
function dm(id){let d=state.dms.find(x=>x.with===id);if(!d){d={id:"dm-"+uid(),with:id,messages:[]};state.dms.push(d);save()}content(`<div class="card dm"><button onclick="view('dms')">← DM一覧</button><h2>${avatar(user(id))} ${esc(user(id).displayName)}</h2><div id="dmMsgs" class="messages">${d.messages.map(messageHTML).join("")}</div><div class="composer"><input id="dmInput" placeholder="メッセージ"><button onclick="sendDM('${id}')">送信</button></div></div>`);document.getElementById("dmInput").onkeydown=e=>{if(e.key==="Enter")sendDM(id)}}
function sendDM(id){
 const i=document.getElementById("dmInput"),v=i.value.trim();if(!v)return;const d=state.dms.find(x=>x.with===id);d.messages.push({id:uid(),author:"me",content:v,createdAt:now()});save();dm(id);
 if(id==="official"){setTimeout(()=>{const dd=state.dms.find(x=>x.with==="official");if(!dd)return;let reply="メッセージありがとう！Luka公式です。使い方や困ったことを案内できるよ。";const q=v.toLowerCase();if(q.includes("アカウント"))reply="アカウントは左メニューの「🔄 アカウント」から作成・切替できます。通常ユーザーはこのブラウザで1つまでです。";else if(q.includes("スペース"))reply="スペースは左メニューの「＋ スペースを作成」から作れます。";else if(q.includes("使い方"))reply="左メニューから機能を選んで試してみてね。困ったらここに質問してOK！";dd.messages.push({id:uid(),author:"official",content:reply,createdAt:now()});save();if(document.getElementById("dmMsgs"))dm("official");},350);}
}
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

function account(){
 const registered=localStorage.getItem("luka_v4_personal_account");
 content(`<div class="card narrow"><h2>👤 アカウント</h2><p>現在：<b>${esc(state.user.displayName)}</b>${state.user.isAdmin?" 👑 管理者":""}</p><hr><h3>個人アカウント</h3><p class="muted">通常ユーザーはこのブラウザで個人アカウントを1つだけ作成できます。</p>${state.user.isAdmin?'<button class="primary" onclick="createManagedAccount()">＋ 通常アカウントを作成（管理者）</button>':(registered?'<div class="notice read"><b>この端末では個人アカウントを作成済みです。</b></div>':'<button class="primary" onclick="createPersonalAccount()">＋ 個人アカウントを作成</button>')}<hr><h3>アカウント切替</h3>${accountListHTML()}</div>`);
}
function accountListHTML(){return `<div class="list">${state.accounts.map(a=>`<div class="row"><span>👤 <b>${esc(a.displayName||a.username)}</b> <small>@${esc(a.username)}${a.id==="sora"?" 👑":""}</small></span><button onclick="switchAccount('${a.id}')">${(state.user.isAdmin&&a.id==="sora")||(state.user.id===a.id)?"使用中":"切替"}</button></div>`).join("")}</div>`}
function ensureAccountStore(){
 if(!Array.isArray(state.accounts))state.accounts=[];
 let s=state.accounts.find(a=>a.id==="sora"||a.username==="sora"||a.username==="そら");
 if(!s){s={id:"sora",username:"そら",displayName:"そら",name:"そら",avatar:"",isAdmin:true};state.accounts.unshift(s)}
 s.id="sora";s.username="そら";s.displayName="そら";s.name="そら";s.isAdmin=true;
 state.accounts.forEach(a=>{if(a.id!=="sora")a.isAdmin=false});save();
}
function createPersonalAccount(){
 if(state.user.isAdmin){alert("管理者は制限の対象外です。");return}
 if(localStorage.getItem("luka_v4_personal_account")){alert("この端末ではすでに個人アカウントを作成しています。");return}
 const name=prompt("個人アカウント名を入力してください");if(name===null)return;const clean=name.trim();if(!clean){alert("アカウント名を入力してください。");return}
 if(state.accounts.some(a=>a.username===clean)){alert("そのアカウント名はすでに使われています。");return}
 const id="acct_"+uid(),a={id,username:clean,displayName:clean,name:clean,avatar:"",isAdmin:false};
 state.accounts.push(a);state.user={id,username:clean,displayName:clean,name:clean,bio:"",status:"オンライン",avatar:"",isAdmin:false};
 state.users=state.users.filter(u=>u.id!=="me");state.users.unshift({...state.user,id:"me"});localStorage.setItem("luka_v4_personal_account",id);save();shell();view("home");
}
function createManagedAccount(){
 if(!state.user.isAdmin){alert("管理者専用です。");return}
 const name=prompt("作成する通常アカウント名を入力してください");if(name===null)return;const clean=name.trim();if(!clean)return;
 if(state.accounts.some(a=>a.username===clean)){alert("そのアカウント名はすでに使われています。");return}
 const id="acct_"+uid(),a={id,username:clean,displayName:clean,name:clean,avatar:"",isAdmin:false};
 state.accounts.push(a);state.users.push({id,username:clean,displayName:clean,name:clean,bio:"",status:"オフライン",avatar:"",isAdmin:false});save();alert("通常アカウント「"+clean+"」を作成しました。");admin();
}
function switchAccount(id){
 ensureAccountStore();const a=state.accounts.find(x=>x.id===id);if(!a)return;
 state.user={id:a.id,username:a.username,displayName:a.displayName||a.username,name:a.name||a.displayName||a.username,bio:a.bio||"",status:a.status||"オンライン",avatar:a.avatar||"",isAdmin:a.id==="sora"};
 state.users=state.users.filter(u=>u.id!=="me");state.users.unshift({...state.user,id:"me"});save();shell();view("home");
}

function createSpace(){const n=prompt("スペース名");if(!n)return;const s={id:uid(),name:n,owner:"me",inviteCode:Math.random().toString(36).slice(2,8).toUpperCase(),rooms:[{id:uid(),name:"ロビー",messages:[]}]};state.spaces.push(s);save();shell();space(s.id)}
function admin(){
 if(!state.user.isAdmin)return content(`<div class="card"><h2>管理者</h2><p>管理者専用です。</p></div>`);
 content(`<div class="adminDash"><div class="card"><h2>👑 管理者ダッシュボード</h2><p class="muted">管理者モードではオンライン/入力中情報を表示しません。</p><div class="stats"><div><b>${state.users.length}</b><small>ユーザー</small></div><div><b>${state.spaces.length}</b><small>スペース</small></div><div><b>${state.spaces.reduce((n,s)=>n+s.rooms.length,0)}</b><small>ルーム</small></div><div><b>${totalMessages()}</b><small>メッセージ</small></div><div><b>${state.reports.filter(r=>!r.resolved).length}</b><small>未解決通報</small></div></div></div><div class="card"><h3>👤 アカウント管理</h3><p class="muted">「そら」が唯一の管理者です。</p><button class="primary" onclick="createManagedAccount()">＋ 通常アカウントを作成</button><button onclick="view('account')">🔄 アカウント切替</button></div><div class="card"><h3>🌐 全スペース</h3>${state.spaces.map(s=>`<div class="adminSpace"><b>${esc(s.name)}</b><small>邀请码：${esc(s.inviteCode||"-")}</small><div>${s.rooms.map(r=>`<button onclick="adminRoom('${s.id}','${r.id}')">${esc(r.name)}</button>`).join("")}</div></div>`).join("")}</div><div class="card"><h3>👥 ユーザー管理</h3>${state.users.map(u=>`<div class="row">${avatar(u)} <span><b>${esc(u.displayName)}</b> <small>@${esc(u.username)}</small></span><span>${u.id==="me"||u.id==="sora"?"👑 自分":`<button onclick="adminUser('${u.id}')">管理</button>`}</span></div>`).join("")}</div><div class="card"><h3>🚨 通報</h3>${state.reports.map(r=>`<div class="row"><span>${esc(r.reason)}</span><button onclick="resolveReport('${r.id}')">${r.resolved?"解決済":"解決"}</button></div>`).join("")||"通報はありません。"}</div><div class="card"><h3>🤖 Luka公式アカウント</h3><div class="row">${avatar(user("official"))}<span>Luka公式<br><small>一般ユーザー向けAIサポート</small></span><button onclick="dm('official')">開く</button></div><div class="row">${avatar(user("update"))}<span>Luka Update<br><small>アップデート専用</small></span></div><div class="row">${avatar(user("adminai"))}<span>Luka管理者<br><small>開発・設計用AI</small></span></div></div></div>`);
}
function totalMessages(){return state.spaces.reduce((n,s)=>n+s.rooms.reduce((x,r)=>x+r.messages.length,0),0)+state.dms.reduce((n,d)=>n+d.messages.length,0)}
function adminRoom(sid,rid){const s=state.spaces.find(x=>x.id===sid),r=s.rooms.find(x=>x.id===rid);content(`<div class="card"><button onclick="admin()">← ダッシュボード</button><h2>${esc(s.name)} / ${esc(r.name)}</h2><p class="muted">管理者閲覧モード。オンライン/入力中情報はありません。</p><div class="messages">${r.messages.map(messageHTML).join("")||"履歴なし"}</div></div>`)}
function adminUser(id){const u=user(id);const action=confirm(`${u.displayName} を利用停止状態にしますか？`);if(action){u.suspended=true;save();admin()}}
function resolveReport(id){const r=state.reports.find(x=>x.id===id);if(r){r.resolved=true;save();admin()}}
function call(){content(`<div class="card call"><h2>📞 Luka通話</h2><div class="callStage"><div class="camera">📹<br><span>カメラプレビュー</span></div><div class="participants"><div>👤 そら</div><div>＋ 参加者</div></div></div><div class="callControls"><button>🎙️ マイク</button><button>📹 カメラ</button><button>🔊 音量</button><button>🖥️ 画面共有</button><button>💬 チャット</button><button class="end">通話を終了</button></div><p class="muted">v4.0では通話UIまで。実際の通信はサーバー/WebRTC接続工程で有効化します。</p></div>`)}
function settings(){content(`<div class="card narrow"><h2>⚙️ 設定</h2><label><input type="checkbox" ${state.settings.notifications?"checked":""} onchange="state.settings.notifications=this.checked;save()"> 通知を有効にする</label><label>テーマ<select onchange="state.settings.theme=this.value;save();document.body.dataset.theme=this.value"><option>light</option><option>dark</option></select></label><hr><button onclick="if(confirm('ローカルデータを初期化しますか？')){localStorage.removeItem(KEY);location.reload()}">ローカルデータを初期化</button></div>`)}
function report(){const reason=prompt("通報理由");if(reason){state.reports.push({id:uid(),reason,resolved:false,createdAt:now()});state.notifications.push({id:uid(),title:"通報を受け付けました",body:"管理者が確認します。",read:false,createdAt:now()});save();updateBadge();alert("通報を送信しました")}}
function content(html){document.getElementById("content").innerHTML=html}
ensureAccountStore();
shell();


/* =========================================================
   Luka V4 Discord-style UI Upgrade
   Local UI stage: reactions / replies / edit-delete / pins /
   search / modal creation / DM picker / room picker / composer
   ========================================================= */
(function(){
  state.reactions = state.reactions || {};
  state.replyingTo = null;
  state.editingMessage = null;

  const esc2 = window.esc || (s => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c])));

  function findMessage(mid){
    for(const s of (state.spaces||[])){
      for(const r of (s.rooms||[])){
        const m=(r.messages||[]).find(x=>x.id===mid);
        if(m) return m;
      }
    }
    for(const d of (state.dms||[])){
      const m=(d.messages||[]).find(x=>x.id===mid);
      if(m) return m;
    }
    return null;
  }

  function save2(){ try{ save(); }catch(e){ localStorage.setItem(KEY,JSON.stringify(state)); } }

  function ensureModalStyle(){
    if(document.getElementById("lukaUpgradeStyle")) return;
    const st=document.createElement("style");
    st.id="lukaUpgradeStyle";
    st.textContent=`
      .luka-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;z-index:9999;padding:18px}
      .luka-modal{width:min(560px,100%);max-height:90vh;overflow:auto;background:var(--panel,#fff);border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.28)}
      .luka-modal h2{margin-top:0}.luka-modal label{display:block;margin:12px 0}.luka-modal input,.luka-modal textarea,.luka-modal select{width:100%;box-sizing:border-box;padding:11px;border-radius:10px;border:1px solid #bbb;margin-top:6px}
      .luka-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
      .luka-picker{position:fixed;z-index:10000;background:var(--panel,#fff);border:1px solid #ccc;border-radius:14px;padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.2);display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
      .luka-picker button{font-size:21px;padding:7px;border:0;background:transparent;border-radius:8px;cursor:pointer}.luka-picker button:hover{background:rgba(127,127,127,.15)}
      .luka-reactions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.luka-reaction{border:1px solid #bbb!important;border-radius:10px!important;padding:3px 8px!important;background:transparent!important}.luka-reaction.active{font-weight:700}
      .luka-message{position:relative}.luka-reply-ref{font-size:12px;opacity:.75;border-left:3px solid currentColor;padding-left:8px;margin-bottom:5px}
      .luka-message-actions{display:flex;gap:4px;opacity:.55;margin-top:5px}.message:hover .luka-message-actions{opacity:1}
      .luka-composer-extra{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px}.luka-composer-extra button{font-size:13px}
      .luka-replybar{display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:9px;background:rgba(127,127,127,.12);margin-bottom:7px}
      .luka-section-title{display:flex;justify-content:space-between;align-items:center;gap:8px}
      .luka-mini{font-size:12px;opacity:.7}
      .luka-empty{padding:25px;text-align:center;opacity:.7}
    `;
    document.head.appendChild(st);
  }

  function closeModal(){document.querySelector(".luka-modal-backdrop")?.remove()}
  function modal(title,body,actions=""){
    ensureModalStyle(); closeModal();
    const d=document.createElement("div");
    d.className="luka-modal-backdrop";
    d.innerHTML=`<div class="luka-modal"><h2>${title}</h2>${body}<div class="luka-modal-actions">${actions||'<button onclick="lukaCloseModal()">閉じる</button>'}</div></div>`;
    d.addEventListener("click",e=>{if(e.target===d)closeModal()});
    document.body.appendChild(d);
    return d;
  }
  window.lukaCloseModal=closeModal;

  const emojis=["👍","❤️","😂","😮","😢","😡","🎉","🔥","👏","🙏","💯","🤔","👀","🤣","🥳","😭","💀","✨","⭐","🚀","☕","🎮","🎵","📌","✅","❌","❤️‍🔥","🫶"];

  window.lukaReactionPicker=function(mid,btn){
    ensureModalStyle();
    document.querySelector(".luka-picker")?.remove();
    const p=document.createElement("div"); p.className="luka-picker";
    p.innerHTML=emojis.map(e=>`<button onclick="lukaAddReaction('${mid}','${e}')">${e}</button>`).join("");
    document.body.appendChild(p);
    const r=btn.getBoundingClientRect();
    p.style.left=Math.max(8,Math.min(window.innerWidth-240,r.left))+"px";
    p.style.top=Math.max(8,r.top-p.offsetHeight-6)+"px";
    setTimeout(()=>document.addEventListener("click",function h(e){
      if(!p.contains(e.target)&&e.target!==btn){p.remove();document.removeEventListener("click",h)}
    }),0);
  };

  window.lukaAddReaction=function(mid,emoji){
    state.reactions[mid]=state.reactions[mid]||{};
    state.reactions[mid][emoji]=state.reactions[mid][emoji]||[];
    const a=state.reactions[mid][emoji], me=state.user.id||"me";
    const i=a.indexOf(me);
    if(i>=0)a.splice(i,1); else a.push(me);
    save2();
    document.querySelector(".luka-picker")?.remove();
    rerenderCurrent();
  };

  function reactionHTML(mid){
    const r=state.reactions[mid]||{};
    return `<div class="luka-reactions">${Object.entries(r).filter(([,a])=>a.length).map(([e,a])=>{
      const active=a.includes(state.user.id||"me");
      return `<button class="luka-reaction ${active?"active":""}" onclick="lukaAddReaction('${mid}','${e}')">${e} ${a.length}</button>`;
    }).join("")}</div>`;
  }

  window.lukaReply=function(mid){
    const m=findMessage(mid); if(!m)return;
    state.replyingTo={id:mid,author:m.author,content:m.content};
    state.editingMessage=null;
    rerenderCurrent();
    setTimeout(()=>document.querySelector("#roomInput,#dmInput")?.focus(),20);
  };

  window.lukaCancelReply=function(){state.replyingTo=null;rerenderCurrent()};

  window.lukaEdit=function(mid){
    const m=findMessage(mid); if(!m || m.author!=="me")return;
    state.editingMessage=mid; state.replyingTo=null;
    rerenderCurrent();
    setTimeout(()=>{const i=document.querySelector("#roomInput,#dmInput");if(i){i.value=m.content;i.focus();}},20);
  };

  window.lukaDelete=function(mid){
    const m=findMessage(mid); if(!m || m.author!=="me")return;
    modal("メッセージを削除","<p>このメッセージを削除しますか？</p>",
      `<button onclick="lukaCloseModal()">キャンセル</button><button class="primary" onclick="lukaConfirmDelete('${mid}')">削除</button>`);
  };
  window.lukaConfirmDelete=function(mid){
    const m=findMessage(mid);if(!m)return;
    for(const s of state.spaces||[])for(const r of s.rooms||[])r.messages=(r.messages||[]).filter(x=>x.id!==mid);
    for(const d of state.dms||[])d.messages=(d.messages||[]).filter(x=>x.id!==mid);
    delete state.reactions[mid]; if(state.replyingTo?.id===mid)state.replyingTo=null;
    save2();closeModal();rerenderCurrent();
  };

  window.lukaPin=function(mid){
    state.pinned=state.pinned||[];
    if(state.pinned.includes(mid))state.pinned=state.pinned.filter(x=>x!==mid);
    else state.pinned.push(mid);
    save2();rerenderCurrent();
  };

  function messageHTML2(m){
    const u=user(m.author)||{displayName:m.author};
    const replyRef=m.replyTo?findMessage(m.replyTo):null;
    const mine=m.author==="me";
    return `<div class="message luka-message" data-mid="${m.id}">
      ${replyRef?`<div class="luka-reply-ref">↩ ${esc2(user(replyRef.author)?.displayName||replyRef.author)}：${esc2(replyRef.content).slice(0,100)}</div>`:""}
      <div><b>${esc2(u.displayName||m.author)}</b> <small>${new Date(m.createdAt).toLocaleString()}</small>${m.edited?" <span class=\"luka-mini\">(編集済み)</span>":""}</div>
      <div>${esc2(m.content)}</div>
      ${reactionHTML(m.id)}
      <div class="luka-message-actions">
        <button title="リアクション" onclick="lukaReactionPicker('${m.id}',this)">😀</button>
        <button title="返信" onclick="lukaReply('${m.id}')">↩️</button>
        <button title="ピン留め" onclick="lukaPin('${m.id}')">${(state.pinned||[]).includes(m.id)?"📌":"📍"}</button>
        ${mine?`<button title="編集" onclick="lukaEdit('${m.id}')">✏️</button><button title="削除" onclick="lukaDelete('${m.id}')">🗑️</button>`:""}
      </div>
    </div>`;
  }
  window.messageHTML=messageHTML2;

  function composerHTML(kind,id){
    const target=state.replyingTo;
    return `${target?`<div class="luka-replybar"><span>↩️ <b>${esc2(user(target.author)?.displayName||target.author)}</b> に返信：${esc2(target.content).slice(0,80)}</span><button onclick="lukaCancelReply()">✕</button></div>`:""}
      <div class="luka-composer-extra">
        <button onclick="lukaEmojiForComposer('${kind}','${id}')">😀 絵文字</button>
        <button onclick="lukaAttach('${kind}')">📎 添付</button>
        <button onclick="lukaShowPinned('${kind}','${id}')">📌 ピン</button>
      </div>
      <div class="composer"><input id="${kind}Input" placeholder="${state.editingMessage?'メッセージを編集…':'メッセージを入力…'}"><button onclick="lukaSend('${kind}','${id}')">${state.editingMessage?"保存":"送信"}</button></div>`;
  }

  window.lukaSend=function(kind,id){
    const input=document.getElementById(kind+"Input");if(!input)return;
    const v=input.value.trim();if(!v)return;
    if(state.editingMessage){
      const m=findMessage(state.editingMessage);
      if(m&&m.author==="me"){m.content=v;m.edited=true;}
      state.editingMessage=null;state.replyingTo=null;save2();rerenderCurrent();return;
    }
    const m={id:uid(),author:"me",content:v,createdAt:now()};
    if(state.replyingTo)m.replyTo=state.replyingTo.id;
    if(kind==="room"){
      const r=state.spaces.find(s=>s.id===id[0])?.rooms.find(x=>x.id===id[1]);
      if(r){r.messages.push(m);save2();room(id[0],id[1]);}
    }else{
      const d=state.dms.find(x=>x.with===id);if(d){d.messages.push(m);save2();dm(id);}
    }
    state.replyingTo=null;
  };

  window.lukaEmojiForComposer=function(kind,id){
    const btn=document.querySelector(".luka-composer-extra button");
    const p=document.createElement("div");p.className="luka-picker";
    p.innerHTML=emojis.map(e=>`<button onclick="lukaInsertEmoji('${kind}','${e}')">${e}</button>`).join("");
    document.body.appendChild(p);
    const r=(btn||document.body).getBoundingClientRect();p.style.left=Math.max(8,r.left)+"px";p.style.top=Math.max(8,r.top-p.offsetHeight-5)+"px";
  };
  window.lukaInsertEmoji=function(kind,e){
    const i=document.getElementById(kind+"Input");if(i){i.value+=e;i.focus()}
    document.querySelector(".luka-picker")?.remove();
  };
  window.lukaAttach=function(){alert("添付UIはサーバー化で実ファイル送信に接続します。V4ではUIのみです。")};

  window.lukaShowPinned=function(kind,id){
    const ids=state.pinned||[];
    const msgs=ids.map(findMessage).filter(Boolean);
    modal("📌 ピン留めメッセージ",msgs.length?msgs.map(m=>`<div class="card" style="margin:7px 0"><b>${esc2(user(m.author)?.displayName||m.author)}</b><p>${esc2(m.content)}</p></div>`).join(""):'<div class="luka-empty">ピン留めはありません。</div>');
  };

  window.lukaCreateSpaceUI=function(){
    modal("🌐 スペースを作成",`
      <label>スペース名<input id="lukaSpaceName" maxlength="40" placeholder="例：ゲーム仲間"></label>
      <label>説明（任意）<textarea id="lukaSpaceDesc" maxlength="120" placeholder="このスペースについて"></textarea></label>`,
      `<button onclick="lukaCloseModal()">キャンセル</button><button class="primary" onclick="lukaCreateSpaceConfirm()">作成</button>`);
  };
  window.lukaCreateSpaceConfirm=function(){
    const n=document.getElementById("lukaSpaceName")?.value.trim();if(!n)return;
    const s={id:uid(),name:n,description:document.getElementById("lukaSpaceDesc")?.value.trim()||"",owner:"me",inviteCode:Math.random().toString(36).slice(2,8).toUpperCase(),rooms:[{id:uid(),name:"ロビー",messages:[]}]};
    state.spaces.push(s);save2();closeModal();shell();space(s.id);
  };

  window.lukaCreateRoomUI=function(sid){
    modal("＃ ルームを作成",`
      <label>ルーム名<input id="lukaRoomName" maxlength="40" placeholder="例：雑談"></label>
      <label>種類<select id="lukaRoomType"><option value="text">💬 テキスト</option><option value="voice">🔊 ボイス（UI）</option></select></label>`,
      `<button onclick="lukaCloseModal()">キャンセル</button><button class="primary" onclick="lukaCreateRoomConfirm('${sid}')">作成</button>`);
  };
  window.lukaCreateRoomConfirm=function(sid){
    const s=state.spaces.find(x=>x.id===sid),n=document.getElementById("lukaRoomName")?.value.trim();if(!s||!n)return;
    s.rooms.push({id:uid(),name:n,type:document.getElementById("lukaRoomType")?.value||"text",messages:[]});
    save2();closeModal();room(sid,s.rooms.at(-1).id);
  };

  window.lukaNewDmUI=function(){
    const list=state.users.filter(u=>u.id!=="me"&&!u.suspended);
    modal("💬 新しいDM",`<label>相手を選択<select id="lukaDmUser">${list.map(u=>`<option value="${u.id}">${esc2(u.displayName)} (@${esc2(u.username)})</option>`).join("")}</select></label>`,
      `<button onclick="lukaCloseModal()">キャンセル</button><button class="primary" onclick="lukaNewDmConfirm()">開く</button>`);
  };
  window.lukaNewDmConfirm=function(){
    const id=document.getElementById("lukaDmUser")?.value;if(id){closeModal();dm(id)}
  };

  window.lukaSearchUI=function(sid,rid){
    const r=state.spaces.find(s=>s.id===sid)?.rooms.find(x=>x.id===rid);if(!r)return;
    modal("🔎 メッセージ検索",`<label>検索<input id="lukaSearchText" placeholder="キーワード"></label>`,
      `<button onclick="lukaCloseModal()">キャンセル</button><button class="primary" onclick="lukaSearchConfirm('${sid}','${rid}')">検索</button>`);
  };
  window.lukaSearchConfirm=function(sid,rid){
    const q=document.getElementById("lukaSearchText")?.value.trim().toLowerCase();if(!q)return;
    const r=state.spaces.find(s=>s.id===sid)?.rooms.find(x=>x.id===rid);
    const a=(r?.messages||[]).filter(m=>m.content.toLowerCase().includes(q));
    closeModal();content(`<div class="card"><button onclick="room('${sid}','${rid}')">← ルームへ戻る</button><h2>🔎 検索結果</h2>${a.length?a.map(messageHTML2).join(""):'<div class="luka-empty">見つかりませんでした。</div>'}</div>`);
  };

  function rerenderCurrent(){
    const roomEl=document.querySelector("#roomInput"),dmEl=document.querySelector("#dmInput");
    // Re-render only the active conversation by reading its buttons/headers.
    if(roomEl){
      const msg=document.querySelector(".roomTabs .active");
      const activeSpace=(state.spaces||[]).find(s=>s.rooms.some(r=>r.name===msg?.textContent));
      if(activeSpace&&msg){
        const rr=activeSpace.rooms.find(r=>r.name===msg.textContent);
        if(rr) return room(activeSpace.id,rr.id);
      }
    }
    if(dmEl){
      const h=document.querySelector(".dm h2"); 
      const d=(state.dms||[]).find(x=>user(x.with)?.displayName===h?.textContent.replace(/^.*?\s/,""));
      if(d) return dm(d.with);
    }
    // Safe fallback: keep current app visible.
    const current=document.querySelector("#content");
    if(current && !current.innerHTML) home();
  }

  // Override core views to use the new message/composer UI.
  window.room=function(sid,rid){
    const s=state.spaces.find(x=>x.id===sid),r=s?.rooms.find(x=>x.id===rid);if(!s||!r)return;
    ensureModalStyle();
    content(`<div class="card room">
      <div class="roomHead"><div><button onclick="space('${sid}')">←</button> <b>${esc2(s.name)}</b> / ${esc2(r.name)}</div>
        <div><button onclick="lukaSearchUI('${sid}','${rid}')">🔎</button><button onclick="lukaCreateRoomUI('${sid}')">＋</button></div>
      </div>
      <div class="roomTabs">${s.rooms.map(x=>`<button class="${x.id===rid?"active":""}" onclick="room('${sid}','${x.id}')">${esc2(x.name)}</button>`).join("")}</div>
      <div id="roomMsgs" class="messages">${r.messages.map(messageHTML2).join("")||'<div class="empty">まだメッセージはありません。最初のメッセージを送ってみよう！</div>'}</div>
      ${composerHTML("room",[sid,rid])}
    </div>`);
    const i=document.getElementById("roomInput");if(i)i.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();lukaSend("room",[sid,rid])}};
  };

  window.dm=function(id){
    let d=state.dms.find(x=>x.with===id);if(!d){d={id:"dm-"+uid(),with:id,messages:[]};state.dms.push(d);save2()}
    content(`<div class="card dm"><div class="roomHead"><button onclick="view('dms')">← DM一覧</button><h2>${avatar(user(id))} ${esc2(user(id).displayName)}</h2></div>
      <div id="dmMsgs" class="messages">${d.messages.map(messageHTML2).join("")||'<div class="empty">ここから会話を始めよう！</div>'}</div>
      ${composerHTML("dm",id)}
    </div>`);
    const i=document.getElementById("dmInput");if(i)i.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();lukaSend("dm",id)}};
  };

  window.dms=function(){
    content(`<div class="card"><div class="luka-section-title"><h2>💬 DM</h2><button class="primary" onclick="lukaNewDmUI()">＋ 新しいDM</button></div>
      ${state.dms.length?state.dms.map(d=>`<button class="dmItem" onclick="dm('${d.with}')">${avatar(user(d.with))} ${esc2(user(d.with).displayName)} <small>${esc2(d.messages.at(-1)?.content||"新しい会話")}</small></button>`).join(""):'<div class="luka-empty">DMはまだありません。</div>'}</div>`);
  };

  window.createSpace=function(){lukaCreateSpaceUI()};
  window.newDm=function(){lukaNewDmUI()};
  window.reply=function(mid){lukaReply(mid)};
  window.react=function(mid){lukaReactionPicker(mid,document.activeElement||document.body)};
  window.pin=function(mid){lukaPin(mid)};
  window.roomSearch=function(sid,rid){lukaSearchUI(sid,rid)};

  // Account creation also gets a real modal instead of prompt.
  window.createPersonalAccount=function(){
    if(state.user.isAdmin){alert("管理者は制限の対象外です。");return}
    if(localStorage.getItem("luka_v4_personal_account")){alert("この端末ではすでに個人アカウントを作成しています。");return}
    modal("👤 個人アカウントを作成",`
      <p class="muted">このブラウザでは通常アカウントを1つだけ作成できます。</p>
      <label>アカウント名<input id="lukaNewAccountName" maxlength="32" placeholder="例：そらの友達"></label>`,
      `<button onclick="lukaCloseModal()">キャンセル</button><button class="primary" onclick="lukaCreatePersonalConfirm()">作成する</button>`);
  };
  window.lukaCreatePersonalConfirm=function(){
    const name=document.getElementById("lukaNewAccountName")?.value.trim();if(!name)return;
    if(state.accounts.some(a=>a.username===name)){alert("そのアカウント名はすでに使われています。");return}
    const id="acct_"+uid(),a={id,username:name,displayName:name,name,avatar:"",isAdmin:false};
    state.accounts.push(a);state.user={...state.user,id,username:name,displayName:name,name,isAdmin:false,status:"オンライン"};
    state.users=state.users.filter(u=>u.id!=="me");state.users.unshift({...state.user,id:"me"});
    localStorage.setItem("luka_v4_personal_account",id);save2();closeModal();shell();view("home");
  };

  // Make the sidebar space creation button use the dedicated UI.
  document.addEventListener("click",()=>{}, {once:true});
  ensureModalStyle();
})();
