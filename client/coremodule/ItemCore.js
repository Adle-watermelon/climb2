export class ItemCore {
    constructor(id,x,y,type,timestamp = Date.now(),followingplayer = null,speed = 7){
        this.id = id;
        this.x = x;
        this.y = y;
        this.iy = y;
        this.type = type;
        this.timestamp = timestamp;
        this._followingplayer = null;
        this.followingplayer = null;
        this.speed = speed;
        this._destroyflag = false;
        this.destroyflag = false;
        this.lateflag = false;
    }
    convertCore() {
        const result = new ItemCore(0,0,0,"stone")
        const keys = ["id","x","y","iy","type","timestamp","followingplayer"]
        for (const key of keys) {
            if (key in this) result[key] = this[key];
        }
        return result;
    }
    acopy(item){
        const keys = ["id","x","y","iy","type","timestamp","followingplayer"]
        for (const key of keys) {
            this[key] = item[key];
        }
    }
    updatePos(time){
        let c = Math.sign(time - this.timestamp) == -1 ? 0 : time - this.timestamp
        this.y = this.iy + this.speed*(c)/1000;
        if(this.y > 1){this.destroyflag = true;}
    }

}