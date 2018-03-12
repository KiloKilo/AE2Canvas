'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function DropShadow(data) {
    this.color = data.color.length > 1 ? new AnimatedProperty(data.color) : new Property(data.color);
    this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity);
    this.direction = data.direction.length > 1 ? new AnimatedProperty(data.direction) : new Property(data.direction);
    this.distance = data.distance.length > 1 ? new AnimatedProperty(data.distance) : new Property(data.distance);
    this.softness = data.softness.length > 1 ? new AnimatedProperty(data.softness) : new Property(data.softness);
}

DropShadow.prototype.getColor = function (time) {
    var color = this.color.getValue(time);
    var opacity = this.opacity.getValue(time);
    return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
};

DropShadow.prototype.setShadow = function (ctx, time) {
    var color = this.getColor(time);
    var dist = this.distance.getValue(time);
    ctx.shadowColor = color;
    ctx.shadowOffsetX = dist;
    ctx.shadowOffsetY = dist;
    ctx.shadowBlur = this.softness.getValue(time);
};

DropShadow.prototype.setKeyframes = function (time) {
    this.color.setKeyframes(time);
    this.opacity.setKeyframes(time);
    this.direction.setKeyframes(time);
    this.distance.setKeyframes(time);
    this.softness.setKeyframes(time);
};

DropShadow.prototype.reset = function (reversed) {
    this.color.reset(reversed);
    this.opacity.reset(reversed);
    this.direction.reset(reversed);
    this.distance.reset(reversed);
    this.softness.reset(reversed);
};

module.exports = DropShadow;