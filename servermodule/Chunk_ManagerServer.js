import { Chunk } from './ChunkServer.js'

export class ChunkManager {
    constructor(){
        this.chunks = new Map();
    }
    getChunk(cx,cy){
        const chunkKey = `${cx},${cy}`;
        if(this.chunks.has(chunkKey)){
            return this.chunks.get(chunkKey)
        }else{
            this.createChunk(cx,cy)
            return this.chunks.get(chunkKey)
        }
    }
    getBlock(x,y){
        const cx = Math.floor(x/16)
        const cy = Math.floor(y/16)
        const chunk = this.getChunk(cx,cy)
        const offsetX = x - cx*16;
        const offsetY = y - cy*16;
        const type = chunk.getBlock(Math.floor(offsetX),Math.floor(offsetY));
        return type;
    }
    allgetBlock(x,y){
        const cx = Math.floor(x/16)
        const cy = Math.floor(y/16)
        const chunk = this.getChunk(cx,cy)
        const offsetX = x - cx*16;
        const offsetY = y - cy*16;
        const block = chunk.allgetBlock(Math.floor(offsetX),Math.floor(offsetY));
        return block;
    }
    createChunk(cx,cy){
        const chunkKey = `${cx},${cy}`;
        this.chunks.set(chunkKey, new Chunk(cx,cy))
    }
    requestChunk(x,y){
        const chunkKey = `${x},${y}`;
        if(chunks.has(chunkKey)){}else{createChunk(x,y)}
    }
    setBlock(x,y,type, timer = 0){
        const cx = Math.floor(x/16)
        const cy = Math.floor(y/16)
        const chunk = this.getChunk(cx,cy)
        const offsetX = x - cx*16;
        const offsetY = y - cy*16;
        chunk.setBlock(Math.floor(offsetX),Math.floor(offsetY),type,timer);
    }
    update(){
        for(const [id,chunk] of this.chunks){
            chunk.update();
        }
    }
}