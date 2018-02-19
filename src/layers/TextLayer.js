'use strict';

var Transform = require('../transform/Transform');
var Path = require('../objects/Path');
var AnimatedPath = require('../objects/AnimatedPath');

function TextLayer(data, parentIn, parentOut, baseFont) {
    this.index = data.index;
    this.text = data.text;
    this.leading = data.leading;
    this.fontSize = data.fontSize;
    this.font = data.font;
    this.color = data.color;
    this.justification = data.justification;
    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;
    this.baseFont = baseFont;

    if (data.parent) this.parent = data.parent;
    this.transform = new Transform(data.transform);

    if (data.masks) {
        this.masks = [];
        for (var k = 0; k < data.masks.length; k++) {
            var mask = data.masks[k];
            if (mask.isAnimated) this.masks.push(new AnimatedPath(mask));
            else this.masks.push(new Path(mask));
        }
    }
}

TextLayer.prototype.draw = function (ctx, time) {

    ctx.save();
    if (this.parent) this.parent.setParentTransform(ctx, time);
    this.transform.transform(ctx, time);

    if (this.masks) {
        ctx.beginPath();
        for (var i = 0; i < this.masks.length; i++) {
            this.masks[i].draw(ctx, time);
        }
        ctx.clip();
    }

    ctx.textAlign = this.justification;
    ctx.font = this.fontSize + 'px ' + this.baseFont || this.font;
    ctx.fillStyle = 'rgb(' + this.color[0] + ', ' + this.color[1] + ', ' + this.color[2] + ')';
    for (var j = 0; j < this.text.length; j++) {
        ctx.fillText(this.text[j], 0, j * this.leading);
    }

    ctx.restore();
};

TextLayer.prototype.setParentTransform = function (ctx, time) {
    if (this.parent) this.parent.setParentTransform(ctx, time);
    this.transform.transform(ctx, time);
};

TextLayer.prototype.setKeyframes = function (time) {
    this.transform.setKeyframes(time);
    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].setKeyframes(time);
        }
    }
};

TextLayer.prototype.reset = function (reversed) {
    this.transform.reset(reversed);

    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].reset(reversed);
        }
    }
};

module.exports = TextLayer;

























