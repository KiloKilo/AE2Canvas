'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function GradientFill(data, gradients) {
    if (!gradients[data.name]) gradients[data.name] = [];
    gradients[data.name].push(this);

    this.stops = data.stops;
    this.type = data.type;
    this.startPoint = data.startPoint.length > 1 ? new AnimatedProperty(data.startPoint) : new Property(data.startPoint);
    this.endPoint = data.endPoint.length > 1 ? new AnimatedProperty(data.endPoint) : new Property(data.endPoint);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity);
}

GradientFill.prototype.setColor = function (ctx, time) {
    var startPoint = this.startPoint.getValue(time);
    var endPoint = this.endPoint.getValue(time);
    var radius = 0;

    if (this.type === 'radial') {
        var distX = startPoint[0] - endPoint[0];
        var distY = startPoint[1] - endPoint[1];
        radius = Math.sqrt(distX * distX + distY * distY);
    }

    var gradient = this.type === 'radial' ?
        ctx.createRadialGradient(startPoint[0], startPoint[1], 0, startPoint[0], startPoint[1], radius) :
        ctx.createLinearGradient(startPoint[0], startPoint[1], endPoint[0], endPoint[1]);

    var opacity = this.opacity ? this.opacity.getValue(time) : 1;

    for (var i = 0; i < this.stops.length; i++) {
        var stop = this.stops[i];
        var color = stop.color;
        gradient.addColorStop(stop.location, 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + color[3] * opacity + ')');
    }

    ctx.fillStyle = gradient;
};

GradientFill.prototype.setKeyframes = function (time) {
    if (this.opacity) this.opacity.setKeyframes(time);
    this.startPoint.setKeyframes(time);
    this.endPoint.setKeyframes(time);
};

GradientFill.prototype.reset = function (reversed) {
    if (this.opacity) this.opacity.setKeyframes(reversed);
    this.startPoint.setKeyframes(reversed);
    this.endPoint.setKeyframes(reversed);
};

module.exports = GradientFill;