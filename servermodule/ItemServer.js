import { ItemCore } from '../client/coremodule/ItemCore.js'

export class Item extends ItemCore{
    static io = null;
    static initialize(io){
        Item.io = io
    }
    constructor(id,x,y,type,timestamp = Date.now(),followingplayer = null,speed = 7){
        super(id,x,y,type,timestamp,followingplayer,speed);
        Item.io.emit('itemAdd',this.convertCore())
    }
    set destroyflag(flag){
        if(flag && !this._destroyflag){Item.io.emit('itemDestroy', {id:this.id})}
        this._destroyflag = flag;
    }
    get destroyflag(){
        return this._destroyflag;
    }
    set followingplayer(id){
        if(id){Item.io.emit('itemGotten', {id:this.id,playerid:id})}
        this._followingplayer = id
    }
    get followingplayer(){
        return this._followingplayer;
    }
    check(chara){
        if(!this.followingplayer && Math.hypot(this.x - chara.x,this.y - chara.y) <= 1.35 && !this.destroyflag){
            this.followingplayer = chara.id;
            chara.haveblock++;
            const socket = Item.io.sockets.sockets.get(chara.id);
            if(socket){
              socket.emit('haveblock', {haveblock:chara.haveblock})
            }
        }
    }
}