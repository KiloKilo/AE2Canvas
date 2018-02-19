class Bezier {

    constructor(path) {
        this.path = path;
    }

    getLength(len) {
        this.steps = Math.max(Math.floor(len / 10), 1);
        this.arcLengths = new Array(this.steps + 1);
        this.arcLengths[0] = 0;

        let ox = this.cubicN(0, this.path[0], this.path[2], this.path[4], this.path[6]);
        let oy = this.cubicN(0, this.path[1], this.path[3], this.path[5], this.path[7]);
        let clen = 0;
        const iterator = 1 / this.steps;

        for (let i = 1; i <= this.steps; i += 1) {
            const x = this.cubicN(i * iterator, this.path[0], this.path[2], this.path[4], this.path[6]);
            const y = this.cubicN(i * iterator, this.path[1], this.path[3], this.path[5], this.path[7]);
            const dx = ox - x;
            const dy = oy - y;

            clen += Math.sqrt(dx * dx + dy * dy);
            this.arcLengths[i] = clen;

            ox = x;
            oy = y;
        }

        this.length = clen;
    }

    map(u) {
        const targetLength = u * this.arcLengths[this.steps];
        let low = 0;
        let high = this.steps;
        let index = 0;

        while (low < high) {
            index = low + (((high - low) / 2) | 0);
            if (this.arcLengths[index] < targetLength) {
                low = index + 1;

            } else {
                high = index;
            }
        }
        if (this.arcLengths[index] > targetLength) {
            index--;
        }

        const lengthBefore = this.arcLengths[index];
        if (lengthBefore === targetLength) {
            return index / this.steps;
        } else {
            return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.steps;
        }
    }

    getValues(elapsed) {
        const t = this.map(elapsed);
        const x = this.cubicN(t, this.path[0], this.path[2], this.path[4], this.path[6]);
        const y = this.cubicN(t, this.path[1], this.path[3], this.path[5], this.path[7]);

        return [x, y];
    }

    cubicN(pct, a, b, c, d) {
        const t2 = pct * pct;
        const t3 = t2 * pct;
        return a + (-a * 3 + pct * (3 * a - a * pct)) * pct
            + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct
            + (c * 3 - c * 3 * pct) * t2
            + d * t3;
    }
}

export default Bezier;