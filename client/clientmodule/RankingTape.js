// module/RankingTape.js
import * as PIXI from 'pixi.js'
import { size, fontSize } from "./Constants.js"; // ← パスは環境に合わせて

export class RankingTape {
  constructor(app,cameraContainer) {
    this.app = app;
    this.container = new PIXI.Container();
    this.tapes = [];
    this.cameraContainer = cameraContainer
    // あらかじめ3本作成して再利用
    for (let i = 0; i < 3; i++) {
      const line = new PIXI.Graphics();
      this._drawHorizontalLine(line); // 新APIで描画

      const label = new PIXI.Text("", {
        fontFamily: "Press Start 2P",
        fontSize: fontSize,
        fill: 0xff0000,
        align: "right",
      });
      label.anchor.set(1, 0.5);
      label.x = 200; // 右端寄せ
      label.resolution = window.devicePixelRatio || 1;

      this.container.addChild(line);
      this.container.addChild(label);
      this.tapes.push({ line, label });
    }

    // ラインは画面固定表示なので stage 直下に追加
    this.app.stage.addChild(this.container);

    // リサイズ時は線幅とラベルXだけ描き直し
    window.addEventListener("resize", () => {
      for (const { line, label } of this.tapes) {
        this._drawHorizontalLine(line);
        label.x = this.app.renderer.width - 10;
      }
    });
  }

  // 新APIで水平ラインを描く（毎フレームではなく初期化/リサイズ時のみ）
  _drawHorizontalLine(g) {
    const w = Math.floor(this.app.renderer.width);
    g.clear();
    g.moveTo(0, 0)
     .lineTo(w, 0)
     .stroke({ width: 2, color: 0xff0000, alpha: 1 });
  }

  /**
   * @param {Array<{y:number,name:string,id:any}>} ranking  // y昇順の上位を渡す
   * @param {{x:number,y:number}} camera // カメラ中心のワールド座標(ピクセル)
   */
  update(ranking, camera) {
    for (let i = 0; i < 3; i++) {
      const tape = this.tapes[i];
      const data = ranking[i];

      if (data) {
        const screenY = this.worldToScreenY(data.y, camera);

        // ラインは y だけ動かす
        tape.line.y = screenY;

        // ラベルは常に視界内に収まるようクランプ
        tape.label.text = data.name;
        tape.label.y = Math.max(10, Math.min(this.app.renderer.height - 10, screenY - 10));

        tape.line.visible = true;
        tape.label.visible = true;
      } else {
        tape.line.visible = false;
        tape.label.visible = false;
      }
    }
  }

  /**
   * ワールド座標Y → 画面座標Yに変換
   * @param {number} worldY - ワールド上のブロック座標
   * @param {Object} camera - {x, y} カメラの中心座標
   */
  worldToScreenY(worldY, camera) {
    const worldPixelY = worldY * size;
    return this.cameraContainer.y + worldPixelY;
  }
}
