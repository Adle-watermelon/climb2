import { Block } from './BlockServer.js'
import { Item } from './ItemServer.js'
export class Chunk {
  static items
  static initialization(items){
    Chunk.items = items;
  }
  constructor(x, y) {
    this.x = x; // チャンク座標 (ワールド座標とは別)
    this.y = y;
    this.blocks = Array.from({ length: 16 }, () =>
      Array.from({ length: 16 }, () => {return new Block("air")})
    );
    for(var i = 0;i<16;i++){
        for(var j = 0;j<16;j++){
            this.blocks[i][j].type = (this.x != 0 || i + this.y*16 >=0) ? 'void' : 'air'
            this.blocks[i][j].timer = (this.x != 0 || i + this.y*16 >=0) ? 1000000 : 0
        }
    }
  }
  getBlock(bx,by){
    return this.blocks[by][bx].type
  }
  allgetBlock(bx,by){
    return this.blocks[by][bx]
  }
  setBlock(bx, by, type, timer = 0,timestamp = Date.now()) {
    if (bx >= 0 && bx < 16 && by >= 0 && by < 16) {
      const newblock = new Block(type,timer)
      newblock.timestamp = timestamp
      this.blocks[by][bx] = newblock;
    }
  }
  update() {
    for(var i = 0;i<16;i++){
      for(var j = 0;j<16;j++){
        const now = Date.now();
        if (this.blocks[i][j].type === "stone" ) {
          this.blocks[i][j].hp = (this.blocks[i][j].timer - (now - this.blocks[i][j].timestamp)/1000);
          if(this.blocks[i][j].hp <= 0) {
            this.blocks[i][j].type = "air";
            let time = Date.now()
            let x = this.x * 16 + j + 0.5;
            let y = this.y * 16 + i;
            let item = new Item(`${time},${x},${y}`,x,y,"stone",time);
            Chunk.items.set(`${time},${x},${y}`,item)
          }
        }
      }
    }
  }
}