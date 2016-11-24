(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AE2Canvas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"D:\\Code\\ae2canvas\\src\\runtime\\AE2Canvas.js":[function(_dereq_,module,exports){
'use strict';

var Group = _dereq_('./Group'),
    ImageLayer = _dereq_('./ImageLayer');

var _animations = [],
    _animationsLength = 0;

// @license http://opensource.org/licenses/MIT
// copyright Paul Irish 2015
// (function () {
//
//     if ('performance' in window == false) {
//         window.performance = {};
//     }
//
//     if ('now' in window.performance == false) {
//
//         var nowOffset = Date.now();
//
//         if (performance.timing && performance.timing.navigationStart) {
//             nowOffset = performance.timing.navigationStart
//         }
//
//         window.performance.now = function now() {
//             return Date.now() - nowOffset;
//         }
//     }
//
//     //
//
// })();

function Animation(options) {
    if (!options.data) {
        console.error('no data');
        return;
    }

    this.pausedTime = 0;
    this.duration = options.data.duration;
    this.baseWidth = options.data.width;
    this.baseHeight = options.data.height;
    this.ratio = options.data.width / options.data.height;

    this.markers = options.data.markers;

    this.canvas = options.canvas || document.createElement('canvas');
    this.loop = options.loop || false;
    this.devicePixelRatio = options.devicePixelRatio || 1;
    this.fluid = options.fluid || true;
    this.reversed = options.reversed || false;
    this.imageBasePath = options.imageBasePath || '';
    this.onComplete = options.onComplete || function () {
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
            this.layers.push(new Group(options.data.layers[i], this.bufferCtx, 0, this.duration));
        } else if (options.data.layers[i].type === 'image') {
            this.layers.push(new ImageLayer(options.data.layers[i], this.bufferCtx, 0, this.duration, this.imageBasePath));
        }
    }
    this.numLayers = this.layers.length;

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
                this.pause();
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
        for (var i = 0; i < this.numLayers; i++) {
            if (time >= this.layers[i].in && time < this.layers[i].out) {
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

module.exports = {

    Animation: Animation,

    update: function (time) {
        time = time !== undefined ? time : performance.now();

        for (var i = 0; i < _animationsLength; i++) {
            _animations[i].update(time);
        }
    }
};
},{"./Group":"D:\\Code\\ae2canvas\\src\\runtime\\Group.js","./ImageLayer":"D:\\Code\\ae2canvas\\src\\runtime\\ImageLayer.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedPath.js":[function(_dereq_,module,exports){
'use strict';

var Path = _dereq_('./Path'),
    BezierEasing = _dereq_('./BezierEasing');

function AnimatedPath(data) {
    Path.call(this, data);
    this.frameCount = this.frames.length;
}

AnimatedPath.prototype = Object.create(Path.prototype);

AnimatedPath.prototype.getValue = function (time) {
    if (this.finished && time >= this.nextFrame.t) {
        return this.nextFrame;
    } else if (!this.started && time <= this.lastFrame.t) {
        return this.lastFrame;
    } else {
        this.started = true;
        this.finished = false;
        if (time > this.nextFrame.t) {
            if (this.pointer + 1 === this.frameCount) {
                this.finished = true;
            } else {
                this.pointer++;
                this.lastFrame = this.frames[this.pointer - 1];
                this.nextFrame = this.frames[this.pointer];
                this.onKeyframeChange();
            }
        } else if (time < this.lastFrame.t) {
            if (this.pointer < 2) {
                this.started = false;
            } else {
                this.pointer--;
                this.lastFrame = this.frames[this.pointer - 1];
                this.nextFrame = this.frames[this.pointer];
                this.onKeyframeChange();
            }
        }
        return this.getValueAtTime(time);
    }
};

AnimatedPath.prototype.setKeyframes = function (time) {
    if (time < this.frames[0].t) {
        this.pointer = 1;
        this.nextFrame = this.frames[this.pointer];
        this.lastFrame = this.frames[this.pointer - 1];
        this.onKeyframeChange();
        return;
    }

    if (time > this.frames[this.frameCount - 1].t) {
        this.pointer = this.frameCount - 1;
        this.nextFrame = this.frames[this.pointer];
        this.lastFrame = this.frames[this.pointer - 1];
        this.onKeyframeChange();
        return;
    }

    for (var i = 1; i < this.frameCount; i++) {
        if (time >= this.frames[i - 1].t && time <= this.frames[i]) {
            this.pointer = i;
            this.lastFrame = this.frames[i - 1];
            this.nextFrame = this.frames[i];
            this.onKeyframeChange();
            return;
        }
    }
};

AnimatedPath.prototype.onKeyframeChange = function () {
    this.setEasing();
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
    else if (elapsed < 0) elapsed = 0;
    else if (this.easing) elapsed = this.easing(elapsed);
    var actualVertices = [],
        actualLength = [];

    for (var i = 0; i < this.verticesCount; i++) {
        var cp1x = this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed),
            cp1y = this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed),
            cp2x = this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed),
            cp2y = this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed),
            x = this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed),
            y = this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed);

        actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y]);
    }

    for (var j = 0; j < this.verticesCount - 1; j++) {
        actualLength.push(this.lerp(this.lastFrame.len[j], this.nextFrame.len[j], elapsed));
    }

    return {
        v  : actualVertices,
        len: actualLength
    }
};

AnimatedPath.prototype.reset = function (reversed) {
    this.finished = false;
    this.started = false;
    this.pointer = reversed ? this.frameCount - 1 : 1;
    this.nextFrame = this.frames[this.pointer];
    this.lastFrame = this.frames[this.pointer - 1];
    this.onKeyframeChange();
};

module.exports = AnimatedPath;


























},{"./BezierEasing":"D:\\Code\\ae2canvas\\src\\runtime\\BezierEasing.js","./Path":"D:\\Code\\ae2canvas\\src\\runtime\\Path.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    BezierEasing = _dereq_('./BezierEasing');

function AnimatedProperty(data) {
    Property.call(this, data);
    this.frameCount = this.frames.length;
}

AnimatedProperty.prototype = Object.create(Property.prototype);

AnimatedProperty.prototype.lerp = function (a, b, t) {
    if (a instanceof Array) {
        var arr = [];
        for (var i = 0; i < a.length; i++) {
            arr[i] = a[i] + t * (b[i] - a[i]);
        }
        return arr;
    } else {
        return a + t * (b - a);
    }
};

AnimatedProperty.prototype.setEasing = function () {
    if (this.nextFrame.easeIn) {
        this.easing = new BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
    } else {
        this.easing = null;
    }
};

AnimatedProperty.prototype.getValue = function (time) {
    if (this.finished && time >= this.nextFrame.t) {
        return this.nextFrame.v;
    } else if (!this.started && time <= this.lastFrame.t) {
        return this.lastFrame.v;
    } else {
        this.started = true;
        this.finished = false;
        if (time > this.nextFrame.t) {
            if (this.pointer + 1 === this.frameCount) {
                this.finished = true;
            } else {
                this.pointer++;
                this.lastFrame = this.frames[this.pointer - 1];
                this.nextFrame = this.frames[this.pointer];
                this.onKeyframeChange();
            }
        } else if (time < this.lastFrame.t) {
            if (this.pointer < 2) {
                this.started = false;
            } else {
                this.pointer--;
                this.lastFrame = this.frames[this.pointer - 1];
                this.nextFrame = this.frames[this.pointer];
                this.onKeyframeChange();
            }
        }
        return this.getValueAtTime(time);
    }
};

AnimatedProperty.prototype.setKeyframes = function (time) {
    //console.log(time, this.frames[this.frameCount - 2].t, this.frames[this.frameCount - 1].t);

    if (time < this.frames[0].t) {
        this.pointer = 1;
        this.nextFrame = this.frames[this.pointer];
        this.lastFrame = this.frames[this.pointer - 1];
        this.onKeyframeChange();
        return;
    }

    if (time > this.frames[this.frameCount - 1].t) {
        this.pointer = this.frameCount - 1;
        this.nextFrame = this.frames[this.pointer];
        this.lastFrame = this.frames[this.pointer - 1];
        this.onKeyframeChange();
        return;
    }

    for (var i = 1; i < this.frameCount; i++) {
        if (time >= this.frames[i - 1].t && time <= this.frames[i].t) {
            this.pointer = i;
            this.lastFrame = this.frames[i - 1];
            this.nextFrame = this.frames[i];
            this.onKeyframeChange();
            return;
        }
    }
};

AnimatedProperty.prototype.onKeyframeChange = function () {
    this.setEasing();
};

AnimatedProperty.prototype.getElapsed = function (time) {
    var delta = ( time - this.lastFrame.t ),
        duration = this.nextFrame.t - this.lastFrame.t,
        elapsed = delta / duration;

    if (elapsed > 1) elapsed = 1;
    else if (elapsed < 0) elapsed = 0;
    else if (this.easing) elapsed = this.easing(elapsed);
    return elapsed;
};

AnimatedProperty.prototype.getValueAtTime = function (time) {
    return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
};

AnimatedProperty.prototype.reset = function (reversed) {
    this.finished = false;
    this.started = false;
    this.pointer = reversed ? this.frameCount - 1 : 1;
    this.nextFrame = this.frames[this.pointer];
    this.lastFrame = this.frames[this.pointer - 1];
    this.onKeyframeChange();
};

module.exports = AnimatedProperty;
},{"./BezierEasing":"D:\\Code\\ae2canvas\\src\\runtime\\BezierEasing.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Bezier.js":[function(_dereq_,module,exports){
'use strict';

function Bezier(path) {
    this.path = path;
}

Bezier.prototype.getLength = function (len) {
    this.steps = Math.max(Math.floor(len / 10), 1);
    this.arcLengths = new Array(this.steps + 1);
    this.arcLengths[0] = 0;

    var ox = this.cubicN(0, this.path[0], this.path[2], this.path[4], this.path[6]),
        oy = this.cubicN(0, this.path[1], this.path[3], this.path[5], this.path[7]),
        clen = 0,
        iterator = 1 / this.steps;

    for (var i = 1; i <= this.steps; i += 1) {
        var x = this.cubicN(i * iterator, this.path[0], this.path[2], this.path[4], this.path[6]),
            y = this.cubicN(i * iterator, this.path[1], this.path[3], this.path[5], this.path[7]);

        var dx = ox - x,
            dy = oy - y;

        clen += Math.sqrt(dx * dx + dy * dy);
        this.arcLengths[i] = clen;

        ox = x;
        oy = y;
    }

    this.length = clen;
};

Bezier.prototype.map = function (u) {
    var targetLength = u * this.arcLengths[this.steps];
    var low = 0,
        high = this.steps,
        index = 0;

    while (low < high) {
        index = low + (((high - low) / 2) | 0);
        if (this.arcLengths[index] < targetLength) {
            low = index + 1;

        } else {
            high = index;
        }
    }
    if (this.arcLengths[index] > targetLength) {
        index--;
    }

    var lengthBefore = this.arcLengths[index];
    if (lengthBefore === targetLength) {
        return index / this.steps;
    } else {
        return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.steps;
    }
};

Bezier.prototype.getValues = function (elapsed) {
    var t = this.map(elapsed),
        x = this.cubicN(t, this.path[0], this.path[2], this.path[4], this.path[6]),
        y = this.cubicN(t, this.path[1], this.path[3], this.path[5], this.path[7]);

    return [x, y];
};

Bezier.prototype.cubicN = function (pct, a, b, c, d) {
    var t2 = pct * pct;
    var t3 = t2 * pct;
    return a + (-a * 3 + pct * (3 * a - a * pct)) * pct
        + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct
        + (c * 3 - c * 3 * pct) * t2
        + d * t3;
};

module.exports = Bezier;
},{}],"D:\\Code\\ae2canvas\\src\\runtime\\BezierEasing.js":[function(_dereq_,module,exports){
/**
 * BezierEasing - use bezier curve for transition easing function
 * is based on Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = BezierEasing(0.25, 0.1, 0.25, 1.0)
 * spline(x) => returns the easing value | x must be in [0, 1] range
 *
 */
(function (definition) {
    if (typeof exports === "object") {
        module.exports = definition();
    }
    else if (typeof window.define === 'function' && window.define.amd) {
        window.define([], definition);
    } else {
        window.BezierEasing = definition();
    }
}(function () {

    // These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === "function";

    function BezierEasing (mX1, mY1, mX2, mY2) {

        // Validate arguments
        if (arguments.length !== 4) {
            throw new Error("BezierEasing requires 4 arguments.");
        }
        for (var i=0; i<4; ++i) {
            if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
                throw new Error("BezierEasing arguments should be integers.");
            }
        }
        if (mX1 < 0 || mX1 > 1 || mX2 < 0 || mX2 > 1) {
            throw new Error("BezierEasing x values must be in [0, 1] range.");
        }

        var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

        function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
        function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
        function C (aA1)      { return 3.0 * aA1; }

        // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
        function calcBezier (aT, aA1, aA2) {
            return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
        }

        // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
        function getSlope (aT, aA1, aA2) {
            return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        }

        function newtonRaphsonIterate (aX, aGuessT) {
            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
                var currentSlope = getSlope(aGuessT, mX1, mX2);
                if (currentSlope === 0.0) return aGuessT;
                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            }
            return aGuessT;
        }

        function calcSampleValues () {
            for (var i = 0; i < kSplineTableSize; ++i) {
                mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
        }

        function binarySubdivide (aX, aA, aB) {
            var currentX, currentT, i = 0;
            do {
                currentT = aA + (aB - aA) / 2.0;
                currentX = calcBezier(currentT, mX1, mX2) - aX;
                if (currentX > 0.0) {
                    aB = currentT;
                } else {
                    aA = currentT;
                }
            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
            return currentT;
        }

        function getTForX (aX) {
            var intervalStart = 0.0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;

            for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }
            --currentSample;

            // Interpolate to provide an initial guess for t
            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample+1] - mSampleValues[currentSample]);
            var guessForT = intervalStart + dist * kSampleStepSize;

            var initialSlope = getSlope(guessForT, mX1, mX2);
            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT);
            } else if (initialSlope == 0.0) {
                return guessForT;
            } else {
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
            }
        }

        if (mX1 != mY1 || mX2 != mY2)
            calcSampleValues();

        var f = function (aX) {
            if (mX1 === mY1 && mX2 === mY2) return aX; // linear
            // Because JavaScript number are imprecise, we should guarantee the extremes are right.
            if (aX === 0) return 0;
            if (aX === 1) return 1;
            return calcBezier(getTForX(aX), mY1, mY2);
        };
        var str = "BezierEasing("+[mX1, mY1, mX2, mY2]+")";
        f.toString = function () { return str; };

        return f;
    }

    // CSS mapping
    BezierEasing.css = {
        "ease":        BezierEasing(0.25, 0.1, 0.25, 1.0),
        "linear":      BezierEasing(0.00, 0.0, 1.00, 1.0),
        "ease-in":     BezierEasing(0.42, 0.0, 1.00, 1.0),
        "ease-out":    BezierEasing(0.00, 0.0, 0.58, 1.0),
        "ease-in-out": BezierEasing(0.42, 0.0, 0.58, 1.0)
    };

    return BezierEasing;
}));
},{}],"D:\\Code\\ae2canvas\\src\\runtime\\Ellipse.js":[function(_dereq_,module,exports){
'use strict';

var Path = _dereq_('./Path'),
    Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Ellipse(data) {
    //this.name = data.name;
    this.closed = true;

    this.size = data.size.length > 1 ? new AnimatedProperty(data.size) : new Property(data.size);
    //optional
    if (data.position) this.position = data.position.length > 1 ? new AnimatedProperty(data.position) : new Property(data.position);
}

Ellipse.prototype = Object.create(Path.prototype);

Ellipse.prototype.draw = function (ctx, time, trim) {

    var size = this.size.getValue(time);
    var position = this.position ? this.position.getValue(time) : [0, 0];

    var i, j;

    var w = size[0] / 2,
        h = size[1] / 2,
        x = position[0] - w,
        y = position[1] - h,
        ow = w * .5522848,
        oh = h * .5522848;

    var vertices = [
        [x + w + ow, y, x + w - ow, y, x + w, y],
        [x + w + w, y + h + oh, x + w + w, y + h - oh, x + w + w, y + h],
        [x + w - ow, y + h + h, x + w + ow, y + h + h, x + w, y + h + h],
        [x, y + h - oh, x, y + h + oh, x, y + h]
    ];

    if (trim) {
        var tv,
            len = w + h;

        trim = this.getTrimValues(trim);

        for (i = 0; i < 4; i++) {
            j = i + 1;
            if (j > 3) j = 0;
            if (i > trim.startIndex && i < trim.endIndex) {
                ctx.bezierCurveTo(vertices[i][0], vertices[i][1], vertices[j][2], vertices[j][3], vertices[j][4], vertices[j][5]);
            } else if (i === trim.startIndex && i === trim.endIndex) {
                tv = this.trim(vertices[i], vertices[j], trim.start, trim.end, len);
                ctx.moveTo(tv.start[4], tv.start[5]);
                ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
            } else if (i === trim.startIndex) {
                tv = this.trim(vertices[i], vertices[j], trim.start, 1, len);
                ctx.moveTo(tv.start[4], tv.start[5]);
                ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
            } else if (i === trim.endIndex) {
                tv = this.trim(vertices[i], vertices[j], 0, trim.end, len);
                ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
            }
        }
    } else {
        ctx.moveTo(vertices[0][4], vertices[0][5]);
        for (i = 0; i < 4; i++) {
            j = i + 1;
            if (j > 3) j = 0;
            ctx.bezierCurveTo(vertices[i][0], vertices[i][1], vertices[j][2], vertices[j][3], vertices[j][4], vertices[j][5]);
        }
    }
};

Ellipse.prototype.getTrimValues = function (trim) {
    var startIndex = Math.floor(trim.start * 4),
        endIndex = Math.floor(trim.end * 4),
        start = (trim.start - startIndex * 0.25) * 4,
        end = (trim.end - endIndex * 0.25) * 4;

    return {
        startIndex: startIndex,
        endIndex  : endIndex,
        start     : start,
        end       : end
    };
};

Ellipse.prototype.setKeyframes = function (time) {
    this.size.setKeyframes(time);
    if (this.position) this.position.setKeyframes(time);
};

Ellipse.prototype.reset = function (reversed) {
    this.size.reset(reversed);
    if (this.position) this.position.reset(reversed);
};

module.exports = Ellipse;
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Path":"D:\\Code\\ae2canvas\\src\\runtime\\Path.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Fill.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Fill(data) {
    this.color = data.color.length > 1 ? new AnimatedProperty(data.color) : new Property(data.color);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity);
}

Fill.prototype.getValue = function (time) {
    var color = this.color.getValue(time);
    var opacity = this.opacity ? this.opacity.getValue(time) : 1;
    return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
};

Fill.prototype.setColor = function (ctx, time) {
    var color = this.getValue(time);
    ctx.fillStyle = color;
};

Fill.prototype.setKeyframes = function (time) {
    this.color.setKeyframes(time);
    if (this.opacity) this.opacity.setKeyframes(time);
};

Fill.prototype.reset = function (reversed) {
    this.color.reset(reversed);
    if (this.opacity) this.opacity.reset(reversed);
};

module.exports = Fill;
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Group.js":[function(_dereq_,module,exports){
'use strict';

var Stroke = _dereq_('./Stroke'),
    Path = _dereq_('./Path'),
    Rect = _dereq_('./Rect'),
    Ellipse = _dereq_('./Ellipse'),
    Polystar = _dereq_('./Polystar'),
    AnimatedPath = _dereq_('./AnimatedPath'),
    Fill = _dereq_('./Fill'),
    Transform = _dereq_('./Transform'),
    Merge = _dereq_('./Merge'),
    Trim = _dereq_('./Trim');

function Group(data, bufferCtx, parentIn, parentOut) {

    //this.name = data.name;
    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

    if (data.fill) this.fill = new Fill(data.fill);
    if (data.stroke) this.stroke = new Stroke(data.stroke);
    if (data.trim) this.trim = new Trim(data.trim);
    if (data.merge) this.merge = new Merge(data.merge);

    this.transform = new Transform(data.transform);
    this.bufferCtx = bufferCtx;

    if (data.groups) {
        this.groups = [];
        for (var i = 0; i < data.groups.length; i++) {
            this.groups.push(new Group(data.groups[i], this.bufferCtx, this.in, this.out));
        }
    }

    if (data.shapes) {
        this.shapes = [];
        for (var j = 0; j < data.shapes.length; j++) {
            var shape = data.shapes[j];
            if (shape.type === 'path') {
                if (shape.isAnimated) this.shapes.push(new AnimatedPath(shape));
                else this.shapes.push(new Path(shape));
            } else if (shape.type === 'rect') {
                this.shapes.push(new Rect(shape));
            } else if (shape.type === 'ellipse') {
                this.shapes.push(new Ellipse(shape));
            } else if (shape.type === 'polystar') {
                this.shapes.push(new Polystar(shape));
            }
        }
    }

    if (data.masks) {
        this.masks = [];
        for (var k = 0; k < data.masks.length; k++) {
            var mask = data.masks[k];
            if (mask.isAnimated) this.masks.push(new AnimatedPath(mask));
            else this.masks.push(new Path(mask));
        }
    }
}

Group.prototype.draw = function (ctx, time, parentFill, parentStroke, parentTrim, isBuffer) {

    var i;

    ctx.save();
    this.bufferCtx.save();

    //TODO check if color/stroke is changing over time
    var fill = this.fill || parentFill;
    var stroke = this.stroke || parentStroke;
    var trimValues = this.trim ? this.trim.getTrim(time) : parentTrim;

    if (fill) fill.setColor(ctx, time);
    if (stroke) stroke.setStroke(ctx, time);

    if (!isBuffer) this.transform.transform(ctx, time);
    this.transform.transform(this.bufferCtx, time);

    if (this.merge) {
        this.bufferCtx.save();
        this.bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.bufferCtx.clearRect(0, 0, this.bufferCtx.canvas.width, this.bufferCtx.canvas.height);
        this.bufferCtx.restore();

        if (fill) fill.setColor(this.bufferCtx, time);
        if (stroke) stroke.setStroke(this.bufferCtx, time);
    }

    if (this.masks) {
        ctx.beginPath();
        for (i = 0; i < this.masks.length; i++) {
            this.masks[i].draw(ctx, time);
        }
        ctx.clip();
    }

    ctx.beginPath();
    if (this.shapes) {
        if (this.merge) {

            for (i = 0; i < this.shapes.length; i++) {
                this.shapes[i].draw(this.bufferCtx, time, trimValues);
                this.bufferCtx.closePath();
                if (fill) this.bufferCtx.fill();
                if (stroke) this.bufferCtx.stroke();
                this.bufferCtx.beginPath();
                this.merge.setCompositeOperation(this.bufferCtx);
            }

            ctx.restore();
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(this.bufferCtx.canvas, 0, 0);
            ctx.restore();

        } else {
            for (i = 0; i < this.shapes.length; i++) {
                this.shapes[i].draw(ctx, time, trimValues);
            }
            if (this.shapes[this.shapes.length - 1].closed) {
                //ctx.closePath();
            }
        }
    }

    //TODO get order
    if (fill) ctx.fill();
    if (!isBuffer && stroke) ctx.stroke();

    if (this.groups) {
        if (this.merge) {
            for (i = 0; i < this.groups.length; i++) {
                if (time >= this.groups[i].in && time < this.groups[i].out) {
                    this.groups[i].draw(this.bufferCtx, time, fill, stroke, trimValues, true);
                    this.merge.setCompositeOperation(this.bufferCtx);
                }
            }
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(this.bufferCtx.canvas, 0, 0);
            ctx.restore();
            this.bufferCtx.restore();
        }
        else {
            for (i = 0; i < this.groups.length; i++) {
                if (time >= this.groups[i].in && time < this.groups[i].out) {
                    this.groups[i].draw(ctx, time, fill, stroke, trimValues);
                }
            }
        }
    }
    ctx.restore();
    this.bufferCtx.restore();
};

Group.prototype.setKeyframes = function (time) {
    this.transform.setKeyframes(time);

    if (this.shapes) {
        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i].setKeyframes(time);
        }
    }
    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].setKeyframes(time);
        }
    }
    if (this.groups) {
        for (var k = 0; k < this.groups.length; k++) {
            this.groups[k].setKeyframes(time);
        }
    }

    if (this.fill) this.fill.setKeyframes(time);
    if (this.stroke) this.stroke.setKeyframes(time);
    if (this.trim) this.trim.setKeyframes(time);
};

