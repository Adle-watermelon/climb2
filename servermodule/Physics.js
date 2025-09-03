import { charaheight, charawidth} from './Constants.js'
const G = 0.5;
const maxvy = 9.0;
const initialJumpVelocity = 11.0;  // 初期ジャンプ速度（即時）
const maxAirTime = 1.2;            // 最大滞空時間（秒）
const minAirTime = 0.1;            // 最小滞空時間（秒）
export function updatePlayerMovement(player, keystate, delta, chunkmanager) {
    const moveSpeed = 6;
    const acceleration = 300;       // 加速度
    const deceleration = 50;
    const airdeceleration = 30;       // 減速度
    const friction = 30;           // 逆方向入力時の摩擦（滑り）
    
    // 横速度の初期化
    if (player.vx === undefined) player.vx = 0;
    if(!keystate['KeyA'] && !keystate['KeyD'] && player.OnGround){player.status = 'idle'}
    // ジャンプ処理
    if (keystate['KeyW']) {
        if (player.OnGround && player.jumpinterval == 0.0) {
            // 即座にジャンプ開始
            player.vy = -initialJumpVelocity;
            player.status = 'walking';
            player.OnGround = false;
            player.jumpinterval = 1.15;
            player.basey = player.y;
            player.jumping = true;
            player.airTime = 0;
            player.isHoldingJump = true;
            player.maxAllowedAirTime = maxAirTime;
        } else if (player.jumping && !player.OnGround) {
            // 空中でWキー押し続け中
            player.isHoldingJump = true;
        }
    } else {
        // Wキーを離した時
        if (player.jumping && player.isHoldingJump) {
            // 離した時点での滞空時間を最大値として設定
            player.maxAllowedAirTime = Math.max(player.airTime + minAirTime, minAirTime);
            player.isHoldingJump = false;
        }
        player.jumpinterval = 0.0;
    }
    
    // 横移動（滑り処理付き）
    let targetVelocityX = 0;
    let inputDirection = null;
    
    if (keystate['KeyA']) {
        targetVelocityX = -moveSpeed;
        inputDirection = 'left';
    }
    if (keystate['KeyD']) {
        targetVelocityX = moveSpeed;
        inputDirection = 'right';
    }
    
    if (inputDirection) {
        // 入力がある場合
        if (Math.sign(player.vx) !== Math.sign(targetVelocityX) && Math.abs(player.vx) > 0.5) {
            // 逆方向への入力：摩擦で減速（滑り処理）
            if(player.OnGround){
                if (player.vx > 0) {
                    player.vx = Math.max(0, player.vx - friction * delta);
                } else {
                    player.vx = Math.min(0, player.vx + friction * delta);
                }
            } else {
                if (player.vx > 0) {
                    player.vx = Math.max(0, player.vx - airdeceleration * delta);
                } else {
                    player.vx = Math.min(0, player.vx + airdeceleration * delta);
                } 
            }
        } else {
            if(player.OnGround){
                // 同じ方向または停止状態：加速
                if (player.vx < targetVelocityX) {
                    player.vx = Math.min(targetVelocityX, player.vx + acceleration * delta);
                } else if (player.vx > targetVelocityX) {
                    player.vx = Math.max(targetVelocityX, player.vx - acceleration * delta);
                }
            } else {
                if (player.vx < targetVelocityX) {
                    player.vx = Math.min(targetVelocityX, player.vx + airdeceleration * delta);
                } else if (player.vx > targetVelocityX) {
                    player.vx = Math.max(targetVelocityX, player.vx - airdeceleration * delta);
                }
            }
        }
        
        // 方向とステータス更新
        player.direction = inputDirection;
        if (player.OnGround) {
            player.status = 'walking';
            player.jumpinterval = 0.0;
        }
    } else {
        // 入力がない場合：減速
        if (Math.abs(player.vx) > 0.1) {
            if(player.OnGround){
                if (player.vx > 0) {
                    player.vx = Math.max(0, player.vx - deceleration * delta);
                } else {
                    player.vx = Math.min(0, player.vx + deceleration * delta);
                }
            }else{
                if (player.vx > 0) {
                    player.vx = Math.max(0, player.vx - airdeceleration * delta);
                } else {
                    player.vx = Math.min(0, player.vx + airdeceleration * delta);
                }
            }
        } else {
            player.vx = 0;
        }
    }
    
    // X座標更新
    player.x += player.vx * delta;

    // 縦移動の物理処理
    if (player.OnGround) {
        player.vy = 0.0;
    } else {
        if (player.jumping) {
            player.airTime += delta;
            
            // 滞空時間による重力制御
            if (player.isHoldingJump && player.airTime < player.maxAllowedAirTime) {
                // Wキー押し続け中：重力を軽減（ふわふわ感）
                player.vy += G * 0.6;
            } else {
                // キーを離した or 最大滞空時間達成：通常重力
                player.vy += G;
                if (player.vy > maxvy) {
                    player.vy = maxvy;
                }
            }
        } else {
            // 通常の落下
            player.vy += G;
            if (player.vy > maxvy) {
                player.vy = maxvy;
            }
        }
        
        // Y座標更新
    }
    
    // 当たり判定
        if(chunkmanager.getBlock(player.x + charawidth/2,player.y - charaheight/2) !='air' || chunkmanager.getBlock(player.x + charawidth/2,player.y - charaheight) !='air' || chunkmanager.getBlock(player.x + charawidth/2,player.y - 0.01) !='air'){
            player.x = Math.floor(player.x) + (1 - charawidth/2)
            player.vx = 0.0;
        }
        if(chunkmanager.getBlock(player.x - charawidth/2,player.y - charaheight/2) !='air' || chunkmanager.getBlock(player.x - charawidth/2,player.y - charaheight) !='air' || chunkmanager.getBlock(player.x - charawidth/2,player.y - 0.01) !='air'){
            player.x = Math.floor(player.x) + charawidth/2
            player.vx = 0.0
        }
        player.y += player.vy * delta;
        if(chunkmanager.getBlock(player.x - charawidth/2 + 0.01,player.y - charaheight) !='air' || chunkmanager.getBlock(player.x + charawidth/2 - 0.01,player.y - charaheight) !='air'){
            player.y = Math.floor(player.y) - 1 + charaheight
            player.vy = 0.0;
            player.jumpinterval = 0.0;
        }
        if (chunkmanager.getBlock(player.x - charawidth/2 + 0.01,player.y) !='air' || chunkmanager.getBlock(player.x + charawidth/2 - 0.01,player.y) !='air' ) {
            player.OnGround = true;
            player.vy = 0.0;
            player.y = Math.floor(player.y);
            player.jumping = false;
            player.airTime = 0;
            player.isHoldingJump = false;
            player.maxAllowedAirTime = 0;
        } else {
            player.OnGround = false;
        }

    // ジャンプインターバル更新
    player.jumpinterval -= delta;
    if (player.jumpinterval < 0) {
        player.jumpinterval = 0.0;
    }
}

// プレイヤーオブジェクトに追加が必要なプロパティ
// player.vx = 0;                   // 横方向の速度
// player.airTime = 0;              // 現在の滞空時間
// player.isHoldingJump = false;    // Wキーを押し続けているか
// player.maxAllowedAirTime = 0;    // 許可される最大滞空時間