'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Transform(data) {
    if (!data) return null;

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

Transform.prototype = {

    transform: function (ctx, time) {
        var anchorX = this.anchorX.getValue(time),
            anchorY = this.anchorY.getValue(time),
            rotation = this.deg2rad(this.rotation.getValue(time)),
            skew = this.deg2rad(this.skew.getValue(time)),
            skewAxis = this.deg2rad(this.skewAxis.getValue(time)),
            positionX = this.positionX.getValue(time),
            positionY = this.positionY.getValue(time),
            scaleX = this.scaleX.getValue(time),
            scaleY = this.scaleY.getValue(time),
            opacity = this.opacity.getValue(time) * ctx.globalAlpha; // FIXME wrong transparency if nested

        console.log(scaleX, scaleY);

        //order very very important :)
        ctx.transform(1, 0, 0, 1, positionX - anchorX, positionY - anchorY);
        this.setRotation(ctx, rotation, anchorX, anchorY);
        this.setSkew(ctx, skew, skewAxis, anchorX, anchorY);
        this.setScale(ctx, scaleX, scaleY, anchorX, anchorY);
        ctx.globalAlpha = opacity;
    },

    setRotation: function (ctx, rad, x, y) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var dx = x - c * x + s * y;
        var dy = y - s * x - c * y;
        ctx.transform(c, s, -s, c, dx, dy);
    },

    setScale: function (ctx, sx, sy, x, y) {
        ctx.transform(sx, 0, 0, sy, -x * sx + x, -y * sy + y);
    },

    setSkew: function (ctx, skew, axis, x, y) {
        var t = Math.tan(-skew);
        this.setRotation(ctx, -axis, x, y);
        ctx.transform(1, 0, t, 1, -y * t, 0);
        this.setRotation(ctx, axis, x, y);
    },

    deg2rad: function (deg) {
        return deg * (Math.PI / 180);
    }
};

module.exports = Transform;