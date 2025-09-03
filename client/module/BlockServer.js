import {size, charaheight, charawidth, synfps} from './Constants.js'

export class Block {
  constructor(type = "air",timer = 0) {
    this._type = type;
    this.hp = timer;
    this._timer = timer;
    // 初期タイプを設定
    this.type = type;
    this.timestamp = Date.now();
  }
  
  get type() {
    return this._type;
  }
  set timer(timer){
    this.hp = timer;
    this.timestamp = Date.now();
    this._timer = timer;
  }
  get timer(){
    return this._timer;
  }
  set type(newType) {
    
    this._type = newType;
  }
  update() {
    const now = Date.now();
    if (this.type === "stone" ) {
      this.hp = (this.timer - (now - this.timestamp)/1000);
      if(this.hp <= 0) {
        this.type = "air";
      }
    }
  }
}