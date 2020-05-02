export default class Coroutine {
    /**
     *
     * @param {function(number)} action
     * @param {function} easing
     * @param {function|number} callback
     * @param {number=} duration
     * @returns {IterableIterator<number>}
     */
    static *routine(action, easing, callback, duration)
    {
        if (!(callback instanceof Function)) {
            duration = callback;
            callback = null;
        }
        const startTime = Date.now();
        const endTime = startTime + duration;
        const timeStep = 1 / duration;
        let time = startTime;
        while (time < endTime) {
            action(easing((time - startTime) * timeStep));
            yield 0;
            time = Date.now();
        }

        action(easing(1));
        if (callback instanceof Function) callback();
    }

    static lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }



}
