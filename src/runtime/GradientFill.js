'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function GradientFill(data) {
    this.colors = data.colors;
    this.type = data.type;
    this.startPoint = data.startPoint.length > 1 ? new AnimatedProperty(data.startPoint) : new Property(data.startPoint);
    this.endPoint = data.endPoint.length > 1 ? new AnimatedProperty(data.endPoint) : new Property(data.endPoint);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity);
}

GradientFill.prototype.setColor = function (ctx, time, transform) {

    var positionX = 0;
    var positionY = 0;

    if (transform.position) {
        var position = transform.position.getValue(time, ctx);
        positionX = position[0];
        positionY = position[1];
    } else {
        positionX = transform.positionX ? transform.positionX.getValue(time) : 0;
        positionY = transform.positionY ? transform.positionY.getValue(time) : 0;
    }

    var startPoint = this.startPoint.getValue(time);
    var endPoint = this.endPoint.getValue(time);

    var startX = startPoint[0] - positionX;
    var startY = startPoint[1] - positionY;
    var endX = endPoint[0] - positionX;
    var endY = endPoint[1] - positionY;

    var radius = 0;

    if (this.type === 'radial') {
        var distX = startX - endX;
        var distY = startY - endY;
        radius = Math.sqrt(distX * distX + distY * distY);
    }

    var gradient = this.type === 'radial' ?
        ctx.createRadialGradient(startX, startY, 0, startX, startY, radius) :
        ctx.createLinearGradient(startX, startY, endX, endY);

    var opacity = this.opacity ? this.opacity.getValue(time) : 1;

    gradient.addColorStop(0, 'rgba(' + this.colors[0][0] + ', ' + this.colors[0][1] + ', ' + this.colors[0][2] + ', ' + this.colors[0][3] * opacity + ')');
    gradient.addColorStop(1, 'rgba(' + this.colors[1][0] + ', ' + this.colors[1][1] + ', ' + this.colors[1][2] + ', ' + this.colors[1][3] * opacity + ')');
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