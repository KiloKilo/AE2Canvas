'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Transform(data) {
    if (!data) return;

    this.name = data.name;

    if (data.anchorX) {
        if (data.anchorX.length > 1) this.anchorX = new AnimatedProperty(data.anchorX);
        else this.anchorX = new Property(data.anchorX);
    }

    if (data.anchorY) {
        if (data.anchorY.length > 1) this.anchorY = new AnimatedProperty(data.anchorY);
        else this.anchorY = new Property(data.anchorY);
    }

    if (data.positionX) {
        if (data.positionX.length > 1) this.positionX = new AnimatedProperty(data.positionX);
        else this.positionX = new Property(data.positionX);
    }

    if (data.positionY) {
        if (data.positionY.length > 1) this.positionY = new AnimatedProperty(data.positionY);
        else this.positionY = new Property(data.positionY);
    }

    if (data.scaleX) {
        if (data.scaleX.length > 1) this.scaleX = new AnimatedProperty(data.scaleX);
        else this.scaleX = new Property(data.scaleX);
    }

    if (data.scaleY) {
        if (data.scaleY.length > 1) this.scaleY = new AnimatedProperty(data.scaleY);
        else this.scaleY = new Property(data.scaleY);
    }

    if (data.skew) {
        if (data.skew.length > 1) this.skew = new AnimatedProperty(data.skew);
        else this.skew = new Property(data.skew);
    }

    if (data.skewAxis) {
        if (data.skewAxis.length > 1) this.skewAxis = new AnimatedProperty(data.skewAxis);
        else this.skewAxis = new Property(data.skewAxis);
    }

    if (data.rotation) {
        if (data.rotation.length > 1) this.rotation = new AnimatedProperty(data.rotation);
        else this.rotation = new Property(data.rotation);
    }

    if (data.opacity) {
        if (data.opacity.length > 1) this.opacity = new AnimatedProperty(data.opacity);
        else this.opacity = new Property(data.opacity);
    }

}

Transform.prototype.transform = function (ctx, time) {
    var anchorX = this.anchorX ? this.anchorX.getValue(time) : 0,
        anchorY = this.anchorY ? this.anchorY.getValue(time) : 0,
        rotation = this.rotation ? this.deg2rad(this.rotation.getValue(time)) : 0,
        skew = this.skew ? this.deg2rad(this.skew.getValue(time)) : 0,
        skewAxis = this.skewAxis ? this.deg2rad(this.skewAxis.getValue(time)) : 0,
        positionX = this.positionX ? this.positionX.getValue(time) : 0,
        positionY = this.positionY ? this.positionY.getValue(time) : 0,
        scaleX = this.scaleX ? this.scaleX.getValue(time) : 1,
        scaleY = this.scaleY ? this.scaleY.getValue(time) : 1,
        opacity = this.opacity ? this.opacity.getValue(time) * ctx.globalAlpha : 1 * ctx.globalAlpha; // FIXME wrong transparency if nested

    //order very very important :)
    ctx.transform(1, 0, 0, 1, positionX - anchorX, positionY - anchorY);
    this.setRotation(ctx, rotation, anchorX, anchorY);
    this.setSkew(ctx, skew, skewAxis, anchorX, anchorY);
    this.setScale(ctx, scaleX, scaleY, anchorX, anchorY);
    ctx.globalAlpha = opacity;
};

Transform.prototype.setRotation = function (ctx, rad, x, y) {
    var c = Math.cos(rad);
    var s = Math.sin(rad);
    var dx = x - c * x + s * y;
    var dy = y - s * x - c * y;
    ctx.transform(c, s, -s, c, dx, dy);
};

Transform.prototype.setScale = function (ctx, sx, sy, x, y) {
    ctx.transform(sx, 0, 0, sy, -x * sx + x, -y * sy + y);
};

Transform.prototype.setSkew = function (ctx, skew, axis, x, y) {
    var t = Math.tan(-skew);
    this.setRotation(ctx, -axis, x, y);
    ctx.transform(1, 0, t, 1, -y * t, 0);
    this.setRotation(ctx, axis, x, y);
};

Transform.prototype.deg2rad = function (deg) {
    return deg * (Math.PI / 180);
};

Transform.prototype.reset = function () {
    if (this.anchorX) this.anchorX.reset();
    if (this.anchorY) this.anchorY.reset();
    if (this.rotation) this.rotation.reset();
    if (this.skew) this.skew.reset();
    if (this.skewAxis) this.skewAxis.reset();
    if (this.positionX) this.positionX.reset();
    if (this.positionY) this.positionY.reset();
    if (this.scaleX) this.scaleX.reset();
    if (this.scaleY) this.scaleY.reset();
    if (this.opacity) this.opacity.reset();
};

module.exports = Transform;