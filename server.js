// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chara } from './servermodule/CharaServer.js'
import { synfps, scale, charaheight, charawidth } from './servermodule/Constants.js'
import { ChunkManager } from './servermodule/Chunk_ManagerServer.js';
import { updatePlayerMovement } from './servermodule/Physics.js';
import { Item } from './servermodule/ItemServer.js'
import { Chunk } from './servermodule/ChunkServer.js';
const app = express();
const fps = 60;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 10000;
app.use(express.static(path.join(__dirname, 'client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});
let items = new Map();
Item.initialize(io);
Chunk.initialization(items);
let charas = new Map();
let ranking = [];
let chunkManager = new ChunkManager();
// synfpsでモブ同期
setInterval(() => {
  for(const [id,chara] of charas){
    const socket = io.sockets.sockets.get(id);
    for(const [sid,schara] of charas){
      if( socket && Math.hypot(schara.x - chara.x,schara.y - chara.y) <= 40 && id != sid){
        socket.emit('playerUpdate', {
        chara:schara.convertCore(),
        timestamp: Date.now()
      })
      }
    }
    if(socket){
      socket.emit('rankupdate',{ranking:ranking.slice(0,3)})
    }
  }
  for ( const [id,chara] of charas) {
    chara.px = chara.x;
  }
  //ついでにブロックの更新
  chunkManager.update()
  //ついでにアイテム同期
}, scale*1000/synfps);
//ブロック数アップデート
setInterval(() => {
  for(const [id,chara] of charas){
    if(chara.haveblock == 0){chara.haveblock += 3;}
    const socket = io.sockets.sockets.get(id);
    if(socket){
      socket.emit('haveblock', {haveblock:chara.haveblock})
    }
  }
},2000);
///////////////////////////////////////////////////////
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on("syncTime", (clientSendTime, ack) => {
    const serverTime = Date.now();
    ack(serverTime);
  });
  socket.on('gamestart', () => {
  let chara = new Chara(socket.id, 7, 0)
  charas.set(socket.id,chara)
      // WASD入力を受信
  socket.on('playerInput', (data) => {
    console.log(`${socket.id} - ${data.type}: ${data.key}`);
    
    // プレイヤーの入力状態を更新
    const KeyState = charas.get(socket.id).keystate;
    if (KeyState) {
      if (data.type === 'keyDown') {
        KeyState[data.key] = true;
      } else if (data.type === 'keyUp') {
        KeyState[data.key] = false;
      }
      charas.get(socket.id).keystatesnapshots.push(JSON.parse(JSON.stringify({timestamp:data.timestamp,keystate:KeyState})));
    }
  });
  // サーバー状態をクライアントへ同期
  socket.on('chunkRequest', (data) => {
    const chunk = chunkManager.getChunk(data.cx,data.cy)
    socket.emit('chunkResponse',{chunk:chunk,cx:data.cx,cy:data.cy})
  });
  socket.on('checkPlayerPos', (data) => {
    const chara = charas.get(socket.id)
    if(chara.time){
      const checkMS = data.timestamp - chara.time;
      const simcout = Math.floor(( checkMS / 1000 ) * fps);
      const delta = (checkMS/1000) / simcout;
      let thenkeystate = {timestamp:0,keystate:{KeyW: false,KeyA: false,KeyS: false,KeyD: false}};
      let thenkeystateindex = -1;
      const kss = chara.keystatesnapshots;
      for(var i = 0;i < kss.length;i++){
        const time = kss[i].timestamp;
        if(thenkeystate.timestamp < time && time <= (chara.time)){thenkeystate = chara.keystatesnapshots[i];thenkeystateindex = i;}
      }
      //console.log(chara.keystatesnapshots)
      let miny = 0;
        for(var i = 0;i < simcout;i++){
          const thentime = chara.time + 1000*delta*(i);
          const nextsnapshot = kss[thenkeystateindex + 1] || null; 
          if(nextsnapshot){if(nextsnapshot.timestamp <= thentime){thenkeystateindex++;thenkeystate = kss[thenkeystateindex];}}
          updatePlayerMovement(chara,thenkeystate.keystate,delta,chunkManager)
          if(Math.floor(chara.y) - chara.y == 0){
            const bx = Math.floor(chara.x)
            const by = Math.floor(chara.y + 0.1)
            const block = chunkManager.allgetBlock(bx,by)
            if(block.type == "stone" && block.timer >= 1000){
              chunkManager.setBlock(bx,by,"stone",3.0)
              const newblock = chunkManager.allgetBlock(bx,by)
              io.emit('setBlock', {bx:bx,by:by,block:newblock});
            }
          }
          if(miny > chara.y){miny = chara.y}
          for(const [id,item] of items){item.updatePos(thentime);item.check(chara);}
        }
        //ランキングチェック
        ranking = insertCharaIntoRanking(ranking,chara)
        
      if(Math.abs(data.chara.x - chara.x) <= 0.75 && Math.abs(data.chara.y - chara.y) <= 0.75){
        let haveblock = chara.haveblock
        chara.acopy(data.chara)
        chara.haveblock = haveblock
        chara.id = socket.id
        chara.time = data.timestamp
      }else{
        socket.emit('correctResult', {chara:chara.convertCore()})
        chara.time = data.timestamp;
      }
    } else{
      let haveblock = chara.haveblock
      chara.acopy(data.chara)
      chara.haveblock = haveblock
      chara.id = socket.id
      chara.time = data.timestamp
    }
  })
  function a(x,y,ax,ay){
    return Math.floor(x) == Math.floor(ax) && Math.floor(y) == Math.floor(ay)
  }
  socket.on('setBlock', (data) => {
    let cansetBlock = true;
    const bx = data.x;
    const by = data.y
    const player = charas.get(socket.id)
    for(const [id, chara] of charas){
      const x = chara.x;
      const y = chara.y;
      if(a(x + charawidth/2,y-0.01,bx,by) || a(x - charawidth/2,y-0.01,bx,by) || a(x + charawidth/2,y-charaheight/2,bx,by) || a(x - charawidth/2,y-charaheight/2,bx,by) || a(x + charawidth/2,y-charaheight + 0.01,bx,by) || a(x - charawidth/2,y-charaheight + 0.01,bx,by)){
        cansetBlock = false;
      }
    }
    if(cansetBlock){
      if(player.haveblock > 0 && chunkManager.getBlock(bx,by) == "air"){
        chunkManager.setBlock(bx,by,"stone",100000)
        const block = chunkManager.allgetBlock(bx,by)
        io.emit('setBlock', {bx:bx,by:by,block:block});
        player.haveblock -= 1;
        socket.emit('haveblock', {haveblock:player.haveblock})
      }else{
        const block = chunkManager.allgetBlock(bx,by)
        io.emit('setBlock', {bx:bx,by:by,block:block});
      }
    }

  });
  socket.on('disconnect', () => {
    console.log('プレイヤー切断:', socket.id);
    charas.delete(socket.id)
  });
})
});
// ====================
// サーバー起動
// ====================
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
function insertCharaIntoRanking(ranking, chara) {
  // ① まず整列を保ったまま挿入
  let inserted = false;
  for (let i = 0; i < ranking.length; i++) {
    if (chara.y < ranking[i].y) {
      ranking.splice(i, 0, {y:chara.y,id:chara.id,name:chara.name});
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    ranking.push({y:chara.y,id:chara.id,name:chara.name}); // 一番後ろに追加
  }

  // ② 同じidを持つものを処理：yが最小のものだけ残す
  let seen = new Map();
  for (let i = 0; i < ranking.length; i++) {
    const item = ranking[i];
    if (!seen.has(item.id) || item.y < seen.get(item.id).y) {
      seen.set(item.id, item); // より小さいyを残す
    }
  }

  // seen の内容で ranking を再構築し、yで整列
  ranking.splice(0, ranking.length, ...Array.from(seen.values()).sort((a, b) => a.y - b.y));

  return ranking;
}