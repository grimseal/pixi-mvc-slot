import * as PIXI from "pixi.js";

export default class ButtonComponent {
    /**
     * @type {PIXI.Sprite}
     */
    sprite;

    /**
     * @returns {PIXI.Container}
     */
    get container() {
        return this.sprite;
    }

    constructor(position, texture) {
        const sprite = new PIXI.Sprite(texture);
        sprite.x = position.x;
        sprite.y = position.y;
        sprite.interactive = true;
        sprite.buttonMode = true;
        this.sprite = sprite;
    }

    addListener(fn, context) {
        this.sprite.addListener('pointerdown', fn, context);
    }

}