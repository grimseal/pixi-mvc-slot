import GameView from "../view/GameView";

export default class GameController {
    /**
     * @type {Game}
     */
    game;

    /**
     * @type {GameView}
     */
    view;

    constructor(game) {
        this.game = game;
        this.view = new GameView(this.game, this);
    }

    async init() {
        await this.view.init();
        this.addListeners();
    }

    addListeners() {
        this.view.on('makeBet', () => this.game.makeBet());
        this.view.on('increaseBet', () => this.game.increaseBet());
        this.view.on('decreaseBet', () => this.game.decreaseBet());
    }

}