Group.prototype.reset = function (reversed) {
    this.transform.reset(reversed);

    if (this.shapes) {
        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i].reset(reversed);
        }
    }
    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].reset(reversed);
        }
    }
    if (this.groups) {
        for (var k = 0; k < this.groups.length; k++) {
            this.groups[k].reset(reversed);
        }
    }
    if (this.fill) this.fill.reset(reversed);
    if (this.stroke) this.stroke.reset(reversed);
    if (this.trim) this.trim.reset(reversed);
};

module.exports = Group;


























},{"./AnimatedPath":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedPath.js","./Ellipse":"D:\\Code\\ae2canvas\\src\\runtime\\Ellipse.js","./Fill":"D:\\Code\\ae2canvas\\src\\runtime\\Fill.js","./Merge":"D:\\Code\\ae2canvas\\src\\runtime\\Merge.js","./Path":"D:\\Code\\ae2canvas\\src\\runtime\\Path.js","./Polystar":"D:\\Code\\ae2canvas\\src\\runtime\\Polystar.js","./Rect":"D:\\Code\\ae2canvas\\src\\runtime\\Rect.js","./Stroke":"D:\\Code\\ae2canvas\\src\\runtime\\Stroke.js","./Transform":"D:\\Code\\ae2canvas\\src\\runtime\\Transform.js","./Trim":"D:\\Code\\ae2canvas\\src\\runtime\\Trim.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\ImageLayer.js":[function(_dereq_,module,exports){
'use strict';

var Transform = _dereq_('./Transform');

function ImageLayer(data, bufferCtx, parentIn, parentOut, basePath) {

    this.isLoaded = false;

    //this.name = data.name;
    this.source = basePath + data.source;

    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

    this.transform = new Transform(data.transform);
    this.bufferCtx = bufferCtx;
}

ImageLayer.prototype.preload = function (cb) {
    this.img = new Image;
    this.img.onload = function () {
        this.isLoaded = true;
        if (typeof cb === 'function') {
            cb();
        }
    }.bind(this);

    this.img.src = this.source;
};

ImageLayer.prototype.draw = function (ctx, time) {

    if (!this.isLoaded) return;

    ctx.save();
    this.transform.transform(ctx, time);

    ctx.drawImage(this.img, 0, 0);

    ctx.restore();
};

ImageLayer.prototype.setKeyframes = function (time) {
    this.transform.setKeyframes(time);
};

ImageLayer.prototype.reset = function (reversed) {
    this.transform.reset(reversed);
};

module.exports = ImageLayer;


























},{"./Transform":"D:\\Code\\ae2canvas\\src\\runtime\\Transform.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Merge.js":[function(_dereq_,module,exports){
'use strict';

function Merge(data) {
    this.type = data.type;
}

Merge.prototype.setCompositeOperation = function (ctx) {
    switch (this.type) {
        case 2:
            ctx.globalCompositeOperation = 'source-over';
            break;
        case 3:
            ctx.globalCompositeOperation = 'source-out';
            break;
        case 4:
            ctx.globalCompositeOperation = 'source-in';
            break;
        case 5:
            ctx.globalCompositeOperation = 'xor';
            break;
        default:
            ctx.globalCompositeOperation = 'source-over';
    }
};

module.exports = Merge;


























},{}],"D:\\Code\\ae2canvas\\src\\runtime\\Path.js":[function(_dereq_,module,exports){
'use strict';

var Bezier = _dereq_('./Bezier');

function Path(data) {
    //this.name = data.name;
    this.closed = data.closed;
    this.frames = data.frames;
    this.verticesCount = this.frames[0].v.length;
}

Path.prototype.draw = function (ctx, time, trim) {
    var frame = this.getValue(time),
        vertices = frame.v;

    if (trim) {
        if ((trim.start === 0 && trim.end === 0) ||
            (trim.start === 1 && trim.end === 1)) {
            return;
        } else {
            trim = this.getTrimValues(trim, frame);
        }
    }

    for (var j = 1; j < vertices.length; j++) {

        var nextVertex = vertices[j],
            lastVertex = vertices[j - 1];

        if (trim) {
            var tv;

            if (j === 1 && trim.startIndex !== 0) {
                ctx.moveTo(lastVertex[4], lastVertex[5]);
            }
            else if (j === trim.startIndex + 1 && j === trim.endIndex + 1) {
                tv = this.trim(lastVertex, nextVertex, trim.start, trim.end, frame.len[j - 1]);
                ctx.moveTo(tv.start[4], tv.start[5]);
                ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
            } else if (j === trim.startIndex + 1) {
                tv = this.trim(lastVertex, nextVertex, trim.start, 1, frame.len[j - 1]);
                ctx.moveTo(tv.start[4], tv.start[5]);
                ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
            } else if (j === trim.endIndex + 1) {
                tv = this.trim(lastVertex, nextVertex, 0, trim.end, frame.len[j - 1]);
                ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
            } else if (j > trim.startIndex + 1 && j < trim.endIndex + 1) {
                ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);
            }
        } else {
            if (j === 1) {
                ctx.moveTo(lastVertex[4], lastVertex[5]);
            }
            ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);
        }
    }

    if (!trim && this.closed) {
        ctx.bezierCurveTo(nextVertex[0], nextVertex[1], vertices[0][2], vertices[0][3], vertices[0][4], vertices[0][5]);
    }
};

Path.prototype.getValue = function () {
    return this.frames[0];
};

Path.prototype.getTrimValues = function (trim, frame) {
    var i;

    var actualTrim = {
        startIndex: 0,
        endIndex: 0,
        start: 0,
        end: 0
    };

// TODO clean up
    if (trim.start === 0) {
        if (trim.end === 0) {
            return actualTrim;
        } else if (trim.end === 1) {
            actualTrim.endIndex = frame.len.length;
            actualTrim.end = 1;
            return actualTrim;
        }
    }

    var totalLen = this.sumArray(frame.len),
        trimAtLen;

    trimAtLen = totalLen * trim.start;

    for (i = 0; i < frame.len.length; i++) {
        if (trimAtLen > 0 && trimAtLen < frame.len[i]) {
            actualTrim.startIndex = i;
            actualTrim.start = trimAtLen / frame.len[i];
        }
        trimAtLen -= frame.len[i];
    }

    if (trim.end === 1) {
        actualTrim.endIndex = frame.len.length;
        actualTrim.end = 1;
        return actualTrim;
    } else {
        trimAtLen = totalLen * trim.end;

        for (i = 0; i < frame.len.length; i++) {
            if (trimAtLen > 0 && trimAtLen < frame.len[i]) {
                actualTrim.endIndex = i;
                actualTrim.end = trimAtLen / frame.len[i];
            }
            trimAtLen -= frame.len[i];
        }
    }

    return actualTrim;
};

Path.prototype.trim = function (lastVertex, nextVertex, from, to, len) {

    if (from === 0 && to === 1) {
        return {
            start: lastVertex,
            end: nextVertex
        };
    }

    if (this.isStraight(lastVertex[4], lastVertex[5], lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5])) {
        startVertex = [
            this.lerp(lastVertex[0], nextVertex[0], from),
            this.lerp(lastVertex[1], nextVertex[1], from),
            this.lerp(lastVertex[2], nextVertex[2], from),
            this.lerp(lastVertex[3], nextVertex[3], from),
            this.lerp(lastVertex[4], nextVertex[4], from),
            this.lerp(lastVertex[5], nextVertex[5], from)
        ];

        endVertex = [
            this.lerp(lastVertex[0], nextVertex[0], to),
            this.lerp(lastVertex[1], nextVertex[1], to),
            this.lerp(lastVertex[2], nextVertex[2], to),
            this.lerp(lastVertex[3], nextVertex[3], to),
            this.lerp(lastVertex[4], nextVertex[4], to),
            this.lerp(lastVertex[5], nextVertex[5], to)
        ];

    } else {
        this.bezier = new Bezier([lastVertex[4], lastVertex[5], lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]]);
        this.bezier.getLength(len);
        from = this.bezier.map(from);
        to = this.bezier.map(to);
        to = (to - from) / (1 - from);

        var e1, f1, g1, h1, j1, k1,
            e2, f2, g2, h2, j2, k2,
            startVertex,
            endVertex;

        e1 = [this.lerp(lastVertex[4], lastVertex[0], from), this.lerp(lastVertex[5], lastVertex[1], from)];
        f1 = [this.lerp(lastVertex[0], nextVertex[2], from), this.lerp(lastVertex[1], nextVertex[3], from)];
        g1 = [this.lerp(nextVertex[2], nextVertex[4], from), this.lerp(nextVertex[3], nextVertex[5], from)];
        h1 = [this.lerp(e1[0], f1[0], from), this.lerp(e1[1], f1[1], from)];
        j1 = [this.lerp(f1[0], g1[0], from), this.lerp(f1[1], g1[1], from)];
        k1 = [this.lerp(h1[0], j1[0], from), this.lerp(h1[1], j1[1], from)];

        startVertex = [j1[0], j1[1], h1[0], h1[1], k1[0], k1[1]];
        endVertex = [nextVertex[0], nextVertex[1], g1[0], g1[1], nextVertex[4], nextVertex[5]];

        e2 = [this.lerp(startVertex[4], startVertex[0], to), this.lerp(startVertex[5], startVertex[1], to)];
        f2 = [this.lerp(startVertex[0], endVertex[2], to), this.lerp(startVertex[1], endVertex[3], to)];
        g2 = [this.lerp(endVertex[2], endVertex[4], to), this.lerp(endVertex[3], endVertex[5], to)];

        h2 = [this.lerp(e2[0], f2[0], to), this.lerp(e2[1], f2[1], to)];
        j2 = [this.lerp(f2[0], g2[0], to), this.lerp(f2[1], g2[1], to)];
        k2 = [this.lerp(h2[0], j2[0], to), this.lerp(h2[1], j2[1], to)];

        startVertex = [e2[0], e2[1], startVertex[2], startVertex[3], startVertex[4], startVertex[5]];
        endVertex = [j2[0], j2[1], h2[0], h2[1], k2[0], k2[1]];

    }

    return {
        start: startVertex,
        end: endVertex
    };
};

