'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Polystar(data) {
    this.name = data.name;
    this.closed = true; // TODO ??

    this.starType = data.starType;
    this.points = data.points.length > 1 ? new AnimatedProperty(data.points) : new Property(data.points);
    this.innerRadius = data.innerRadius.length > 1 ? new AnimatedProperty(data.innerRadius) : new Property(data.innerRadius);
    this.outerRadius = data.outerRadius.length > 1 ? new AnimatedProperty(data.outerRadius) : new Property(data.outerRadius);

    //optinals
    if (data.position) this.position = data.position.length > 1 ? new AnimatedProperty(data.position) : new Property(data.position);
    if (data.rotation) this.rotation = data.rotation.length > 1 ? new AnimatedProperty(data.rotation) : new Property(data.rotation);
    if (data.innerRoundness) this.innerRoundness = data.innerRoundness.length > 1 ? new AnimatedProperty(data.innerRoundness) : new Property(data.innerRoundness);
    if (data.outerRoundness) this.outerRoundness = data.outerRoundness.length > 1 ? new AnimatedProperty(data.outerRoundness) : new Property(data.outerRoundness);
}

Polystar.prototype.draw = function (ctx, time) {

    var points = this.points.getValue(time),
        innerRadius = this.innerRadius.getValue(time),
        outerRadius = this.outerRadius.getValue(time),
        position = this.position ? this.position.getValue(time) : [0, 0],
        rotation = this.rotation ? this.rotation.getValue(time) : 0,
        innerRoundness = this.innerRoundness ? this.innerRoundness.getValue(time) : 0,
        outerRoundness = this.outerRoundness ? this.outerRoundness.getValue(time) : 0;

    rotation = this.deg2rad(rotation);
    var start = this.rotatePoint(0, 0, 0, 0 - outerRadius, rotation);

    ctx.save();
    ctx.beginPath();
    ctx.translate(position[0], position[1]);
    ctx.moveTo(start[0], start[1]);

    for (var i = 0; i < points; i++) {

        var pInner,
            pOuter,
            pOuter1Tangent,
            pOuter2Tangent,
            pInner1Tangent,
            pInner2Tangent,
            outerOffset,
            innerOffset,
            rot;

        rot = Math.PI / points * 2;

        pInner = this.rotatePoint(0, 0, 0, 0 - innerRadius, (rot * (i + 1) - rot / 2) + rotation);
        pOuter = this.rotatePoint(0, 0, 0, 0 - outerRadius, (rot * (i + 1)) + rotation);

        //FIxME
        if (!outerOffset) outerOffset = (start[0] + pInner[0]) * outerRoundness / 100 * .5522848;
        if (!innerOffset) innerOffset = (start[0] + pInner[0]) * innerRoundness / 100 * .5522848;

        pOuter1Tangent = this.rotatePoint(0, 0, outerOffset, 0 - outerRadius, (rot * i) + rotation);
        pInner1Tangent = this.rotatePoint(0, 0, innerOffset * -1, 0 - innerRadius, (rot * (i + 1) - rot / 2) + rotation);
        pInner2Tangent = this.rotatePoint(0, 0, innerOffset, 0 - innerRadius, (rot * (i + 1) - rot / 2) + rotation);
        pOuter2Tangent = this.rotatePoint(0, 0, outerOffset * -1, 0 - outerRadius, (rot * (i + 1)) + rotation);

        if (this.starType === 1) {
            //star
            ctx.bezierCurveTo(pOuter1Tangent[0], pOuter1Tangent[1], pInner1Tangent[0], pInner1Tangent[1], pInner[0], pInner[1]);
            ctx.bezierCurveTo(pInner2Tangent[0], pInner2Tangent[1], pOuter2Tangent[0], pOuter2Tangent[1], pOuter[0], pOuter[1]);
        } else {
            //polygon
            ctx.bezierCurveTo(pOuter1Tangent[0], pOuter1Tangent[1], pOuter2Tangent[0], pOuter2Tangent[1], pOuter[0], pOuter[1]);
        }

        //debug
        //ctx.fillStyle = "black";
        //ctx.fillRect(pInner[0], pInner[1], 5, 5);
        //ctx.fillRect(pOuter[0], pOuter[1], 5, 5);
        //ctx.fillStyle = "blue";
        //ctx.fillRect(pOuter1Tangent[0], pOuter1Tangent[1], 5, 5);
        //ctx.fillStyle = "red";
        //ctx.fillRect(pInner1Tangent[0], pInner1Tangent[1], 5, 5);
        //ctx.fillStyle = "green";
        //ctx.fillRect(pInner2Tangent[0], pInner2Tangent[1], 5, 5);
        //ctx.fillStyle = "brown";
        //ctx.fillRect(pOuter2Tangent[0], pOuter2Tangent[1], 5, 5);

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

Polystar.prototype.deg2rad = function (deg) {
    return deg * (Math.PI / 180);
};

Polystar.prototype.reset = function (reversed) {
    this.points.reset(reversed);
    this.innerRadius.reset(reversed);
    this.outerRadius.reset(reversed);
    if (this.position) this.position.reset(reversed);
    if (this.rotation) this.rotation.reset(reversed);
    if (this.innerRoundness) this.innerRoundness.reset(reversed);
    if (this.outerRoundness) this.outerRoundness.reset(reversed);
};

module.exports = Polystar;