import * as PIXI from 'pixi.js'
import bg_ground from '../assets/bg_ground.png'
import bg_city from '../assets/bg_city.png' 
import bg_clouds from '../assets/bg_clouds.png'
import bg_space from '../assets/bg_space.png' 
import stone from '../assets/stone.png'
import frame from '../assets/frame.png'
import walk1 from '../assets/walk1.png'
import walk2 from '../assets/walk2.png'
import walk3 from '../assets/walk3.png'
import idle from '../assets/idle.png'
import jump from '../assets/jump.png'
import slip from '../assets/slip.png'
export class Texture{
    static loaded = false;
    static textures = new Map()
    static async initialization(){
        Texture.textures.set('bg_ground', await PIXI.Assets.load(bg_ground));
        Texture.textures.set('bg_city', await PIXI.Assets.load(bg_city));
        Texture.textures.set('bg_clouds', await PIXI.Assets.load(bg_clouds));
        Texture.textures.set('bg_space', await PIXI.Assets.load(bg_space));
        Texture.textures.set('stone', await PIXI.Assets.load(stone));
        Texture.textures.set('frame', await PIXI.Assets.load(frame));
        Texture.textures.set('walk1', await PIXI.Assets.load(walk1));
        Texture.textures.set('walk2', await PIXI.Assets.load(walk2));
        Texture.textures.set('walk3', await PIXI.Assets.load(walk3));
        Texture.textures.set('idle', await PIXI.Assets.load(idle));
        Texture.textures.set('jump', await PIXI.Assets.load(jump));
        Texture.textures.set('slip', await PIXI.Assets.load(slip));
        Texture.loaded = true;
    }
}