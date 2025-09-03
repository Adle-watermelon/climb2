import { CharaCore } from './CharaCore.js'
import * as PIXI from 'https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs'
import {size, charaheight, charawidth} from './Constants.js'
export class Chara extends CharaCore {
    static cameraContainer = null;
    static textures = new Map(); // テクスチャキャッシュ
    
    static async initialization(cameraContainer){
        Chara.cameraContainer = cameraContainer;
        // テクスチャを事前読み込み
        Chara.textures.set('walk1', await PIXI.Assets.load('./assets/walk1.png'));
        Chara.textures.set('walk2', await PIXI.Assets.load('./assets/walk2.png'));
        Chara.textures.set('walk3', await PIXI.Assets.load('./assets/walk3.png'));
        Chara.textures.set('idle', await PIXI.Assets.load('./assets/idle.png'));
        Chara.textures.set('jump', await PIXI.Assets.load('./assets/jump.png'));
        Chara.textures.set('slip', await PIXI.Assets.load('./assets/slip.png'));
    }
    
    static async loadTextures() {
        const textureNames = ['walk1', 'walk2', 'walk3', 'idle', 'jump', 'slip'];

    }
    
    constructor(id, x, y, direction = "right", status = "idle"){
        super(id, x, y, direction, status)
        this.px = x;
        this.py = y;
        this.lx = x;
        this.ly = y;
        this.inpcout = 0;
        
        // アニメーション用のプロパティ
        this.walkAnimationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 8; 

        // 名前表示用
        this.nameText = null;
    }

    setPos(x,y){
        this.px = this.x;
        this.py = this.y;
        this.lx = x;
        this.ly = y;
        this.inpcout = 0;
    }

    drawChara() {
        if (!this.sprite) {
            // 初回生成 - スプライト
            this.sprite = new PIXI.Sprite();
            this.sprite.anchor.set(0.5, 1);
            Chara.cameraContainer.addChild(this.sprite);

            // 名前テキスト追加
            this.nameText = new PIXI.Text(this.name, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 14,
                fill: 0xffffff,
                align: "center"
            });
            this.nameText.anchor.set(0.5, 1); // 中央揃え、下基準
            Chara.cameraContainer.addChild(this.nameText);
        }

        // スプライト位置更新
        this.sprite.x = this.x * size;
        this.sprite.y = this.y * size;

        // 名前テキスト位置（キャラの少し上）
        if (this.nameText) {
            this.nameText.text = this.name || "player"; // 最新の名前反映
            this.nameText.x = this.sprite.x;
            this.nameText.y = this.sprite.y - this.sprite.height - 5;
        }

        // 方向反転
        this.sprite.scale.x = this.direction === "right" ? 1 : -1;

        // アニメーションタイマー更新
        this.animationTimer++;

        // ステータスによって画像を変える
        let textureName = 'idle';

        if (!this.OnGround) {
            textureName = 'jump';
        } else if (this.OnGround && this.status === "walking" && Math.abs(this.vx) > 5.8) {
            if (this.animationTimer >= this.animationSpeed) {
                this.walkAnimationFrame = (this.walkAnimationFrame + 1) % 3;
                this.animationTimer = 0;
            }
            textureName = `walk${this.walkAnimationFrame + 1}`;
        } else if (this.OnGround && this.status === "walking" && Math.abs(this.vx) <= 5.8) {
            textureName = 'slip'
        } else {
            textureName = 'idle';
            this.walkAnimationFrame = 0;
            this.animationTimer = 0;
        }

        // テクスチャ反映
        if (Chara.textures.has(textureName)) {
            this.sprite.texture = Chara.textures.get(textureName);
            this.sprite.width = size * charawidth;
            this.sprite.height = size * charaheight;
        }else{console.log("aaaaaaa")}
    }

    destroy() {
        if (this.sprite) {
            Chara.cameraContainer.removeChild(this.sprite);
            this.sprite.destroy();
            this.sprite = null;
        }
        if (this.nameText) {
            Chara.cameraContainer.removeChild(this.nameText);
            this.nameText.destroy();
            this.nameText = null;
        }
    }
}
