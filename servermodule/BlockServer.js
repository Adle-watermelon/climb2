import { charaheight, charawidth, synfps} from './Constants.js'
export class Block {
  constructor(type = "air",timer = 0, items) {
    this._type = type;
    this.hp = timer;
    this._timer = timer;
    // 初期タイプを設定
    this.type = type;
    this.timestamp = Date.now();
    this.items = items;
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
  }
}