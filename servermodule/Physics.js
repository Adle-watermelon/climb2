import {size, charaheight, charawidth} from './Constants.js'
const G = 0.5;
const maxvy = 9.0;
const initialJumpVelocity = 11.0;  // 初期ジャンプ速度（即時）
const maxAirTime = 1.2;            // 最大滞空時間（秒）
const minAirTime = 0.1;            // 最小滞空時間（秒）

export function updatePlayerMovement(player, keystate, delta, chunkmanager) {
    const moveSpeed = 6;
    const acceleration = 300;       // 加速度
    const deceleration = 50;
    const airdeceleration = 30;     // 減速度
    const friction = 30;            // 逆方向入力時の摩擦（滑り）

    // 初期化
    if (player.vx === undefined) player.vx = 0;
    if (player.OnWall === undefined) player.OnWall = false;
    if(!keystate['KeyA'] && !keystate['KeyD'] && player.OnGround){player.status = 'idle'}

    // ジャンプ処理
    if (keystate['KeyW']) {
        if ((player.OnGround || player.OnWall) && player.jumpinterval == 0.0) {
            // 即座にジャンプ開始
            player.vy = -initialJumpVelocity;
            player.status = 'walking';
            player.OnGround = false;
            player.OnWall = false;   // 壁ジャンプ直後は解除
            player.jumpinterval = 1.15;
            player.basey = player.y;
            player.jumping = true;
            player.airTime = 0;
            player.isHoldingJump = true;
            player.maxAllowedAirTime = maxAirTime;

            // ウォールジャンプ時に横へ飛ばす処理
            // ★ウォールジャンプ時に横へ飛ばす処理
if (!player.OnGround ) {
    // 右の壁に張り付いていた → 左へ飛ばす
    if (chunkmanager.getBlock(player.x + charawidth/2, player.y - charaheight/1.5) != 'air' ) {
        player.vx = -moveSpeed * 1.6;
        player.direction = 'left';
    }
    // 左の壁に張り付いていた → 右へ飛ばす
    else if (chunkmanager.getBlock(player.x - charawidth/2 - 0.1, player.y - charaheight/1.5) != 'air') {
        player.vx = moveSpeed * 1.6;
        player.direction = 'right';
    }
}

        } else if (player.jumping && !player.OnGround) {
            // 空中でWキー押し続け中
            player.isHoldingJump = true;
        }
    } else {
        // Wキーを離した時
        if (player.jumping && player.isHoldingJump) {
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
        if (Math.sign(player.vx) !== Math.sign(targetVelocityX) && Math.abs(player.vx) > 0.5) {
            if(player.OnGround){
                if (player.vx > 0) player.vx = Math.max(0, player.vx - friction * delta);
                else player.vx = Math.min(0, player.vx + friction * delta);
            } else {
                if (player.vx > 0) player.vx = Math.max(0, player.vx - airdeceleration * delta);
                else player.vx = Math.min(0, player.vx + airdeceleration * delta);
            }
        } else {
            if(player.OnGround){
                if (player.vx < targetVelocityX) player.vx = Math.min(targetVelocityX, player.vx + acceleration * delta);
                else if (player.vx > targetVelocityX) player.vx = Math.max(targetVelocityX, player.vx - acceleration * delta);
            } else {
                if (player.vx < targetVelocityX) player.vx = Math.min(targetVelocityX, player.vx + airdeceleration * delta);
                else if (player.vx > targetVelocityX) player.vx = Math.max(targetVelocityX, player.vx - airdeceleration * delta);
            }
        }
        player.direction = inputDirection;
        if (player.OnGround) {
            player.status = 'walking';
            player.jumpinterval = 0.0;
        }
    } else {
        if (Math.abs(player.vx) > 0.1) {
            if(player.OnGround){
                if (player.vx > 0) player.vx = Math.max(0, player.vx - deceleration * delta);
                else player.vx = Math.min(0, player.vx + deceleration * delta);
            } else {
                if (player.vx > 0) player.vx = Math.max(0, player.vx - airdeceleration * delta);
                else player.vx = Math.min(0, player.vx + airdeceleration * delta);
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
            if (player.isHoldingJump && player.airTime < player.maxAllowedAirTime) {
                player.vy += G * 0.6;
            } else {
                player.vy += G;
                if (player.vy > maxvy) player.vy = maxvy;
            }
        } else {
            player.vy += G;
            if (player.vy > maxvy) player.vy = maxvy;
        }
    }

    // 当たり判定（壁）
    player.OnWall = false;
    if(chunkmanager.getBlock(player.x + charawidth/2,player.y - charaheight/2) !='air' ||
       chunkmanager.getBlock(player.x + charawidth/2,player.y - charaheight) !='air'){
        player.x = Math.floor(player.x) + (1 - charawidth/2);
        player.vx = 0.0;
        if(chunkmanager.getBlock(player.x + charawidth/2, player.y - charaheight/1.5) != 'air'  && player.vy > 0){
            player.OnWall = true;
        }
    }
    if(chunkmanager.getBlock(player.x - charawidth/2,player.y - charaheight/2) !='air' ||
       chunkmanager.getBlock(player.x - charawidth/2,player.y - charaheight) !='air'){
        player.x = Math.floor(player.x) + charawidth/2;
        player.vx = 0.0;
        if(chunkmanager.getBlock(player.x - charawidth/2 - 0.1, player.y - charaheight/1.5) != 'air'  && player.vy > 0){
            player.OnWall = true;
        }
    }

    // 壁に張り付いているときは落下しない
// 壁張り付き＆ずり落ち処理
const wallStickDelay = 0.3;   // 壁に完全停止できる時間（秒）
const wallSlideSpeed = 1.5;   // 壁ずり落ちの最大速度

if (player.OnWall && !player.OnGround) {
    if (player.wallStickTimer === undefined) player.wallStickTimer = wallStickDelay;

    if (player.wallStickTimer > 0) {
        // 粘着中：完全に止まる
        player.vy = 0.0;
        player.wallStickTimer -= delta;
    } else {
        // ずり落ちモード：ゆっくり落下
        if (player.vy > wallSlideSpeed) {
            player.vy = wallSlideSpeed;
        }
    }
} else {
    // 壁から離れたらリセット
    player.wallStickTimer = wallStickDelay;
}


    // Y座標更新
    player.y += player.vy * delta;

    // 下方向の当たり判定
    if(chunkmanager.getBlock(player.x - charawidth/2 + 0.01,player.y - charaheight) !='air' ||
       chunkmanager.getBlock(player.x + charawidth/2 - 0.01,player.y - charaheight) !='air'){
        player.y = Math.floor(player.y) - 1 + charaheight;
        player.vy = 0.0;
        player.jumpinterval = 0.0;
    }

    // 地面にいるか判定
    if (chunkmanager.getBlock(player.x - charawidth/2 + 0.01,player.y) !='air' ||
        chunkmanager.getBlock(player.x + charawidth/2 - 0.01,player.y) !='air' ) {
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
