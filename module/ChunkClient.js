import { Block } from './BlockClient.js'
export class Chunk {
  constructor(x, y) {
    this.x = x; // チャンク座標 (ワールド座標とは別)
    this.y = y;
    this.blocks = Array.from({ length: 16 }, () =>
      Array.from({ length: 16 }, () => {return new Block("air")})
    );
    for(var i = 0;i<16;i++){
        for(var j = 0;j<16;j++){
            this.blocks[i][j].type = (Math.abs(this.x*16 + j) > 8 || i + this.y*16 >=0) ? 'void' : 'air'
            this.blocks[i][j].timer = (Math.abs(this.x*16 + j) > 8 || i + this.y*16 >=0) ? 1000000 : 0
            this.blocks[i][j].setPosition(this.x*16 + j,this.y*16 + i)
        }
    }
  }
  static convert(chunk){
    const newchunk = new Chunk(chunk.x,chunk.y)
    for(var i = 0;i<16;i++){
        for(var j = 0;j<16;j++){
            newchunk.blocks[i][j].type = chunk.blocks[i][j]._type;
            newchunk.blocks[i][j].timer = chunk.blocks[i][j]._timer;
            newchunk.blocks[i][j].setPosition(newchunk.x*16 + j,newchunk.y*16 + i)
        }
    }
    return newchunk
  }
  getBlock(bx,by){
    if(this.blocks){return this.blocks[by][bx].type}
    return 'air'
  }
  setBlock(bx, by, type, timer = 0, timestamp) {
    if (bx >= 0 && bx < 16 && by >= 0 && by < 16) {
      const newblock = new Block(type,timer)
      newblock.timestamp = timestamp;
      newblock.setPosition(this.x*16 + bx,this.y*16 + by)
      this.blocks[by][bx] = newblock;
    }
  }

  update() {
    for (let row of this.blocks) {
      for (let b of row) b.update();
    }
  }
  destroy(){
    for (let row of this.blocks) {
      for (let b of row) b.destroy();
    }
  }
}