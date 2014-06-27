'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Rect(data) {
    this.name = data.name;

    if (data.size.length > 1) this.size = new AnimatedProperty(data.size);
    else this.size = new Property(data.size);

    if (data.position.length > 1) this.position = new AnimatedProperty(data.position);
    else this.position = new Property(data.position);

    if (data.roundness.length > 1) this.roundness = new AnimatedProperty(data.roundness);
    else this.roundness = new Property(data.roundness);

}

Rect.prototype = {
    draw: function (ctx, time) {

        var size = this.size.getValue(time),
            position = this.position.getValue(time),
            roundness = this.roundness.getValue(time);

        if (size[0] < 2 * roundness) roundness = size[0] / 2;
        if (size[1] < 2 * roundness) roundness = size[1] / 2;

        var x = position[0] - size[0] / 2,
            y = position[1] - size[1] / 2;

        ctx.beginPath();
        ctx.moveTo(x + roundness, y);
        ctx.arcTo(x + size[0], y, x + size[0], y + size[1], roundness);
        ctx.arcTo(x + size[0], y + size[1], x, y + size[1], roundness);
        ctx.arcTo(x, y + size[1], x, y, roundness);
        ctx.arcTo(x, y, x + size[0], y, roundness);
        ctx.closePath();

    }
};

module.exports = Rect;