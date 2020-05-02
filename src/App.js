import Game from "./model/Game";
import GameController from "./controller/GameController";

export default class App {
    constructor() {
        const betRequestUrl = 'https://www.bngtool.com/260b23a4df1396a6d67647ba3e50dca9/index.php';
        this.game = new Game(betRequestUrl);
        this.controller = new GameController(this.game);
    }

    async init() {
        await this.controller.init();
    }

}