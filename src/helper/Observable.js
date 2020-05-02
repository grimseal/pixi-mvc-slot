export default class Observable {

    /**
     * @private
     * @type {Map<string, Set<function>>}
     */
    observers = new Map();

    on(eventName, fn) {
        if (!this.observers.has(eventName)) this.observers.set(eventName, new Set());
        this.observers.get(eventName).add(fn);
    }

    emit(eventName, eventValue) {
        if (!this.observers.has(eventName)) return;
        const observers = this.observers.get(eventName);
        for (const observer of observers) observer(eventValue);
    }
}