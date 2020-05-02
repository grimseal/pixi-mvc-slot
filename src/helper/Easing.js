export default class Easing {

    static linear() {
        return t => t;
    }

    static backOut(amount) {
        return t => --t * t * ((amount + 1) * t + amount) + 1;
    }

    static backIn(amount) {
        return t => t * t * ((amount + 1) * t - amount);
    }

    static sin(amount) {
        return t => 1 - Math.abs(Math.sin(Math.PI * t * amount - Math.PI / 2));
    }
}