import * as PIXI from 'https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs';
import { Chara } from './clientmodule/CharaClient.js';
import { updateCamera } from './clientmodule/Camera.js';
import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';
import { WASDInputManager } from './clientmodule/KeyManager.js';
import { Block } from './clientmodule/BlockClient.js';
import { Chunk } from './clientmodule/ChunkClient.js';
import { size, synfps, scale, charawidth, charaheight } from './clientmodule/Constants.js';
import { updatePlayerMovement } from './clientmodule/Physics.js';
import { ChunkManager } from './clientmodule/Chunk_ManagerClient.js';
import { Inventory } from './clientmodule/Inventory.js';
import { Ranking } from './clientmodule/Ranking.js';
import { RankingTape } from './clientmodule/RankingTape.js';
import { Background } from "./clientmodule/Background.js";
import {Item} from './clientmodule/ItemClient.js'
import JoyStickManager from "./clientmodule/JoystickManager.js";
import { Texture } from "./clientmodule/Texture.js"
const socket = io();
Texture.initialization();
////////////////////////////////////////////////////////////////////////////////////////////////////////
let isConnected = false;
let connectionStatus = "disconnected"
function showConnectionStatus(status, message) {
  const statusDiv = document.getElementById('connection-status') || createStatusDiv();
  statusDiv.textContent = message;
  statusDiv.className = `connection-status ${status}`;
}
function unshowConnectionStatus(){
    const statusDiv = document.getElementById('connection-status') || createStatusDiv();
    statusDiv.style.display = "none";
}
function createStatusDiv() {
  const div = document.createElement('div');
  div.id = 'connection-status';
  div.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 10px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 1000;
  `;
  document.body.appendChild(div);
  return div;
}
socket.on('connect', () => {
    console.log('✅ Connected to server');
    isConnected = true;
    connectionStatus = 'connected';
    showConnectionStatus('success', '🟢Online');
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from server:', reason);
    isConnected = false;
    connectionStatus = 'disconnected';
    showConnectionStatus('error', '🔴Disconnected');
    
    // Handle disconnection based on reason
    if (reason === 'io server disconnect') {
        // Server-side disconnection, manually reconnect
        socket.connect();
    }
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    connectionStatus = 'error';
    showConnectionStatus('error', '🔴Connection Error');
});

socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Reconnected (attempt:', attemptNumber, ')');
    showConnectionStatus('success', '🟡Reconnecting...');
});

socket.on('reconnect_error', (error) => {
    console.error('❌ Reconnection error:', error);
    showConnectionStatus('error', '🔴Reconnection Failed');
});

socket.on('reconnect_failed', () => {
    console.error('❌ Failed to reconnect');
    showConnectionStatus('error', '🔴Connection Failed');
    alert('Could not connect to server.\nPlease reload the page.');
});
///////////////////////////////////////////////////////////////////////////////////////////////////////
let scroll = 0;

window.addEventListener("wheel", (event) => {
  scroll += event.deltaY > 0 ? 1 : -1;
});
// Pixiをまだ作らない
let inputManager;
let app
let cameraContainer
let mobs = new Map();
let snapshots = new Map();
let player;
let ranking = [];
let joystick = null;
let items = new Map();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==========================
// ゲーム開始関数
// ==========================
async function startGame(playerName) {
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  if (!isConnected) {
    alert('サーバーに接続されていません。しばらく待ってから再試行してください。');
    return;
  }
  socket.emit('gamestart')
  // タイトル画面を消す
  document.getElementById('title-screen').style.display = 'none';

    // ゲーム画面を表示
  const container = document.getElementById('game-container');
  container.style.display = 'block';
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Pixiアプリ作成
  app = new PIXI.Application();
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    antialias: true,
    forceCanvas: true,
  });
  container.appendChild(app.canvas);
  if(isMobile()){joystick = new JoyStickManager(app, app.view.width - 20 - size*1.8, app.view.height/2*1.5);}

  // ====== ここからは今までの処理をそのまま移植 ======
  cameraContainer = new PIXI.Container();
  app.stage.addChild(cameraContainer);
  await Item.initialization(cameraContainer,Texture.textures);
  await Block.initialization(cameraContainer,Texture.textures);
  await Chara.initialization(cameraContainer,Texture.textures);
  await Inventory.initialization(app.stage,Texture.textures);
      const rankingTape = new RankingTape(app, cameraContainer);
    const rankingUI = new Ranking(app);

    const bg = new Background(app, [
    { start: -16, end: 0, texture: './assets/bg_ground.png'},
    { start: 0, end: 20, texture: './assets/bg_city.png' },
    { start: 20, end: 100, texture: './assets/bg_clouds.png' },
    { start: 100, end: null, texture: './assets/bg_space.png' }
    ]);
  player = new Chara(socket.id, 7, 0);
  player.name = playerName;
  const inventory = new Inventory(playerName);
  inputManager = new WASDInputManager(socket);
    socket.on('rankupdate', (data) => {
        for(const ranking of data.ranking){
            ranking.y = Math.floor(ranking.y * 10)/10
        }
        rankingUI.update(data.ranking,player);
        ranking = data.ranking
    })
    socket.on('inputReceived', (data) => {
        console.log('サーバーからの確認:', data);
    });
    socket.on('correctResult', (data) => {
        player.acopy(data.chara)
        player.name = playerName;
        console.log("corrected");
    });
    socket.on('playerUpdate', async (data) => {
        if(mobs.has(data.chara.id)){
            snapshots.get(data.chara.id).push(data)
        }else{
            let array = [];
            snapshots.set(data.chara.id,array)
            const newmob = await new Chara(0,0,0)
            await newmob.acopy(data.chara)
            mobs.set(data.chara.id, newmob)
        }
    })
    ChunkManager.initialization(socket)
    let chunkmanager = new ChunkManager();
    const delay = (scale/synfps) * 2 * 1000;
        
    // マウスハイライト用の矩形を作成
    const highlightGraphics = new PIXI.Graphics();
    cameraContainer.addChild(highlightGraphics);
    
    // マウス座標を追跡する変数
    let mouseWorldPos = { x: 0, y: 0 };
    let mouseviewPos = {x:0,y:0}
    // マウスイベントリスナーを追加
    app.canvas.addEventListener('mousemove', (event) => {
        const rect = app.view.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        mouseviewPos = {x:mouseX,y:mouseY}
        // カメラの位置を考慮してワールド座標に変換

    });
      function a(x,y,ax,ay){
    return Math.floor(x) == Math.floor(ax) && Math.floor(y) == Math.floor(ay)
  }
        // マウスクリックイベントリスナーを追加
    app.canvas.addEventListener('click', (event) => {
        if(isMobile()){return;}
        const rect = app.view.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // カメラの位置を考慮してワールド座標に変換
        const worldX = mouseX - cameraContainer.x;
        const worldY = mouseY - cameraContainer.y;
        
        // グリッド座標に変換
        const GRID_SIZE = size; // ブロックのサイズ
        const blockX = Math.floor(worldX / GRID_SIZE);
        const blockY = Math.floor(worldY / GRID_SIZE);
        const bx = blockX;
        const by = blockY;
        const x = player.x;
        const y = player.y;
        const flag = (a(x + charawidth/2,y-0.01,bx,by) || a(x - charawidth/2,y-0.01,bx,by) || a(x + charawidth/2,y-charaheight/2,bx,by) || a(x - charawidth/2,y-charaheight/2,bx,by) || a(x + charawidth/2,y-charaheight + 0.01,bx,by) || a(x - charawidth/2,y-charaheight + 0.01,bx,by))
        // setBlockイベントを送信
        console.log(flag)
        if(player.haveblock!=0 && !flag){chunkmanager.setBlock(blockX,blockY,"stone",0.3,Date.now())}
        socket.emit('setBlock', {
            x: blockX,
            y: blockY,
            type: 'stone', // ブロックの種類（必要に応じて変更）
            timestamp: Date.now()
        });
    });

    if(isMobile()){scroll = 1;}
app.stage.interactive = true;
app.stage.on("pointerdown", (e) => {
  if (!isMobile()) return;
    console.log("📱 pointerdown");

    // Pixi座標（stage基準）
    const pos = e.data.global;

    // カメラ位置を補正
    const worldX = pos.x - cameraContainer.x;
    const worldY = pos.y - cameraContainer.y;

    // グリッド変換
    const GRID_SIZE = size;
    const blockX = Math.floor(worldX / GRID_SIZE);
    const blockY = Math.floor(worldY / GRID_SIZE);
    if(joystick.activetouch != e.pointerId){
        if(player.haveblock!=0){chunkmanager.setBlock(blockX,blockY,"stone",0.3,Date.now())}
        socket.emit("setBlock", {
        x: blockX,
        y: blockY,
        type: "stone",
        timestamp: Date.now(),
        });
        console.log(`${blockX},${blockY}`)
    }

  // ブラウザのデフォルト挙動（スクロールなど）を抑制したい場合
  e.stopPropagation();
});

    socket.on('setBlock' , (data) => {
        const block = data.block;
        chunkmanager.setBlock(data.bx,data.by,block._type,block._timer,block.timestamp)
    });
    socket.on('haveblock' ,(data) => {
        player.haveblock = data.haveblock;
    })
    socket.on('itemAdd' , (item) => {
        let newitem = new Item(0,0,0,"stone",Date.now())
        newitem.acopy(item)
        console.log(newitem)
        items.set(item.id,newitem)

    })
    socket.on('itemDestroy', (data) => {
        let id = data.id
        if(items.has(id)){if(!items.get(id).followingplayer){items.get(id).destroy();items.delete(id);}}
    })
    socket.on('itemGotten', (data) => {
        let id = data.id;
        let playerid = data.playerid
        if(items.has(id)){
            items.get(id).followingplayer = playerid;
        }
    })
    setInterval(() => {
        socket.emit('checkPlayerPos',{timestamp:Date.now(),chara:player.convertCore()})
        //ついでにブロック更新
        chunkmanager.update();
    }, 1000/synfps);
    app.ticker.add(() => {
        let now = Date.now()
        for(const [id,item] of items){
            item.drawItem(player);
            let Charas = deepCopyMap(mobs)
            Charas.set(player.id,player)
            item.update(now,Charas);
            if(item.followingplayer){
                if(item.followtime >= Item.time){
                    item.destroy();
                    items.delete(id)
                }
            }
        }
        rankingTape.update(ranking, { x: player.x * size, y: player.y * size });
        if(inventory.items.stone != player.haveblock){
            
            if(inventory.items.stone < player.haveblock){
                inventory.stonegraphics.width = size*3;
                inventory.stonegraphics.height = size*3;
            }else{
                inventory.stonegraphics.width = size*0.5;
                inventory.stonegraphics.height = size*0.5;
            }
            inventory.setStoneCount(player.haveblock)
        }
        if(inventory.stonegraphics.width > size*1.5){
            inventory.stonegraphics.width -= 20;
            inventory.stonegraphics.height -= 20;
        }
        if(inventory.stonegraphics.width < size*1.5){
            inventory.stonegraphics.width += 20;
            inventory.stonegraphics.height+= 20;
        }
        if(Math.abs(inventory.stonegraphics.width - size*1.5) < 20) {
            inventory.stonegraphics.width = size*1.5;
            inventory.stonegraphics.height = size*1.5;  
        }
        if(isMobile()){inputManager.currentState = joystick.keys}
        inputManager.update();
        if(isMobile()){updatePlayerMovement(player, joystick.keys, app.ticker.deltaMS/1000,chunkmanager)}else{updatePlayerMovement(player, inputManager.currentState, app.ticker.deltaMS/1000,chunkmanager)}
        player.drawChara(cameraContainer);
        bg.update(player.x,player.y + scroll);
        updateCamera(app,cameraContainer, player);
        cameraContainer.y -= scroll * size;
        //チャンクリクエスト
        player.y +=scroll
        const cpos = player.getchunkpos();
        player.y -=scroll
        for(var i=0;i<=0;i++){
            for(var j=-3;j<=3;j++){
                chunkmanager.requestChunk(cpos.x + i,cpos.y + j) //ここでリクエスト
            }
        }
        chunkmanager.deleteChunks(cpos.x,cpos.y)
        const rendertime = Date.now() - delay;
        for(const [id,mob] of mobs){
            if(snapshots.get(id)){if(snapshots.get(id)[0]){
                let prevsnap = snapshots.get(mob.id)[0];
                let nextsnap = snapshots.get(mob.id)[snapshots.get(mob.id).length - 1];
                for(const snapshot of snapshots.get(mob.id)){
                    if(snapshot.timestamp < rendertime && snapshot.timestamp >= prevsnap.timestamp){prevsnap = snapshot;}
                    if(snapshot.timestamp >= rendertime && snapshot.timestamp <= nextsnap.timestamp){nextsnap = snapshot;}
                }
                const delta = rendertime - prevsnap.timestamp;
                const snapdelta = nextsnap.timestamp - prevsnap.timestamp;
                let t = 0;if(snapdelta!=0){t=delta/snapdelta}else{t=0;}
                mobs.get(mob.id).acopy(prevsnap.chara)
                mobs.get(mob.id).x = prevsnap.chara.x + (nextsnap.chara.x - prevsnap.chara.x)*t;
                mobs.get(mob.id).y = prevsnap.chara.y + (nextsnap.chara.y - prevsnap.chara.y)*t;
                //console.log((nextsnap.chara.x - prevsnap.chara.x)*1000 / snapdelta)
                if(Math.abs(Date.now() - snapshots.get(mob.id)[snapshots.get(mob.id).length - 1].timestamp) >=1000 ){mobs.get(mob.id).destroy();mobs.delete(mob.id);break;}
            }}
            mobs.get(mob.id).drawChara(cameraContainer);
        }
        if(!isMobile()){updateMouseHighlight()}
    });
        // マウスハイライト機能
    function updateMouseHighlight() {
        mouseWorldPos.x = mouseviewPos.x- cameraContainer.x;
        mouseWorldPos.y = mouseviewPos.y - cameraContainer.y;
        // グリッドサイズを仮定（必要に応じて調整してください）
        const GRID_SIZE = size; // ブロックのサイズ
        
        // マウス位置をグリッドに合わせて計算
        const gridX = Math.floor(mouseWorldPos.x / GRID_SIZE) * GRID_SIZE;
        const gridY = Math.floor(mouseWorldPos.y / GRID_SIZE) * GRID_SIZE;
        // ハイライト矩形を描画
        highlightGraphics.clear();
        highlightGraphics.lineStyle(2, 0xFF0000, 0.8); // 赤色の枠線
        highlightGraphics.beginFill(0xFF0000, 0.2); // 薄い赤色の塗りつぶし
        highlightGraphics.drawRect(gridX, gridY, GRID_SIZE, GRID_SIZE);
        highlightGraphics.endFill();
    }
  
}
function isMobile() {
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}
// ==========================
// タイトル画面のイベント設定
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startButton").addEventListener("click", () => {
    const playerName = document.getElementById("playerName").value || "player";
    startGame(playerName);
  });
});
function deepCopyMap(map) {
  if (!(map instanceof Map)) {
    throw new TypeError("Argument must be a Map");
  }

  const copy = new Map();
  for (const [key, value] of map) {
    copy.set(deepCopyValue(key), deepCopyValue(value));
  }
  return copy;
}
function deepCopyValue(value, seen = new WeakMap()) {
  if (value instanceof Map) {
    if (seen.has(value)) return seen.get(value);
    const copy = new Map();
    seen.set(value, copy);
    for (const [k, v] of value) {
      copy.set(deepCopyValue(k, seen), deepCopyValue(v, seen));
    }
    return copy;
  } else if (value instanceof Set) {
    if (seen.has(value)) return seen.get(value);
    const copy = new Set();
    seen.set(value, copy);
    for (const v of value) {
      copy.add(deepCopyValue(v, seen));
    }
    return copy;
  } else if (Array.isArray(value)) {
    if (seen.has(value)) return seen.get(value);
    const copy = [];
    seen.set(value, copy);
    for (const v of value) {
      copy.push(deepCopyValue(v, seen));
    }
    return copy;
  } else if (value && typeof value === "object") {
    if (seen.has(value)) return seen.get(value);
    const copy = {};
    seen.set(value, copy);
    for (const [k, v] of Object.entries(value)) {
      copy[k] = deepCopyValue(v, seen);
    }
    return copy;
  }
  return value; // プリミティブ型
}
