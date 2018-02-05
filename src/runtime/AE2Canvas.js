'use strict';

import {requestAnimationFrame, cancelAnimationFrame} from './shim'

var Group = require('./Group');
var ImageLayer = require('./ImageLayer');
var TextLayer = require('./TextLayer');
var Comp = require('./Comp');

var _animations = [],
    _animationsLength = 0;

var _autoPlay = false;
var _rafId;

function Animation(options) {
    if (!options.data) {
        console.error('no data');
        return;
    }

    this.gradients = {};
    this.pausedTime = 0;
    this.duration = options.data.duration;
    this.baseWidth = options.data.width;
    this.baseHeight = options.data.height;
    this.ratio = options.data.width / options.data.height;
    this.markers = options.data.markers;
    this.baseFont = options.baseFont;

    this.canvas = options.canvas || document.createElement('canvas');
    this.loop = options.loop || false;
    this.devicePixelRatio = options.devicePixelRatio || window && window.devicePixelRatio ? window.devicePixelRatio : 1;
    this.fluid = options.fluid || true;
    this.reversed = options.reversed || false;
    this.imageBasePath = options.imageBasePath || '';
    this.onUpdate = options.onUpdate || function () {
    };
    this.onComplete = options.onComplete || function () {
    };
    this.onStop = options.onStop || function () {
    };

    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = this.baseWidth;
    this.canvas.height = this.baseHeight;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.baseWidth;
    this.buffer.height = this.baseHeight;
    this.bufferCtx = this.buffer.getContext('2d');

    this.layers = [];
    for (var i = 0; i < options.data.layers.length; i++) {
        if (options.data.layers[i].type === 'vector') {
            this.layers.push(new Group(options.data.layers[i], this.bufferCtx, 0, this.duration, this.gradients));
        } else if (options.data.layers[i].type === 'image') {
            this.layers.push(new ImageLayer(options.data.layers[i], 0, this.duration, this.imageBasePath));
        } else if (options.data.layers[i].type === 'text') {
            this.layers.push(new TextLayer(options.data.layers[i], 0, this.duration, this.baseFont));
        } else if (options.data.layers[i].type === 'comp') {
            this.layers.push(new Comp(options.data.layers[i], this.bufferCtx, 0, this.duration, this.baseFont, this.gradients, this.imageBasePath, this.baseFont));
        }
    }
    this.numLayers = this.layers.length;

    for (var j = 0; j < this.layers.length; j++) {
        var layer = this.layers[j];
        if (layer.parent) {
            for (var k = 0; k < this.layers.length; k++) {
                //TODO stop loop
                if (layer.parent === this.layers[k].index) {
                    layer.parent = this.layers[k];
                }
            }
        }
    }

    this.reset(this.reversed);
    this.resize();

    this.isPaused = false;
    this.isPlaying = false;
    this.drawFrame = true;

    _animations.push(this);
    _animationsLength = _animations.length;
}

