'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Polystar(data) {
    this.name = data.name;
    this.closed = true;

    this.starType = data.starType;

    if (data.points.length > 1) this.points = new AnimatedProperty(data.points);
    else this.points = new Property(data.points);

    if (data.position.length > 1) this.position = new AnimatedProperty(data.position);
    else this.position = new Property(data.position);

    if (data.rotation.length > 1) this.rotation = new AnimatedProperty(data.rotation);
    else this.rotation = new Property(data.rotation);

    if (data.innerRadius.length > 1) this.innerRadius = new AnimatedProperty(data.innerRadius);
    else this.innerRadius = new Property(data.innerRadius);

    if (data.outerRadius.length > 1) this.outerRadius = new AnimatedProperty(data.outerRadius);
    else this.outerRadius = new Property(data.outerRadius);

    if (data.innerRoundness.length > 1) this.innerRoundness = new AnimatedProperty(data.innerRoundness);
    else this.innerRoundness = new Property(data.innerRoundness);

    if (data.outerRoundness.length > 1) this.outerRoundness = new AnimatedProperty(data.outerRoundness);
    else this.outerRoundness = new Property(data.outerRoundness);

//    console.log(this.position);
}

Polystar.prototype.draw = function (ctx, time) {

//    console.log(this.position);

    var points = this.points.getValue(time),
        position = this.position.getValue(time),
        innerRadius = this.innerRadius.getValue(time),
        outerRadius = this.outerRadius.getValue(time),
        innerRoundness = this.innerRoundness.getValue(time),
        outerRoundness = this.outerRoundness.getValue(time);

    var x = position[0],
        y = position[1],
        bezierOffset = outerRadius / 2;

    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0, 0 - outerRadius);

    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0 - outerRadius, 5, 5);
    ctx.restore();

    for (var i = 0; i < points; i++) {
        ctx.rotate(Math.PI / points);

        var b1x = this.rotatePoint(0, 0, bezierOffset, 0 - outerRadius, -1 * Math.PI / points)[0],
            b1y = this.rotatePoint(0, 0, bezierOffset, 0 - outerRadius, -1 * Math.PI / points)[1],
            b2x = 0,
            b2y = 0 - innerRadius;

        ctx.bezierCurveTo(b1x, b1y, b2x, b2y, 0, 0 - innerRadius);

        ctx.save();
        ctx.fillStyle = "blue";
        ctx.fillRect(b1x, b1y, 5, 5);
        ctx.fillRect(b2x, b2y, 5, 5);
        ctx.restore();

//            break;

        ctx.rotate(Math.PI / points);

        var b3x = 0,
            b3y = 0 - innerRadius,
            b4x = -bezierOffset,
            b4y = 0 - outerRadius;

        ctx.bezierCurveTo(b3x, b3y, b4x, b4y, 0, 0 - outerRadius);

        ctx.save();
        ctx.fillStyle = "green";
        ctx.fillRect(b3x, b3y, 5, 5);
        ctx.fillRect(b4x, b4y, 5, 5);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0 - outerRadius, 5, 5);
        ctx.restore();

//            break;

    }
    ctx.restore();
};

Polystar.prototype.rotatePoint = function (cx, cy, x, y, radians) {
    var cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) - (sin * (y - cy)) + cx,
        ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
    return [nx, ny];
};

Polystar.prototype.reset = function () {
    this.points.reset();
    this.position.reset();
    this.innerRadius.reset();
    this.outerRadius.reset();
    this.innerRoundness.reset();
    this.outerRoundness.reset();
};

module.exports = Polystar;