import Queue from './Queue';

export default class ActionQueue {


    /**
     * @private
     * @type {Queue<function>}
     */
    queue;

    constructor() {
        this.queue = new Queue();
    }

    /**
     *
     * @param {function:Promise} action
     */
    enqueue(action) {
        const empty = this.queue.isEmpty();
        this.enqueueCommand(action);
        if (empty) this.next();
    }

    /**
     * @private
     * @param action
     */
    enqueueCommand(action) {
        this.queue.enqueue(async () => {
            await action();
            this.queue.dequeue();
            this.next();
        });
    }

    /**
     * @private
     */
    next() {
        const handle = this.queue.peek();
        if (handle instanceof Function) handle();
    }
}