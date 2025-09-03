// module/Background.js
import * as PIXI from "https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs";
import { size } from "./Constants.js";

export class Background {
  constructor(app, layers) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChildAt(this.container, 0);

    this.layers = layers;
    this.sprites = [];
    this._loadLayers();
    this.loop = Math.floor(this.app.renderer.width / 2) + 2
  }

  async _loadLayers() {
    for (const layer of this.layers) {
      const texture = await PIXI.Assets.load(layer.texture);
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      // 横ループ用に3枚並べる
      
      const group = [];
      let height = layer.end
        ? (layer.end - layer.start) * size
        : this.app.renderer.height * 2;
        if(layer.end == 0){height = (layer.end - layer.start) * size}
      const width = 16 * size;


      for (let i = 0; i <= 0; i++) {
        const sprite = new PIXI.Sprite(texture);
        sprite.width = width;
        sprite.height = height;
        sprite.x = i * width;
        sprite.y = layer.end ? -layer.end * size : -layer.start * size - sprite.height ; // Y方向の配置
        this.container.addChild(sprite);
        group.push(sprite);
      }
      this.sprites.push({ layer, group, width });
    }
  }

  /**
   * プレイヤーの座標に応じて背景をスクロール
   * @param {number} playerX - プレイヤーのワールド座標X（ブロック単位）
   * @param {number} playerY - プレイヤーのワールド座標Y（ブロック単位）
   */
  update(playerX, playerY) {
    const worldPixelY = playerY * size;
    const worldPixelX = playerX * size;
    const screenCenterY = this.app.renderer.height / 2;
    const screenCenterX = this.app.renderer.width / 2;

    // 背景コンテナを縦方向に追従
    this.container.y = screenCenterY - worldPixelY;

    for (const { group, width } of this.sprites) {
      // 剰余でループ
      const offsetX = -((worldPixelX % width) + width) % width;

      for (let i = 0; i < group.length; i++) {
        group[i].x = offsetX + (i ) * width + screenCenterX;
      }
    }
  }
}
