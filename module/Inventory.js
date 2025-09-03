import * as PIXI from 'pixi.js'
import {size} from './Constants.js'
export class Inventory {
    static uiContainer = null;
    static textures = {};
    static instances = new Map(); // 複数のインベントリインスタンス管理用
    
    static async initialization(parentContainer) {
        // UI用の固定コンテナを作成（カメラの影響を受けない）
        Inventory.uiContainer = new PIXI.Container();
        parentContainer.addChild(Inventory.uiContainer);
        // テクスチャを事前読み込み
        await Inventory.loadTextures();
    }
    
    static async loadTextures() {
        const textureNames = ['stone', 'frame'];
        for (const name of textureNames) {
            try {
                Inventory.textures[name] = await PIXI.Assets.load(`./assets/${name}.png`);
                Inventory.textures[name].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            } catch (error) {
                console.warn(`Failed to load texture: ${name}.png`, error);
            }
        }
        console.log("aaaaa")
    }
    
    constructor(ownerId, x = 20, y = null) {
        this.ownerId = ownerId;
        this.items = {
            stone: 0
        };
        
        // UI位置設定（yがnullの場合は画面下基準）
        this.x = x;
        this.y = y !== null ? y : window.innerHeight - 20;
        this.stonegraphics = null;
        // UI要素
        this.uiElements = null;
        this.itemTexts = {};
        
        // インスタンス管理に登録
        Inventory.instances.set(ownerId, this);
        
        this.createUI();
    }
    
    createUI() {

        if (!Inventory.uiContainer) return;

        this.uiElements = new PIXI.Container();
        
        // フレーム画像
        if (Inventory.textures['frame']) {
            console.log("a")
            const frame = new PIXI.Sprite(Inventory.textures['frame']);
            frame.anchor.set(0, 1); // 左下基準
            frame.x = this.x;
            frame.y = this.y;
            frame.width = size * 2.4;
            frame.height = size * 2.4;
            this.uiElements.addChild(frame);
        }
        console.log(Inventory.textures['stone'])
        // 石のアイコン
        if (Inventory.textures['stone']) {
            
            const stoneIcon = new PIXI.Sprite(Inventory.textures['stone']);
            stoneIcon.anchor.set(0.5, 0.5);
            stoneIcon.x = this.x + size*1.2; // フレーム内の左側
            stoneIcon.y = this.y - size*1.2; // フレーム内中央
            stoneIcon.width = size*1.5;
            stoneIcon.height = size*1.5;
            this.stonegraphics = stoneIcon;
            this.uiElements.addChild(stoneIcon);
        }
        
        // 石の数のテキスト
        this.itemTexts.stone = new PIXI.Text({
            text: this.items.stone.toString(),
            style: {
                fontFamily: 'Arial',
                fontSize: size*0.6,
                fill: 0xffffff,
                stroke: 0x000000,
                strokeThickness: 2
            }
        });
        this.itemTexts.stone.anchor.set(0, 0.5);
        this.itemTexts.stone.x = this.x + size*1.6; // アイコンの右側
        this.itemTexts.stone.y = this.y - size*0.7;
        this.uiElements.addChild(this.itemTexts.stone);
        
        Inventory.uiContainer.addChild(this.uiElements);
    }
    
    updateUI() {
        // 石の数を更新
        if (this.itemTexts.stone) {
            this.itemTexts.stone.text = this.items.stone.toString();
        }
    }
    
    // 石を追加するメソッド
    addStone(count = 1) {
        this.items.stone += count;
        this.updateUI();
    }
    
    // 石を使用するメソッド
    useStone(count = 1) {
        if (this.items.stone >= count) {
            this.items.stone -= count;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    // 石の数を取得
    getStoneCount() {
        return this.items.stone;
    }
    
    // 石の数を設定
    setStoneCount(count) {
        this.items.stone = Math.max(0, count);
        this.updateUI();
    }
    
    // アイテム全般を追加（将来の拡張用）
    addItem(itemType, count = 1) {
        if (this.items.hasOwnProperty(itemType)) {
            this.items[itemType] += count;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    // アイテム全般を使用（将来の拡張用）
    useItem(itemType, count = 1) {
        if (this.items.hasOwnProperty(itemType) && this.items[itemType] >= count) {
            this.items[itemType] -= count;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    // アイテム数を取得
    getItemCount(itemType) {
        return this.items[itemType] || 0;
    }
    
    // UIの位置を更新（画面リサイズ時など）
    updatePosition(x = null, y = null) {
        if (x !== null) this.x = x;
        if (y !== null) this.y = y;
        
        if (this.uiElements) {
            // フレームの位置を更新
            const frame = this.uiElements.children[0];
            if (frame) {
                frame.x = this.x;
                frame.y = this.y;
            }
            
            // アイコンの位置を更新
            const stoneIcon = this.uiElements.children[1];
            if (stoneIcon) {
                stoneIcon.x = this.x + 30;
                stoneIcon.y = this.y - 40;
            }
            
            // テキストの位置を更新
            if (this.itemTexts.stone) {
                this.itemTexts.stone.x = this.x + 55;
                this.itemTexts.stone.y = this.y - 40;
            }
        }
    }
    
    destroy() {
        if (this.uiElements) {
            Inventory.uiContainer.removeChild(this.uiElements);
            this.uiElements.destroy();
            this.uiElements = null;
        }
        
        // インスタンス管理から削除
        Inventory.instances.delete(this.ownerId);
    }
    
    // 静的メソッド：IDでインベントリを取得
    static getInstance(ownerId) {
        return Inventory.instances.get(ownerId);
    }
    
    // 静的メソッド：全てのインベントリを取得
    static getAllInstances() {
        return Array.from(Inventory.instances.values());
    }
}