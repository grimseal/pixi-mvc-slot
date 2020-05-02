import * as PIXI from "pixi.js";

export default class SymbolComponent {

    /**
     * @type {PIXI.Sprite}
     */
    sprite;

    /**
     * @type {PIXI.filters.ColorMatrixFilter}
     */
    filter;

    /**
     *
     * @returns {PIXI.Container}
     */
    get container() {
        return this.sprite;
    };

    set y(value) {
        this.sprite.y = value;
    }

    get y() {
        return this.sprite.y;
    }

    constructor(texture, offset, width) {
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.y = offset;
        this.sprite.scale.x = this.sprite.scale.y = Math.min(width / this.sprite.width, width / this.sprite.height);
        this.sprite.x = Math.round((width - this.sprite.width) / 2);
        this.filter = new PIXI.filters.ColorMatrixFilter();
        this.sprite.filters = [this.filter];
    }

    updateTexture(texture, size) {
        const scale = Math.min(size / texture.width, size / texture.height);
        this.sprite.texture = texture;
        this.sprite.scale.x = scale;
        this.sprite.scale.y = scale;
        this.sprite.x = Math.round((size - this.sprite.width) / 2);
    }

    brightness(bright) {
        this.filter.reset();
        this.filter.brightness(bright, true);
    }


}