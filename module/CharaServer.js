import { CharaCore } from './CharaCore.js'
export class Chara extends CharaCore {
    constructor(id, x, y, direction = "right", status = "idle"){
        super(id, x, y, direction, status);
        this.keystate = {
            KeyW: false,
            KeyA: false,
            KeyS: false,
            KeyD: false
        }
        this.keystatesnapshots = [];
        this.socket = null;
        this.px = this.x
        this.time = null;
    }
}