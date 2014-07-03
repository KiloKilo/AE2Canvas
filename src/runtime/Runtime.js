'use strict';

var Group = require('./Group');

function Runtime(data) {
    if (!data) return;

    this.duration = data.duration;
    this.baseWidth = data.width;
    this.baseHeight = data.height;
    this.ratio = data.width / data.height;

    this.groups = [];
    for (var i = 0; i < data.groups.length; i++) {
        this.groups.push(new Group(data.groups[i]));
    }
    this.reset();
    this.started = false;

    console.log(this);
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
            }
        }
    },

    draw: function (time) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();

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

    setWidth: function (width) {
        this.canvas.width = width;
        this.canvas.height = width / this.ratio;

        var scaleFactor = width / this.baseWidth;
        console.log(scaleFactor);
    }
};

module.exports = Runtime;