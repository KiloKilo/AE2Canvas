'use strict';

var Group = require('./Group');

function Runtime(data) {
    if (!data) return;

    this.isHD = ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));

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

    draw: function () {
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
        var scaleFactor;
        if (this.isHD) {
            this.canvas.width = width * 2;
            this.canvas.height = width / this.ratio * 2;
            scaleFactor = width / this.baseWidth * 2;
        } else {
            this.canvas.width = width;
            this.canvas.height = width / this.ratio;
            scaleFactor = width / this.baseWidth;
        }

        this.ctx.transform(scaleFactor, 0, 0, scaleFactor, 0, 0);
    }



};

module.exports = Runtime;