Path.prototype.lerp = function (a, b, t) {
    var s = 1 - t;
    return a * s + b * t;
};

Path.prototype.sumArray = function (arr) {
    function add(a, b) {
        return a + b;
    }

    return arr.reduce(add);
};

Path.prototype.isStraight = function (startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY) {
    return startX === ctrl1X && startY === ctrl1Y && endX === ctrl2X && endY === ctrl2Y;
};

Path.prototype.setKeyframes = function (time) {
};

Path.prototype.reset = function (reversed) {
};

module.exports = Path;




























},{"./Bezier":"D:\\Code\\ae2canvas\\src\\runtime\\Bezier.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Polystar.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Polystar(data) {
    //this.name = data.name;
    this.closed = true; // TODO ??

    this.starType = data.starType;
    this.points = data.points.length > 1 ? new AnimatedProperty(data.points) : new Property(data.points);
    this.innerRadius = data.innerRadius.length > 1 ? new AnimatedProperty(data.innerRadius) : new Property(data.innerRadius);
    this.outerRadius = data.outerRadius.length > 1 ? new AnimatedProperty(data.outerRadius) : new Property(data.outerRadius);

    //optinals
    if (data.position) this.position = data.position.length > 1 ? new AnimatedProperty(data.position) : new Property(data.position);
    if (data.rotation) this.rotation = data.rotation.length > 1 ? new AnimatedProperty(data.rotation) : new Property(data.rotation);
    if (data.innerRoundness) this.innerRoundness = data.innerRoundness.length > 1 ? new AnimatedProperty(data.innerRoundness) : new Property(data.innerRoundness);
    if (data.outerRoundness) this.outerRoundness = data.outerRoundness.length > 1 ? new AnimatedProperty(data.outerRoundness) : new Property(data.outerRoundness);
}

Polystar.prototype.draw = function (ctx, time) {

    var points = this.points.getValue(time),
        innerRadius = this.innerRadius.getValue(time),
        outerRadius = this.outerRadius.getValue(time),
        position = this.position ? this.position.getValue(time) : [0, 0],
        rotation = this.rotation ? this.rotation.getValue(time) : 0,
        innerRoundness = this.innerRoundness ? this.innerRoundness.getValue(time) : 0,
        outerRoundness = this.outerRoundness ? this.outerRoundness.getValue(time) : 0;

    rotation = this.deg2rad(rotation);
    var start = this.rotatePoint(0, 0, 0, 0 - outerRadius, rotation);

    ctx.save();
    ctx.beginPath();
    ctx.translate(position[0], position[1]);
    ctx.moveTo(start[0], start[1]);

    for (var i = 0; i < points; i++) {

        var pInner,
            pOuter,
            pOuter1Tangent,
            pOuter2Tangent,
            pInner1Tangent,
            pInner2Tangent,
            outerOffset,
            innerOffset,
            rot;

        rot = Math.PI / points * 2;

        pInner = this.rotatePoint(0, 0, 0, 0 - innerRadius, (rot * (i + 1) - rot / 2) + rotation);
        pOuter = this.rotatePoint(0, 0, 0, 0 - outerRadius, (rot * (i + 1)) + rotation);

        //FIxME
        if (!outerOffset) outerOffset = (start[0] + pInner[0]) * outerRoundness / 100 * .5522848;
        if (!innerOffset) innerOffset = (start[0] + pInner[0]) * innerRoundness / 100 * .5522848;

        pOuter1Tangent = this.rotatePoint(0, 0, outerOffset, 0 - outerRadius, (rot * i) + rotation);
        pInner1Tangent = this.rotatePoint(0, 0, innerOffset * -1, 0 - innerRadius, (rot * (i + 1) - rot / 2) + rotation);
        pInner2Tangent = this.rotatePoint(0, 0, innerOffset, 0 - innerRadius, (rot * (i + 1) - rot / 2) + rotation);
        pOuter2Tangent = this.rotatePoint(0, 0, outerOffset * -1, 0 - outerRadius, (rot * (i + 1)) + rotation);

        if (this.starType === 1) {
            //star
            ctx.bezierCurveTo(pOuter1Tangent[0], pOuter1Tangent[1], pInner1Tangent[0], pInner1Tangent[1], pInner[0], pInner[1]);
            ctx.bezierCurveTo(pInner2Tangent[0], pInner2Tangent[1], pOuter2Tangent[0], pOuter2Tangent[1], pOuter[0], pOuter[1]);
        } else {
            //polygon
            ctx.bezierCurveTo(pOuter1Tangent[0], pOuter1Tangent[1], pOuter2Tangent[0], pOuter2Tangent[1], pOuter[0], pOuter[1]);
        }

        //debug
        //ctx.fillStyle = "black";
        //ctx.fillRect(pInner[0], pInner[1], 5, 5);
        //ctx.fillRect(pOuter[0], pOuter[1], 5, 5);
        //ctx.fillStyle = "blue";
        //ctx.fillRect(pOuter1Tangent[0], pOuter1Tangent[1], 5, 5);
        //ctx.fillStyle = "red";
        //ctx.fillRect(pInner1Tangent[0], pInner1Tangent[1], 5, 5);
        //ctx.fillStyle = "green";
        //ctx.fillRect(pInner2Tangent[0], pInner2Tangent[1], 5, 5);
        //ctx.fillStyle = "brown";
        //ctx.fillRect(pOuter2Tangent[0], pOuter2Tangent[1], 5, 5);

    }

    ctx.restore();
};

Polystar.prototype.rotatePoint = function (cx, cy, x, y, radians) {
    var cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) - (sin * (y - cy)) + cx,
        ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
    return [nx, ny];
};

Polystar.prototype.deg2rad = function (deg) {
    return deg * (Math.PI / 180);
};

Polystar.prototype.setKeyframes = function (time) {
    this.points.setKeyframes(time);
    this.innerRadius.setKeyframes(time);
    this.outerRadius.setKeyframes(time);
    if (this.position) this.position.setKeyframes(time);
    if (this.rotation) this.rotation.setKeyframes(time);
    if (this.innerRoundness) this.innerRoundness.setKeyframes(time);
    if (this.outerRoundness) this.outerRoundness.setKeyframes(time);
};

Polystar.prototype.reset = function (reversed) {
    this.points.reset(reversed);
    this.innerRadius.reset(reversed);
    this.outerRadius.reset(reversed);
    if (this.position) this.position.reset(reversed);
    if (this.rotation) this.rotation.reset(reversed);
    if (this.innerRoundness) this.innerRoundness.reset(reversed);
    if (this.outerRoundness) this.outerRoundness.reset(reversed);
};

module.exports = Polystar;
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Position.js":[function(_dereq_,module,exports){
'use strict';

var Bezier = _dereq_('./Bezier'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Position(data) {
    AnimatedProperty.call(this, data);
}

Position.prototype = Object.create(AnimatedProperty.prototype);

Position.prototype.onKeyframeChange = function () {
    this.setEasing();
    this.setMotionPath();
};

Position.prototype.getValueAtTime = function (time) {
    if (this.motionpath) {
        return this.motionpath.getValues(this.getElapsed(time));
    } else {
        return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
    }
};

Position.prototype.setMotionPath = function () {
    if (this.lastFrame.motionpath) {
        this.motionpath = new Bezier(this.lastFrame.motionpath);
        this.motionpath.getLength(this.lastFrame.len);
    } else {
        this.motionpath = null;
    }
};

module.exports = Position;


























},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Bezier":"D:\\Code\\ae2canvas\\src\\runtime\\Bezier.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Property.js":[function(_dereq_,module,exports){
'use strict';

function Property(data) {
    if (!(data instanceof Array)) return null;
    this.frames = data;
}

Property.prototype.getValue = function () {
    return this.frames[0].v;
};

Property.prototype.setKeyframes = function (time) {
};

Property.prototype.reset = function (reversed) {
};

module.exports = Property;
},{}],"D:\\Code\\ae2canvas\\src\\runtime\\Rect.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Rect(data) {
    //this.name = data.name;
    this.closed = true;

    this.size = data.size.length > 1 ? new AnimatedProperty(data.size) : new Property(data.size);

    //optionals
    if (data.position) this.position = data.position.length > 1 ? new AnimatedProperty(data.position) : new Property(data.position);
    if (data.roundness) this.roundness = data.roundness.length > 1 ? new AnimatedProperty(data.roundness) : new Property(data.roundness);
}

Rect.prototype.draw = function (ctx, time, trim) {

    var size = this.size.getValue(time),
        position = this.position ? this.position.getValue(time) : [0, 0],
        roundness = this.roundness ? this.roundness.getValue(time) : 0;

    if (size[0] < 2 * roundness) roundness = size[0] / 2;
    if (size[1] < 2 * roundness) roundness = size[1] / 2;

    var x = position[0] - size[0] / 2,
        y = position[1] - size[1] / 2;

    if (trim) {
        var tv;
        trim = this.getTrimValues(trim);
        //TODO add trim
    } else {
        ctx.moveTo(x + roundness, y);
        ctx.arcTo(x + size[0], y, x + size[0], y + size[1], roundness);
        ctx.arcTo(x + size[0], y + size[1], x, y + size[1], roundness);
        ctx.arcTo(x, y + size[1], x, y, roundness);
        ctx.arcTo(x, y, x + size[0], y, roundness);
    }

};

Rect.prototype.setKeyframes = function (time) {
    this.size.setKeyframes(time);
    if (this.position) this.position.setKeyframes(time);
    if (this.roundness) this.roundness.setKeyframes(time);
};

Rect.prototype.reset = function (reversed) {
    this.size.reset(reversed);
    if (this.position) this.position.reset(reversed);
    if (this.roundness) this.roundness.reset(reversed);
};

module.exports = Rect;
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Stroke.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Stroke(data) {
    if (data) {
        this.join = data.join;
        this.cap = data.cap;

        if (data.miterLimit) {
            if (data.miterLimit.length > 1) this.miterLimit = new AnimatedProperty(data.miterLimit);
            else this.miterLimit = new Property(data.miterLimit);
        }

        if (data.color.length > 1) this.color = new AnimatedProperty(data.color);
        else this.color = new Property(data.color);

        if (data.opacity.length > 1) this.opacity = new AnimatedProperty(data.opacity);
        else this.opacity = new Property(data.opacity);

        if (data.width.length > 1) this.width = new AnimatedProperty(data.width);
        else this.width = new Property(data.width);
    }
}

Stroke.prototype.getValue = function (time) {
    var color = this.color.getValue(time);
    var opacity = this.opacity.getValue(time);
    color[0] = Math.round(color[0]);
    color[1] = Math.round(color[1]);
    color[2] = Math.round(color[2]);
    var s = color.join(', ');

    return 'rgba(' + s + ', ' + opacity + ')';
};

Stroke.prototype.setStroke = function (ctx, time) {
    var strokeColor = this.getValue(time);
    var strokeWidth = this.width.getValue(time);
    var strokeJoin = this.join;
    if (strokeJoin === 'miter') var miterLimit = this.miterLimit.getValue(time);

    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = strokeJoin;
    if (miterLimit) ctx.miterLimit = miterLimit;
    ctx.lineCap = this.cap;
    ctx.strokeStyle = strokeColor;
};

Stroke.prototype.setKeyframes = function (time) {
    this.color.setKeyframes(time);
    this.opacity.setKeyframes(time);
    this.width.setKeyframes(time);
    if (this.miterLimit) this.miterLimit.setKeyframes(time);
};

Stroke.prototype.reset = function (reversed) {
    this.color.reset(reversed);
    this.opacity.reset(reversed);
    this.width.reset(reversed);
    if (this.miterLimit) this.miterLimit.reset(reversed);
};

module.exports = Stroke;
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Transform.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty'),
    Position = _dereq_('./Position');

function Transform(data) {
    if (!data) return;

    //this.name = data.name;

    if (data.positionX && data.positionY) {
        if (data.positionX.length > 1 && data.positionY.length > 1) {
            this.positionX = new AnimatedProperty(data.positionX);
            this.positionY = new AnimatedProperty(data.positionY);
        } else {
            this.positionX = new Property(data.positionX);
            this.positionY = new Property(data.positionY);
        }
    } else if (data.position) {
        if (data.position.length > 1) {
            this.position = new Position(data.position);
        } else {
            this.position = new Property(data.position);
        }
    }

    if (data.anchor) this.anchor = data.anchor.length > 1 ? new AnimatedProperty(data.anchor) : new Property(data.anchor);
    if (data.scaleX) this.scaleX = data.scaleX.length > 1 ? new AnimatedProperty(data.scaleX) : new Property(data.scaleX);
    if (data.scaleY) this.scaleY = data.scaleY.length > 1 ? new AnimatedProperty(data.scaleY) : new Property(data.scaleY);
    if (data.skew) this.skew = data.skew.length > 1 ? new AnimatedProperty(data.skew) : new Property(data.skew);
    if (data.skewAxis) this.skewAxis = data.skewAxis.length > 1 ? new AnimatedProperty(data.skewAxis) : new Property(data.skewAxis);
    if (data.rotation) this.rotation = data.rotation.length > 1 ? new AnimatedProperty(data.rotation) : new Property(data.rotation);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity);
}

