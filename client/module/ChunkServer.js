import { Block } from './BlockServer.js'
export class Chunk {
  constructor(x, y) {
    this.x = x; // チャンク座標 (ワールド座標とは別)
    this.y = y;
    this.blocks = Array.from({ length: 16 }, () =>
      Array.from({ length: 16 }, () => {return new Block("air")})
    );
    for(var i = 0;i<16;i++){
        for(var j = 0;j<16;j++){
            this.blocks[i][j].type = (!(this.x!=0) || i + this.y*16 >=3) ? 'stone' : 'air'
            this.blocks[i][j].timer = (!(this.x!=0) || i + this.y*16 >=3) ? 1000000 : 0
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
    for (let row of this.blocks) {
      for (let b of row) b.update();
    }
  }
}