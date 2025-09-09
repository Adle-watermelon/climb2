import { ItemCore } from '../coremodule/ItemCore.js'
import * as PIXI from 'https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs'
import {size, charaheight, charawidth, fontSize} from './Constants.js'
export class Item extends ItemCore{
    static time = 0.1;
    static cameraContainer = null;
    static textures = null;
    static async initialization(cameraContainer,textures){
        Item.cameraContainer = cameraContainer;
        Item.textures = await textures;
    }
    constructor(id,x,y,type,timestamp = Date.now(),followingplayer = null,speed = 7){
        super(id,x,y,type,timestamp,followingplayer,speed);
        this.sprite = null; // 最初はスプライト未生成
        this.iix = null;
        this.iiy = null;
        this.followtime = null;
        this.lastupdate = Date.now();
    }
    drawItem(player) {
        if (!Item.cameraContainer) {
            console.warn("cameraContainer is not initialized");
            return;
        }
        if(Math.abs(this.y - player.y) <= 20)
        // 初回: spriteを作って追加
        if (!this.sprite) {
            const texture = Item.textures.get(this.type);
            if (!texture) {
                console.warn(`Texture not found for type: ${this.type}`);
                return;
            }
            this.sprite = new PIXI.Sprite(texture);
            this.sprite.width = size* 0.5;
            this.sprite.height = size*0.5;
            this.sprite.anchor.set(0.5,0.5);
            Item.cameraContainer.addChild(this.sprite);
        }

        // 毎回: 座標を更新
        if(this.sprite){
        this.sprite.x = this.x * size;
        this.sprite.y = this.y * size;
        }
    }
    set followingplayer(flag){
        this.iix = this.x;
        this.iiy = this.y;
        this.followtime = 0;
        this._followingplayer = flag;
    }
    get followingplayer(){
        return this._followingplayer
    }
    update(time,charas){
        if(this.followingplayer){
            const targetplayer = charas.get(this.followingplayer)
            if(targetplayer){
            const targetX = targetplayer.x;
            const targetY = targetplayer.y;
            const i = this.followtime / Item.time;
            this.x = (targetX - this.iix) * i + this.iix;
            this.y = (targetY - this.iiy) * i + this.iiy;
            if(this.sprite){
            this.sprite.width = size * (0.5 - i*0.25)
            this.sprite.height = size * (0.5 - i*0.25)
            this.sprite.anchor.set(0.5,0.5);
            }
            this.followtime += (time - this.lastupdate) / 1000
            if(this.followtime > Item.time){this.followtime = Item.time;}
            }else{this.followtime = Item.time}
        } else {
            this.updatePos(time);
        }
        this.lastupdate = time;
    }
    destroy() {
        if (this.sprite) {
        Item.cameraContainer.removeChild(this.sprite);
        this.sprite.destroy();
        this.sprite = null;
        }
    }
}