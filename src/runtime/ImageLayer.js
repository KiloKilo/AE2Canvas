'use strict';

var Transform = require('./Transform');
var Path = require('./Path');
var AnimatedPath = require('./AnimatedPath');

function ImageLayer(data, parentIn, parentOut, basePath) {

    this.isLoaded = false;

    this.index = data.index;
    this.source = basePath + data.source;
    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

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

ImageLayer.prototype.preload = function (cb) {
    this.img = new Image;
    this.img.onload = function () {
        this.isLoaded = true;
        if (typeof cb === 'function') {
            cb();
        }
    }.bind(this);

    this.img.src = this.source;
};

ImageLayer.prototype.draw = function (ctx, time) {

    if (!this.isLoaded) return;

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

    ctx.drawImage(this.img, 0, 0);

    ctx.restore();
};

ImageLayer.prototype.setParentTransform = function (ctx, time) {
    if (this.parent) this.parent.setParentTransform(ctx, time);
    this.transform.transform(ctx, time);
};

ImageLayer.prototype.setKeyframes = function (time) {
    this.transform.setKeyframes(time);
    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].setKeyframes(time);
        }
    }
};

ImageLayer.prototype.reset = function (reversed) {
    this.transform.reset(reversed);

    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].reset(reversed);
        }
    }
};

module.exports = ImageLayer;

























