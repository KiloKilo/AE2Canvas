'use strict';

var Group = require('./Group');

var _animations = [],
    _animationsLength = 0;

function Animation(options) {
    this.data = options.data || function () {
        throw 'no data';
    }();

    this.then = 0;
    this.pausedTime = 0;
    this.duration = this.data.duration;
    this.timeRatio = this.duration / 100;
    this.baseWidth = this.data.width;
    this.baseHeight = this.data.height;
    this.ratio = this.data.width / this.data.height;

    this.markers = this.data.markers;

    this.canvas = options.canvas || document.createElement('canvas');
    this.loop = options.loop || false;
    this.hd = options.hd || false;
    this.fluid = options.fluid || true;
    this.reversed = options.reversed || false;
    this.onComplete = options.onComplete || function () {
    };

    this.ctx = this.canvas.getContext('2d');

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
            this.pausedTime = 0;
            this.started = true;
        }
    },

    stop: function () {
        this.reset(this.reversed);
        this.started = false;
        this.drawFrame = true;
    },

    pause: function () {
        if (this.started) {
            this.pausedTime = this.compTime;
            this.started = false;
        }
    },

    gotoAndPlay: function (id) {
        var marker = this.getMarker(id);
        if (marker) {
            this.compTime = marker.time;
            this.pausedTime = 0;
            this.setKeyframes(this.compTime);
            this.started = true;
        }
    },

    gotoAndStop: function (id) {
        var marker = this.getMarker(id);
        if (marker) {
            this.started = false;
            this.compTime = marker.time;
            this.setKeyframes(this.compTime);
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
        this.started = false;
        this.compTime = step * this.timeRatio;
        this.pausedTime = this.compTime;
        this.setKeyframes(this.compTime);
        this.drawFrame = true;
    },

    getStep: function () {
        return Math.floor(this.compTime / this.timeRatio);
    },

    update: function (time) {
        var delta = time - this.then;
        this.then = time;

        if (this.started) {
            this.compTime = this.reversed ? this.compTime -= delta : this.compTime += delta;

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
        this.pausedTime = 0;
        this.then = 0;
        this.compTime = this.reversed ? this.duration : 0;
        for (var i = 0; i < this.groups.length; i++) {
            this.groups[i].reset(this.reversed);
        }
    },

    setKeyframes: function (time) {
        for (var i = 0; i < this.groupsLength; i++) {
            this.groups[i].setKeyframes(time);
        }
    },

    destroy: function () {
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
            this.drawFrame = true;
        }
    },

    get reversed() {
        return this._reversed;
    },

    set reversed(bool) {
        this._reversed = bool;
        if (this.pausedTime) {
            this.compTime = this.pausedTime;
        } else if (!this.started) {
            this.compTime = this.reversed ? this.duration : 0;
        }
        console.log('----------', this.compTime);
        this.setKeyframes(this.compTime);
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