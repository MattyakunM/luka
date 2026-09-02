/*
  Luka JSON -> DB migration preparation.

  This file intentionally does NOT connect to a real DB yet.
  It validates the existing luka.json shape and produces a migration report.

  Run:
    npm run migrate:dry

  Later, when DATABASE_URL is configured, this can be replaced with the
  real PostgreSQL/Supabase migration implementation without changing the
  old JSON file.
*/
const fs=require("fs");
const path=require("path");

const file=path.join(__dirname,"luka.json");

function load(){
  if(!fs.existsSync(file)){
    console.error("luka.json が見つかりません。既存データを含むプロジェクトで実行してください。");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file,"utf8"));
}

const d=load();
const spaces=Object.values(d.spaces||{});
const rooms=spaces.flatMap(s=>Object.values(s.rooms||{}));

const report={
  users:(d.users||[]).length,
  spaces:spaces.length,
  rooms:rooms.length,
  messages:(d.messages||[]).length,
  friendRequests:(d.friendRequests||[]).length,
  friends:(d.friends||[]).length,
  blocks:(d.blocks||[]).length,
  notifications:(d.notifications||[]).length,
  reports:(d.reports||[]).length,
  reactions:(d.reactions||[]).length,
  pins:(d.pins||[]).length
};

console.log("=== Luka migration dry-run ===");
console.log(JSON.stringify(report,null,2));
console.log("DBへの書き込みはまだ実行していません。");
