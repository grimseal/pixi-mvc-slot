import * as PIXI from "pixi.js";
import Coroutine from "../helper/Coroutine";
import Easing from "../helper/Easing";
import SymbolComponent from "./SymbolComponent";

export default class ReelComponent {

    /**
     * @type {PIXI.Container}
     */
    container;

    position;

    /**
     * @type {SymbolComponent[]}
     */
    symbols;

    symbolSize;

    /**
     * @type {number[]|null}
     */
    targetSymbols;

    /**
     * @private
     * @type {PIXI.Texture[]}
     */
    symbolTextures;

    /**
     * @type {PIXI.filters.BlurFilter}
     */
    blur;

    speed = 0;

    maxSpeed = 10;

    acceleration = 20;

    symbolSeq = [];

    routine;

    stopSound;

    /**
     * @type {ReelState}
     */
    state;

    /**
     * @typedef {Symbol} ReelState
     **/

    /**
     * @readonly
     * @enum {ReelState}
     */
    static State = {
        // Idle: Symbol("Idle"),
        Starting: Symbol('Starting'),
        // Spin: Symbol("Spin"),
        Stopping: Symbol('Stopping')
    };

    constructor(parent, width, offset, symbolTextures, stopSound) {
        const container = new PIXI.Container();
        container.x = offset;

        this.state = ReelComponent.State.Stopping;
        this.container = container;
        this.position = 0;
        this.blur = new PIXI.filters.BlurFilter();
        this.symbolTextures = symbolTextures;
        this.symbolSize = width;
        this.stopSound = stopSound;

        this.blur.blurX = 0;
        this.blur.blurY = 0;
        container.filters = [this.blur];

        const symbols = [];
        for (let j = 0; j < 4; j++) {
            const symbol = new SymbolComponent(this.getRandomSymbolTexture(), j * width, width);
            symbols.push(symbol);
            container.addChild(symbol.container);
        }
        this.symbols = symbols;
    }

    update(timeDelta) {
        if (this.routine) this.routine.next();
        if (this.state === ReelComponent.State.Starting) this.position += this.speed * timeDelta;
        this.updateSymbols();
    }

    startSpin() {
        this.state = ReelComponent.State.Starting;
        const curSpeed = this.speed;
        const duration = this.maxSpeed / this.acceleration * 1000;
        this.routine = Coroutine.routine(t => {
            this.speed = Coroutine.lerp(curSpeed, this.maxSpeed, t);
        }, Easing.backIn(1), () => this.routine = null, duration);
    }

    stopSpin(symbols, startDelay) {
        const symbolSeq = [...symbols].reverse();
        return new Promise(resolve => {
            setTimeout(() => {
                this.symbolSeq = symbolSeq;
                this.state = ReelComponent.State.Stopping;

                const curPosition = this.position;
                const stopDuration = this.speed / this.acceleration;
                const finishPosition = Math.ceil(this.position + 3);
                const targetPosition = finishPosition - (0.5 * this.speed * stopDuration);
                const duration = (targetPosition - curPosition) / this.speed * 1000;

                this.routine = Coroutine.routine(t => {
                    this.position = Coroutine.lerp(curPosition, targetPosition, t)
                }, Easing.linear(), () => {
                    this.animateStop(stopDuration, finishPosition, resolve);
                }, duration);
            }, startDelay);
        });
    }

    /**
     * @param highlight
     * @returns {Promise<void>}
     */
    highlight(highlight) {
        return new Promise(resolve => {
            const targetSymbols = [...this.symbols].sort((a, b) => b.y - a.y).slice(0, 3).reverse();
            const light = targetSymbols.filter((sym, i) => highlight[i]);
            const dark = targetSymbols.filter((sym, i) => !highlight[i]);
            this.routine = Coroutine.routine(t => {
                const tLight = Easing.sin(3)(t);
                const tDark = Math.pow(1 - Easing.sin(1)(t), 8);
                for (const symbol of light) symbol.brightness(Coroutine.lerp(1, 2, tLight));
                for (const symbol of dark) symbol.brightness(Coroutine.lerp(0.33, 1, tDark));
            }, Easing.linear(), resolve, 1200);
        })
    }

    /**
     * @private
     */
    updateSymbols() {
        this.blur.blurY = this.speed;
        const size = this.symbolSize;

        // Update symbol positions on reel.
        for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];

            const yPrev = symbol.y;
            symbol.y = ((this.position + i) % this.symbols.length) * size - size;
            if (symbol.y < 0 && yPrev > size) {
                // Detect going over and swap a texture.
                // This should in proper product be determined from some logical reel.
                symbol.updateTexture(this.getNextSymbolTexture(), size);
            }
        }
    }

    /**
     * @private
     * @returns {PIXI.Texture}
     */
    getNextSymbolTexture() {
        if (!this.symbolSeq.length) return this.getRandomSymbolTexture();
        return this.symbolTextures[this.symbolSeq.shift()];
    }

    /**
     * @private
     * @param stopDuration
     * @param finishPosition
     * @param done
     */
    animateStop(stopDuration, finishPosition, done) {
        const curSpeed = this.speed;
        const curPosition = this.position;
        const duration = stopDuration * 1000;

        setTimeout(() => this.stopSound.play(), duration * 0.333);

        this.routine = Coroutine.routine(t => {
            this.position = Coroutine.lerp(curPosition, finishPosition, t);
            this.speed = Coroutine.lerp(curSpeed, 0, t);
        }, Easing.backOut(1), () => {
            this.routine = null;
            done();
        }, duration);
    }

    /**
     * @private
     * @returns {PIXI.Texture}
     */
    getRandomSymbolTexture() {
        return this.symbolTextures[Math.floor(Math.random() * this.symbolTextures.length)];
    }
}