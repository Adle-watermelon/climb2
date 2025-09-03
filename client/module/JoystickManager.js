// JoyStickManager.js
import * as PIXI from 'https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs';

export default class JoyStickManager {
  constructor(app, baseX, baseY, baseRadius = 100, knobRadius = 40) {
    this.app = app;
    this.baseRadius = baseRadius;
    this.knobRadius = knobRadius;

    this.basePos = { x: baseX, y: baseY };
    this.knobPos = { x: baseX, y: baseY };

    this.keys = { W: false, A: false, S: false, D: false };

    // グラフィック作成
    this.baseCircle = new PIXI.Graphics();
    this.baseCircle.beginFill(0x999999, 0.3);
    this.baseCircle.drawCircle(0, 0, baseRadius);
    this.baseCircle.endFill();
    this.baseCircle.x = baseX;
    this.baseCircle.y = baseY;
    app.stage.addChild(this.baseCircle);

    this.knobCircle = new PIXI.Graphics();
    this.knobCircle.beginFill(0xffffff);
    this.knobCircle.drawCircle(0, 0, knobRadius);
    this.knobCircle.endFill();
    this.knobCircle.x = baseX;
    this.knobCircle.y = baseY;
    app.stage.addChild(this.knobCircle);

    // イベント
    this.active = false;
    app.stage.interactive = true;
    app.stage.on("pointerdown", this.onDown.bind(this));
    app.stage.on("pointermove", this.onMove.bind(this));
    app.stage.on("pointerup", this.onUp.bind(this));
    app.stage.on("pointerupoutside", this.onUp.bind(this));
  }

  onDown(e) {
    const pos = e.data.global;
    this.active = true;
    this.updateKnob(pos);
  }

  onMove(e) {
    if (!this.active) return;
    const pos = e.data.global;
    this.updateKnob(pos);
  }

  onUp() {
    this.active = false;
    this.knobPos = { ...this.basePos };
    this.knobCircle.position.set(this.basePos.x, this.basePos.y);
    this.keys = { W: false, A: false, S: false, D: false };
  }

  updateKnob(pos) {
    this.knobPos = { x: pos.x, y: pos.y };
    this.knobCircle.position.set(pos.x, pos.y);

    const dx = pos.x - this.basePos.x;
    const dy = pos.y - this.basePos.y;

    this.keys = { W: false, A: false, S: false, D: false };
    if (dy < -20) this.keys.W = true;
    if (dy > 20) this.keys.S = true;
    if (dx < -20) this.keys.A = true;
    if (dx > 20) this.keys.D = true;
  }
}
