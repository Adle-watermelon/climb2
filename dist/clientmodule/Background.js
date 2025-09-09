// module/Background.js
import * as PIXI from "https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs";
import { size } from "./Constants.js";

export class Background {
  constructor(app, layers) {
    this.app = app;
    this.container = new PIXI.Container();
    // zIndex を有効化
    this.container.sortableChildren = true;
    this.app.stage.addChildAt(this.container, 0);

    this.layers = layers;
    this.sprites = []; // { layer, group[], width, height, baseY, isLoop }
    this._loadLayers();
  }

  async _loadLayers() {
    for (const layer of this.layers) {
      const texture = await PIXI.Assets.load(layer.texture);
      texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      const group = [];
      const width = 16 * size;

      // 明示的に null と 0 を区別する（ここが重要）
      if (layer.end === null) {
        // ループ用：テクスチャのアスペクト比を保って幅に合わせた高さを使う
        const scale = width / texture.width;
        const height = Math.round(texture.height * scale);

        // 縦に3枚並べる（中心が0になるように -height, 0, +height）
        for (let i = 0; i < 3; i++) {
          const sprite = new PIXI.Sprite(texture);
          sprite.width = width;
          sprite.height = height;
          sprite.x = 0;
          sprite.y = (i - 1) * height; // -1*height, 0, +height
          sprite.zIndex = (layer.zIndex != null) ? layer.zIndex : -1000; // 奥に置くのがデフォルト
          this.container.addChild(sprite);
          group.push(sprite);
        }

        this.sprites.push({
          layer,
          group,
          width,
          height,
          baseY: 0,    // ループ層は baseY を 0 にして update で剰余運用
          isLoop: true,
        });

      } else {
        // end が数値（0 を含む） -> 固定表示
        // 高さは end-start ブロック数 * size
        const height = (layer.end - layer.start) * size; // end===0 でも OK
        const sprite = new PIXI.Sprite(texture);
        sprite.width = width;
        sprite.height = height;
        sprite.x = 0;

        // baseY: スプライトのワールド上の基準Y（以前のロジックに合わせる）
        const baseY = (layer.end === 0) ? 0 : -layer.end * size;
        sprite.y = baseY;
        sprite.zIndex = (layer.zIndex != null) ? layer.zIndex : 0;
        this.container.addChild(sprite);
        group.push(sprite);

        this.sprites.push({
          layer,
          group,
          width,
          height,
          baseY,
          isLoop: false,
        });
      }
    }
  }

  /**
   * playerX/playerY はブロック単位のワールド座標
   */
  update(playerX, playerY) {
    const worldPixelY = playerY * size;
    const worldPixelX = playerX * size;
    const screenCenterY = this.app.renderer.height / 2;
    const screenCenterX = this.app.renderer.width / 2;

    // container の y は固定（各スプライトの y を直接操作する）
    this.container.y = 0;

    for (const item of this.sprites) {
      const { layer, group, width, height, baseY, isLoop } = item;

      if (isLoop) {
        // 横ループ（必要なら）＋縦ループ
        const offsetX = -((worldPixelX % width) + width) % width + screenCenterX;
        const offsetY = -((worldPixelY % height) + height) % height + screenCenterY;

        for (let i = 0; i < group.length; i++) {
          group[i].x = offsetX;
          // 中央のタイルを offsetY に合わせ、上下に tile する
          group[i].y = offsetY + (i - 1) * height;
        }
      } else {
        // 固定レイヤー：カメラ（playerY）に合わせて移動させる
        // 元の実装に合わせるなら sprite の画面上位置は:
        // screenY = screenCenterY - worldPixelY + baseY
        const fixedY = screenCenterY - worldPixelY + (baseY || 0);
        for (let i = 0; i < group.length; i++) {
          group[i].x = -worldPixelX + screenCenterX; // 中央に固定（横ループをしない場合）
          group[i].y = fixedY;
        }
      }
    }
  }
}
