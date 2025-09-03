// module/Ranking.js
import * as PIXI from 'pixi.js';

export class Ranking {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    // 背景枠
    this.background = new PIXI.Graphics();
    this.background.beginFill(0x000000, 0.6);
    this.background.lineStyle(2, 0xffffff, 1);
    this.background.drawRoundedRect(0, 0, 280, 150, 10);
    this.background.endFill();
    this.container.addChild(this.background);

    // タイトル（"Ranking"）
    this.title = new PIXI.Text("Ranking", {
      fontFamily: "Press Start 2P", // タイトル画面と同じフォントを想定
      fontSize: 14,
      fill: "#ffffff",
    });
    this.title.x = 10;
    this.title.y = 8;
    this.container.addChild(this.title);

    // ランキング表示用のテキストを3つ作成
    this.texts = [];
    for (let i = 0; i < 3; i++) {
      const text = new PIXI.Text("", {
        fontFamily: "Press Start 2P",
        fontSize: 12,
        fill: "#ffff00",
      });
      text.x = 10;
      text.y = 35 + i * 25;
      this.container.addChild(text);
      this.texts.push(text);
    }

    // 自分の位置表示用
    this.youText = new PIXI.Text("", {
      fontFamily: "Press Start 2P",
      fontSize: 12,
      fill: "#00ff00", // 自分は緑で表示
    });
    this.youText.x = 10;
    this.youText.y = 115;
    this.container.addChild(this.youText);

    // 右上に配置
    this.container.x = app.renderer.width - 290;
    this.container.y = 10;

    // 画面リサイズ対応
    window.addEventListener("resize", () => {
      this.container.x = this.app.renderer.width - 290;
    });

    app.stage.addChild(this.container);
  }

  /**
   * ランキングを更新
   * @param {Array} ranking - [{y, name, id}, ...] がソート済みで渡される
   * @param {Object} player - {y, name, id} の形式を想定
   */
  update(ranking, player) {
    // 上位3人を描画
    for (let i = 0; i < 3; i++) {
      if (ranking[i]) {
        this.texts[i].text = `${i + 1}. ${ranking[i].name}: ${-ranking[i].y}`;
      } else {
        this.texts[i].text = "";
      }
    }

    // 自分の位置を描画
    if (player) {
      this.youText.text = `You: ${-Math.floor(player.y * 10)/10}`;
    } else {
      this.youText.text = "";
    }
  }
}
