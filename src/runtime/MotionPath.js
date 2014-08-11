'use strict';

function MotionPath(startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY) {

    this.startX = startX;
    this.startY = startY;
    this.ctrl1X = ctrl1X;
    this.ctrl1Y = ctrl1Y;
    this.ctrl2X = ctrl2X;
    this.ctrl2Y = ctrl2Y;
    this.endX = endX;
    this.endY = endY;

}

MotionPath.prototype.getPosition = function (elapsed) {
    var x = this.cubicN(elapsed, this.startX, this.ctrl1X, this.ctrl2X, this.endX);
    var y = this.cubicN(elapsed, this.startY, this.ctrl1Y, this.ctrl2Y, this.endY);
    return {
        x: x,
        y: y
    };
};

MotionPath.prototype.cubicN = function (pct, a, b, c, d) {
    var t2 = pct * pct;
    var t3 = t2 * pct;
    return a + (-a * 3 + pct * (3 * a - a * pct)) * pct
        + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct
        + (c * 3 - c * 3 * pct) * t2
        + d * t3;
};

module.exports = MotionPath;

























