import * as PIXI from 'pixi.js';
import PIXISound from 'pixi-sound';
import ReelComponent from "../component/ReelComponent";
import ButtonComponent from "../component/ButtonComponent";
import ActionQueue from "../helper/ActionQueue";
import Observable from "../helper/Observable";
import Coroutine from "../helper/Coroutine";
import Easing from "../helper/Easing";

const WINDOW_SIZE = {
    width: 1280,
    height: 720
};

const REEL_WIDTH = 180;

const assets = {
    sprites: {
        symbol1: "./assets/1.png",
        symbol2: "./assets/2.png",
        symbol3: "./assets/3.png",
        symbol4: "./assets/4.png",
        symbol5: "./assets/5.png",
        symbol6: "./assets/6.png",
        symbol7: "./assets/7.png",
        symbol8: "./assets/8.png",
        symbol9: "./assets/9.png",
        symbol10: "./assets/10.png",
        background: "./assets/background.png",
        buttonMinus: "./assets/btn_minus.png",
        buttonPlus: "./assets/btn_plus.png",
        buttonStart: "./assets/btn_start.png"
    },
    sounds: {
        bell: "./assets/bell.mp3",
        reelstop: "./assets/reelstop.mp3"
    }
};

export default class GameView extends Observable {

    /**
     * @private
     * @type {GameController}
     */
    controller;

    /**
     * @private
     * @type {Game}
     */
    game;

    /**
     * @private
     * @type {ReelComponent[]}
     */
    reels;

    /**
     * @private
     * @type {ActionQueue}
     */
    queue;

    /**
     * @private
     * @type {boolean}
     */
    isRunning;

    /**
     * @private
     * @type {ButtonComponent}
     */
    buttonStart;

    /**
     * @private
     * @type {ButtonComponent}
     */
    buttonPlus;

    /**
     * @private
     * @type {ButtonComponent}
     */
    buttonMinus;

    /**
     * @private
     * @type {PIXI.Text}
     */
    betText;

    /**
     * @private
     * @type {WinLine[]}
     */
    winLines;

    /**
     * @private
     * @type {Set}
     */
    routines;

    constructor(game, controller) {
        super();
        this.controller = controller;
        this.game = game;
        this.queue = new ActionQueue();

        const app = new PIXI.Application({
            backgroundColor: 0,
            width: WINDOW_SIZE.width,
            height: WINDOW_SIZE.height
        });
        document.body.appendChild(app.renderer.view);
        this.app = app;

        this.routines = new Set();

        this.app.ticker.add(() => {
            for (const routine of this.routines) routine.next();
        });

    }

