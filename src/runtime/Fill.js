'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Fill(data) {
    if (data.color.length > 1) this.color = new AnimatedProperty(data.color);
    else this.color = new Property(data.color);
    if (data.opacity.length > 1) this.opacity = new AnimatedProperty(data.opacity);
    else this.opacity = new Property(data.opacity);
}

Fill.prototype.getValue = function (time) {
    var color = this.color.getValue(time);
    var opacity = this.opacity.getValue(time);
    return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
};

Fill.prototype.setColor = function (ctx, time) {
    var color = this.getValue(time);
    ctx.fillStyle = color;
};

Fill.prototype.reset = function () {
    this.color.reset();
    this.opacity.reset();
};

module.exports = Fill;