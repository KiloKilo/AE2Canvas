'use strict';

var Path = require('./Path'),
    BezierEasing = require('../lib/BezierEasing');

function AnimatedPath(data) {

    if (!data) return null;

    Path.call(this, data);
    this.frameCount = this.frames.length;
}

AnimatedPath.prototype = Object.create(Path.prototype);

AnimatedPath.prototype.getValue = function (time) {
    if ((time <= this.nextFrame.t && !this.started) || this.finished) {
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
            }
        }
        return this.getValueAtTime(time);
    }
};

AnimatedPath.prototype.lerp = function (a, b, t) {
    return a + t * (b - a);
};

AnimatedPath.prototype.setEasing = function () {
    if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
        this.easing = new BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
    } else {
        this.easing = null;
    }
};

AnimatedPath.prototype.getValueAtTime = function (time) {
    var delta = ( time - this.lastFrame.t );
    var duration = this.nextFrame.t - this.lastFrame.t;
    var elapsed = delta / duration;
    if (elapsed > 1) elapsed = 1;
    else if (this.easing) elapsed = this.easing(elapsed);
    var actualVertices = [];

    for (var i = 0; i < this.verticesCount; i++) {
//        var cp1x = Math.round(this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed)),
//            cp1y = Math.round(this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed)),
//            cp2x = Math.round(this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed)),
//            cp2y = Math.round(this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed)),
//            x = Math.round(this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed)),
//            y = Math.round(this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed));

        var cp1x = this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed),
            cp1y = this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed),
            cp2x = this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed),
            cp2y = this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed),
            x = this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed),
            y = this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed);

        actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y]);
    }
    return actualVertices;
};

AnimatedPath.prototype.reset = function () {
    this.finished = false;
    this.started = false;
    this.pointer = 0;
    this.nextFrame = this.frames[this.pointer];
    this.lastFrame = this.nextFrame;
    this.easing = null;
};

module.exports = AnimatedPath;

























