'use strict';

var Group = require('./Group');

var _animations = [],
    _animationsLength = 0;

function Animation(options) {
    this.data = options.data || function () {
        throw 'no data';
    }();
    this.canvas = options.canvas || document.createElement('canvas');
    this.loop = options.loop || false;
    this.hd = options.hd || false;
    this.fluid = options.fluid || true;
    this.reversed = options.reversed || false;
    this.onComplete = options.onComplete || function () {
    };

    this.ctx = this.canvas.getContext('2d');

    this.time = 0;
    this.duration = this.data.duration;
    this.timeRatio = this.duration / 100;
    this.baseWidth = this.data.width;
    this.baseHeight = this.data.height;
    this.ratio = this.data.width / this.data.height;

    this.markers = this.data.markers;

    this.canvas.width = this.baseWidth;
    this.canvas.height = this.baseHeight;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.baseWidth;
    this.buffer.height = this.baseHeight;
    this.bufferCtx = this.buffer.getContext('2d');

    this.groups = [];
    for (var i = 0; i < this.data.groups.length; i++) {
        this.groups.push(new Group(this.data.groups[i], this.bufferCtx, 0, this.duration));
    }
    this.groupsLength = this.groups.length;

    this.time = 0;
    this.reset(this.reversed);
    this.resize();

    this.started = false;
    this.drawFrame = true;

    _animations.push(this);
    _animationsLength = _animations.length;
}

Animation.prototype = {

    play: function () {
        if (!this.started) {
            this.startTime = this.time;
            //console.log(this.startTime, this.pausedTime);
            this.started = true;
            console.log('test');
        }
    },

    stop: function () {
        console.log('stop');
        this.reset(this.reversed);
        this.started = false;
        this.drawFrame = true;
    },

    pause: function () {
        console.log('pause');
        if (this.started) {
            this.pausedTime = this.time - this.startTime + this.pausedTime;
            this.started = false;
        }
    },

    gotoAndPlay: function (id) {
        console.log('gotoAndPlay');
        var marker = this.getMarker(id);
        if (marker) {
            this.pausedTime = marker.time;
            this.startTime = this.time;
            this.started = true;
        }
    },

    gotoAndStop: function (id) {
        console.log('gotoAndStop');
        var marker = this.getMarker(id);
        if (marker) {
            this.started = false;
            this.compTime = marker.time;
            this.pausedTime = this.compTime;
            this.drawFrame = true;
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

    setStep: function (step) {
        console.log('setStep');
        this.started = false;
        this.compTime = step * this.timeRatio;
        this.pausedTime = this.compTime;
        this.drawFrame = true;
    },

    getStep: function () {
        //console.log('getStep');
        return Math.floor(this.compTime / this.timeRatio);
    },

    update: function (time) {
        this.time = time;
        if (this.started) {
            //console.log(this.time - this.startTime + this.pausedTime);
            this.compTime = this.time - this.startTime + this.pausedTime;
            if (this.reversed) this.compTime = this.duration - (this.time - this.startTime + this.pausedTime);
            //console.log(this.compTime);
            if (this.compTime > this.duration || this.reversed && this.compTime < 0) {
                this.started = false;
                this.onComplete();
                this.reset();
                if (this.loop) {
                    this.play();
                }
            } else {
                this.draw(this.compTime);
            }
        } else if (this.drawFrame) {
            console.log(this.compTime);
            this.drawFrame = false;
            this.draw(this.compTime);
        }
    },

    draw: function (time) {
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
        for (var i = 0; i < this.groupsLength; i++) {
            if (time >= this.groups[i].in && time < this.groups[i].out) {
                this.groups[i].draw(this.ctx, time);
            }
        }
    },

    reset: function () {
        this.startTime = 0;
        this.pausedTime = 0;
        this.compTime = this.reversed ? this.duration : 0;
        for (var i = 0; i < this.groups.length; i++) {
            this.groups[i].reset(this.reversed);
        }
        console.log('reset', this.compTime);
    },

    destroy: function () {
        console.log('destroy');
        this.started = false;
        this.onComplete = null;
        var i = _animations.indexOf(this);
        if (i > -1) {
            _animations.splice(i, 1);
            _animationsLength = _animations.length;
        }
        if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    },

    resize: function () {
        if (this.fluid) {
            var factor = this.hd ? 2 : 1;
            var width = this.canvas.clientWidth || this.baseWidth;
            this.canvas.width = width * factor;
            this.canvas.height = width / this.ratio * factor;
            this.scale = width / this.baseWidth * factor;
            this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
        }
    }
};

module.exports = {

    Animation: Animation,

    update: function (time) {
        //https://github.com/sole/tween.js
        time = time !== undefined ? time : ( typeof window !== 'undefined' && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now() );

        for (var i = 0; i < _animationsLength; i++) {
            _animations[i].update(time);
        }
    }
};