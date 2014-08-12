'use strict';

var AnimatedProperty = require('./AnimatedProperty'),
    MotionPath = require('./MotionPath');

function Position(data) {
    AnimatedProperty.call(this, data);
}

Position.prototype = Object.create(AnimatedProperty.prototype);

Position.prototype.setMotionPath = function () {
    if (this.nextFrame.inTangent) {
        this.motionPath = new MotionPath(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
    } else {
        this.motionPath = null;
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
    var delta = ( time - this.lastFrame.t );
    var duration = this.nextFrame.t - this.lastFrame.t;
    var elapsed = delta / duration;
    if (elapsed > 1) elapsed = 1;
    else if (this.easing) elapsed = this.easing(elapsed);
    return this.lerp(this.lastFrame.v, this.nextFrame.v, elapsed);
};

Position.prototype.reset = function () {
    AnimatedProperty.prototype.reset.call(this);
    this.motionPath = null;
};

module.exports = Position;