
import {size, charawidth, charaheight} from './Constants.js'
export function updateCamera(app, cameraContainer, chara) {
    // キャラクターを画面中心に配置
    const centerX = app.renderer.width / 2;
    const centerY = app.renderer.height / 2;

    cameraContainer.x = -chara.x * size + centerX;
    cameraContainer.y = -chara.y * size + centerY;
}