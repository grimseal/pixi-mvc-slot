export default class WinLine {

    /**
     * @type {number}
     */
    num;

    /**
     * @type {number}
     */
    win;

    /**
     * @type {number[]}
     */
    boardSymbolIndexes;


    constructor(num, win, board) {
        this.num = num;
        this.win = win;
        this.boardSymbolIndexes = board;
    }


    static deserialize(string) {
        const [num, win, board] = string.split("~");
        return new WinLine(+num, +win, board.split(',').map(v => +v));
    }
}