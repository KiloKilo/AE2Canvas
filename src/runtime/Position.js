'use strict';

var AnimatedProperty = require('./AnimatedProperty');

function Position(data) {
    AnimatedProperty.call(this, data);
}

Position.prototype = Object.create(AnimatedProperty.prototype);

Position.prototype.getValueAtTime = function (time) {
//    console.log(this.getElapsed(time));
    if (this.lastFrame.motionpath) {
        console.log(this.lastFrame.motionpath);
        var x = this.cubicN(this.getElapsed(time), this.lastFrame.motionpath[0], this.lastFrame.motionpath[2], this.lastFrame.motionpath[4], this.lastFrame.motionpath[6]),
            y = this.cubicN(this.getElapsed(time), this.lastFrame.motionpath[1], this.lastFrame.motionpath[3], this.lastFrame.motionpath[5], this.lastFrame.motionpath[7]);

        return [x, y];
    } else {
        return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
    }
};

Position.prototype.cubicN = function (pct, a, b, c, d) {
    var t2 = pct * pct;
    var t3 = t2 * pct;
    return a + (-a * 3 + pct * (3 * a - a * pct)) * pct
        + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct
        + (c * 3 - c * 3 * pct) * t2
        + d * t3;
};

module.exports = Position;

