Animation.prototype = {

    play: function () {
        if (!this.isPlaying) {
            if (!this.isPaused) this.reset(this.reversed);
            this.isPaused = false;
            this.pausedTime = 0;
            this.isPlaying = true;
        }
    },

    stop: function () {
        this.reset(this.reversed);
        this.isPlaying = false;
        this.drawFrame = true;
    },

    pause: function () {
        if (this.isPlaying) {
            this.isPaused = true;
            this.pausedTime = this.compTime;
            this.isPlaying = false;
        }
    },

    gotoAndPlay: function (id) {
        var marker = this.getMarker(id);
        if (marker) {
            this.compTime = marker.time;
            this.pausedTime = 0;
            this.setKeyframes(this.compTime);
            this.isPlaying = true;
        }
    },

    gotoAndStop: function (id) {
        var marker = this.getMarker(id);
        if (marker) {
            this.isPlaying = false;
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

    checkStopMarkers: function (from, to) {
        for (var i = 0; i < this.markers.length; i++) {
            if (this.markers[i].stop && this.markers[i].time > from && this.markers[i].time < to) {
                return this.markers[i];
            }
        }
        return false;
    },

    setStep: function (step) {
        this.isPlaying = false;
        this.compTime = step * this.duration;
        this.pausedTime = this.compTime;
        this.setKeyframes(this.compTime);
        this.drawFrame = true;
    },

    getStep: function () {
        return this.compTime / this.duration;
    },

    update: function (time) {
        if (!this.then) this.then = time;

        var delta = time - this.then;
        this.then = time;

        if (this.isPlaying) {
            this.compTime = this.reversed ? this.compTime - delta : this.compTime + delta;

            var stopMarker = this.checkStopMarkers(this.compTime - delta, this.compTime);

            if (this.compTime > this.duration || this.reversed && this.compTime < 0) {
                this.compTime = this.reversed ? 0 : this.duration - 1;
                this.isPlaying = false;
                this.onComplete();
                if (this.loop) {
                    this.play();
                }
            } else if (stopMarker) {
                this.compTime = stopMarker.time;
                this.onStop(stopMarker);
                this.pause();
            } else {
                this.draw(this.compTime);
            }
            this.onUpdate();
        } else if (this.drawFrame) {
            this.drawFrame = false;
            this.draw(this.compTime);
            this.onUpdate();
        }
    },

    draw: function (time) {
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
        for (var i = 0; i < this.numLayers; i++) {
            if (time >= this.layers[i].in && time <= this.layers[i].out) {
                this.layers[i].draw(this.ctx, time);
            }
        }
    },

    preload: function (cb) {
        this.onloadCB = cb;
        for (var i = 0; i < this.numLayers; i++) {
            if (this.layers[i] instanceof ImageLayer) {
                this.layers[i].preload(this.onload.bind(this));
            }
        }
    },

    onload: function () {
        for (var i = 0; i < this.numLayers; i++) {
            if (this.layers[i] instanceof ImageLayer) {
                if (!this.layers[i].isLoaded) {
                    return;
                }
            }
        }
        this.isLoaded = true;
        if (typeof this.onloadCB === 'function') {
            this.onloadCB();
        }
    },

    reset: function () {
        this.pausedTime = 0;
        this.compTime = this.reversed ? this.duration : 0;
        for (var i = 0; i < this.numLayers; i++) {
            this.layers[i].reset(this.reversed);
        }
    },

    setKeyframes: function (time) {
        for (var i = 0; i < this.numLayers; i++) {
            this.layers[i].setKeyframes(time);
        }
    },

    destroy: function () {
        this.isPlaying = false;
        this.onComplete = null;
        var i = _animations.indexOf(this);
        if (i > -1) {
            _animations.splice(i, 1);
            _animationsLength = _animations.length;
        }
        if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    },

    resize: function (w) {
        if (this.fluid) {
            var width = w || this.canvas.clientWidth || this.baseWidth;
            this.canvas.width = width * this.devicePixelRatio;
            this.canvas.height = width / this.ratio * this.devicePixelRatio;

            this.buffer.width = width * this.devicePixelRatio;
            this.buffer.height = width / this.ratio * this.devicePixelRatio;

            this.scale = width / this.baseWidth * this.devicePixelRatio;
            this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
            this.bufferCtx.transform(this.scale, 0, 0, this.scale, 0, 0);
            this.setKeyframes(this.compTime);
            this.drawFrame = true;
        }
    },

    setGradients: function (name, stops) {
        if (!this.gradients[name]) {
            console.warn('Gradient with name: ' + name + ' not found.');
            return;
        }

        this.gradients[name].forEach(function (gradient) {
            gradient.stops = stops;
        });
    },

    get reversed() {
        return this._reversed;
    },

    set reversed(bool) {
        this._reversed = bool;
        if (this.pausedTime) {
            this.compTime = this.pausedTime;
        } else if (!this.isPlaying) {
            this.compTime = this.reversed ? this.duration : 0;
        }
        this.setKeyframes(this.compTime);
    }

};


const update = function (time) {
    if (_autoPlay) {
        _rafId = requestAnimationFrame(update);
    }
    time = time !== undefined ? time : performance.now();

    for (var i = 0; i < _animationsLength; i++) {
        _animations[i].update(time);
    }
};

const autoPlay = function (auto) {
    _autoPlay = auto;
    _autoPlay ? _rafId = requestAnimationFrame(update) : cancelAnimationFrame(_rafId);
};

export {Animation, update, autoPlay};
