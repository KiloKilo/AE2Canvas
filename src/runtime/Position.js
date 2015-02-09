'use strict';

var Bezier = require('./Bezier'),
    AnimatedProperty = require('./AnimatedProperty');

function Position(data) {
    AnimatedProperty.call(this, data);
}

Position.prototype = Object.create(AnimatedProperty.prototype);

Position.prototype.setMotionPath = function () {
    if (this.lastFrame.motionpath) {
        this.motionpath = new Bezier(this.lastFrame.motionpath);
        this.motionpath.getLength(this.lastFrame.len);
    } else {
        this.motionpath = null;
    }
};

Position.prototype.getValue = function (time) {
    if (this.finished || (time <= this.nextFrame.t && !this.started)) {
        return this.nextFrame.v;
    } else {
        this.started = true;
        if (time > this.nextFrame.t) {
            if (this.pointer + 1 === this.frameCount) {
                this.finished = true;
            } else {
                this.lastFrame = this.nextFrame;
                this.pointer++;
                this.nextFrame = this.frames[this.pointer];
                this.setEasing();
                this.setMotionPath();
            }
        }
        return this.getValueAtTime(time);
    }
};

Position.prototype.getValueAtTime = function (time) {
    if (this.motionpath) {
        return this.motionpath.getValues(this.getElapsed(time));
    } else {
        return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
    }
};

module.exports = Position;

























