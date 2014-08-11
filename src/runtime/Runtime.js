'use strict';

var Group = require('./Group');

function Runtime(data, canvas) {
    if (!data) return;

    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.duration = data.duration;
    this.baseWidth = data.width;
    this.baseHeight = data.height;
    this.ratio = data.width / data.height;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.baseWidth;
    this.buffer.height = this.baseHeight;
    this.bufferCtx = this.buffer.getContext('2d');

    this.groups = [];
    for (var i = 0; i < data.groups.length; i++) {
        this.groups.push(new Group(data.groups[i], this.bufferCtx));
    }
    this.reset();
    this.started = false;
    window.addEventListener('resize', this.setWidth.bind(this), false);
    this.setWidth();
}

Runtime.prototype = {

    start: function () {
        if (!this.started) {
            this.startTime = this.time;
            this.started = true;
        }
    },

    stop: function () {
        this.reset();
        this.draw();
        this.started = false;
    },

    pause: function () {
        if (this.started) {
            this.pausedTime = this.compTime;
            this.started = false;
        }
    },

    update: function (time) {
        this.time = time;
        if (this.started) {
            this.compTime = this.time - this.startTime + this.pausedTime;
            if (this.compTime <= this.duration) {
                this.draw();
            } else {
                this.stop();
                if (this.loop) this.start();
            }
        }
    },

    draw: function () {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
        for (var i = 0; i < this.groups.length; i++) {
            if (this.compTime >= this.groups[i].in &&
                this.compTime < this.groups[i].out) {
                this.groups[i].draw(this.ctx, this.compTime);
            }
        }
        this.ctx.restore();
    },

    reset: function () {
        this.startTime = 0;
        this.pausedTime = 0;
        this.compTime = 0;
        for (var i = 0; i < this.groups.length; i++) {
            this.groups[i].reset();
        }
    },

    setWidth: function () {
        var factor = 1;
        if (this.isHD) factor = 2;

        var width = this.canvas.getBoundingClientRect().width;
        console.log(width);

        this.canvas.width = width * factor;
        this.canvas.height = width / this.ratio * factor;
        this.scale = width / this.baseWidth * factor;
        this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
    }
};

module.exports = Runtime;