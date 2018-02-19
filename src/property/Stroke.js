'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Stroke(data) {
    if (data) {
        this.join = data.join;
        this.cap = data.cap;

        if (data.miterLimit) {
            if (data.miterLimit.length > 1) this.miterLimit = new AnimatedProperty(data.miterLimit);
            else this.miterLimit = new Property(data.miterLimit);
        }

        if (data.color.length > 1) this.color = new AnimatedProperty(data.color);
        else this.color = new Property(data.color);

        if (data.opacity.length > 1) this.opacity = new AnimatedProperty(data.opacity);
        else this.opacity = new Property(data.opacity);

        if (data.width.length > 1) this.width = new AnimatedProperty(data.width);
        else this.width = new Property(data.width);

        if (data.dashes) {
            this.dashes = {};

            if (data.dashes.dash.length > 1) this.dashes.dash = new AnimatedProperty(data.dashes.dash);
            else this.dashes.dash = new Property(data.dashes.dash);

            if (data.dashes.gap.length > 1) this.dashes.gap = new AnimatedProperty(data.dashes.gap);
            else this.dashes.gap = new Property(data.dashes.gap);

            if (data.dashes.offset.length > 1) this.dashes.offset = new AnimatedProperty(data.dashes.offset);
            else this.dashes.offset = new Property(data.dashes.offset);
        }
    }
}

Stroke.prototype.getValue = function (time) {
    var color = this.color.getValue(time);
    var opacity = this.opacity.getValue(time);
    color[0] = Math.round(color[0]);
    color[1] = Math.round(color[1]);
    color[2] = Math.round(color[2]);
    var s = color.join(', ');

    return 'rgba(' + s + ', ' + opacity + ')';
};

Stroke.prototype.setStroke = function (ctx, time) {
    var strokeColor = this.getValue(time);
    var strokeWidth = this.width.getValue(time);
    var strokeJoin = this.join;
    if (strokeJoin === 'miter') var miterLimit = this.miterLimit.getValue(time);

    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = strokeJoin;
    if (miterLimit) ctx.miterLimit = miterLimit;
    ctx.lineCap = this.cap;
    ctx.strokeStyle = strokeColor;

    if (this.dashes) {
        ctx.setLineDash([
            this.dashes.dash.getValue(time),
            this.dashes.gap.getValue(time)
        ]);
        ctx.lineDashOffset = this.dashes.offset.getValue(time);
    }
};

Stroke.prototype.setKeyframes = function (time) {
    this.color.setKeyframes(time);
    this.opacity.setKeyframes(time);
    this.width.setKeyframes(time);
    if (this.miterLimit) this.miterLimit.setKeyframes(time);
    if (this.dashes) {
        this.dashes.dash.setKeyframes(time);
        this.dashes.gap.setKeyframes(time);
        this.dashes.offset.setKeyframes(time);
    }
};

Stroke.prototype.reset = function (reversed) {
    this.color.reset(reversed);
    this.opacity.reset(reversed);
    this.width.reset(reversed);
    if (this.miterLimit) this.miterLimit.reset(reversed);
    if (this.dashes) {
        this.dashes.dash.reset(reversed);
        this.dashes.gap.reset(reversed);
        this.dashes.offset.reset(reversed);
    }
};

module.exports = Stroke;