export class WASDInputManager {
    constructor(socket) {
        this.socket = socket;
        
        // 監視するキーのリスト
        this.targetKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
        
        // 現在の状態と前回の状態
        this.currentState = {
            'KeyW': false,  // 上移動
            'KeyA': false,  // 左移動
            'KeyS': false,  // 下移動
            'KeyD': false   // 右移動
        };
        
        this.previousState = { ...this.currentState };
        
        this.setupEventListeners();
        console.log('WASD入力管理を初期化しました');
    }
    // 入力欄にフォーカスがあるかどうかを判定
    isChatFocused() {
        const active = document.activeElement;
        return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.isChatFocused()) return; // チャット入力中なら無視
            
            if (this.targetKeys.includes(e.code)) {
                this.currentState[e.code] = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.isChatFocused()) return;
            
            if (this.targetKeys.includes(e.code)) {
                this.currentState[e.code] = false;
                e.preventDefault();
            }
        });
    }
    update() {
        // 各キーの状態変化をチェック
        for (let keyCode of this.targetKeys) {
            const current = this.currentState[keyCode];
            const previous = this.previousState[keyCode];
            
            // 押し始め
            if (current && !previous) {
                this.sendKeyEvent('keyDown', keyCode);
            }
            // 押し終わり
            else if (!current && previous) {
                this.sendKeyEvent('keyUp', keyCode);
            }
        }
        
        // 前回の状態を更新
        this.previousState = { ...this.currentState };
    }
    
    sendKeyEvent(eventType, keyCode) {
        const keyName = this.getKeyName(keyCode);
        const data = {
            type: eventType,
            key: keyName,
            keyCode: keyCode,
            timestamp: Date.now(),
            playerId: this.socket.id
        };
        
        this.socket.emit('playerInput', data);
    }
    
    getKeyName(keyCode) {
        const keyMap = {
            'KeyW': 'KeyW',
            'KeyA': 'KeyA', 
            'KeyS': 'KeyS',
            'KeyD': 'KeyD'
        };
        return keyMap[keyCode] || keyCode;
    }
    
    // 現在押されているキーの状態を取得
    getPressedKeys() {
        return Object.keys(this.currentState).filter(key => this.currentState[key]);
    }
    
    // 特定のキーが押されているかチェック
    isPressed(keyCode) {
        return this.currentState[keyCode] || false;
    }
}