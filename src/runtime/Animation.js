'use strict';

var Group = require('./Group');

function Animation(data, canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.duration = data.duration;
    this.baseWidth = data.width;
    this.baseHeight = data.height;
    this.ratio = data.width / data.height;

    this.markers = data.markers;

    this.canvas.width = this.baseWidth;
    this.canvas.height = this.baseHeight;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.baseWidth;
    this.buffer.height = this.baseHeight;
    this.bufferCtx = this.buffer.getContext('2d');

    this.groups = [];
    for (var i = 0; i < data.groups.length; i++) {
        this.groups.push(new Group(data.groups[i], this.bufferCtx));
    }

    this.fluid = true;

    this.reset();
    this.resize();
    this.started = false;
}

Animation.prototype = {

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

    gotoAndPlay: function (id) {
        var marker = this.getMarker(id);
    },

    gotoAndStop: function (id) {
        var marker = this.getMarker(id);
        if (marker) {
            //console.log(this.compTime);
            this.compTime = marker.time;
            //this.pause();
            //this.update();
            //this.draw();
        }
    },

    getMarker: function (id) {
        if (typeof id === 'number') {
            return this.markers[id];
        } else if (typeof id === 'string') {
            for (var i = 0; i < this.markers.length; i++) {
                if (this.markers[i].comment === id) {
                    return this.markers[i];
                }
            }
        }

        console.warn('Marker not found');
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

    resize: function () {
        if (this.fluid) {
            var factor = this.isHD ? 2 : 1;
            var width = this.canvas.getBoundingClientRect().width;
            this.canvas.width = width * factor;
            this.canvas.height = width / this.ratio * factor;
            this.scale = width / this.baseWidth * factor;
            this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
        }
    }
};

module.exports = Animation;