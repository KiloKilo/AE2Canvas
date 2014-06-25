Transform = function (data) {
    if (!data) return null;

    this.name = data.name;

    if (data.anchor) {
        if (data.anchor.length > 1) this.anchor = new AnimatedProperty(data.anchor);
        else this.anchor = new Property(data.anchor);
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

};

Transform.prototype = {

    transform: function (ctx, time) {
        var anchor = this.anchor.getValue(time);
        var rotation = this.deg2rad(this.rotation.getValue(time));
        var skew = this.deg2rad(this.skew.getValue(time));
        var skewAxis = this.deg2rad(this.skewAxis.getValue(time));
        var positionX = this.positionX.getValue(time);
        var positionY = this.positionY.getValue(time);
        var scaleX = this.scaleX.getValue(time);
        var scaleY = this.scaleY.getValue(time);

        //order very very important :)
        ctx.transform(1, 0, 0, 1, positionX - anchor[0], positionY - anchor[1]);
        this.setRotation(ctx, rotation, anchor[0], anchor[1]);
        this.setSkew(ctx, skew, skewAxis, anchor[0], anchor[1]);
        this.setScale(ctx, scaleX, scaleY, anchor[0], anchor[1]);
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
}