    async init() {
        await this.loadAssets();
        this.buildStage();
        this.startObservers();
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async loadAssets() {
        await Promise.all([
            this.loadTextures(),
            this.loadSounds()
        ]);
    }

    /**
     * @private
     */
    buildStage() {
        this.buildBackground();
        this.buildReels();
        this.buildText();
        this.buildButtons();
    }

    /**
     * @private
     */
    startObservers() {
        this.game.on('betChange', bet => this.betChangeHandler(bet));
        this.game.on('boardChange', board => this.boardChangeHandler(board));
        this.game.on('winLinesChange', winLines => this.winLinesChangeHandler(winLines));
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    loadTextures() {
        return new Promise((resolve, reject) => {
            const spriteAssets = Object.entries(assets.sprites);
            for (const [name, url] of spriteAssets) this.app.loader.add(name, url);
            this.app.loader.load(() => {
                const textures = {};
                for (const [name] of spriteAssets)
                    textures[name] = PIXI.Texture.from(name);
                this.textures = textures;
                resolve();
            });
        });
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async loadSounds() {
        const soundAssets = Object.entries(assets.sounds);
        const sounds = {};
        const result = await Promise.all(soundAssets.map(([, url]) => this.loadSound(url)));
        for (let i = 0; i < soundAssets.length; i++) sounds[soundAssets[i][0]] = result[i];
        this.sounds = sounds;
    }

    /**
     * @private
     * @param {string} url
     * @returns {Promise<Sound>}
     */
    loadSound(url) {
        return new Promise((resolve, reject) => {
            PIXISound.sound.Sound.from({
                url,
                preload: true,
                loaded: function(err, sound) {
                    if (err) reject(err);
                    else resolve(sound);
                }
            });
        });
    }

    buildBackground() {
        const background = new PIXI.Sprite(this.textures.background);
        this.app.stage.addChild(background);
    }

    /**
     * @private
     */
    buildReels() {
        const reelCount = 5;
        const reels = [];
        const reelContainer = new PIXI.Container();
        reelContainer.x = (WINDOW_SIZE.width - REEL_WIDTH * reelCount) / 2;
        reelContainer.y = 70;

        const symbolTextures = Object.values(this.textures).slice(0, 10);
        const normalizeDelta = 1 / 60;
        for (let i = 0; i < reelCount; i++) {
            const reel = new ReelComponent(reelContainer, REEL_WIDTH, i * REEL_WIDTH, symbolTextures,
                this.sounds.reelstop);
            this.app.ticker.add(timeDelta => reel.update(timeDelta * normalizeDelta));
            reelContainer.addChild(reel.container);
            reels.push(reel);
        }
        this.reels = reels;

        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xFF3300);
        graphics.drawRect(reelContainer.x, reelContainer.y - 14, REEL_WIDTH * reelCount,
            REEL_WIDTH * 3 + 28);
        graphics.endFill();

        reelContainer.mask = graphics;

        this.app.stage.addChild(reelContainer);
    }

    /**
     * @private
     */
    buildText() {
        const betText = new PIXI.Text(this.game.bet.toString(), new PIXI.TextStyle({
            align: 'center',
            fontFamily: 'Arial',
            fontSize: 36,
            fontWeight: 'bold',
            fill: '#000',
            wordWrap: true,
            wordWrapWidth: 440,
        }));
        betText.anchor.set(0.5);
        betText.x = WINDOW_SIZE.width / 2 - 330 + 0.5;
        betText.y = WINDOW_SIZE.height - 45 + 0.5;
        this.app.stage.addChild(betText);
        this.betText = betText;

        const scoreText = new PIXI.Text("", new PIXI.TextStyle({
            align: 'center',
            fontFamily: 'Arial',
            fontSize: 128,
            fontWeight: 'bold',
            fill: ['#fff', '#f90'],
            stroke: '#530',
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: '#000',
            dropShadowAlpha: 0.5,
            dropShadowBlur: 4,
            wordWrap: true,
            wordWrapWidth: 440,
        }));
        scoreText.anchor.set(0.5);
        scoreText.x = WINDOW_SIZE.width / 2 ;
        scoreText.y = WINDOW_SIZE.height / 2 ;
        scoreText.scale.x = scoreText.scale.y = 0.25;
        this.app.stage.addChild(scoreText);
        this.scoreText = scoreText;
    }

    /**
     * @private
     */
    buildButtons() {
        const y = WINDOW_SIZE.height - 84;
        const middle = WINDOW_SIZE.width / 2;

        // minus button
        this.buttonMinus = new ButtonComponent({ x: middle - 450, y: y + 10 }, this.textures.buttonMinus);
        this.app.stage.addChild(this.buttonMinus.container);
        this.buttonMinus.addListener(() => {
            if (!this.isRunning) this.emit('decreaseBet');
        });

        // plus button
        this.buttonPlus = new ButtonComponent({ x: middle - 280, y: y + 10 }, this.textures.buttonPlus);
        this.app.stage.addChild(this.buttonPlus.container);
        this.buttonPlus.addListener(() => {
            if (!this.isRunning) this.emit('increaseBet');
        });

        // start button
        this.buttonStart = new ButtonComponent({ x: middle + 320, y }, this.textures.buttonStart);
        this.app.stage.addChild(this.buttonStart.container);
        this.buttonStart.addListener(() => {
            if (!this.isRunning) this.emit('makeBet')
        });

    }

    /**
     * @private
     * @param {number} bet
     */
    betChangeHandler(bet) {
        this.betText.text = bet.toString();
    }

    /**
     * @private
     * @param {number[]} board
     */
    boardChangeHandler(board) {
        if (board.length === 0) {
            this.queue.enqueue(() => this.start());
            return;
        }
        this.queue.enqueue(() => this.stop(board));
    }

    /**
     * @private
     * @param {WinLine[]} winLines
     */
    winLinesChangeHandler(winLines) {
        this.winLines = winLines;
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    start() {
        this.isRunning = true;
        const delay = 80;
        for (let i = 0; i < this.reels.length; i++) {
            const reel = this.reels[i];
            setTimeout(() => reel.startSpin(), i * delay);
        }
        return new Promise(resolve => setTimeout(resolve, delay * this.reels.length + 500));
    }
    /**
     * @private
     * @param {number[]} board
     * @returns {Promise<void>}
     */
    stop(board) {
        const promises = [];
        const delay = 80;
        for (let i = 0; i < this.reels.length; i++) {
            const reel = this.reels[i];
            promises.push(reel.stopSpin(board.slice(i * 3, i * 3 + 3), i * delay));
        }
        return Promise.all(promises)
            .then(() => this.winHandler())
            .then(() => {
                this.isRunning = false;
            });
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async winHandler() {
        const winLines = [...this.winLines];
        if (!winLines.length) return;

        this.sounds.bell.play();
        const winIndexes = new Set();
        for (const winLine of winLines) {
            for (const index of winLine.boardSymbolIndexes) {
                winIndexes.add(index);
            }
        }

        const win = Math.max(...this.winLines.map(l => l.win));
        const routine = Coroutine.routine(t => {
            this.scoreText.text = Coroutine.lerp(0, win, t).toFixed(0);
        }, Easing.linear(), () => this.routines.delete(routine), 800);
        this.routines.add(routine);

        const routine2 = Coroutine.routine(t => {
            this.scoreText.alpha = 1 - Math.pow(1 - Easing.sin(1)(t), 100);
            this.scoreText.scale.x = this.scoreText.scale.y = Coroutine.lerp(0.25, 1, Easing.backOut(1)(t));
        }, Easing.linear(), () => this.routines.delete(routine2), 1200);
        this.routines.add(routine2);

        const highlightMap = [...Array(3 * 5).keys()].map(i => winIndexes.has(i));
        await Promise.all(this.reels.map((reel, i) => reel.highlight(highlightMap.slice(i * 3, i * 3 + 3))));
    }
}