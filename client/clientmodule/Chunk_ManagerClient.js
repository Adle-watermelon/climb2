import { Chunk } from './ChunkClient.js'

export class ChunkManager {
    static socket = null;
    static offset = 0;
    static async initialization(socket,offset){
        ChunkManager.socket = socket;
        ChunkManager.offset = offset;
    }
    
    constructor(){
        this.chunks = new Map();
        this.pendingRequests = new Set(); // リクエスト中のチャンクキー
        this.requestPromises = new Map(); // Promise管理用
        
        // サーバーからのチャンク応答を処理
        ChunkManager.socket.on('chunkResponse', (data) => {
            this.handleChunkResponse(data);
        });
        
        // サーバーからのエラー応答を処理（必要に応じて）
        ChunkManager.socket.on('chunkError', (data) => {
            this.handleChunkError(data);
        });
    }
    
    /**
     * チャンクを非同期で取得（メイン関数）
     * @param {number} cx - チャンクのX座標
     * @param {number} cy - チャンクのY座標
     * @returns {Promise<Chunk|string>} チャンクオブジェクトまたは"air"
     */
    async getChunkAsync(cx, cy) {
        const chunkKey = `${cx},${cy}`;
        
        // 1. キャッシュから確認
        if (this.chunks.has(chunkKey)) {
            return this.chunks.get(chunkKey);
        }
        
        // 2. 既にリクエスト中かどうか確認
        if (this.pendingRequests.has(chunkKey)) {
            // 既存のPromiseを待機
            return this.requestPromises.get(chunkKey);
        }
        
        // 3. 新しいリクエストを送信
        return this.requestChunkAsync(cx, cy);
    }
    
    /**
     * 同期版のgetChunk（既存の互換性を保持）
     * @param {number} cx - チャンクのX座標
     * @param {number} cy - チャンクのY座標
     * @returns {Chunk|string} チャンクオブジェクトまたは"air"
     */
    getChunk(cx, cy) {
        const chunkKey = `${cx},${cy}`;
        if (this.chunks.has(chunkKey)) {
            return this.chunks.get(chunkKey);
        } else {
            // 非同期でリクエストを開始（結果は待たない）
            this.requestChunkAsync(cx, cy);
            return null;
        }
    }
    
