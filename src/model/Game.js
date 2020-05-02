import Observable from "../helper/Observable";
import WinLine from "./WinLine";
import mock from "../mock";

function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export default class Game extends Observable {

    /**
     * @type {string}
     */
    url;

    /**
     * @type {number}
     */
    bet = 1;

    /**
     * @type {number}
     */
    win = 0;

    /**
     * @type {number[]}
     */
    board = [];

    /**
     * @type {WinLine[]}
     */
    winLines = [];

    /**
     * @param {string} url
     */
    constructor(url) {
        super();
        this.url = url;
    }


    dropState() {
        this.win = 0;
        this.updateBoard([]);
        this.updateWinLines({});
    }

    increaseBet() {
        this.setBet(Math.min(this.bet + 1, 10));
    }

    decreaseBet() {
        this.setBet(Math.max(this.bet - 1, 1));
    }

    updateBoard(board) {
        this.board = board;
        this.emit('boardChange', this.board);
    }

    updateWinLines(winLines) {
        this.winLines = winLines;
        this.emit('winLinesChange', this.winLines);
    }

    setBet(bet) {
        this.bet = bet;
        this.emit('betChange', this.bet);
    }

    async makeBet() {
        if (this.bet <= 0) return;
        this.dropState();
        const json = await this.makeRequest();
        this.win = json.win;
        this.updateBoard(json.board.split(',').map(v => v - 1));
        this.updateWinLines(json.winlines.map(data => WinLine.deserialize(data)));
    }

    /**
     * @private
     * @returns {Promise}
     */
    async makeRequest() {
        const url = new URL(this.url);
        const params = { action: 'bet', bet: this.bet };
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value.toString()));
        let tryCount = 3;
        while (true) {
            try {
                const response = await fetch(url.toString());
                if (response.status === 200) return await response.json();
            } catch (e) {
                if (tryCount <= 0) return mock[random(0, mock.length - 1)];
            }
            await wait(250);
            tryCount--;
        }
    }

}