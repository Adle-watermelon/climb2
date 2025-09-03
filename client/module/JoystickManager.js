// JoyStickManager.js
import * as PIXI from 'https://unpkg.com/pixi.js@8.5.1/dist/pixi.mjs';
import { size } from './Constants.js'
export default class JoyStickManager {
  constructor(app, baseX, baseY, baseRadius = size*1.8, knobRadius = size * 0.5) {
    this.app = app;
    this.baseRadius = baseRadius;
    this.knobRadius = knobRadius;

    this.basePos = { x: baseX, y: baseY };
    this.knobPos = { x: baseX, y: baseY };

    this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false };

    // グラフィック作成
    this.joystickContainer = new PIXI.Container();
app.stage.addChild(this.joystickContainer);

this.baseCircle = new PIXI.Graphics();
this.baseCircle.beginFill(0x999999, 0.3);
this.baseCircle.drawCircle(0, 0, baseRadius);
this.baseCircle.endFill();
this.baseCircle.x = baseX;
this.baseCircle.y = baseY;
this.joystickContainer.addChild(this.baseCircle);

this.knobCircle = new PIXI.Graphics();
this.knobCircle.beginFill(0xffffff);
this.knobCircle.drawCircle(0, 0, knobRadius);
this.knobCircle.endFill();
this.knobCircle.x = baseX;
this.knobCircle.y = baseY;
this.joystickContainer.addChild(this.knobCircle);

// イベント設定
this.joystickContainer.interactive = true;
this.joystickContainer.on("pointerdown", this.onDown.bind(this));
this.joystickContainer.on("pointermove", this.onMove.bind(this));
this.joystickContainer.on("pointerup", this.onUp.bind(this));
this.joystickContainer.on("pointerupoutside", this.onUp.bind(this));
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
    console.log("onUp")
    this.knobPos = { ...this.basePos };
    this.knobCircle.position.set(this.basePos.x, this.basePos.y);
    this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false };
  }

  updateKnob(pos) {
    this.knobPos = { x: pos.x, y: pos.y };
    this.knobCircle.position.set(pos.x, pos.y);

    const dx = pos.x - this.basePos.x;
    const dy = pos.y - this.basePos.y;

    this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false };
    if (dy < -20) this.keys.KeyW = true;
    if (dy > 20) this.keys.KeyS = true;
    if (dx < -20) this.keys.KeyA = true;
    if (dx > 20) this.keys.KeyD = true;
  }
}