    /**
     * サーバーにチャンクリクエストを送信（Promise版）
     * @param {number} cx - チャンクのX座標
     * @param {number} cy - チャンクのY座標
     * @returns {Promise<Chunk>}
     */
    requestChunkAsync(cx, cy) {
        const chunkKey = `${cx},${cy}`;
        
        // 既にキャッシュにある場合は即座に返す
        if (this.chunks.has(chunkKey)) {
            return Promise.resolve(this.chunks.get(chunkKey));
        }
        
        // 既にリクエスト中の場合は既存のPromiseを返す
        if (this.requestPromises.has(chunkKey)) {
            return this.requestPromises.get(chunkKey);
        }
        
        const promise = new Promise((resolve, reject) => {
            // リクエスト中として記録
            this.pendingRequests.add(chunkKey);
            
            
            // タイムアウト設定（30秒）
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(chunkKey);
                this.requestPromises.delete(chunkKey);
                reject(new Error(`チャンク (${cx}, ${cy}) のリクエストがタイムアウトしました`));
            }, 30000);
            
            // リクエスト情報を保存
            const requestInfo = {
                resolve,
                reject,
                timeout,
                timestamp: Date.now()
            };
            
            // 一時的なリクエスト情報を保存
            this.chunks.set(`__pending_${chunkKey}`, requestInfo);
            
            // サーバーにリクエスト送信
            if (ChunkManager.socket) {
                ChunkManager.socket.emit('chunkRequest', { cx: cx, cy: cy });
            } else {
                clearTimeout(timeout);
                this.pendingRequests.delete(chunkKey);
                this.requestPromises.delete(chunkKey);
                reject(new Error('Socket接続が利用できません'));
            }
        });
        
        // Promiseを管理用Mapに保存
        this.requestPromises.set(chunkKey, promise);
        
        return promise;
    }
    
    /**
     * 従来のrequestChunk（互換性のため）
     * @param {number} cx - チャンクのX座標
     * @param {number} cy - チャンクのY座標
     */
    requestChunk(cx, cy) {
        const chunkKey = `${cx},${cy}`;
        if (this.chunks.has(chunkKey)) {
            return null;
        } else {
            if (!this.pendingRequests.has(chunkKey)) {
                this.requestChunkAsync(cx, cy);
            }
        }
    }
    
    /**
     * サーバーからのチャンク応答を処理
     * @param {object} data - { chunk: { x, y, ... } }
     */
    handleChunkResponse(data) {
        const chunkKey = `${data.chunk.x},${data.chunk.y}`;
        const chunk = Chunk.convert(data.chunk);
        // キャッシュに保存
        this.chunks.set(chunkKey, chunk);
        
        // リクエスト中リストから削除
        this.pendingRequests.delete(chunkKey);
        
        // 保留中のPromiseを解決
        const pendingKey = `__pending_${chunkKey}`;
        if (this.chunks.has(pendingKey)) {
            const requestInfo = this.chunks.get(pendingKey);
            clearTimeout(requestInfo.timeout);
            requestInfo.resolve(chunk);
            this.chunks.delete(pendingKey);
        }
        // Promise管理からも削除
        this.requestPromises.delete(chunkKey);
    }
    
    /**
     * サーバーからのエラー応答を処理
     * @param {object} data - { cx, cy, error }
     */
    handleChunkError(data) {
        const chunkKey = `${data.cx},${data.cy}`;
        
        console.error(`チャンク (${data.cx}, ${data.cy}) でエラーが発生: ${data.error}`);
        
        // リクエスト中リストから削除
        this.pendingRequests.delete(chunkKey);
        
        // 保留中のPromiseを拒否
        const pendingKey = `__pending_${chunkKey}`;
        if (this.chunks.has(pendingKey)) {
            const requestInfo = this.chunks.get(pendingKey);
            clearTimeout(requestInfo.timeout);
            requestInfo.reject(new Error(data.error));
            this.chunks.delete(pendingKey);
        }
        
        // Promise管理からも削除
        this.requestPromises.delete(chunkKey);
    }
    
    /**
     * ブロックを取得
     * @param {number} x - ワールドX座標
     * @param {number} y - ワールドY座標
     * @returns {any} ブロックタイプ
     */
    getBlock(x, y) {
        const cx = Math.floor(x / 16);
        const cy = Math.floor(y / 16);
        const chunk = this.getChunk(cx, cy);
        
        if (chunk === null) {
            return "void";
        }
        
        const offsetX = x - cx * 16;
        const offsetY = y - cy * 16;
        const type = chunk.getBlock(Math.floor(offsetX), Math.floor(offsetY));
        return type;
    }
    
    /**
     * ブロックを非同期で取得
     * @param {number} x - ワールドX座標
     * @param {number} y - ワールドY座標
     * @returns {Promise<any>} ブロックタイプ
     */
    async getBlockAsync(x, y) {
        const cx = Math.floor(x / 16);
        const cy = Math.floor(y / 16);
        const chunk = await this.getChunkAsync(cx, cy);
        
        if (chunk === "air") {
            return "air";
        }
        
        const offsetX = x - cx * 16;
        const offsetY = y - cy * 16;
        const type = chunk.getBlock(Math.floor(offsetX), Math.floor(offsetY));
        return type;
    }
    
    /**
     * チャンクを作成（将来的な実装用）
     * @param {number} cx - チャンクのX座標
     * @param {number} cy - チャンクのY座標
     */
    createChunk(cx, cy) {
        // 将来的な実装
        /*const chunkKey = `${cx},${cy}`;
        this.chunks.set(chunkKey, new Chunk(cx,cy))*/
    }
    
    /**
     * 遠いチャンクを削除
     * @param {number} cx - 現在のチャンクX座標
     * @param {number} cy - 現在のチャンクY座標
     */
    deleteChunks(cx, cy) {
        for (const [key, chunk] of this.chunks) {
            // __pending_で始まるキーは除外
            if (key.startsWith('__pending_')) continue;
            
            const x = Number(key.split(",")[0]);
            const y = Number(key.split(",")[1]);
            if (Math.abs(cx - x) > 5 && Math.abs(cy - y) > 5) {
                if (chunk.destroy) {
                    chunk.destroy();
                }
                this.chunks.delete(key);
            }
        }
    }
    
    /**
     * 現在のリクエスト状況を取得
     * @returns {object}
     */
    getStatus() {
        return {
            cachedChunks: Array.from(this.chunks.keys()).filter(k => !k.startsWith('__pending_')),
            pendingRequests: Array.from(this.pendingRequests),
            cacheSize: this.chunks.size - Array.from(this.chunks.keys()).filter(k => k.startsWith('__pending_')).length
        };
    }
    
    /**
     * キャッシュをクリア
     */
    clearCache() {
        // 保留中のリクエストは保持
        const pendingEntries = Array.from(this.chunks.entries()).filter(([key]) => key.startsWith('__pending_'));
        
        this.chunks.clear();
        
        // 保留中のリクエストを復元
        pendingEntries.forEach(([key, value]) => {
            this.chunks.set(key, value);
        });
        
        console.log('チャンクキャッシュをクリアしました');
    }
    setBlock(x,y,type,timer = 0, timestamp = Date.now() + ChunkManager.offset){
        const cx = Math.floor(x/16)
        const cy = Math.floor(y/16)
        const chunk = this.getChunk(cx,cy)
        const offsetX = x - cx*16;
        const offsetY = y - cy*16;
        chunk.setBlock(Math.floor(offsetX),Math.floor(offsetY),type,timer,timestamp);
    }
    update(){
        for(const [id,chunk] of this.chunks){

            if(chunk.blocks){chunk.update()};
        }
    }
}