Transform.prototype.transform = function (ctx, time) {

    var positionX, positionY,
        anchor = this.anchor ? this.anchor.getValue(time) : [0, 0],
        rotation = this.rotation ? this.deg2rad(this.rotation.getValue(time)) : 0,
        skew = this.skew ? this.deg2rad(this.skew.getValue(time)) : 0,
        skewAxis = this.skewAxis ? this.deg2rad(this.skewAxis.getValue(time)) : 0,
        scaleX = this.scaleX ? this.scaleX.getValue(time) : 1,
        scaleY = this.scaleY ? this.scaleY.getValue(time) : 1,
        opacity = this.opacity ? this.opacity.getValue(time) * ctx.globalAlpha : ctx.globalAlpha; // FIXME wrong transparency if nested

    if (this.positionX && this.positionY) {
        positionX = this.positionX.getValue(time);
        positionY = this.positionY.getValue(time);
    } else if (this.position) {
        var position = this.position.getValue(time, ctx);
        positionX = position[0];
        positionY = position[1];
    } else {
        positionX = 0;
        positionY = 0;
    }

    // console.log(ctx, positionX, positionY, anchor, rotation, skew, skewAxis, scaleX, scaleY, opacity);

    //order very very important :)
    ctx.transform(1, 0, 0, 1, positionX - anchor[0], positionY - anchor[1]);
    this.setRotation(ctx, rotation, anchor[0], anchor[1]);
    this.setSkew(ctx, skew, skewAxis, anchor[0], anchor[1]);
    this.setScale(ctx, scaleX, scaleY, anchor[0], anchor[1]);
    ctx.globalAlpha = opacity;
};

Transform.prototype.setRotation = function (ctx, rad, x, y) {
    var c = Math.cos(rad);
    var s = Math.sin(rad);
    var dx = x - c * x + s * y;
    var dy = y - s * x - c * y;
    ctx.transform(c, s, -s, c, dx, dy);
};

Transform.prototype.setScale = function (ctx, sx, sy, x, y) {
    ctx.transform(sx, 0, 0, sy, -x * sx + x, -y * sy + y);
};

Transform.prototype.setSkew = function (ctx, skew, axis, x, y) {
    var t = Math.tan(-skew);
    this.setRotation(ctx, -axis, x, y);
    ctx.transform(1, 0, t, 1, -y * t, 0);
    this.setRotation(ctx, axis, x, y);
};

Transform.prototype.deg2rad = function (deg) {
    return deg * (Math.PI / 180);
};

Transform.prototype.setKeyframes = function (time) {
    if (this.anchor) this.anchor.setKeyframes(time);
    if (this.rotation) this.rotation.setKeyframes(time);
    if (this.skew) this.skew.setKeyframes(time);
    if (this.skewAxis) this.skewAxis.setKeyframes(time);
    if (this.position) this.position.setKeyframes(time);
    if (this.positionX) this.positionX.setKeyframes(time);
    if (this.positionY) this.positionY.setKeyframes(time);
    if (this.scaleX) this.scaleX.setKeyframes(time);
    if (this.scaleY) this.scaleY.setKeyframes(time);
    if (this.opacity) this.opacity.setKeyframes(time);
};

Transform.prototype.reset = function (reversed) {
    if (this.anchor) this.anchor.reset(reversed);
    if (this.rotation) this.rotation.reset(reversed);
    if (this.skew) this.skew.reset(reversed);
    if (this.skewAxis) this.skewAxis.reset(reversed);
    if (this.position) this.position.reset(reversed);
    if (this.positionX) this.positionX.reset(reversed);
    if (this.positionY) this.positionY.reset(reversed);
    if (this.scaleX) this.scaleX.reset(reversed);
    if (this.scaleY) this.scaleY.reset(reversed);
    if (this.opacity) this.opacity.reset(reversed);
};

module.exports = Transform;
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Position":"D:\\Code\\ae2canvas\\src\\runtime\\Position.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Trim.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Trim(data) {

    this.type = data.type;

    if (data.start) this.start = data.start.length > 1 ? new AnimatedProperty(data.start) : new Property(data.start);
    if (data.end) this.end = data.end.length > 1 ? new AnimatedProperty(data.end) : new Property(data.end);
    //if (data.offset) this.offset = data.offset.length > 1 ? new AnimatedProperty(data.offset) : new Property(data.offset);

}

Trim.prototype.getTrim = function (time) {
    var start = this.start ? this.start.getValue(time) : 0,
        end = this.end ? this.end.getValue(time) : 1;

    var trim = {
        start: Math.min(start, end),
        end: Math.max(start, end)
    };

    if (trim.start === 0 && trim.end === 1) {
        return null;
    } else {
        return trim;
    }
};

Trim.prototype.setKeyframes = function (time) {
    if (this.start) this.start.setKeyframes(time);
    if (this.end) this.end.setKeyframes(time);
    //if (this.offset) this.offset.reset();
};

Trim.prototype.reset = function (reversed) {
    if (this.start) this.start.reset(reversed);
    if (this.end) this.end.reset(reversed);
    //if (this.offset) this.offset.reset();
};

