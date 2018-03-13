'use strict';

var Path = require('./Path');
var AnimatedPath = require('./AnimatedPath');
var Transform = require('./Transform');
var ImageLayer = require('./ImageLayer');
var TextLayer = require('./TextLayer');
var Group = require('./Group');

function Comp(data, bufferCtx, parentIn, parentOut, baseFont, gradients, imageBasePath) {
    this.index = data.index;
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

    this.layers = [];
    for (var i = 0; i < data.layers.length; i++) {
        if (data.layers[i].type === 'vector') {
            this.layers.push(new Group(data.layers[i], bufferCtx, 0, this.duration, gradients));
        } else if (data.layers[i].type === 'image') {
            this.layers.push(new ImageLayer(data.layers[i], 0, this.duration, imageBasePath));
        } else if (data.layers[i].type === 'text') {
            this.layers.push(new TextLayer(data.layers[i], 0, this.duration, baseFont));
        } else if (data.layers[i].type === 'comp') {
            this.layers.push(new Comp(data.layers[i], bufferCtx, 0, this.duration, this.baseFont, gradients, imageBasePath, baseFont));
        }
    }
    this.numLayers = this.layers.length;

    for (var j = 0; j < this.numLayers; j++) {
        var layer = this.layers[j];
        if (layer.parent) {
            for (var k = 0; k < this.layers.length; k++) {
                //TODO stop loop
                if (layer.parent === this.layers[k].index) {
                    layer.parent = this.layers[k];
                }
            }
        }
    }
}

Comp.prototype.draw = function (ctx, time) {

    ctx.save();

    var i;

    if (this.parent) this.parent.setParentTransform(ctx, time);
    this.transform.transform(ctx, time);

    if (this.masks) {
        ctx.beginPath();
        for (i = 0; i < this.masks.length; i++) {
            this.masks[i].draw(ctx, time);
        }
        ctx.clip();
    }

    var internalTime = time - this.in;
    for (i = 0; i < this.numLayers; i++) {
        if (internalTime >= this.layers[i].in && internalTime <= this.layers[i].out) {
            this.layers[i].draw(ctx, internalTime);
        }
    }

    ctx.restore();

};

Comp.prototype.setParentTransform = function (ctx, time) {
    if (this.parent) this.parent.setParentTransform(ctx, time);
    this.transform.transform(ctx, time);
    for (var i = 0; i < this.numLayers; i++) {
        this.layers[i].setParentTransform(ctx, time);
    }
};

Comp.prototype.setKeyframes = function (time) {
    this.transform.setKeyframes(time);
    for (var i = 0; i < this.numLayers; i++) {
        this.layers[i].setKeyframes(time);
    }
};

Comp.prototype.reset = function (reversed) {
    this.transform.reset(reversed);
    for (var i = 0; i < this.numLayers; i++) {
        this.layers[i].reset(this.reversed);
    }
};

module.exports = Comp;

























