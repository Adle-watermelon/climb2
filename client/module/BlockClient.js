import * as PIXI from 'https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs'
import {size, charaheight, charawidth, synfps} from './Constants.js'
export class Block {
  static textures = new Map();
  static cameraContainer = null;
  static async initialization(cameraContainer){
    Block.cameraContainer = cameraContainer;
    Block.textures.set('stone', await PIXI.Assets.load('./assets/stone.png'));
  }
  constructor(type = "air",timer = 0) {
    this.sprite = null;
    this._type = type;
    this._timer = timer;
    this.hp = timer;
    this.timestamp = Date.now();
    // 初期タイプを設定
    this.type = type;
  }
  set timer(timer){
    this.hp = timer;
    this.timestamp = Date.now();
    this._timer = timer
  }
  get timer(){
    return this._timer
  }
  get type() {
    return this._type;
  }
  
  set type(newType) {
    // 既存のspriteを削除
    if (this.sprite) {
      Block.cameraContainer.removeChild(this.sprite);
      this.sprite.destroy();
      this.sprite = null;
    }
    
    this._type = newType;
    
    // 新しいspriteを作成
    if (newType === 'stone' && Block.textures.has('stone')) {
      this.sprite = new PIXI.Sprite(Block.textures.get('stone'));
      this.sprite.width = size;
      this.sprite.height = size;
      Block.cameraContainer.addChild(this.sprite);
    }
  }
  
  setPosition(x, y) {
    if (this.sprite) {
      this.sprite.x = x * size;
      this.sprite.y = y * size;
    }
  }
  
  update() {
    const now = Date.now();
    if (this.type === "stone" ) {
      this.hp = (this.timer - (now - this.timestamp)/1000);
      if(this.hp <= 0) {
        this.type = "air";
        this.timestamp = now;
      }
      if(this.sprite){
        const ratio = this.hp / this.timer;
        const a = 0.01;
        const res = (Math.log(1 + a) - Math.log(a)) ? (Math.log(ratio + a) - Math.log(a)) / (Math.log(1 + a) - Math.log(a)) : 0;
        this.sprite.alpha =  res;
      }
    }
  }
  
  destroy() {
    if (this.sprite) {
      Block.cameraContainer.removeChild(this.sprite);
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}