module.exports = Trim;
























},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}]},{},["D:\\Code\\ae2canvas\\src\\runtime\\AE2Canvas.js"])("D:\\Code\\ae2canvas\\src\\runtime\\AE2Canvas.js")
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL0ltYWdlTGF5ZXIuanMiLCJzcmMvcnVudGltZS9NZXJnZS5qcyIsInNyYy9ydW50aW1lL1BhdGguanMiLCJzcmMvcnVudGltZS9Qb2x5c3Rhci5qcyIsInNyYy9ydW50aW1lL1Bvc2l0aW9uLmpzIiwic3JjL3J1bnRpbWUvUHJvcGVydHkuanMiLCJzcmMvcnVudGltZS9SZWN0LmpzIiwic3JjL3J1bnRpbWUvU3Ryb2tlLmpzIiwic3JjL3J1bnRpbWUvVHJhbnNmb3JtLmpzIiwic3JjL3J1bnRpbWUvVHJpbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEdyb3VwID0gcmVxdWlyZSgnLi9Hcm91cCcpLFxyXG4gICAgSW1hZ2VMYXllciA9IHJlcXVpcmUoJy4vSW1hZ2VMYXllcicpO1xyXG5cclxudmFyIF9hbmltYXRpb25zID0gW10sXHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IDA7XHJcblxyXG4vLyBAbGljZW5zZSBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXHJcbi8vIGNvcHlyaWdodCBQYXVsIElyaXNoIDIwMTVcclxuLy8gKGZ1bmN0aW9uICgpIHtcclxuLy9cclxuLy8gICAgIGlmICgncGVyZm9ybWFuY2UnIGluIHdpbmRvdyA9PSBmYWxzZSkge1xyXG4vLyAgICAgICAgIHdpbmRvdy5wZXJmb3JtYW5jZSA9IHt9O1xyXG4vLyAgICAgfVxyXG4vL1xyXG4vLyAgICAgaWYgKCdub3cnIGluIHdpbmRvdy5wZXJmb3JtYW5jZSA9PSBmYWxzZSkge1xyXG4vL1xyXG4vLyAgICAgICAgIHZhciBub3dPZmZzZXQgPSBEYXRlLm5vdygpO1xyXG4vL1xyXG4vLyAgICAgICAgIGlmIChwZXJmb3JtYW5jZS50aW1pbmcgJiYgcGVyZm9ybWFuY2UudGltaW5nLm5hdmlnYXRpb25TdGFydCkge1xyXG4vLyAgICAgICAgICAgICBub3dPZmZzZXQgPSBwZXJmb3JtYW5jZS50aW1pbmcubmF2aWdhdGlvblN0YXJ0XHJcbi8vICAgICAgICAgfVxyXG4vL1xyXG4vLyAgICAgICAgIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSBmdW5jdGlvbiBub3coKSB7XHJcbi8vICAgICAgICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gbm93T2Zmc2V0O1xyXG4vLyAgICAgICAgIH1cclxuLy8gICAgIH1cclxuLy9cclxuLy8gICAgIC8vXHJcbi8vXHJcbi8vIH0pKCk7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRpb24ob3B0aW9ucykge1xyXG4gICAgaWYgKCFvcHRpb25zLmRhdGEpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdubyBkYXRhJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICB0aGlzLmR1cmF0aW9uID0gb3B0aW9ucy5kYXRhLmR1cmF0aW9uO1xyXG4gICAgdGhpcy5iYXNlV2lkdGggPSBvcHRpb25zLmRhdGEud2lkdGg7XHJcbiAgICB0aGlzLmJhc2VIZWlnaHQgPSBvcHRpb25zLmRhdGEuaGVpZ2h0O1xyXG4gICAgdGhpcy5yYXRpbyA9IG9wdGlvbnMuZGF0YS53aWR0aCAvIG9wdGlvbnMuZGF0YS5oZWlnaHQ7XHJcblxyXG4gICAgdGhpcy5tYXJrZXJzID0gb3B0aW9ucy5kYXRhLm1hcmtlcnM7XHJcblxyXG4gICAgdGhpcy5jYW52YXMgPSBvcHRpb25zLmNhbnZhcyB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMubG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZTtcclxuICAgIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbyA9IG9wdGlvbnMuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xyXG4gICAgdGhpcy5mbHVpZCA9IG9wdGlvbnMuZmx1aWQgfHwgdHJ1ZTtcclxuICAgIHRoaXMucmV2ZXJzZWQgPSBvcHRpb25zLnJldmVyc2VkIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5pbWFnZUJhc2VQYXRoID0gb3B0aW9ucy5pbWFnZUJhc2VQYXRoIHx8ICcnO1xyXG4gICAgdGhpcy5vbkNvbXBsZXRlID0gb3B0aW9ucy5vbkNvbXBsZXRlIHx8IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB9O1xyXG5cclxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5iYXNlSGVpZ2h0O1xyXG5cclxuICAgIHRoaXMuYnVmZmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmJ1ZmZlci53aWR0aCA9IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgdGhpcy5idWZmZXIuaGVpZ2h0ID0gdGhpcy5iYXNlSGVpZ2h0O1xyXG4gICAgdGhpcy5idWZmZXJDdHggPSB0aGlzLmJ1ZmZlci5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIHRoaXMubGF5ZXJzID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuZGF0YS5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAob3B0aW9ucy5kYXRhLmxheWVyc1tpXS50eXBlID09PSAndmVjdG9yJykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVycy5wdXNoKG5ldyBHcm91cChvcHRpb25zLmRhdGEubGF5ZXJzW2ldLCB0aGlzLmJ1ZmZlckN0eCwgMCwgdGhpcy5kdXJhdGlvbikpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5kYXRhLmxheWVyc1tpXS50eXBlID09PSAnaW1hZ2UnKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzLnB1c2gobmV3IEltYWdlTGF5ZXIob3B0aW9ucy5kYXRhLmxheWVyc1tpXSwgdGhpcy5idWZmZXJDdHgsIDAsIHRoaXMuZHVyYXRpb24sIHRoaXMuaW1hZ2VCYXNlUGF0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubnVtTGF5ZXJzID0gdGhpcy5sYXllcnMubGVuZ3RoO1xyXG5cclxuICAgIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICB0aGlzLnJlc2l6ZSgpO1xyXG5cclxuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcblxyXG4gICAgX2FuaW1hdGlvbnMucHVzaCh0aGlzKTtcclxuICAgIF9hbmltYXRpb25zTGVuZ3RoID0gX2FuaW1hdGlvbnMubGVuZ3RoO1xyXG59XHJcblxyXG5BbmltYXRpb24ucHJvdG90eXBlID0ge1xyXG5cclxuICAgIHBsYXk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1BhdXNlZCkgdGhpcy5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnb3RvQW5kUGxheTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMuZ2V0TWFya2VyKGlkKTtcclxuICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdvdG9BbmRTdG9wOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xyXG4gICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IG1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TWFya2VyOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGlkID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2lkXTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpZCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcnNbaV0uY29tbWVudCA9PT0gaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUud2FybignTWFya2VyIG5vdCBmb3VuZCcpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGVja1N0b3BNYXJrZXJzOiBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZXJzW2ldLnN0b3AgJiYgdGhpcy5tYXJrZXJzW2ldLnRpbWUgPiBmcm9tICYmIHRoaXMubWFya2Vyc1tpXS50aW1lIDwgdG8pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtlcnNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRTdGVwOiBmdW5jdGlvbiAoc3RlcCkge1xyXG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jb21wVGltZSA9IHN0ZXAgKiB0aGlzLmR1cmF0aW9uO1xyXG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRTdGVwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcFRpbWUgLyB0aGlzLmR1cmF0aW9uO1xyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRoZW4pIHRoaXMudGhlbiA9IHRpbWU7XHJcblxyXG4gICAgICAgIHZhciBkZWx0YSA9IHRpbWUgLSB0aGlzLnRoZW47XHJcbiAgICAgICAgdGhpcy50aGVuID0gdGltZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnJldmVyc2VkID8gdGhpcy5jb21wVGltZSAtIGRlbHRhIDogdGhpcy5jb21wVGltZSArIGRlbHRhO1xyXG5cclxuICAgICAgICAgICAgdmFyIHN0b3BNYXJrZXIgPSB0aGlzLmNoZWNrU3RvcE1hcmtlcnModGhpcy5jb21wVGltZSAtIGRlbHRhLCB0aGlzLmNvbXBUaW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBUaW1lID4gdGhpcy5kdXJhdGlvbiB8fCB0aGlzLnJldmVyc2VkICYmIHRoaXMuY29tcFRpbWUgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IDAgOiB0aGlzLmR1cmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvb3ApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzdG9wTWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gc3RvcE1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3KHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRyYXdGcmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBkcmF3OiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhc2VXaWR0aCwgdGhpcy5iYXNlSGVpZ2h0KTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5sYXllcnNbaV0uaW4gJiYgdGltZSA8IHRoaXMubGF5ZXJzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uZHJhdyh0aGlzLmN0eCwgdGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uIChjYikge1xyXG4gICAgICAgIHRoaXMub25sb2FkQ0IgPSBjYjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldIGluc3RhbmNlb2YgSW1hZ2VMYXllcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ucHJlbG9hZCh0aGlzLm9ubG9hZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgb25sb2FkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxheWVyc1tpXSBpbnN0YW5jZW9mIEltYWdlTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sYXllcnNbaV0uaXNMb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9ubG9hZENCID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25sb2FkQ0IoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuZHVyYXRpb24gOiAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1MYXllcnM7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNldEtleWZyYW1lczogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbnVsbDtcclxuICAgICAgICB2YXIgaSA9IF9hbmltYXRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgaWYgKGkgPiAtMSkge1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9ucy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zTGVuZ3RoID0gX2FuaW1hdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jYW52YXMucGFyZW50Tm9kZSkgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2l6ZTogZnVuY3Rpb24gKHcpIHtcclxuICAgICAgICBpZiAodGhpcy5mbHVpZCkge1xyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSB3IHx8IHRoaXMuY2FudmFzLmNsaWVudFdpZHRoIHx8IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aWR0aCAvIHRoaXMucmF0aW8gKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcblxyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlci53aWR0aCA9IHdpZHRoICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlci5oZWlnaHQgPSB3aWR0aCAvIHRoaXMucmF0aW8gKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNjYWxlID0gd2lkdGggLyB0aGlzLmJhc2VXaWR0aCAqIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgdGhpcy5jdHgudHJhbnNmb3JtKHRoaXMuc2NhbGUsIDAsIDAsIHRoaXMuc2NhbGUsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC50cmFuc2Zvcm0odGhpcy5zY2FsZSwgMCwgMCwgdGhpcy5zY2FsZSwgMCwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXQgcmV2ZXJzZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2VkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXQgcmV2ZXJzZWQoYm9vbCkge1xyXG4gICAgICAgIHRoaXMuX3JldmVyc2VkID0gYm9vbDtcclxuICAgICAgICBpZiAodGhpcy5wYXVzZWRUaW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnBhdXNlZFRpbWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICBBbmltYXRpb246IEFuaW1hdGlvbixcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgdGltZSA9IHRpbWUgIT09IHVuZGVmaW5lZCA/IHRpbWUgOiBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfYW5pbWF0aW9uc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zW2ldLnVwZGF0ZSh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4vQmV6aWVyRWFzaW5nJyk7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRlZFBhdGgoZGF0YSkge1xyXG4gICAgUGF0aC5jYWxsKHRoaXMsIGRhdGEpO1xyXG4gICAgdGhpcy5mcmFtZUNvdW50ID0gdGhpcy5mcmFtZXMubGVuZ3RoO1xyXG59XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXRoLnByb3RvdHlwZSk7XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLmZpbmlzaGVkICYmIHRpbWUgPj0gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZTtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCAmJiB0aW1lIDw9IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXN0RnJhbWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyICsgMSA9PT0gdGhpcy5mcmFtZUNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyIDwgMikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXItLTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZUF0VGltZSh0aW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aW1lID4gdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5mcmFtZUNvdW50OyBpKyspIHtcclxuICAgICAgICBpZiAodGltZSA+PSB0aGlzLmZyYW1lc1tpIC0gMV0udCAmJiB0aW1lIDw9IHRoaXMuZnJhbWVzW2ldKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9pbnRlciA9IGk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbaSAtIDFdO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xyXG4gICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuc2V0RWFzaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMubGFzdEZyYW1lLmVhc2VPdXQgJiYgdGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBuZXcgQmV6aWVyRWFzaW5nKHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMF0sIHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMV0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblswXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzFdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAoIHRpbWUgLSB0aGlzLmxhc3RGcmFtZS50ICk7XHJcbiAgICB2YXIgZHVyYXRpb24gPSB0aGlzLm5leHRGcmFtZS50IC0gdGhpcy5sYXN0RnJhbWUudDtcclxuICAgIHZhciBlbGFwc2VkID0gZGVsdGEgLyBkdXJhdGlvbjtcclxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XHJcbiAgICBlbHNlIGlmIChlbGFwc2VkIDwgMCkgZWxhcHNlZCA9IDA7XHJcbiAgICBlbHNlIGlmICh0aGlzLmVhc2luZykgZWxhcHNlZCA9IHRoaXMuZWFzaW5nKGVsYXBzZWQpO1xyXG4gICAgdmFyIGFjdHVhbFZlcnRpY2VzID0gW10sXHJcbiAgICAgICAgYWN0dWFsTGVuZ3RoID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzQ291bnQ7IGkrKykge1xyXG4gICAgICAgIHZhciBjcDF4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMF0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDF5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMV0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMV0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDJ4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMl0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMl0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDJ5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bM10sIHRoaXMubmV4dEZyYW1lLnZbaV1bM10sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICB4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bNF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bNF0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICB5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bNV0sIHRoaXMubmV4dEZyYW1lLnZbaV1bNV0sIGVsYXBzZWQpO1xyXG5cclxuICAgICAgICBhY3R1YWxWZXJ0aWNlcy5wdXNoKFtjcDF4LCBjcDF5LCBjcDJ4LCBjcDJ5LCB4LCB5XSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnZlcnRpY2VzQ291bnQgLSAxOyBqKyspIHtcclxuICAgICAgICBhY3R1YWxMZW5ndGgucHVzaCh0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUubGVuW2pdLCB0aGlzLm5leHRGcmFtZS5sZW5bal0sIGVsYXBzZWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHYgIDogYWN0dWFsVmVydGljZXMsXHJcbiAgICAgICAgbGVuOiBhY3R1YWxMZW5ndGhcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5wb2ludGVyID0gcmV2ZXJzZWQgPyB0aGlzLmZyYW1lQ291bnQgLSAxIDogMTtcclxuICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0ZWRQYXRoO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQmV6aWVyRWFzaW5nID0gcmVxdWlyZSgnLi9CZXppZXJFYXNpbmcnKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkUHJvcGVydHkoZGF0YSkge1xyXG4gICAgUHJvcGVydHkuY2FsbCh0aGlzLCBkYXRhKTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFByb3BlcnR5LnByb3RvdHlwZSk7XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICB2YXIgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFycltpXSA9IGFbaV0gKyB0ICogKGJbaV0gLSBhW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEVhc2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLm5leHRGcmFtZS5lYXNlSW4pIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG5ldyBCZXppZXJFYXNpbmcodGhpcy5sYXN0RnJhbWUuZWFzZU91dFswXSwgdGhpcy5sYXN0RnJhbWUuZWFzZU91dFsxXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzBdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCAmJiB0aW1lID49IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0RnJhbWUudjtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCAmJiB0aW1lIDw9IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXN0RnJhbWUudjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRpbWUgPiB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgKyAxID09PSB0aGlzLmZyYW1lQ291bnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRpbWUgPCB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgPCAyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlci0tO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlQXRUaW1lKHRpbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIC8vY29uc29sZS5sb2codGltZSwgdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMl0udCwgdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCk7XHJcblxyXG4gICAgaWYgKHRpbWUgPCB0aGlzLmZyYW1lc1swXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRpbWUgPiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gdGhpcy5mcmFtZUNvdW50IC0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICAgIGlmICh0aW1lID49IHRoaXMuZnJhbWVzW2kgLSAxXS50ICYmIHRpbWUgPD0gdGhpcy5mcmFtZXNbaV0udCkge1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXIgPSBpO1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW2kgLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldEVsYXBzZWQgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5sYXN0RnJhbWUudCApLFxyXG4gICAgICAgIGR1cmF0aW9uID0gdGhpcy5uZXh0RnJhbWUudCAtIHRoaXMubGFzdEZyYW1lLnQsXHJcbiAgICAgICAgZWxhcHNlZCA9IGRlbHRhIC8gZHVyYXRpb247XHJcblxyXG4gICAgaWYgKGVsYXBzZWQgPiAxKSBlbGFwc2VkID0gMTtcclxuICAgIGVsc2UgaWYgKGVsYXBzZWQgPCAwKSBlbGFwc2VkID0gMDtcclxuICAgIGVsc2UgaWYgKHRoaXMuZWFzaW5nKSBlbGFwc2VkID0gdGhpcy5lYXNpbmcoZWxhcHNlZCk7XHJcbiAgICByZXR1cm4gZWxhcHNlZDtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHJldHVybiB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudiwgdGhpcy5uZXh0RnJhbWUudiwgdGhpcy5nZXRFbGFwc2VkKHRpbWUpKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMucG9pbnRlciA9IHJldmVyc2VkID8gdGhpcy5mcmFtZUNvdW50IC0gMSA6IDE7XHJcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGVkUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gQmV6aWVyKHBhdGgpIHtcclxuICAgIHRoaXMucGF0aCA9IHBhdGg7XHJcbn1cclxuXHJcbkJlemllci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xyXG4gICAgdGhpcy5zdGVwcyA9IE1hdGgubWF4KE1hdGguZmxvb3IobGVuIC8gMTApLCAxKTtcclxuICAgIHRoaXMuYXJjTGVuZ3RocyA9IG5ldyBBcnJheSh0aGlzLnN0ZXBzICsgMSk7XHJcbiAgICB0aGlzLmFyY0xlbmd0aHNbMF0gPSAwO1xyXG5cclxuICAgIHZhciBveCA9IHRoaXMuY3ViaWNOKDAsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgb3kgPSB0aGlzLmN1YmljTigwLCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pLFxyXG4gICAgICAgIGNsZW4gPSAwLFxyXG4gICAgICAgIGl0ZXJhdG9yID0gMSAvIHRoaXMuc3RlcHM7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gdGhpcy5zdGVwczsgaSArPSAxKSB7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLmN1YmljTihpICogaXRlcmF0b3IsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgICAgIHkgPSB0aGlzLmN1YmljTihpICogaXRlcmF0b3IsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSk7XHJcblxyXG4gICAgICAgIHZhciBkeCA9IG94IC0geCxcclxuICAgICAgICAgICAgZHkgPSBveSAtIHk7XHJcblxyXG4gICAgICAgIGNsZW4gKz0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcclxuICAgICAgICB0aGlzLmFyY0xlbmd0aHNbaV0gPSBjbGVuO1xyXG5cclxuICAgICAgICBveCA9IHg7XHJcbiAgICAgICAgb3kgPSB5O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubGVuZ3RoID0gY2xlbjtcclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKHUpIHtcclxuICAgIHZhciB0YXJnZXRMZW5ndGggPSB1ICogdGhpcy5hcmNMZW5ndGhzW3RoaXMuc3RlcHNdO1xyXG4gICAgdmFyIGxvdyA9IDAsXHJcbiAgICAgICAgaGlnaCA9IHRoaXMuc3RlcHMsXHJcbiAgICAgICAgaW5kZXggPSAwO1xyXG5cclxuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XHJcbiAgICAgICAgaW5kZXggPSBsb3cgKyAoKChoaWdoIC0gbG93KSAvIDIpIHwgMCk7XHJcbiAgICAgICAgaWYgKHRoaXMuYXJjTGVuZ3Roc1tpbmRleF0gPCB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICAgICAgbG93ID0gaW5kZXggKyAxO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoaWdoID0gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuYXJjTGVuZ3Roc1tpbmRleF0gPiB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICBpbmRleC0tO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsZW5ndGhCZWZvcmUgPSB0aGlzLmFyY0xlbmd0aHNbaW5kZXhdO1xyXG4gICAgaWYgKGxlbmd0aEJlZm9yZSA9PT0gdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4IC8gdGhpcy5zdGVwcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIChpbmRleCArICh0YXJnZXRMZW5ndGggLSBsZW5ndGhCZWZvcmUpIC8gKHRoaXMuYXJjTGVuZ3Roc1tpbmRleCArIDFdIC0gbGVuZ3RoQmVmb3JlKSkgLyB0aGlzLnN0ZXBzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5nZXRWYWx1ZXMgPSBmdW5jdGlvbiAoZWxhcHNlZCkge1xyXG4gICAgdmFyIHQgPSB0aGlzLm1hcChlbGFwc2VkKSxcclxuICAgICAgICB4ID0gdGhpcy5jdWJpY04odCwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcclxuICAgICAgICB5ID0gdGhpcy5jdWJpY04odCwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKTtcclxuXHJcbiAgICByZXR1cm4gW3gsIHldO1xyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5jdWJpY04gPSBmdW5jdGlvbiAocGN0LCBhLCBiLCBjLCBkKSB7XHJcbiAgICB2YXIgdDIgPSBwY3QgKiBwY3Q7XHJcbiAgICB2YXIgdDMgPSB0MiAqIHBjdDtcclxuICAgIHJldHVybiBhICsgKC1hICogMyArIHBjdCAqICgzICogYSAtIGEgKiBwY3QpKSAqIHBjdFxyXG4gICAgICAgICsgKDMgKiBiICsgcGN0ICogKC02ICogYiArIGIgKiAzICogcGN0KSkgKiBwY3RcclxuICAgICAgICArIChjICogMyAtIGMgKiAzICogcGN0KSAqIHQyXHJcbiAgICAgICAgKyBkICogdDM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJlemllcjsiLCIvKipcclxuICogQmV6aWVyRWFzaW5nIC0gdXNlIGJlemllciBjdXJ2ZSBmb3IgdHJhbnNpdGlvbiBlYXNpbmcgZnVuY3Rpb25cclxuICogaXMgYmFzZWQgb24gRmlyZWZveCdzIG5zU01JTEtleVNwbGluZS5jcHBcclxuICogVXNhZ2U6XHJcbiAqIHZhciBzcGxpbmUgPSBCZXppZXJFYXNpbmcoMC4yNSwgMC4xLCAwLjI1LCAxLjApXHJcbiAqIHNwbGluZSh4KSA9PiByZXR1cm5zIHRoZSBlYXNpbmcgdmFsdWUgfCB4IG11c3QgYmUgaW4gWzAsIDFdIHJhbmdlXHJcbiAqXHJcbiAqL1xyXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcclxuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdy5kZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgd2luZG93LmRlZmluZS5hbWQpIHtcclxuICAgICAgICB3aW5kb3cuZGVmaW5lKFtdLCBkZWZpbml0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgd2luZG93LkJlemllckVhc2luZyA9IGRlZmluaXRpb24oKTtcclxuICAgIH1cclxufShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gVGhlc2UgdmFsdWVzIGFyZSBlc3RhYmxpc2hlZCBieSBlbXBpcmljaXNtIHdpdGggdGVzdHMgKHRyYWRlb2ZmOiBwZXJmb3JtYW5jZSBWUyBwcmVjaXNpb24pXHJcbiAgICB2YXIgTkVXVE9OX0lURVJBVElPTlMgPSA0O1xyXG4gICAgdmFyIE5FV1RPTl9NSU5fU0xPUEUgPSAwLjAwMTtcclxuICAgIHZhciBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDE7XHJcbiAgICB2YXIgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMgPSAxMDtcclxuXHJcbiAgICB2YXIga1NwbGluZVRhYmxlU2l6ZSA9IDExO1xyXG4gICAgdmFyIGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKTtcclxuXHJcbiAgICB2YXIgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gXCJmdW5jdGlvblwiO1xyXG5cclxuICAgIGZ1bmN0aW9uIEJlemllckVhc2luZyAobVgxLCBtWTEsIG1YMiwgbVkyKSB7XHJcblxyXG4gICAgICAgIC8vIFZhbGlkYXRlIGFyZ3VtZW50c1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICE9PSA0KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyByZXF1aXJlcyA0IGFyZ3VtZW50cy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTw0OyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gIT09IFwibnVtYmVyXCIgfHwgaXNOYU4oYXJndW1lbnRzW2ldKSB8fCAhaXNGaW5pdGUoYXJndW1lbnRzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIGFyZ3VtZW50cyBzaG91bGQgYmUgaW50ZWdlcnMuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtWDEgPCAwIHx8IG1YMSA+IDEgfHwgbVgyIDwgMCB8fCBtWDIgPiAxKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyB4IHZhbHVlcyBtdXN0IGJlIGluIFswLCAxXSByYW5nZS5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbVNhbXBsZVZhbHVlcyA9IGZsb2F0MzJBcnJheVN1cHBvcnRlZCA/IG5ldyBGbG9hdDMyQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSkgOiBuZXcgQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIEEgKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTE7IH1cclxuICAgICAgICBmdW5jdGlvbiBCIChhQTEsIGFBMikgeyByZXR1cm4gMy4wICogYUEyIC0gNi4wICogYUExOyB9XHJcbiAgICAgICAgZnVuY3Rpb24gQyAoYUExKSAgICAgIHsgcmV0dXJuIDMuMCAqIGFBMTsgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm5zIHgodCkgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgeSh0KSBnaXZlbiB0LCB5MSwgYW5kIHkyLlxyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNCZXppZXIgKGFULCBhQTEsIGFBMikge1xyXG4gICAgICAgICAgICByZXR1cm4gKChBKGFBMSwgYUEyKSphVCArIEIoYUExLCBhQTIpKSphVCArIEMoYUExKSkqYVQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm5zIGR4L2R0IGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIGR5L2R0IGdpdmVuIHQsIHkxLCBhbmQgeTIuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0U2xvcGUgKGFULCBhQTEsIGFBMikge1xyXG4gICAgICAgICAgICByZXR1cm4gMy4wICogQShhQTEsIGFBMikqYVQqYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUgKGFYLCBhR3Vlc3NUKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTkVXVE9OX0lURVJBVElPTlM7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRTbG9wZSA9IGdldFNsb3BlKGFHdWVzc1QsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2xvcGUgPT09IDAuMCkgcmV0dXJuIGFHdWVzc1Q7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xyXG4gICAgICAgICAgICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYUd1ZXNzVDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNTYW1wbGVWYWx1ZXMgKCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgbVNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBiaW5hcnlTdWJkaXZpZGUgKGFYLCBhQSwgYUIpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XHJcbiAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50WCA9IGNhbGNCZXppZXIoY3VycmVudFQsIG1YMSwgbVgyKSAtIGFYO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRYID4gMC4wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYUIgPSBjdXJyZW50VDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYUEgPSBjdXJyZW50VDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gU1VCRElWSVNJT05fUFJFQ0lTSU9OICYmICsraSA8IFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TKTtcclxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0VEZvclggKGFYKSB7XHJcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbFN0YXJ0ID0gMC4wO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFNhbXBsZSA9IDE7XHJcbiAgICAgICAgICAgIHZhciBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgY3VycmVudFNhbXBsZSAhPSBsYXN0U2FtcGxlICYmIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0gPD0gYVg7ICsrY3VycmVudFNhbXBsZSkge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLS1jdXJyZW50U2FtcGxlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW50ZXJwb2xhdGUgdG8gcHJvdmlkZSBhbiBpbml0aWFsIGd1ZXNzIGZvciB0XHJcbiAgICAgICAgICAgIHZhciBkaXN0ID0gKGFYIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAobVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlKzFdIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSk7XHJcbiAgICAgICAgICAgIHZhciBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSBORVdUT05fTUlOX1NMT1BFKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGd1ZXNzRm9yVCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09IDAuMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobVgxICE9IG1ZMSB8fCBtWDIgIT0gbVkyKVxyXG4gICAgICAgICAgICBjYWxjU2FtcGxlVmFsdWVzKCk7XHJcblxyXG4gICAgICAgIHZhciBmID0gZnVuY3Rpb24gKGFYKSB7XHJcbiAgICAgICAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgcmV0dXJuIGFYOyAvLyBsaW5lYXJcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBKYXZhU2NyaXB0IG51bWJlciBhcmUgaW1wcmVjaXNlLCB3ZSBzaG91bGQgZ3VhcmFudGVlIHRoZSBleHRyZW1lcyBhcmUgcmlnaHQuXHJcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMCkgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMSkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKGFYKSwgbVkxLCBtWTIpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHN0ciA9IFwiQmV6aWVyRWFzaW5nKFwiK1ttWDEsIG1ZMSwgbVgyLCBtWTJdK1wiKVwiO1xyXG4gICAgICAgIGYudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzdHI7IH07XHJcblxyXG4gICAgICAgIHJldHVybiBmO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENTUyBtYXBwaW5nXHJcbiAgICBCZXppZXJFYXNpbmcuY3NzID0ge1xyXG4gICAgICAgIFwiZWFzZVwiOiAgICAgICAgQmV6aWVyRWFzaW5nKDAuMjUsIDAuMSwgMC4yNSwgMS4wKSxcclxuICAgICAgICBcImxpbmVhclwiOiAgICAgIEJlemllckVhc2luZygwLjAwLCAwLjAsIDEuMDAsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLWluXCI6ICAgICBCZXppZXJFYXNpbmcoMC40MiwgMC4wLCAxLjAwLCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1vdXRcIjogICAgQmV6aWVyRWFzaW5nKDAuMDAsIDAuMCwgMC41OCwgMS4wKSxcclxuICAgICAgICBcImVhc2UtaW4tb3V0XCI6IEJlemllckVhc2luZygwLjQyLCAwLjAsIDAuNTgsIDEuMClcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEJlemllckVhc2luZztcclxufSkpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEVsbGlwc2UoZGF0YSkge1xyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5zaXplID0gZGF0YS5zaXplLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNpemUpIDogbmV3IFByb3BlcnR5KGRhdGEuc2l6ZSk7XHJcbiAgICAvL29wdGlvbmFsXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbiA9IGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG59XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdO1xyXG5cclxuICAgIHZhciBpLCBqO1xyXG5cclxuICAgIHZhciB3ID0gc2l6ZVswXSAvIDIsXHJcbiAgICAgICAgaCA9IHNpemVbMV0gLyAyLFxyXG4gICAgICAgIHggPSBwb3NpdGlvblswXSAtIHcsXHJcbiAgICAgICAgeSA9IHBvc2l0aW9uWzFdIC0gaCxcclxuICAgICAgICBvdyA9IHcgKiAuNTUyMjg0OCxcclxuICAgICAgICBvaCA9IGggKiAuNTUyMjg0ODtcclxuXHJcbiAgICB2YXIgdmVydGljZXMgPSBbXHJcbiAgICAgICAgW3ggKyB3ICsgb3csIHksIHggKyB3IC0gb3csIHksIHggKyB3LCB5XSxcclxuICAgICAgICBbeCArIHcgKyB3LCB5ICsgaCArIG9oLCB4ICsgdyArIHcsIHkgKyBoIC0gb2gsIHggKyB3ICsgdywgeSArIGhdLFxyXG4gICAgICAgIFt4ICsgdyAtIG93LCB5ICsgaCArIGgsIHggKyB3ICsgb3csIHkgKyBoICsgaCwgeCArIHcsIHkgKyBoICsgaF0sXHJcbiAgICAgICAgW3gsIHkgKyBoIC0gb2gsIHgsIHkgKyBoICsgb2gsIHgsIHkgKyBoXVxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0dixcclxuICAgICAgICAgICAgbGVuID0gdyArIGg7XHJcblxyXG4gICAgICAgIHRyaW0gPSB0aGlzLmdldFRyaW1WYWx1ZXModHJpbSk7XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICBpZiAoaiA+IDMpIGogPSAwO1xyXG4gICAgICAgICAgICBpZiAoaSA+IHRyaW0uc3RhcnRJbmRleCAmJiBpIDwgdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odmVydGljZXNbaV1bMF0sIHZlcnRpY2VzW2ldWzFdLCB2ZXJ0aWNlc1tqXVsyXSwgdmVydGljZXNbal1bM10sIHZlcnRpY2VzW2pdWzRdLCB2ZXJ0aWNlc1tqXVs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5zdGFydEluZGV4ICYmIGkgPT09IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5zdGFydEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIHRyaW0uc3RhcnQsIDEsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCAwLCB0cmltLmVuZCwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyh2ZXJ0aWNlc1swXVs0XSwgdmVydGljZXNbMF1bNV0pO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICBpZiAoaiA+IDMpIGogPSAwO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2ZXJ0aWNlc1tpXVswXSwgdmVydGljZXNbaV1bMV0sIHZlcnRpY2VzW2pdWzJdLCB2ZXJ0aWNlc1tqXVszXSwgdmVydGljZXNbal1bNF0sIHZlcnRpY2VzW2pdWzVdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5nZXRUcmltVmFsdWVzID0gZnVuY3Rpb24gKHRyaW0pIHtcclxuICAgIHZhciBzdGFydEluZGV4ID0gTWF0aC5mbG9vcih0cmltLnN0YXJ0ICogNCksXHJcbiAgICAgICAgZW5kSW5kZXggPSBNYXRoLmZsb29yKHRyaW0uZW5kICogNCksXHJcbiAgICAgICAgc3RhcnQgPSAodHJpbS5zdGFydCAtIHN0YXJ0SW5kZXggKiAwLjI1KSAqIDQsXHJcbiAgICAgICAgZW5kID0gKHRyaW0uZW5kIC0gZW5kSW5kZXggKiAwLjI1KSAqIDQ7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydEluZGV4OiBzdGFydEluZGV4LFxyXG4gICAgICAgIGVuZEluZGV4ICA6IGVuZEluZGV4LFxyXG4gICAgICAgIHN0YXJ0ICAgICA6IHN0YXJ0LFxyXG4gICAgICAgIGVuZCAgICAgICA6IGVuZFxyXG4gICAgfTtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnNpemUuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuc2l6ZS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVsbGlwc2U7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gRmlsbChkYXRhKSB7XHJcbiAgICB0aGlzLmNvbG9yID0gZGF0YS5jb2xvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5jb2xvcikgOiBuZXcgUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuRmlsbC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5vcGFjaXR5ID8gdGhpcy5vcGFjaXR5LmdldFZhbHVlKHRpbWUpIDogMTtcclxuICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChjb2xvclswXSkgKyAnLCAnICsgTWF0aC5yb3VuZChjb2xvclsxXSkgKyAnLCAnICsgTWF0aC5yb3VuZChjb2xvclsyXSkgKyAnLCAnICsgb3BhY2l0eSArICcpJztcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnNldENvbG9yID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcjtcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLmNvbG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5jb2xvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGaWxsOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTdHJva2UgPSByZXF1aXJlKCcuL1N0cm9rZScpLFxyXG4gICAgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpLFxyXG4gICAgRWxsaXBzZSA9IHJlcXVpcmUoJy4vRWxsaXBzZScpLFxyXG4gICAgUG9seXN0YXIgPSByZXF1aXJlKCcuL1BvbHlzdGFyJyksXHJcbiAgICBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpLFxyXG4gICAgRmlsbCA9IHJlcXVpcmUoJy4vRmlsbCcpLFxyXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcclxuICAgIE1lcmdlID0gcmVxdWlyZSgnLi9NZXJnZScpLFxyXG4gICAgVHJpbSA9IHJlcXVpcmUoJy4vVHJpbScpO1xyXG5cclxuZnVuY3Rpb24gR3JvdXAoZGF0YSwgYnVmZmVyQ3R4LCBwYXJlbnRJbiwgcGFyZW50T3V0KSB7XHJcblxyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmluID0gZGF0YS5pbiA/IGRhdGEuaW4gOiBwYXJlbnRJbjtcclxuICAgIHRoaXMub3V0ID0gZGF0YS5vdXQgPyBkYXRhLm91dCA6IHBhcmVudE91dDtcclxuXHJcbiAgICBpZiAoZGF0YS5maWxsKSB0aGlzLmZpbGwgPSBuZXcgRmlsbChkYXRhLmZpbGwpO1xyXG4gICAgaWYgKGRhdGEuc3Ryb2tlKSB0aGlzLnN0cm9rZSA9IG5ldyBTdHJva2UoZGF0YS5zdHJva2UpO1xyXG4gICAgaWYgKGRhdGEudHJpbSkgdGhpcy50cmltID0gbmV3IFRyaW0oZGF0YS50cmltKTtcclxuICAgIGlmIChkYXRhLm1lcmdlKSB0aGlzLm1lcmdlID0gbmV3IE1lcmdlKGRhdGEubWVyZ2UpO1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybShkYXRhLnRyYW5zZm9ybSk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IGJ1ZmZlckN0eDtcclxuXHJcbiAgICBpZiAoZGF0YS5ncm91cHMpIHtcclxuICAgICAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHMucHVzaChuZXcgR3JvdXAoZGF0YS5ncm91cHNbaV0sIHRoaXMuYnVmZmVyQ3R4LCB0aGlzLmluLCB0aGlzLm91dCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5zaGFwZXMpIHtcclxuICAgICAgICB0aGlzLnNoYXBlcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGF0YS5zaGFwZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdmFyIHNoYXBlID0gZGF0YS5zaGFwZXNbal07XHJcbiAgICAgICAgICAgIGlmIChzaGFwZS50eXBlID09PSAncGF0aCcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzaGFwZS5pc0FuaW1hdGVkKSB0aGlzLnNoYXBlcy5wdXNoKG5ldyBBbmltYXRlZFBhdGgoc2hhcGUpKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5zaGFwZXMucHVzaChuZXcgUGF0aChzaGFwZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdyZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgUmVjdChzaGFwZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdlbGxpcHNlJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgRWxsaXBzZShzaGFwZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdwb2x5c3RhcicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IFBvbHlzdGFyKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEubWFza3MpIHtcclxuICAgICAgICB0aGlzLm1hc2tzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBkYXRhLm1hc2tzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgIHZhciBtYXNrID0gZGF0YS5tYXNrc1trXTtcclxuICAgICAgICAgICAgaWYgKG1hc2suaXNBbmltYXRlZCkgdGhpcy5tYXNrcy5wdXNoKG5ldyBBbmltYXRlZFBhdGgobWFzaykpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMubWFza3MucHVzaChuZXcgUGF0aChtYXNrKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5Hcm91cC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHBhcmVudEZpbGwsIHBhcmVudFN0cm9rZSwgcGFyZW50VHJpbSwgaXNCdWZmZXIpIHtcclxuXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG5cclxuICAgIC8vVE9ETyBjaGVjayBpZiBjb2xvci9zdHJva2UgaXMgY2hhbmdpbmcgb3ZlciB0aW1lXHJcbiAgICB2YXIgZmlsbCA9IHRoaXMuZmlsbCB8fCBwYXJlbnRGaWxsO1xyXG4gICAgdmFyIHN0cm9rZSA9IHRoaXMuc3Ryb2tlIHx8IHBhcmVudFN0cm9rZTtcclxuICAgIHZhciB0cmltVmFsdWVzID0gdGhpcy50cmltID8gdGhpcy50cmltLmdldFRyaW0odGltZSkgOiBwYXJlbnRUcmltO1xyXG5cclxuICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKGN0eCwgdGltZSk7XHJcbiAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKGN0eCwgdGltZSk7XHJcblxyXG4gICAgaWYgKCFpc0J1ZmZlcikgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0odGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG5cclxuICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5idWZmZXJDdHguY2FudmFzLndpZHRoLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgICAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5tYXNrcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLm1hc2tzW2ldLmRyYXcoY3R4LCB0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY3R4LmNsaXAoKTtcclxuICAgIH1cclxuXHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGwpIHRoaXMuYnVmZmVyQ3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJva2UpIHRoaXMuYnVmZmVyQ3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KGN0eCwgdGltZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuc2hhcGVzW3RoaXMuc2hhcGVzLmxlbmd0aCAtIDFdLmNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgLy9jdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9UT0RPIGdldCBvcmRlclxyXG4gICAgaWYgKGZpbGwpIGN0eC5maWxsKCk7XHJcbiAgICBpZiAoIWlzQnVmZmVyICYmIHN0cm9rZSkgY3R4LnN0cm9rZSgpO1xyXG5cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcodGhpcy5idWZmZXJDdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXJnZS5zZXRDb21wb3NpdGVPcGVyYXRpb24odGhpcy5idWZmZXJDdHgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyhjdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuR3JvdXAucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5zZXRLZXlmcmFtZXModGltZSk7XHJcblxyXG4gICAgaWYgKHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubWFza3MpIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMubWFza3MubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdGhpcy5tYXNrc1tqXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGsrKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1trXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zdHJva2UpIHRoaXMuc3Ryb2tlLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnRyaW0pIHRoaXMudHJpbS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5Hcm91cC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnJlc2V0KHJldmVyc2VkKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5tYXNrcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLm1hc2tzW2pdLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2tdLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5maWxsKSB0aGlzLmZpbGwucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc3Ryb2tlKSB0aGlzLnN0cm9rZS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy50cmltKSB0aGlzLnRyaW0ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHcm91cDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpO1xyXG5cclxuZnVuY3Rpb24gSW1hZ2VMYXllcihkYXRhLCBidWZmZXJDdHgsIHBhcmVudEluLCBwYXJlbnRPdXQsIGJhc2VQYXRoKSB7XHJcblxyXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5zb3VyY2UgPSBiYXNlUGF0aCArIGRhdGEuc291cmNlO1xyXG5cclxuICAgIHRoaXMuaW4gPSBkYXRhLmluID8gZGF0YS5pbiA6IHBhcmVudEluO1xyXG4gICAgdGhpcy5vdXQgPSBkYXRhLm91dCA/IGRhdGEub3V0IDogcGFyZW50T3V0O1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybShkYXRhLnRyYW5zZm9ybSk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IGJ1ZmZlckN0eDtcclxufVxyXG5cclxuSW1hZ2VMYXllci5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uIChjYikge1xyXG4gICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2U7XHJcbiAgICB0aGlzLmltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBjYigpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLmltZy5zcmMgPSB0aGlzLnNvdXJjZTtcclxufTtcclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgaWYgKCF0aGlzLmlzTG9hZGVkKSByZXR1cm47XHJcblxyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIHRoaXMudHJhbnNmb3JtLnRyYW5zZm9ybShjdHgsIHRpbWUpO1xyXG5cclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDApO1xyXG5cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuSW1hZ2VMYXllci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMYXllcjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIE1lcmdlKGRhdGEpIHtcclxuICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZTtcclxufVxyXG5cclxuTWVyZ2UucHJvdG90eXBlLnNldENvbXBvc2l0ZU9wZXJhdGlvbiA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdXQnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWluJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3hvcic7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXJnZTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpO1xyXG5cclxuZnVuY3Rpb24gUGF0aChkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gZGF0YS5jbG9zZWQ7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGEuZnJhbWVzO1xyXG4gICAgdGhpcy52ZXJ0aWNlc0NvdW50ID0gdGhpcy5mcmFtZXNbMF0udi5sZW5ndGg7XHJcbn1cclxuXHJcblBhdGgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcbiAgICB2YXIgZnJhbWUgPSB0aGlzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHZlcnRpY2VzID0gZnJhbWUudjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIGlmICgodHJpbS5zdGFydCA9PT0gMCAmJiB0cmltLmVuZCA9PT0gMCkgfHxcclxuICAgICAgICAgICAgKHRyaW0uc3RhcnQgPT09IDEgJiYgdHJpbS5lbmQgPT09IDEpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0sIGZyYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDE7IGogPCB2ZXJ0aWNlcy5sZW5ndGg7IGorKykge1xyXG5cclxuICAgICAgICB2YXIgbmV4dFZlcnRleCA9IHZlcnRpY2VzW2pdLFxyXG4gICAgICAgICAgICBsYXN0VmVydGV4ID0gdmVydGljZXNbaiAtIDFdO1xyXG5cclxuICAgICAgICBpZiAodHJpbSkge1xyXG4gICAgICAgICAgICB2YXIgdHY7XHJcblxyXG4gICAgICAgICAgICBpZiAoaiA9PT0gMSAmJiB0cmltLnN0YXJ0SW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSAmJiBqID09PSB0cmltLmVuZEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uc3RhcnRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIHRyaW0uc3RhcnQsIDEsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCAwLCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA+IHRyaW0uc3RhcnRJbmRleCArIDEgJiYgaiA8IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChqID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRyaW0gJiYgdGhpcy5jbG9zZWQpIHtcclxuICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCB2ZXJ0aWNlc1swXVsyXSwgdmVydGljZXNbMF1bM10sIHZlcnRpY2VzWzBdWzRdLCB2ZXJ0aWNlc1swXVs1XSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmZyYW1lc1swXTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFRyaW1WYWx1ZXMgPSBmdW5jdGlvbiAodHJpbSwgZnJhbWUpIHtcclxuICAgIHZhciBpO1xyXG5cclxuICAgIHZhciBhY3R1YWxUcmltID0ge1xyXG4gICAgICAgIHN0YXJ0SW5kZXg6IDAsXHJcbiAgICAgICAgZW5kSW5kZXg6IDAsXHJcbiAgICAgICAgc3RhcnQ6IDAsXHJcbiAgICAgICAgZW5kOiAwXHJcbiAgICB9O1xyXG5cclxuLy8gVE9ETyBjbGVhbiB1cFxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDApIHtcclxuICAgICAgICBpZiAodHJpbS5lbmQgPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFjdHVhbFRyaW07XHJcbiAgICAgICAgfSBlbHNlIGlmICh0cmltLmVuZCA9PT0gMSkge1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZEluZGV4ID0gZnJhbWUubGVuLmxlbmd0aDtcclxuICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmQgPSAxO1xyXG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHRvdGFsTGVuID0gdGhpcy5zdW1BcnJheShmcmFtZS5sZW4pLFxyXG4gICAgICAgIHRyaW1BdExlbjtcclxuXHJcbiAgICB0cmltQXRMZW4gPSB0b3RhbExlbiAqIHRyaW0uc3RhcnQ7XHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGZyYW1lLmxlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICh0cmltQXRMZW4gPiAwICYmIHRyaW1BdExlbiA8IGZyYW1lLmxlbltpXSkge1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLnN0YXJ0SW5kZXggPSBpO1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLnN0YXJ0ID0gdHJpbUF0TGVuIC8gZnJhbWUubGVuW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmltQXRMZW4gLT0gZnJhbWUubGVuW2ldO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0cmltLmVuZCA9PT0gMSkge1xyXG4gICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBmcmFtZS5sZW4ubGVuZ3RoO1xyXG4gICAgICAgIGFjdHVhbFRyaW0uZW5kID0gMTtcclxuICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdHJpbUF0TGVuID0gdG90YWxMZW4gKiB0cmltLmVuZDtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGZyYW1lLmxlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodHJpbUF0TGVuID4gMCAmJiB0cmltQXRMZW4gPCBmcmFtZS5sZW5baV0pIHtcclxuICAgICAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmQgPSB0cmltQXRMZW4gLyBmcmFtZS5sZW5baV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHJpbUF0TGVuIC09IGZyYW1lLmxlbltpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFjdHVhbFRyaW07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS50cmltID0gZnVuY3Rpb24gKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIGZyb20sIHRvLCBsZW4pIHtcclxuXHJcbiAgICBpZiAoZnJvbSA9PT0gMCAmJiB0byA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBsYXN0VmVydGV4LFxyXG4gICAgICAgICAgICBlbmQ6IG5leHRWZXJ0ZXhcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmlzU3RyYWlnaHQobGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XSkpIHtcclxuICAgICAgICBzdGFydFZlcnRleCA9IFtcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMF0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzJdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbM10sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzVdLCBuZXh0VmVydGV4WzVdLCBmcm9tKVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGVuZFZlcnRleCA9IFtcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMF0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMV0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbM10sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNF0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIHRvKVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmJlemllciA9IG5ldyBCZXppZXIoW2xhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0sIGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV1dKTtcclxuICAgICAgICB0aGlzLmJlemllci5nZXRMZW5ndGgobGVuKTtcclxuICAgICAgICBmcm9tID0gdGhpcy5iZXppZXIubWFwKGZyb20pO1xyXG4gICAgICAgIHRvID0gdGhpcy5iZXppZXIubWFwKHRvKTtcclxuICAgICAgICB0byA9ICh0byAtIGZyb20pIC8gKDEgLSBmcm9tKTtcclxuXHJcbiAgICAgICAgdmFyIGUxLCBmMSwgZzEsIGgxLCBqMSwgazEsXHJcbiAgICAgICAgICAgIGUyLCBmMiwgZzIsIGgyLCBqMiwgazIsXHJcbiAgICAgICAgICAgIHN0YXJ0VmVydGV4LFxyXG4gICAgICAgICAgICBlbmRWZXJ0ZXg7XHJcblxyXG4gICAgICAgIGUxID0gW3RoaXMubGVycChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzBdLCBmcm9tKSwgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIGxhc3RWZXJ0ZXhbMV0sIGZyb20pXTtcclxuICAgICAgICBmMSA9IFt0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFsyXSwgZnJvbSksIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzNdLCBmcm9tKV07XHJcbiAgICAgICAgZzEgPSBbdGhpcy5sZXJwKG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbNF0sIGZyb20pLCB0aGlzLmxlcnAobmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs1XSwgZnJvbSldO1xyXG4gICAgICAgIGgxID0gW3RoaXMubGVycChlMVswXSwgZjFbMF0sIGZyb20pLCB0aGlzLmxlcnAoZTFbMV0sIGYxWzFdLCBmcm9tKV07XHJcbiAgICAgICAgajEgPSBbdGhpcy5sZXJwKGYxWzBdLCBnMVswXSwgZnJvbSksIHRoaXMubGVycChmMVsxXSwgZzFbMV0sIGZyb20pXTtcclxuICAgICAgICBrMSA9IFt0aGlzLmxlcnAoaDFbMF0sIGoxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGgxWzFdLCBqMVsxXSwgZnJvbSldO1xyXG5cclxuICAgICAgICBzdGFydFZlcnRleCA9IFtqMVswXSwgajFbMV0sIGgxWzBdLCBoMVsxXSwgazFbMF0sIGsxWzFdXTtcclxuICAgICAgICBlbmRWZXJ0ZXggPSBbbmV4dFZlcnRleFswXSwgbmV4dFZlcnRleFsxXSwgZzFbMF0sIGcxWzFdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdXTtcclxuXHJcbiAgICAgICAgZTIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzRdLCBzdGFydFZlcnRleFswXSwgdG8pLCB0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNV0sIHN0YXJ0VmVydGV4WzFdLCB0byldO1xyXG4gICAgICAgIGYyID0gW3RoaXMubGVycChzdGFydFZlcnRleFswXSwgZW5kVmVydGV4WzJdLCB0byksIHRoaXMubGVycChzdGFydFZlcnRleFsxXSwgZW5kVmVydGV4WzNdLCB0byldO1xyXG4gICAgICAgIGcyID0gW3RoaXMubGVycChlbmRWZXJ0ZXhbMl0sIGVuZFZlcnRleFs0XSwgdG8pLCB0aGlzLmxlcnAoZW5kVmVydGV4WzNdLCBlbmRWZXJ0ZXhbNV0sIHRvKV07XHJcblxyXG4gICAgICAgIGgyID0gW3RoaXMubGVycChlMlswXSwgZjJbMF0sIHRvKSwgdGhpcy5sZXJwKGUyWzFdLCBmMlsxXSwgdG8pXTtcclxuICAgICAgICBqMiA9IFt0aGlzLmxlcnAoZjJbMF0sIGcyWzBdLCB0byksIHRoaXMubGVycChmMlsxXSwgZzJbMV0sIHRvKV07XHJcbiAgICAgICAgazIgPSBbdGhpcy5sZXJwKGgyWzBdLCBqMlswXSwgdG8pLCB0aGlzLmxlcnAoaDJbMV0sIGoyWzFdLCB0byldO1xyXG5cclxuICAgICAgICBzdGFydFZlcnRleCA9IFtlMlswXSwgZTJbMV0sIHN0YXJ0VmVydGV4WzJdLCBzdGFydFZlcnRleFszXSwgc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzVdXTtcclxuICAgICAgICBlbmRWZXJ0ZXggPSBbajJbMF0sIGoyWzFdLCBoMlswXSwgaDJbMV0sIGsyWzBdLCBrMlsxXV07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnQ6IHN0YXJ0VmVydGV4LFxyXG4gICAgICAgIGVuZDogZW5kVmVydGV4XHJcbiAgICB9O1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XHJcbiAgICB2YXIgcyA9IDEgLSB0O1xyXG4gICAgcmV0dXJuIGEgKiBzICsgYiAqIHQ7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5zdW1BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcclxuICAgIGZ1bmN0aW9uIGFkZChhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIGEgKyBiO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhcnIucmVkdWNlKGFkZCk7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5pc1N0cmFpZ2h0ID0gZnVuY3Rpb24gKHN0YXJ0WCwgc3RhcnRZLCBjdHJsMVgsIGN0cmwxWSwgY3RybDJYLCBjdHJsMlksIGVuZFgsIGVuZFkpIHtcclxuICAgIHJldHVybiBzdGFydFggPT09IGN0cmwxWCAmJiBzdGFydFkgPT09IGN0cmwxWSAmJiBlbmRYID09PSBjdHJsMlggJiYgZW5kWSA9PT0gY3RybDJZO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGg7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFBvbHlzdGFyKGRhdGEpIHtcclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlOyAvLyBUT0RPID8/XHJcblxyXG4gICAgdGhpcy5zdGFyVHlwZSA9IGRhdGEuc3RhclR5cGU7XHJcbiAgICB0aGlzLnBvaW50cyA9IGRhdGEucG9pbnRzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvaW50cykgOiBuZXcgUHJvcGVydHkoZGF0YS5wb2ludHMpO1xyXG4gICAgdGhpcy5pbm5lclJhZGl1cyA9IGRhdGEuaW5uZXJSYWRpdXMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSYWRpdXMpIDogbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSYWRpdXMpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cyA9IGRhdGEub3V0ZXJSYWRpdXMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3V0ZXJSYWRpdXMpIDogbmV3IFByb3BlcnR5KGRhdGEub3V0ZXJSYWRpdXMpO1xyXG5cclxuICAgIC8vb3B0aW5hbHNcclxuICAgIGlmIChkYXRhLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uID0gZGF0YS5wb3NpdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm90YXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucm90YXRpb24pO1xyXG4gICAgaWYgKGRhdGEuaW5uZXJSb3VuZG5lc3MpIHRoaXMuaW5uZXJSb3VuZG5lc3MgPSBkYXRhLmlubmVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmlubmVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmlubmVyUm91bmRuZXNzKTtcclxuICAgIGlmIChkYXRhLm91dGVyUm91bmRuZXNzKSB0aGlzLm91dGVyUm91bmRuZXNzID0gZGF0YS5vdXRlclJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJvdW5kbmVzcykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJvdW5kbmVzcyk7XHJcbn1cclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIHZhciBwb2ludHMgPSB0aGlzLnBvaW50cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBpbm5lclJhZGl1cyA9IHRoaXMuaW5uZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgb3V0ZXJSYWRpdXMgPSB0aGlzLm91dGVyUmFkaXVzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiA/IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLnJvdGF0aW9uID8gdGhpcy5yb3RhdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgaW5uZXJSb3VuZG5lc3MgPSB0aGlzLmlubmVyUm91bmRuZXNzID8gdGhpcy5pbm5lclJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgb3V0ZXJSb3VuZG5lc3MgPSB0aGlzLm91dGVyUm91bmRuZXNzID8gdGhpcy5vdXRlclJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcblxyXG4gICAgcm90YXRpb24gPSB0aGlzLmRlZzJyYWQocm90YXRpb24pO1xyXG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCAwLCAwIC0gb3V0ZXJSYWRpdXMsIHJvdGF0aW9uKTtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0pO1xyXG4gICAgY3R4Lm1vdmVUbyhzdGFydFswXSwgc3RhcnRbMV0pO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzOyBpKyspIHtcclxuXHJcbiAgICAgICAgdmFyIHBJbm5lcixcclxuICAgICAgICAgICAgcE91dGVyLFxyXG4gICAgICAgICAgICBwT3V0ZXIxVGFuZ2VudCxcclxuICAgICAgICAgICAgcE91dGVyMlRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBJbm5lcjFUYW5nZW50LFxyXG4gICAgICAgICAgICBwSW5uZXIyVGFuZ2VudCxcclxuICAgICAgICAgICAgb3V0ZXJPZmZzZXQsXHJcbiAgICAgICAgICAgIGlubmVyT2Zmc2V0LFxyXG4gICAgICAgICAgICByb3Q7XHJcblxyXG4gICAgICAgIHJvdCA9IE1hdGguUEkgLyBwb2ludHMgKiAyO1xyXG5cclxuICAgICAgICBwSW5uZXIgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwT3V0ZXIgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBvdXRlclJhZGl1cywgKHJvdCAqIChpICsgMSkpICsgcm90YXRpb24pO1xyXG5cclxuICAgICAgICAvL0ZJeE1FXHJcbiAgICAgICAgaWYgKCFvdXRlck9mZnNldCkgb3V0ZXJPZmZzZXQgPSAoc3RhcnRbMF0gKyBwSW5uZXJbMF0pICogb3V0ZXJSb3VuZG5lc3MgLyAxMDAgKiAuNTUyMjg0ODtcclxuICAgICAgICBpZiAoIWlubmVyT2Zmc2V0KSBpbm5lck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBpbm5lclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xyXG5cclxuICAgICAgICBwT3V0ZXIxVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQsIDAgLSBvdXRlclJhZGl1cywgKHJvdCAqIGkpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBJbm5lcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBpbm5lck9mZnNldCAqIC0xLCAwIC0gaW5uZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpIC0gcm90IC8gMikgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcElubmVyMlRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIGlubmVyT2Zmc2V0LCAwIC0gaW5uZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpIC0gcm90IC8gMikgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcE91dGVyMlRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIG91dGVyT2Zmc2V0ICogLTEsIDAgLSBvdXRlclJhZGl1cywgKHJvdCAqIChpICsgMSkpICsgcm90YXRpb24pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGFyVHlwZSA9PT0gMSkge1xyXG4gICAgICAgICAgICAvL3N0YXJcclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocE91dGVyMVRhbmdlbnRbMF0sIHBPdXRlcjFUYW5nZW50WzFdLCBwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIHBJbm5lclswXSwgcElubmVyWzFdKTtcclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocElubmVyMlRhbmdlbnRbMF0sIHBJbm5lcjJUYW5nZW50WzFdLCBwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIHBPdXRlclswXSwgcE91dGVyWzFdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvL3BvbHlnb25cclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocE91dGVyMVRhbmdlbnRbMF0sIHBPdXRlcjFUYW5nZW50WzFdLCBwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIHBPdXRlclswXSwgcE91dGVyWzFdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vZGVidWdcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocElubmVyWzBdLCBwSW5uZXJbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlclswXSwgcE91dGVyWzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImJsdWVcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwicmVkXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocElubmVyMVRhbmdlbnRbMF0sIHBJbm5lcjFUYW5nZW50WzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImdyZWVuXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocElubmVyMlRhbmdlbnRbMF0sIHBJbm5lcjJUYW5nZW50WzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImJyb3duXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyMlRhbmdlbnRbMF0sIHBPdXRlcjJUYW5nZW50WzFdLCA1LCA1KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5yb3RhdGVQb2ludCA9IGZ1bmN0aW9uIChjeCwgY3ksIHgsIHksIHJhZGlhbnMpIHtcclxuICAgIHZhciBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKSxcclxuICAgICAgICBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKSxcclxuICAgICAgICBueCA9IChjb3MgKiAoeCAtIGN4KSkgLSAoc2luICogKHkgLSBjeSkpICsgY3gsXHJcbiAgICAgICAgbnkgPSAoc2luICogKHggLSBjeCkpICsgKGNvcyAqICh5IC0gY3kpKSArIGN5O1xyXG4gICAgcmV0dXJuIFtueCwgbnldO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XHJcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnBvaW50cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMub3V0ZXJSYWRpdXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucm90YXRpb24pIHRoaXMucm90YXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuaW5uZXJSb3VuZG5lc3MpIHRoaXMuaW5uZXJSb3VuZG5lc3Muc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3Muc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnBvaW50cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMub3V0ZXJSYWRpdXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm90YXRpb24pIHRoaXMucm90YXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuaW5uZXJSb3VuZG5lc3MpIHRoaXMuaW5uZXJSb3VuZG5lc3MucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb2x5c3RhcjsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQmV6aWVyID0gcmVxdWlyZSgnLi9CZXppZXInKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFBvc2l0aW9uKGRhdGEpIHtcclxuICAgIEFuaW1hdGVkUHJvcGVydHkuY2FsbCh0aGlzLCBkYXRhKTtcclxufVxyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZSk7XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbiAgICB0aGlzLnNldE1vdGlvblBhdGgoKTtcclxufTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5tb3Rpb25wYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW90aW9ucGF0aC5nZXRWYWx1ZXModGhpcy5nZXRFbGFwc2VkKHRpbWUpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52LCB0aGlzLm5leHRGcmFtZS52LCB0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLnNldE1vdGlvblBhdGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5sYXN0RnJhbWUubW90aW9ucGF0aCkge1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG5ldyBCZXppZXIodGhpcy5sYXN0RnJhbWUubW90aW9ucGF0aCk7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoLmdldExlbmd0aCh0aGlzLmxhc3RGcmFtZS5sZW4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGggPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb3NpdGlvbjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIFByb3BlcnR5KGRhdGEpIHtcclxuICAgIGlmICghKGRhdGEgaW5zdGFuY2VvZiBBcnJheSkpIHJldHVybiBudWxsO1xyXG4gICAgdGhpcy5mcmFtZXMgPSBkYXRhO1xyXG59XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcmFtZXNbMF0udjtcclxufTtcclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG59O1xyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3BlcnR5OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFJlY3QoZGF0YSkge1xyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5zaXplID0gZGF0YS5zaXplLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNpemUpIDogbmV3IFByb3BlcnR5KGRhdGEuc2l6ZSk7XHJcblxyXG4gICAgLy9vcHRpb25hbHNcclxuICAgIGlmIChkYXRhLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uID0gZGF0YS5wb3NpdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICBpZiAoZGF0YS5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzID0gZGF0YS5yb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnJvdW5kbmVzcyk7XHJcbn1cclxuXHJcblJlY3QucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcblxyXG4gICAgdmFyIHNpemUgPSB0aGlzLnNpemUuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcclxuICAgICAgICByb3VuZG5lc3MgPSB0aGlzLnJvdW5kbmVzcyA/IHRoaXMucm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMDtcclxuXHJcbiAgICBpZiAoc2l6ZVswXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMF0gLyAyO1xyXG4gICAgaWYgKHNpemVbMV0gPCAyICogcm91bmRuZXNzKSByb3VuZG5lc3MgPSBzaXplWzFdIC8gMjtcclxuXHJcbiAgICB2YXIgeCA9IHBvc2l0aW9uWzBdIC0gc2l6ZVswXSAvIDIsXHJcbiAgICAgICAgeSA9IHBvc2l0aW9uWzFdIC0gc2l6ZVsxXSAvIDI7XHJcblxyXG4gICAgaWYgKHRyaW0pIHtcclxuICAgICAgICB2YXIgdHY7XHJcbiAgICAgICAgdHJpbSA9IHRoaXMuZ2V0VHJpbVZhbHVlcyh0cmltKTtcclxuICAgICAgICAvL1RPRE8gYWRkIHRyaW1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyh4ICsgcm91bmRuZXNzLCB5KTtcclxuICAgICAgICBjdHguYXJjVG8oeCArIHNpemVbMF0sIHksIHggKyBzaXplWzBdLCB5ICsgc2l6ZVsxXSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCArIHNpemVbMF0sIHkgKyBzaXplWzFdLCB4LCB5ICsgc2l6ZVsxXSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCwgeSArIHNpemVbMV0sIHgsIHksIHJvdW5kbmVzcyk7XHJcbiAgICAgICAgY3R4LmFyY1RvKHgsIHksIHggKyBzaXplWzBdLCB5LCByb3VuZG5lc3MpO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnNpemUuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5SZWN0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5zaXplLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3MucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWN0OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFN0cm9rZShkYXRhKSB7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMuam9pbiA9IGRhdGEuam9pbjtcclxuICAgICAgICB0aGlzLmNhcCA9IGRhdGEuY2FwO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5taXRlckxpbWl0KSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQubGVuZ3RoID4gMSkgdGhpcy5taXRlckxpbWl0ID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5taXRlckxpbWl0KTtcclxuICAgICAgICAgICAgZWxzZSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgUHJvcGVydHkoZGF0YS5taXRlckxpbWl0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkYXRhLmNvbG9yLmxlbmd0aCA+IDEpIHRoaXMuY29sb3IgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuICAgICAgICBlbHNlIHRoaXMuY29sb3IgPSBuZXcgUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSkgdGhpcy5vcGFjaXR5ID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxuICAgICAgICBlbHNlIHRoaXMub3BhY2l0eSA9IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS53aWR0aC5sZW5ndGggPiAxKSB0aGlzLndpZHRoID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcbiAgICAgICAgZWxzZSB0aGlzLndpZHRoID0gbmV3IFByb3BlcnR5KGRhdGEud2lkdGgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5TdHJva2UucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuY29sb3IuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIGNvbG9yWzBdID0gTWF0aC5yb3VuZChjb2xvclswXSk7XHJcbiAgICBjb2xvclsxXSA9IE1hdGgucm91bmQoY29sb3JbMV0pO1xyXG4gICAgY29sb3JbMl0gPSBNYXRoLnJvdW5kKGNvbG9yWzJdKTtcclxuICAgIHZhciBzID0gY29sb3Iuam9pbignLCAnKTtcclxuXHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIHMgKyAnLCAnICsgb3BhY2l0eSArICcpJztcclxufTtcclxuXHJcblN0cm9rZS5wcm90b3R5cGUuc2V0U3Ryb2tlID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG4gICAgdmFyIHN0cm9rZUNvbG9yID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBzdHJva2VXaWR0aCA9IHRoaXMud2lkdGguZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgc3Ryb2tlSm9pbiA9IHRoaXMuam9pbjtcclxuICAgIGlmIChzdHJva2VKb2luID09PSAnbWl0ZXInKSB2YXIgbWl0ZXJMaW1pdCA9IHRoaXMubWl0ZXJMaW1pdC5nZXRWYWx1ZSh0aW1lKTtcclxuXHJcbiAgICBjdHgubGluZVdpZHRoID0gc3Ryb2tlV2lkdGg7XHJcbiAgICBjdHgubGluZUpvaW4gPSBzdHJva2VKb2luO1xyXG4gICAgaWYgKG1pdGVyTGltaXQpIGN0eC5taXRlckxpbWl0ID0gbWl0ZXJMaW1pdDtcclxuICAgIGN0eC5saW5lQ2FwID0gdGhpcy5jYXA7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2VDb2xvcjtcclxufTtcclxuXHJcblN0cm9rZS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuY29sb3Iuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5vcGFjaXR5LnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMud2lkdGguc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMubWl0ZXJMaW1pdCkgdGhpcy5taXRlckxpbWl0LnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblN0cm9rZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuY29sb3IucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5vcGFjaXR5LnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMud2lkdGgucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMubWl0ZXJMaW1pdCkgdGhpcy5taXRlckxpbWl0LnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3Ryb2tlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKSxcclxuICAgIFBvc2l0aW9uID0gcmVxdWlyZSgnLi9Qb3NpdGlvbicpO1xyXG5cclxuZnVuY3Rpb24gVHJhbnNmb3JtKGRhdGEpIHtcclxuICAgIGlmICghZGF0YSkgcmV0dXJuO1xyXG5cclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG5cclxuICAgIGlmIChkYXRhLnBvc2l0aW9uWCAmJiBkYXRhLnBvc2l0aW9uWSkge1xyXG4gICAgICAgIGlmIChkYXRhLnBvc2l0aW9uWC5sZW5ndGggPiAxICYmIGRhdGEucG9zaXRpb25ZLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25ZID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvblkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25YID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb25YKTtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvblkpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoZGF0YS5wb3NpdGlvbikge1xyXG4gICAgICAgIGlmIChkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb3NpdGlvbihkYXRhLnBvc2l0aW9uKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5hbmNob3IpIHRoaXMuYW5jaG9yID0gZGF0YS5hbmNob3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuYW5jaG9yKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmFuY2hvcik7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVgpIHRoaXMuc2NhbGVYID0gZGF0YS5zY2FsZVgubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVYKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWCk7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVkpIHRoaXMuc2NhbGVZID0gZGF0YS5zY2FsZVkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVZKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWSk7XHJcbiAgICBpZiAoZGF0YS5za2V3KSB0aGlzLnNrZXcgPSBkYXRhLnNrZXcubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2tldykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3KTtcclxuICAgIGlmIChkYXRhLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzID0gZGF0YS5za2V3QXhpcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3QXhpcykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3QXhpcyk7XHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm90YXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucm90YXRpb24pO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIHZhciBwb3NpdGlvblgsIHBvc2l0aW9uWSxcclxuICAgICAgICBhbmNob3IgPSB0aGlzLmFuY2hvciA/IHRoaXMuYW5jaG9yLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbiA/IHRoaXMuZGVnMnJhZCh0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2tldyA9IHRoaXMuc2tldyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXcuZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3QXhpcyA9IHRoaXMuc2tld0F4aXMgPyB0aGlzLmRlZzJyYWQodGhpcy5za2V3QXhpcy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNjYWxlWCA9IHRoaXMuc2NhbGVYID8gdGhpcy5zY2FsZVguZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIHNjYWxlWSA9IHRoaXMuc2NhbGVZID8gdGhpcy5zY2FsZVkuZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkgPyB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgKiBjdHguZ2xvYmFsQWxwaGEgOiBjdHguZ2xvYmFsQWxwaGE7IC8vIEZJWE1FIHdyb25nIHRyYW5zcGFyZW5jeSBpZiBuZXN0ZWRcclxuXHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblggJiYgdGhpcy5wb3NpdGlvblkpIHtcclxuICAgICAgICBwb3NpdGlvblggPSB0aGlzLnBvc2l0aW9uWC5nZXRWYWx1ZSh0aW1lKTtcclxuICAgICAgICBwb3NpdGlvblkgPSB0aGlzLnBvc2l0aW9uWS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5wb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSwgY3R4KTtcclxuICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblswXTtcclxuICAgICAgICBwb3NpdGlvblkgPSBwb3NpdGlvblsxXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcG9zaXRpb25YID0gMDtcclxuICAgICAgICBwb3NpdGlvblkgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKGN0eCwgcG9zaXRpb25YLCBwb3NpdGlvblksIGFuY2hvciwgcm90YXRpb24sIHNrZXcsIHNrZXdBeGlzLCBzY2FsZVgsIHNjYWxlWSwgb3BhY2l0eSk7XHJcblxyXG4gICAgLy9vcmRlciB2ZXJ5IHZlcnkgaW1wb3J0YW50IDopXHJcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIDAsIDEsIHBvc2l0aW9uWCAtIGFuY2hvclswXSwgcG9zaXRpb25ZIC0gYW5jaG9yWzFdKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCByb3RhdGlvbiwgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRTa2V3KGN0eCwgc2tldywgc2tld0F4aXMsIGFuY2hvclswXSwgYW5jaG9yWzFdKTtcclxuICAgIHRoaXMuc2V0U2NhbGUoY3R4LCBzY2FsZVgsIHNjYWxlWSwgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0Um90YXRpb24gPSBmdW5jdGlvbiAoY3R4LCByYWQsIHgsIHkpIHtcclxuICAgIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcclxuICAgIHZhciBkeCA9IHggLSBjICogeCArIHMgKiB5O1xyXG4gICAgdmFyIGR5ID0geSAtIHMgKiB4IC0gYyAqIHk7XHJcbiAgICBjdHgudHJhbnNmb3JtKGMsIHMsIC1zLCBjLCBkeCwgZHkpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIChjdHgsIHN4LCBzeSwgeCwgeSkge1xyXG4gICAgY3R4LnRyYW5zZm9ybShzeCwgMCwgMCwgc3ksIC14ICogc3ggKyB4LCAteSAqIHN5ICsgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNrZXcgPSBmdW5jdGlvbiAoY3R4LCBza2V3LCBheGlzLCB4LCB5KSB7XHJcbiAgICB2YXIgdCA9IE1hdGgudGFuKC1za2V3KTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCAtYXhpcywgeCwgeSk7XHJcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIHQsIDEsIC15ICogdCwgMCk7XHJcbiAgICB0aGlzLnNldFJvdGF0aW9uKGN0eCwgYXhpcywgeCwgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XHJcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuYW5jaG9yKSB0aGlzLmFuY2hvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5za2V3KSB0aGlzLnNrZXcuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWCkgdGhpcy5zY2FsZVguc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgaWYgKHRoaXMuYW5jaG9yKSB0aGlzLmFuY2hvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5za2V3KSB0aGlzLnNrZXcucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWCkgdGhpcy5zY2FsZVgucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gVHJpbShkYXRhKSB7XHJcblxyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG5cclxuICAgIGlmIChkYXRhLnN0YXJ0KSB0aGlzLnN0YXJ0ID0gZGF0YS5zdGFydC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zdGFydCkgOiBuZXcgUHJvcGVydHkoZGF0YS5zdGFydCk7XHJcbiAgICBpZiAoZGF0YS5lbmQpIHRoaXMuZW5kID0gZGF0YS5lbmQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZW5kKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmVuZCk7XHJcbiAgICAvL2lmIChkYXRhLm9mZnNldCkgdGhpcy5vZmZzZXQgPSBkYXRhLm9mZnNldC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vZmZzZXQpIDogbmV3IFByb3BlcnR5KGRhdGEub2Zmc2V0KTtcclxuXHJcbn1cclxuXHJcblRyaW0ucHJvdG90eXBlLmdldFRyaW0gPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5zdGFydCA/IHRoaXMuc3RhcnQuZ2V0VmFsdWUodGltZSkgOiAwLFxyXG4gICAgICAgIGVuZCA9IHRoaXMuZW5kID8gdGhpcy5lbmQuZ2V0VmFsdWUodGltZSkgOiAxO1xyXG5cclxuICAgIHZhciB0cmltID0ge1xyXG4gICAgICAgIHN0YXJ0OiBNYXRoLm1pbihzdGFydCwgZW5kKSxcclxuICAgICAgICBlbmQ6IE1hdGgubWF4KHN0YXJ0LCBlbmQpXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0cmltLnN0YXJ0ID09PSAwICYmIHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0cmltO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVHJpbS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLnN0YXJ0KSB0aGlzLnN0YXJ0LnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLmVuZCkgdGhpcy5lbmQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgLy9pZiAodGhpcy5vZmZzZXQpIHRoaXMub2Zmc2V0LnJlc2V0KCk7XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJpbTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iXX0=
