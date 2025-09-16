// ==============================
// 1. Chara class
// ==============================
export class CharaCore {
    constructor(id, x, y, direction = "right", status = "idle") {
        this.id = id;
        this.x = x;           // 世界座標
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.direction = direction; // "left" or "right"
        this.status = status;       // "walking", "jumping", "idle"
        this.sprite = null;    // PIXI.Graphicsオブジェクトを保持
        this.OnGround = false;
        this.Jumping = true;
        this.jumpinterval = 0;
        this.basey = this.y;
        this.time = 0;
        this.chargingJump = false;  // ジャンプ力蓄積中かどうか
        this.jumpPower = 0;         // 現在のジャンプ力
        this.airTime = 0;              // 現在の滞空時間
        this.isHoldingJump = false;    // Wキーを押し続けているか
        this.maxAllowedAirTime = 0;    // 許可される最大滞空時間
        this.haveblock = 0;
        this.OnWall = false;
        this.name = null;
        this.wallStickTimer = 0;
    }
    getchunkpos(dx = 0,dy = 0){
        const x = this.x + dx;
        const y = this.y + dy;
        const cx = Math.floor(x/16);
        const cy = Math.floor(y/16)
        const px = x - cx*16;
        const py = y - cy*16;
        const pfx = Math.floor(px);
        const pfy = Math.floor(py);
        const offx = px - pfx;
        const offy = py - pfy;
        return {"x": cx, "y": cy,"pfx": pfx, "pfy": pfy, "offx":offx,"offy":offy}
    }
    convertCore() {
        const result = new CharaCore(0,0,0);
        const keys = ["id","x","y","vx","vy","direction","status","OnGround","Jumping","jumpinterval","basey","time","chargingJump","jumpPower","airTime","isHoldingJump","maxAllowedAirTime", "haveblock","name","OnWall","wallStickTimer"]
        for (const key of keys) {
            if (key in this) result[key] = this[key];
        }
        return result;
    }
    acopy(chara){
        const keys = ["id","x","y","vx","vy","direction","status","OnGround","Jumping","jumpinterval","basey","time","chargingJump","jumpPower","airTime","isHoldingJump","maxAllowedAirTime","haveblock","name","OnWall","wallStickTimer"]
        for (const key of keys) {
            this[key] = chara[key];
        }
    }
}