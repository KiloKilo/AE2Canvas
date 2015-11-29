'use strict';

var Transform = require('./Transform');

function ImageLayer(data, bufferCtx, parentIn, parentOut, basePath) {

    this.isLoaded = false;

    this.name = data.name;
    this.source = basePath + data.source;

    this.img = new Image;
    this.img.onload = function () {
        this.isLoaded = true;
    }.bind(this);

    this.img.src = this.source;

    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

    this.transform = new Transform(data.transform);
    this.bufferCtx = bufferCtx;
}

ImageLayer.prototype.draw = function (ctx, time) {

    if (!this.isLoaded) return;

    ctx.save();
    this.transform.transform(ctx, time);

    ctx.drawImage(this.img, 0, 0);

    ctx.restore();
};

ImageLayer.prototype.setKeyframes = function (time) {
    this.transform.setKeyframes(time);
};

ImageLayer.prototype.reset = function (reversed) {
    this.transform.reset(reversed);
};

module.exports = ImageLayer;

























