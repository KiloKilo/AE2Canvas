(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AE2Canvas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"D:\\Code\\ae2canvas\\src\\runtime\\AE2Canvas.js":[function(_dereq_,module,exports){
'use strict';

var Group = _dereq_('./Group'),
    ImageLayer = _dereq_('./ImageLayer');

var _animations = [],
    _animationsLength = 0;

// @license http://opensource.org/licenses/MIT
// copyright Paul Irish 2015
(function () {

    if ('performance' in window == false) {
        window.performance = {};
    }

    if ('now' in window.performance == false) {

        var nowOffset = Date.now();

        if (performance.timing && performance.timing.navigationStart) {
            nowOffset = performance.timing.navigationStart
        }

        window.performance.now = function now() {
            return Date.now() - nowOffset;
        }
    }

    //

})();

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

    document.body.appendChild(this.buffer)

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
                console.log(this.layers[i]);
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
        time = time !== undefined ? time : window.performance.now();

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
    if (this.groups) {
        for (var j = 0; j < this.groups.length; j++) {
            this.groups[j].setKeyframes(time);
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
    if (this.groups) {
        for (var j = 0; j < this.groups.length; j++) {
            this.groups[j].reset(reversed);
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

function ImageLayer(data, bufferCtx, parentIn, parentOut, basePath, onLoad) {

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL0ltYWdlTGF5ZXIuanMiLCJzcmMvcnVudGltZS9NZXJnZS5qcyIsInNyYy9ydW50aW1lL1BhdGguanMiLCJzcmMvcnVudGltZS9Qb2x5c3Rhci5qcyIsInNyYy9ydW50aW1lL1Bvc2l0aW9uLmpzIiwic3JjL3J1bnRpbWUvUHJvcGVydHkuanMiLCJzcmMvcnVudGltZS9SZWN0LmpzIiwic3JjL3J1bnRpbWUvU3Ryb2tlLmpzIiwic3JjL3J1bnRpbWUvVHJhbnNmb3JtLmpzIiwic3JjL3J1bnRpbWUvVHJpbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEdyb3VwID0gcmVxdWlyZSgnLi9Hcm91cCcpLFxyXG4gICAgSW1hZ2VMYXllciA9IHJlcXVpcmUoJy4vSW1hZ2VMYXllcicpO1xyXG5cclxudmFyIF9hbmltYXRpb25zID0gW10sXHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IDA7XHJcblxyXG4vLyBAbGljZW5zZSBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXHJcbi8vIGNvcHlyaWdodCBQYXVsIElyaXNoIDIwMTVcclxuKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBpZiAoJ3BlcmZvcm1hbmNlJyBpbiB3aW5kb3cgPT0gZmFsc2UpIHtcclxuICAgICAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoJ25vdycgaW4gd2luZG93LnBlcmZvcm1hbmNlID09IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIHZhciBub3dPZmZzZXQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgICAgICBpZiAocGVyZm9ybWFuY2UudGltaW5nICYmIHBlcmZvcm1hbmNlLnRpbWluZy5uYXZpZ2F0aW9uU3RhcnQpIHtcclxuICAgICAgICAgICAgbm93T2Zmc2V0ID0gcGVyZm9ybWFuY2UudGltaW5nLm5hdmlnYXRpb25TdGFydFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2luZG93LnBlcmZvcm1hbmNlLm5vdyA9IGZ1bmN0aW9uIG5vdygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIERhdGUubm93KCkgLSBub3dPZmZzZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vXHJcblxyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gQW5pbWF0aW9uKG9wdGlvbnMpIHtcclxuICAgIGlmICghb3B0aW9ucy5kYXRhKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignbm8gZGF0YScpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgdGhpcy5kdXJhdGlvbiA9IG9wdGlvbnMuZGF0YS5kdXJhdGlvbjtcclxuICAgIHRoaXMuYmFzZVdpZHRoID0gb3B0aW9ucy5kYXRhLndpZHRoO1xyXG4gICAgdGhpcy5iYXNlSGVpZ2h0ID0gb3B0aW9ucy5kYXRhLmhlaWdodDtcclxuICAgIHRoaXMucmF0aW8gPSBvcHRpb25zLmRhdGEud2lkdGggLyBvcHRpb25zLmRhdGEuaGVpZ2h0O1xyXG5cclxuICAgIHRoaXMubWFya2VycyA9IG9wdGlvbnMuZGF0YS5tYXJrZXJzO1xyXG5cclxuICAgIHRoaXMuY2FudmFzID0gb3B0aW9ucy5jYW52YXMgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmxvb3AgPSBvcHRpb25zLmxvb3AgfHwgZmFsc2U7XHJcbiAgICB0aGlzLmRldmljZVBpeGVsUmF0aW8gPSBvcHRpb25zLmRldmljZVBpeGVsUmF0aW8gfHwgMTtcclxuICAgIHRoaXMuZmx1aWQgPSBvcHRpb25zLmZsdWlkIHx8IHRydWU7XHJcbiAgICB0aGlzLnJldmVyc2VkID0gb3B0aW9ucy5yZXZlcnNlZCB8fCBmYWxzZTtcclxuICAgIHRoaXMuaW1hZ2VCYXNlUGF0aCA9IG9wdGlvbnMuaW1hZ2VCYXNlUGF0aCB8fCAnJztcclxuICAgIHRoaXMub25Db21wbGV0ZSA9IG9wdGlvbnMub25Db21wbGV0ZSB8fCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmJhc2VXaWR0aDtcclxuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcclxuXHJcbiAgICB0aGlzLmJ1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5idWZmZXIud2lkdGggPSB0aGlzLmJhc2VXaWR0aDtcclxuICAgIHRoaXMuYnVmZmVyLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gdGhpcy5idWZmZXIuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYnVmZmVyKVxyXG5cclxuICAgIHRoaXMubGF5ZXJzID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuZGF0YS5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAob3B0aW9ucy5kYXRhLmxheWVyc1tpXS50eXBlID09PSAndmVjdG9yJykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVycy5wdXNoKG5ldyBHcm91cChvcHRpb25zLmRhdGEubGF5ZXJzW2ldLCB0aGlzLmJ1ZmZlckN0eCwgMCwgdGhpcy5kdXJhdGlvbikpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5kYXRhLmxheWVyc1tpXS50eXBlID09PSAnaW1hZ2UnKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzLnB1c2gobmV3IEltYWdlTGF5ZXIob3B0aW9ucy5kYXRhLmxheWVyc1tpXSwgdGhpcy5idWZmZXJDdHgsIDAsIHRoaXMuZHVyYXRpb24sIHRoaXMuaW1hZ2VCYXNlUGF0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubnVtTGF5ZXJzID0gdGhpcy5sYXllcnMubGVuZ3RoO1xyXG5cclxuICAgIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICB0aGlzLnJlc2l6ZSgpO1xyXG5cclxuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcblxyXG4gICAgX2FuaW1hdGlvbnMucHVzaCh0aGlzKTtcclxuICAgIF9hbmltYXRpb25zTGVuZ3RoID0gX2FuaW1hdGlvbnMubGVuZ3RoO1xyXG59XHJcblxyXG5BbmltYXRpb24ucHJvdG90eXBlID0ge1xyXG5cclxuICAgIHBsYXk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1BhdXNlZCkgdGhpcy5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnb3RvQW5kUGxheTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMuZ2V0TWFya2VyKGlkKTtcclxuICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdvdG9BbmRTdG9wOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xyXG4gICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IG1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TWFya2VyOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGlkID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2lkXTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpZCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcnNbaV0uY29tbWVudCA9PT0gaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUud2FybignTWFya2VyIG5vdCBmb3VuZCcpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGVja1N0b3BNYXJrZXJzOiBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZXJzW2ldLnN0b3AgJiYgdGhpcy5tYXJrZXJzW2ldLnRpbWUgPiBmcm9tICYmIHRoaXMubWFya2Vyc1tpXS50aW1lIDwgdG8pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtlcnNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRTdGVwOiBmdW5jdGlvbiAoc3RlcCkge1xyXG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jb21wVGltZSA9IHN0ZXAgKiB0aGlzLmR1cmF0aW9uO1xyXG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRTdGVwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcFRpbWUgLyB0aGlzLmR1cmF0aW9uO1xyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRoZW4pIHRoaXMudGhlbiA9IHRpbWU7XHJcblxyXG4gICAgICAgIHZhciBkZWx0YSA9IHRpbWUgLSB0aGlzLnRoZW47XHJcbiAgICAgICAgdGhpcy50aGVuID0gdGltZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnJldmVyc2VkID8gdGhpcy5jb21wVGltZSAtIGRlbHRhIDogdGhpcy5jb21wVGltZSArIGRlbHRhO1xyXG5cclxuICAgICAgICAgICAgdmFyIHN0b3BNYXJrZXIgPSB0aGlzLmNoZWNrU3RvcE1hcmtlcnModGhpcy5jb21wVGltZSAtIGRlbHRhLCB0aGlzLmNvbXBUaW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBUaW1lID4gdGhpcy5kdXJhdGlvbiB8fCB0aGlzLnJldmVyc2VkICYmIHRoaXMuY29tcFRpbWUgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IDAgOiB0aGlzLmR1cmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvb3ApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzdG9wTWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gc3RvcE1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3KHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRyYXdGcmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBkcmF3OiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhc2VXaWR0aCwgdGhpcy5iYXNlSGVpZ2h0KTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5sYXllcnNbaV0uaW4gJiYgdGltZSA8IHRoaXMubGF5ZXJzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uZHJhdyh0aGlzLmN0eCwgdGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uIChjYikge1xyXG4gICAgICAgIHRoaXMub25sb2FkQ0IgPSBjYjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldIGluc3RhbmNlb2YgSW1hZ2VMYXllcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ucHJlbG9hZCh0aGlzLm9ubG9hZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgb25sb2FkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxheWVyc1tpXSBpbnN0YW5jZW9mIEltYWdlTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMubGF5ZXJzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sYXllcnNbaV0uaXNMb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9ubG9hZENCID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25sb2FkQ0IoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuZHVyYXRpb24gOiAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1MYXllcnM7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNldEtleWZyYW1lczogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbnVsbDtcclxuICAgICAgICB2YXIgaSA9IF9hbmltYXRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgaWYgKGkgPiAtMSkge1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9ucy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zTGVuZ3RoID0gX2FuaW1hdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jYW52YXMucGFyZW50Tm9kZSkgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2l6ZTogZnVuY3Rpb24gKHcpIHtcclxuICAgICAgICBpZiAodGhpcy5mbHVpZCkge1xyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSB3IHx8IHRoaXMuY2FudmFzLmNsaWVudFdpZHRoIHx8IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aWR0aCAvIHRoaXMucmF0aW8gKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcblxyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlci53aWR0aCA9IHdpZHRoICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlci5oZWlnaHQgPSB3aWR0aCAvIHRoaXMucmF0aW8gKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNjYWxlID0gd2lkdGggLyB0aGlzLmJhc2VXaWR0aCAqIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgdGhpcy5jdHgudHJhbnNmb3JtKHRoaXMuc2NhbGUsIDAsIDAsIHRoaXMuc2NhbGUsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC50cmFuc2Zvcm0odGhpcy5zY2FsZSwgMCwgMCwgdGhpcy5zY2FsZSwgMCwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXQgcmV2ZXJzZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2VkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXQgcmV2ZXJzZWQoYm9vbCkge1xyXG4gICAgICAgIHRoaXMuX3JldmVyc2VkID0gYm9vbDtcclxuICAgICAgICBpZiAodGhpcy5wYXVzZWRUaW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnBhdXNlZFRpbWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICBBbmltYXRpb246IEFuaW1hdGlvbixcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgdGltZSA9IHRpbWUgIT09IHVuZGVmaW5lZCA/IHRpbWUgOiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2FuaW1hdGlvbnNMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9uc1tpXS51cGRhdGUodGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBCZXppZXJFYXNpbmcgPSByZXF1aXJlKCcuL0JlemllckVhc2luZycpO1xyXG5cclxuZnVuY3Rpb24gQW5pbWF0ZWRQYXRoKGRhdGEpIHtcclxuICAgIFBhdGguY2FsbCh0aGlzLCBkYXRhKTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCAmJiB0aW1lID49IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0RnJhbWU7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQgJiYgdGltZSA8PSB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEZyYW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGltZSA+IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciArIDEgPT09IHRoaXMuZnJhbWVDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXIrKztcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGltZSA8IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciA8IDIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyLS07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVBdFRpbWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGltZSA8IHRoaXMuZnJhbWVzWzBdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGltZSA+IHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSB0aGlzLmZyYW1lQ291bnQgLSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuZnJhbWVDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5mcmFtZXNbaSAtIDFdLnQgJiYgdGltZSA8PSB0aGlzLmZyYW1lc1tpXSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXIgPSBpO1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW2kgLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLm9uS2V5ZnJhbWVDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNldEVhc2luZygpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHJldHVybiBhICsgdCAqIChiIC0gYSk7XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnNldEVhc2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0ICYmIHRoaXMubmV4dEZyYW1lLmVhc2VJbikge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbmV3IEJlemllckVhc2luZyh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzBdLCB0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzFdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMF0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblsxXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5sYXN0RnJhbWUudCApO1xyXG4gICAgdmFyIGR1cmF0aW9uID0gdGhpcy5uZXh0RnJhbWUudCAtIHRoaXMubGFzdEZyYW1lLnQ7XHJcbiAgICB2YXIgZWxhcHNlZCA9IGRlbHRhIC8gZHVyYXRpb247XHJcbiAgICBpZiAoZWxhcHNlZCA+IDEpIGVsYXBzZWQgPSAxO1xyXG4gICAgZWxzZSBpZiAoZWxhcHNlZCA8IDApIGVsYXBzZWQgPSAwO1xyXG4gICAgZWxzZSBpZiAodGhpcy5lYXNpbmcpIGVsYXBzZWQgPSB0aGlzLmVhc2luZyhlbGFwc2VkKTtcclxuICAgIHZhciBhY3R1YWxWZXJ0aWNlcyA9IFtdLFxyXG4gICAgICAgIGFjdHVhbExlbmd0aCA9IFtdO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlc0NvdW50OyBpKyspIHtcclxuICAgICAgICB2YXIgY3AxeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzBdLCB0aGlzLm5leHRGcmFtZS52W2ldWzBdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AxeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzFdLCB0aGlzLm5leHRGcmFtZS52W2ldWzFdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzJdLCB0aGlzLm5leHRGcmFtZS52W2ldWzJdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzNdLCB0aGlzLm5leHRGcmFtZS52W2ldWzNdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzRdLCB0aGlzLm5leHRGcmFtZS52W2ldWzRdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzVdLCB0aGlzLm5leHRGcmFtZS52W2ldWzVdLCBlbGFwc2VkKTtcclxuXHJcbiAgICAgICAgYWN0dWFsVmVydGljZXMucHVzaChbY3AxeCwgY3AxeSwgY3AyeCwgY3AyeSwgeCwgeV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy52ZXJ0aWNlc0NvdW50IC0gMTsgaisrKSB7XHJcbiAgICAgICAgYWN0dWFsTGVuZ3RoLnB1c2godGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLmxlbltqXSwgdGhpcy5uZXh0RnJhbWUubGVuW2pdLCBlbGFwc2VkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ICA6IGFjdHVhbFZlcnRpY2VzLFxyXG4gICAgICAgIGxlbjogYWN0dWFsTGVuZ3RoXHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMucG9pbnRlciA9IHJldmVyc2VkID8gdGhpcy5mcmFtZUNvdW50IC0gMSA6IDE7XHJcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGVkUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4vQmV6aWVyRWFzaW5nJyk7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRlZFByb3BlcnR5KGRhdGEpIHtcclxuICAgIFByb3BlcnR5LmNhbGwodGhpcywgZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lQ291bnQgPSB0aGlzLmZyYW1lcy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQcm9wZXJ0eS5wcm90b3R5cGUpO1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XHJcbiAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgdmFyIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBhcnJbaV0gPSBhW2ldICsgdCAqIChiW2ldIC0gYVtpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBhICsgdCAqIChiIC0gYSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5zZXRFYXNpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBuZXcgQmV6aWVyRWFzaW5nKHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMF0sIHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMV0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblswXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzFdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuZmluaXNoZWQgJiYgdGltZSA+PSB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEZyYW1lLnY7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQgJiYgdGltZSA8PSB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEZyYW1lLnY7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyICsgMSA9PT0gdGhpcy5mcmFtZUNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyIDwgMikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXItLTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZUF0VGltZSh0aW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKHRpbWUsIHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDJdLnQsIHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpO1xyXG5cclxuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aW1lID4gdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5mcmFtZUNvdW50OyBpKyspIHtcclxuICAgICAgICBpZiAodGltZSA+PSB0aGlzLmZyYW1lc1tpIC0gMV0udCAmJiB0aW1lIDw9IHRoaXMuZnJhbWVzW2ldLnQpIHtcclxuICAgICAgICAgICAgdGhpcy5wb2ludGVyID0gaTtcclxuICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1tpIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbaV07XHJcbiAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRFbGFwc2VkID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMubGFzdEZyYW1lLnQgKSxcclxuICAgICAgICBkdXJhdGlvbiA9IHRoaXMubmV4dEZyYW1lLnQgLSB0aGlzLmxhc3RGcmFtZS50LFxyXG4gICAgICAgIGVsYXBzZWQgPSBkZWx0YSAvIGR1cmF0aW9uO1xyXG5cclxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XHJcbiAgICBlbHNlIGlmIChlbGFwc2VkIDwgMCkgZWxhcHNlZCA9IDA7XHJcbiAgICBlbHNlIGlmICh0aGlzLmVhc2luZykgZWxhcHNlZCA9IHRoaXMuZWFzaW5nKGVsYXBzZWQpO1xyXG4gICAgcmV0dXJuIGVsYXBzZWQ7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnBvaW50ZXIgPSByZXZlcnNlZCA/IHRoaXMuZnJhbWVDb3VudCAtIDEgOiAxO1xyXG4gICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRlZFByb3BlcnR5OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIEJlemllcihwYXRoKSB7XHJcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xyXG59XHJcblxyXG5CZXppZXIucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uIChsZW4pIHtcclxuICAgIHRoaXMuc3RlcHMgPSBNYXRoLm1heChNYXRoLmZsb29yKGxlbiAvIDEwKSwgMSk7XHJcbiAgICB0aGlzLmFyY0xlbmd0aHMgPSBuZXcgQXJyYXkodGhpcy5zdGVwcyArIDEpO1xyXG4gICAgdGhpcy5hcmNMZW5ndGhzWzBdID0gMDtcclxuXHJcbiAgICB2YXIgb3ggPSB0aGlzLmN1YmljTigwLCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgIG95ID0gdGhpcy5jdWJpY04oMCwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKSxcclxuICAgICAgICBjbGVuID0gMCxcclxuICAgICAgICBpdGVyYXRvciA9IDEgLyB0aGlzLnN0ZXBzO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IHRoaXMuc3RlcHM7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcy5jdWJpY04oaSAqIGl0ZXJhdG9yLCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgICAgICB5ID0gdGhpcy5jdWJpY04oaSAqIGl0ZXJhdG9yLCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pO1xyXG5cclxuICAgICAgICB2YXIgZHggPSBveCAtIHgsXHJcbiAgICAgICAgICAgIGR5ID0gb3kgLSB5O1xyXG5cclxuICAgICAgICBjbGVuICs9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XHJcbiAgICAgICAgdGhpcy5hcmNMZW5ndGhzW2ldID0gY2xlbjtcclxuXHJcbiAgICAgICAgb3ggPSB4O1xyXG4gICAgICAgIG95ID0geTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxlbmd0aCA9IGNsZW47XHJcbn07XHJcblxyXG5CZXppZXIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uICh1KSB7XHJcbiAgICB2YXIgdGFyZ2V0TGVuZ3RoID0gdSAqIHRoaXMuYXJjTGVuZ3Roc1t0aGlzLnN0ZXBzXTtcclxuICAgIHZhciBsb3cgPSAwLFxyXG4gICAgICAgIGhpZ2ggPSB0aGlzLnN0ZXBzLFxyXG4gICAgICAgIGluZGV4ID0gMDtcclxuXHJcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xyXG4gICAgICAgIGluZGV4ID0gbG93ICsgKCgoaGlnaCAtIGxvdykgLyAyKSB8IDApO1xyXG4gICAgICAgIGlmICh0aGlzLmFyY0xlbmd0aHNbaW5kZXhdIDwgdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxvdyA9IGluZGV4ICsgMTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGlnaCA9IGluZGV4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmFyY0xlbmd0aHNbaW5kZXhdID4gdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgaW5kZXgtLTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbGVuZ3RoQmVmb3JlID0gdGhpcy5hcmNMZW5ndGhzW2luZGV4XTtcclxuICAgIGlmIChsZW5ndGhCZWZvcmUgPT09IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBpbmRleCAvIHRoaXMuc3RlcHM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiAoaW5kZXggKyAodGFyZ2V0TGVuZ3RoIC0gbGVuZ3RoQmVmb3JlKSAvICh0aGlzLmFyY0xlbmd0aHNbaW5kZXggKyAxXSAtIGxlbmd0aEJlZm9yZSkpIC8gdGhpcy5zdGVwcztcclxuICAgIH1cclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUuZ2V0VmFsdWVzID0gZnVuY3Rpb24gKGVsYXBzZWQpIHtcclxuICAgIHZhciB0ID0gdGhpcy5tYXAoZWxhcHNlZCksXHJcbiAgICAgICAgeCA9IHRoaXMuY3ViaWNOKHQsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgeSA9IHRoaXMuY3ViaWNOKHQsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSk7XHJcblxyXG4gICAgcmV0dXJuIFt4LCB5XTtcclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUuY3ViaWNOID0gZnVuY3Rpb24gKHBjdCwgYSwgYiwgYywgZCkge1xyXG4gICAgdmFyIHQyID0gcGN0ICogcGN0O1xyXG4gICAgdmFyIHQzID0gdDIgKiBwY3Q7XHJcbiAgICByZXR1cm4gYSArICgtYSAqIDMgKyBwY3QgKiAoMyAqIGEgLSBhICogcGN0KSkgKiBwY3RcclxuICAgICAgICArICgzICogYiArIHBjdCAqICgtNiAqIGIgKyBiICogMyAqIHBjdCkpICogcGN0XHJcbiAgICAgICAgKyAoYyAqIDMgLSBjICogMyAqIHBjdCkgKiB0MlxyXG4gICAgICAgICsgZCAqIHQzO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCZXppZXI7IiwiLyoqXHJcbiAqIEJlemllckVhc2luZyAtIHVzZSBiZXppZXIgY3VydmUgZm9yIHRyYW5zaXRpb24gZWFzaW5nIGZ1bmN0aW9uXHJcbiAqIGlzIGJhc2VkIG9uIEZpcmVmb3gncyBuc1NNSUxLZXlTcGxpbmUuY3BwXHJcbiAqIFVzYWdlOlxyXG4gKiB2YXIgc3BsaW5lID0gQmV6aWVyRWFzaW5nKDAuMjUsIDAuMSwgMC4yNSwgMS4wKVxyXG4gKiBzcGxpbmUoeCkgPT4gcmV0dXJucyB0aGUgZWFzaW5nIHZhbHVlIHwgeCBtdXN0IGJlIGluIFswLCAxXSByYW5nZVxyXG4gKlxyXG4gKi9cclxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XHJcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cuZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHdpbmRvdy5kZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgd2luZG93LmRlZmluZShbXSwgZGVmaW5pdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdpbmRvdy5CZXppZXJFYXNpbmcgPSBkZWZpbml0aW9uKCk7XHJcbiAgICB9XHJcbn0oZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8vIFRoZXNlIHZhbHVlcyBhcmUgZXN0YWJsaXNoZWQgYnkgZW1waXJpY2lzbSB3aXRoIHRlc3RzICh0cmFkZW9mZjogcGVyZm9ybWFuY2UgVlMgcHJlY2lzaW9uKVxyXG4gICAgdmFyIE5FV1RPTl9JVEVSQVRJT05TID0gNDtcclxuICAgIHZhciBORVdUT05fTUlOX1NMT1BFID0gMC4wMDE7XHJcbiAgICB2YXIgU1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxO1xyXG4gICAgdmFyIFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TID0gMTA7XHJcblxyXG4gICAgdmFyIGtTcGxpbmVUYWJsZVNpemUgPSAxMTtcclxuICAgIHZhciBrU2FtcGxlU3RlcFNpemUgPSAxLjAgLyAoa1NwbGluZVRhYmxlU2l6ZSAtIDEuMCk7XHJcblxyXG4gICAgdmFyIGZsb2F0MzJBcnJheVN1cHBvcnRlZCA9IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09IFwiZnVuY3Rpb25cIjtcclxuXHJcbiAgICBmdW5jdGlvbiBCZXppZXJFYXNpbmcgKG1YMSwgbVkxLCBtWDIsIG1ZMikge1xyXG5cclxuICAgICAgICAvLyBWYWxpZGF0ZSBhcmd1bWVudHNcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gNCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgcmVxdWlyZXMgNCBhcmd1bWVudHMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8NDsgKytpKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGlzTmFOKGFyZ3VtZW50c1tpXSkgfHwgIWlzRmluaXRlKGFyZ3VtZW50c1tpXSkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyBhcmd1bWVudHMgc2hvdWxkIGJlIGludGVnZXJzLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobVgxIDwgMCB8fCBtWDEgPiAxIHx8IG1YMiA8IDAgfHwgbVgyID4gMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgeCB2YWx1ZXMgbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2UuXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG1TYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBBIChhQTEsIGFBMikgeyByZXR1cm4gMS4wIC0gMy4wICogYUEyICsgMy4wICogYUExOyB9XHJcbiAgICAgICAgZnVuY3Rpb24gQiAoYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEMgKGFBMSkgICAgICB7IHJldHVybiAzLjAgKiBhQTE7IH1cclxuXHJcbiAgICAgICAgLy8gUmV0dXJucyB4KHQpIGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIHkodCkgZ2l2ZW4gdCwgeTEsIGFuZCB5Mi5cclxuICAgICAgICBmdW5jdGlvbiBjYWxjQmV6aWVyIChhVCwgYUExLCBhQTIpIHtcclxuICAgICAgICAgICAgcmV0dXJuICgoQShhQTEsIGFBMikqYVQgKyBCKGFBMSwgYUEyKSkqYVQgKyBDKGFBMSkpKmFUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmV0dXJucyBkeC9kdCBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciBkeS9kdCBnaXZlbiB0LCB5MSwgYW5kIHkyLlxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFNsb3BlIChhVCwgYUExLCBhQTIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDMuMCAqIEEoYUExLCBhQTIpKmFUKmFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlIChhWCwgYUd1ZXNzVCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNsb3BlID09PSAwLjApIHJldHVybiBhR3Vlc3NUO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRYID0gY2FsY0JlemllcihhR3Vlc3NULCBtWDEsIG1YMikgLSBhWDtcclxuICAgICAgICAgICAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjYWxjU2FtcGxlVmFsdWVzICgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrU3BsaW5lVGFibGVTaXplOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIG1TYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlIChhWCwgYUEsIGFCKSB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50WCwgY3VycmVudFQsIGkgPSAwO1xyXG4gICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMi4wO1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50WCA+IDAuMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFCID0gY3VycmVudFQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IFNVQkRJVklTSU9OX1BSRUNJU0lPTiAmJiArK2kgPCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyk7XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50VDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFRGb3JYIChhWCkge1xyXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxTdGFydCA9IDAuMDtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTYW1wbGUgPSAxO1xyXG4gICAgICAgICAgICB2YXIgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT0gbGFzdFNhbXBsZSAmJiBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyArK2N1cnJlbnRTYW1wbGUpIHtcclxuICAgICAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC0tY3VycmVudFNhbXBsZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludGVycG9sYXRlIHRvIHByb3ZpZGUgYW4gaW5pdGlhbCBndWVzcyBmb3IgdFxyXG4gICAgICAgICAgICB2YXIgZGlzdCA9IChhWCAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZSsxXSAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pO1xyXG4gICAgICAgICAgICB2YXIgZ3Vlc3NGb3JUID0gaW50ZXJ2YWxTdGFydCArIGRpc3QgKiBrU2FtcGxlU3RlcFNpemU7XHJcblxyXG4gICAgICAgICAgICB2YXIgaW5pdGlhbFNsb3BlID0gZ2V0U2xvcGUoZ3Vlc3NGb3JULCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsU2xvcGUgPj0gTkVXVE9OX01JTl9TTE9QRSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBndWVzc0ZvclQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluaXRpYWxTbG9wZSA9PSAwLjApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBndWVzc0ZvclQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmluYXJ5U3ViZGl2aWRlKGFYLCBpbnRlcnZhbFN0YXJ0LCBpbnRlcnZhbFN0YXJ0ICsga1NhbXBsZVN0ZXBTaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1YMSAhPSBtWTEgfHwgbVgyICE9IG1ZMilcclxuICAgICAgICAgICAgY2FsY1NhbXBsZVZhbHVlcygpO1xyXG5cclxuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChhWCkge1xyXG4gICAgICAgICAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHJldHVybiBhWDsgLy8gbGluZWFyXHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2UgSmF2YVNjcmlwdCBudW1iZXIgYXJlIGltcHJlY2lzZSwgd2Ugc2hvdWxkIGd1YXJhbnRlZSB0aGUgZXh0cmVtZXMgYXJlIHJpZ2h0LlxyXG4gICAgICAgICAgICBpZiAoYVggPT09IDApIHJldHVybiAwO1xyXG4gICAgICAgICAgICBpZiAoYVggPT09IDEpIHJldHVybiAxO1xyXG4gICAgICAgICAgICByZXR1cm4gY2FsY0JlemllcihnZXRURm9yWChhWCksIG1ZMSwgbVkyKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBzdHIgPSBcIkJlemllckVhc2luZyhcIitbbVgxLCBtWTEsIG1YMiwgbVkyXStcIilcIjtcclxuICAgICAgICBmLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gc3RyOyB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDU1MgbWFwcGluZ1xyXG4gICAgQmV6aWVyRWFzaW5nLmNzcyA9IHtcclxuICAgICAgICBcImVhc2VcIjogICAgICAgIEJlemllckVhc2luZygwLjI1LCAwLjEsIDAuMjUsIDEuMCksXHJcbiAgICAgICAgXCJsaW5lYXJcIjogICAgICBCZXppZXJFYXNpbmcoMC4wMCwgMC4wLCAxLjAwLCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1pblwiOiAgICAgQmV6aWVyRWFzaW5nKDAuNDIsIDAuMCwgMS4wMCwgMS4wKSxcclxuICAgICAgICBcImVhc2Utb3V0XCI6ICAgIEJlemllckVhc2luZygwLjAwLCAwLjAsIDAuNTgsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLWluLW91dFwiOiBCZXppZXJFYXNpbmcoMC40MiwgMC4wLCAwLjU4LCAxLjApXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBCZXppZXJFYXNpbmc7XHJcbn0pKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBFbGxpcHNlKGRhdGEpIHtcclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuc2l6ZSA9IGRhdGEuc2l6ZS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zaXplKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNpemUpO1xyXG4gICAgLy9vcHRpb25hbFxyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxufVxyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcblxyXG4gICAgdmFyIHNpemUgPSB0aGlzLnNpemUuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXTtcclxuXHJcbiAgICB2YXIgaSwgajtcclxuXHJcbiAgICB2YXIgdyA9IHNpemVbMF0gLyAyLFxyXG4gICAgICAgIGggPSBzaXplWzFdIC8gMixcclxuICAgICAgICB4ID0gcG9zaXRpb25bMF0gLSB3LFxyXG4gICAgICAgIHkgPSBwb3NpdGlvblsxXSAtIGgsXHJcbiAgICAgICAgb3cgPSB3ICogLjU1MjI4NDgsXHJcbiAgICAgICAgb2ggPSBoICogLjU1MjI4NDg7XHJcblxyXG4gICAgdmFyIHZlcnRpY2VzID0gW1xyXG4gICAgICAgIFt4ICsgdyArIG93LCB5LCB4ICsgdyAtIG93LCB5LCB4ICsgdywgeV0sXHJcbiAgICAgICAgW3ggKyB3ICsgdywgeSArIGggKyBvaCwgeCArIHcgKyB3LCB5ICsgaCAtIG9oLCB4ICsgdyArIHcsIHkgKyBoXSxcclxuICAgICAgICBbeCArIHcgLSBvdywgeSArIGggKyBoLCB4ICsgdyArIG93LCB5ICsgaCArIGgsIHggKyB3LCB5ICsgaCArIGhdLFxyXG4gICAgICAgIFt4LCB5ICsgaCAtIG9oLCB4LCB5ICsgaCArIG9oLCB4LCB5ICsgaF1cclxuICAgIF07XHJcblxyXG4gICAgaWYgKHRyaW0pIHtcclxuICAgICAgICB2YXIgdHYsXHJcbiAgICAgICAgICAgIGxlbiA9IHcgKyBoO1xyXG5cclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGogPSBpICsgMTtcclxuICAgICAgICAgICAgaWYgKGogPiAzKSBqID0gMDtcclxuICAgICAgICAgICAgaWYgKGkgPiB0cmltLnN0YXJ0SW5kZXggJiYgaSA8IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZlcnRpY2VzW2ldWzBdLCB2ZXJ0aWNlc1tpXVsxXSwgdmVydGljZXNbal1bMl0sIHZlcnRpY2VzW2pdWzNdLCB2ZXJ0aWNlc1tqXVs0XSwgdmVydGljZXNbal1bNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uc3RhcnRJbmRleCAmJiBpID09PSB0cmltLmVuZEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIHRyaW0uc3RhcnQsIHRyaW0uZW5kLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uc3RhcnRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCB0cmltLnN0YXJ0LCAxLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgMCwgdHJpbS5lbmQsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGogPSBpICsgMTtcclxuICAgICAgICAgICAgaWYgKGogPiAzKSBqID0gMDtcclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odmVydGljZXNbaV1bMF0sIHZlcnRpY2VzW2ldWzFdLCB2ZXJ0aWNlc1tqXVsyXSwgdmVydGljZXNbal1bM10sIHZlcnRpY2VzW2pdWzRdLCB2ZXJ0aWNlc1tqXVs1XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltKSB7XHJcbiAgICB2YXIgc3RhcnRJbmRleCA9IE1hdGguZmxvb3IodHJpbS5zdGFydCAqIDQpLFxyXG4gICAgICAgIGVuZEluZGV4ID0gTWF0aC5mbG9vcih0cmltLmVuZCAqIDQpLFxyXG4gICAgICAgIHN0YXJ0ID0gKHRyaW0uc3RhcnQgLSBzdGFydEluZGV4ICogMC4yNSkgKiA0LFxyXG4gICAgICAgIGVuZCA9ICh0cmltLmVuZCAtIGVuZEluZGV4ICogMC4yNSkgKiA0O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogc3RhcnRJbmRleCxcclxuICAgICAgICBlbmRJbmRleCAgOiBlbmRJbmRleCxcclxuICAgICAgICBzdGFydCAgICAgOiBzdGFydCxcclxuICAgICAgICBlbmQgICAgICAgOiBlbmRcclxuICAgIH07XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5zaXplLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbGxpcHNlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEZpbGwoZGF0YSkge1xyXG4gICAgdGhpcy5jb2xvciA9IGRhdGEuY29sb3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpIDogbmV3IFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcbkZpbGwucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuY29sb3IuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSA6IDE7XHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoY29sb3JbMF0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMV0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMl0pICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5zZXRDb2xvciA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuZ2V0VmFsdWUodGltZSk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5jb2xvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuRmlsbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuY29sb3IucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsbDsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU3Ryb2tlID0gcmVxdWlyZSgnLi9TdHJva2UnKSxcclxuICAgIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKSxcclxuICAgIEVsbGlwc2UgPSByZXF1aXJlKCcuL0VsbGlwc2UnKSxcclxuICAgIFBvbHlzdGFyID0gcmVxdWlyZSgnLi9Qb2x5c3RhcicpLFxyXG4gICAgQW5pbWF0ZWRQYXRoID0gcmVxdWlyZSgnLi9BbmltYXRlZFBhdGgnKSxcclxuICAgIEZpbGwgPSByZXF1aXJlKCcuL0ZpbGwnKSxcclxuICAgIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXHJcbiAgICBNZXJnZSA9IHJlcXVpcmUoJy4vTWVyZ2UnKSxcclxuICAgIFRyaW0gPSByZXF1aXJlKCcuL1RyaW0nKTtcclxuXHJcbmZ1bmN0aW9uIEdyb3VwKGRhdGEsIGJ1ZmZlckN0eCwgcGFyZW50SW4sIHBhcmVudE91dCkge1xyXG5cclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5pbiA9IGRhdGEuaW4gPyBkYXRhLmluIDogcGFyZW50SW47XHJcbiAgICB0aGlzLm91dCA9IGRhdGEub3V0ID8gZGF0YS5vdXQgOiBwYXJlbnRPdXQ7XHJcblxyXG4gICAgaWYgKGRhdGEuZmlsbCkgdGhpcy5maWxsID0gbmV3IEZpbGwoZGF0YS5maWxsKTtcclxuICAgIGlmIChkYXRhLnN0cm9rZSkgdGhpcy5zdHJva2UgPSBuZXcgU3Ryb2tlKGRhdGEuc3Ryb2tlKTtcclxuICAgIGlmIChkYXRhLnRyaW0pIHRoaXMudHJpbSA9IG5ldyBUcmltKGRhdGEudHJpbSk7XHJcbiAgICBpZiAoZGF0YS5tZXJnZSkgdGhpcy5tZXJnZSA9IG5ldyBNZXJnZShkYXRhLm1lcmdlKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0oZGF0YS50cmFuc2Zvcm0pO1xyXG4gICAgdGhpcy5idWZmZXJDdHggPSBidWZmZXJDdHg7XHJcblxyXG4gICAgaWYgKGRhdGEuZ3JvdXBzKSB7XHJcbiAgICAgICAgdGhpcy5ncm91cHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzLnB1c2gobmV3IEdyb3VwKGRhdGEuZ3JvdXBzW2ldLCB0aGlzLmJ1ZmZlckN0eCwgdGhpcy5pbiwgdGhpcy5vdXQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEuc2hhcGVzKSB7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRhdGEuc2hhcGVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IGRhdGEuc2hhcGVzW2pdO1xyXG4gICAgICAgICAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3BhdGgnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUuaXNBbmltYXRlZCkgdGhpcy5zaGFwZXMucHVzaChuZXcgQW5pbWF0ZWRQYXRoKHNoYXBlKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXMuc2hhcGVzLnB1c2gobmV3IFBhdGgoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IFJlY3Qoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAnZWxsaXBzZScpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IEVsbGlwc2Uoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAncG9seXN0YXInKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBQb2x5c3RhcihzaGFwZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5Hcm91cC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHBhcmVudEZpbGwsIHBhcmVudFN0cm9rZSwgcGFyZW50VHJpbSwgaXNCdWZmZXIpIHtcclxuXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG5cclxuICAgIC8vVE9ETyBjaGVjayBpZiBjb2xvci9zdHJva2UgaXMgY2hhbmdpbmcgb3ZlciB0aW1lXHJcbiAgICB2YXIgZmlsbCA9IHRoaXMuZmlsbCB8fCBwYXJlbnRGaWxsO1xyXG4gICAgdmFyIHN0cm9rZSA9IHRoaXMuc3Ryb2tlIHx8IHBhcmVudFN0cm9rZTtcclxuICAgIHZhciB0cmltVmFsdWVzID0gdGhpcy50cmltID8gdGhpcy50cmltLmdldFRyaW0odGltZSkgOiBwYXJlbnRUcmltO1xyXG5cclxuICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKGN0eCwgdGltZSk7XHJcbiAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKGN0eCwgdGltZSk7XHJcblxyXG4gICAgaWYgKCFpc0J1ZmZlcikgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0odGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG5cclxuICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5idWZmZXJDdHguY2FudmFzLndpZHRoLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgICAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGwpIHRoaXMuYnVmZmVyQ3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJva2UpIHRoaXMuYnVmZmVyQ3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KGN0eCwgdGltZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuc2hhcGVzW3RoaXMuc2hhcGVzLmxlbmd0aCAtIDFdLmNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgLy9jdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9UT0RPIGdldCBvcmRlclxyXG4gICAgaWYgKGZpbGwpIGN0eC5maWxsKCk7XHJcbiAgICBpZiAoIWlzQnVmZmVyICYmIHN0cm9rZSkgY3R4LnN0cm9rZSgpO1xyXG5cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcodGhpcy5idWZmZXJDdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXJnZS5zZXRDb21wb3NpdGVPcGVyYXRpb24odGhpcy5idWZmZXJDdHgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyhjdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuR3JvdXAucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5zZXRLZXlmcmFtZXModGltZSk7XHJcblxyXG4gICAgaWYgKHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1tqXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zdHJva2UpIHRoaXMuc3Ryb2tlLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnRyaW0pIHRoaXMudHJpbS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5Hcm91cC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnJlc2V0KHJldmVyc2VkKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2pdLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5maWxsKSB0aGlzLmZpbGwucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc3Ryb2tlKSB0aGlzLnN0cm9rZS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy50cmltKSB0aGlzLnRyaW0ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHcm91cDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpO1xyXG5cclxuZnVuY3Rpb24gSW1hZ2VMYXllcihkYXRhLCBidWZmZXJDdHgsIHBhcmVudEluLCBwYXJlbnRPdXQsIGJhc2VQYXRoLCBvbkxvYWQpIHtcclxuXHJcbiAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XHJcblxyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLnNvdXJjZSA9IGJhc2VQYXRoICsgZGF0YS5zb3VyY2U7XHJcblxyXG4gICAgdGhpcy5pbiA9IGRhdGEuaW4gPyBkYXRhLmluIDogcGFyZW50SW47XHJcbiAgICB0aGlzLm91dCA9IGRhdGEub3V0ID8gZGF0YS5vdXQgOiBwYXJlbnRPdXQ7XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKGRhdGEudHJhbnNmb3JtKTtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gYnVmZmVyQ3R4O1xyXG59XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5wcmVsb2FkID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgICB0aGlzLmltZyA9IG5ldyBJbWFnZTtcclxuICAgIHRoaXMuaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuaW1nLnNyYyA9IHRoaXMuc291cmNlO1xyXG59O1xyXG5cclxuSW1hZ2VMYXllci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuXHJcbiAgICBpZiAoIXRoaXMuaXNMb2FkZWQpIHJldHVybjtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcblxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCk7XHJcblxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZUxheWVyO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gTWVyZ2UoZGF0YSkge1xyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG59XHJcblxyXG5NZXJnZS5wcm90b3R5cGUuc2V0Q29tcG9zaXRlT3BlcmF0aW9uID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW91dCc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2UtaW4nO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDU6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAneG9yJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lcmdlO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEJlemllciA9IHJlcXVpcmUoJy4vQmV6aWVyJyk7XHJcblxyXG5mdW5jdGlvbiBQYXRoKGRhdGEpIHtcclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSBkYXRhLmNsb3NlZDtcclxuICAgIHRoaXMuZnJhbWVzID0gZGF0YS5mcmFtZXM7XHJcbiAgICB0aGlzLnZlcnRpY2VzQ291bnQgPSB0aGlzLmZyYW1lc1swXS52Lmxlbmd0aDtcclxufVxyXG5cclxuUGF0aC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuICAgIHZhciBmcmFtZSA9IHRoaXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgdmVydGljZXMgPSBmcmFtZS52O1xyXG5cclxuICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgaWYgKCh0cmltLnN0YXJ0ID09PSAwICYmIHRyaW0uZW5kID09PSAwKSB8fFxyXG4gICAgICAgICAgICAodHJpbS5zdGFydCA9PT0gMSAmJiB0cmltLmVuZCA9PT0gMSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRyaW0gPSB0aGlzLmdldFRyaW1WYWx1ZXModHJpbSwgZnJhbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBqID0gMTsgaiA8IHZlcnRpY2VzLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXh0VmVydGV4ID0gdmVydGljZXNbal0sXHJcbiAgICAgICAgICAgIGxhc3RWZXJ0ZXggPSB2ZXJ0aWNlc1tqIC0gMV07XHJcblxyXG4gICAgICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgICAgIHZhciB0djtcclxuXHJcbiAgICAgICAgICAgIGlmIChqID09PSAxICYmIHRyaW0uc3RhcnRJbmRleCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChqID09PSB0cmltLnN0YXJ0SW5kZXggKyAxICYmIGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCB0cmltLnN0YXJ0LCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgdHJpbS5zdGFydCwgMSwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA9PT0gdHJpbS5lbmRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIDAsIHRyaW0uZW5kLCBmcmFtZS5sZW5baiAtIDFdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChqID4gdHJpbS5zdGFydEluZGV4ICsgMSAmJiBqIDwgdHJpbS5lbmRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGogPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8obGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghdHJpbSAmJiB0aGlzLmNsb3NlZCkge1xyXG4gICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKG5leHRWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMV0sIHZlcnRpY2VzWzBdWzJdLCB2ZXJ0aWNlc1swXVszXSwgdmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgIH1cclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltLCBmcmFtZSkge1xyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgdmFyIGFjdHVhbFRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogMCxcclxuICAgICAgICBlbmRJbmRleDogMCxcclxuICAgICAgICBzdGFydDogMCxcclxuICAgICAgICBlbmQ6IDBcclxuICAgIH07XHJcblxyXG4vLyBUT0RPIGNsZWFuIHVwXHJcbiAgICBpZiAodHJpbS5zdGFydCA9PT0gMCkge1xyXG4gICAgICAgIGlmICh0cmltLmVuZCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBmcmFtZS5sZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdG90YWxMZW4gPSB0aGlzLnN1bUFycmF5KGZyYW1lLmxlbiksXHJcbiAgICAgICAgdHJpbUF0TGVuO1xyXG5cclxuICAgIHRyaW1BdExlbiA9IHRvdGFsTGVuICogdHJpbS5zdGFydDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRyaW1BdExlbiA+IDAgJiYgdHJpbUF0TGVuIDwgZnJhbWUubGVuW2ldKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnQgPSB0cmltQXRMZW4gLyBmcmFtZS5sZW5baV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGZyYW1lLmxlbi5sZW5ndGg7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmQgPSAxO1xyXG4gICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0cmltQXRMZW4gPSB0b3RhbExlbiAqIHRyaW0uZW5kO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0cmltQXRMZW4gPiAwICYmIHRyaW1BdExlbiA8IGZyYW1lLmxlbltpXSkge1xyXG4gICAgICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IHRyaW1BdExlbiAvIGZyYW1lLmxlbltpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cmltQXRMZW4gLT0gZnJhbWUubGVuW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnRyaW0gPSBmdW5jdGlvbiAobGFzdFZlcnRleCwgbmV4dFZlcnRleCwgZnJvbSwgdG8sIGxlbikge1xyXG5cclxuICAgIGlmIChmcm9tID09PSAwICYmIHRvID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhcnQ6IGxhc3RWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZDogbmV4dFZlcnRleFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaXNTdHJhaWdodChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKSkge1xyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzFdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzRdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIGZyb20pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgZW5kVmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsyXSwgbmV4dFZlcnRleFsyXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbmV4dFZlcnRleFs1XSwgdG8pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYmV6aWVyID0gbmV3IEJlemllcihbbGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XV0pO1xyXG4gICAgICAgIHRoaXMuYmV6aWVyLmdldExlbmd0aChsZW4pO1xyXG4gICAgICAgIGZyb20gPSB0aGlzLmJlemllci5tYXAoZnJvbSk7XHJcbiAgICAgICAgdG8gPSB0aGlzLmJlemllci5tYXAodG8pO1xyXG4gICAgICAgIHRvID0gKHRvIC0gZnJvbSkgLyAoMSAtIGZyb20pO1xyXG5cclxuICAgICAgICB2YXIgZTEsIGYxLCBnMSwgaDEsIGoxLCBrMSxcclxuICAgICAgICAgICAgZTIsIGYyLCBnMiwgaDIsIGoyLCBrMixcclxuICAgICAgICAgICAgc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZFZlcnRleDtcclxuXHJcbiAgICAgICAgZTEgPSBbdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbMF0sIGZyb20pLCB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFsxXSwgZnJvbSldO1xyXG4gICAgICAgIGYxID0gW3RoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSwgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbM10sIGZyb20pXTtcclxuICAgICAgICBnMSA9IFt0aGlzLmxlcnAobmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFs0XSwgZnJvbSksIHRoaXMubGVycChuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzVdLCBmcm9tKV07XHJcbiAgICAgICAgaDEgPSBbdGhpcy5sZXJwKGUxWzBdLCBmMVswXSwgZnJvbSksIHRoaXMubGVycChlMVsxXSwgZjFbMV0sIGZyb20pXTtcclxuICAgICAgICBqMSA9IFt0aGlzLmxlcnAoZjFbMF0sIGcxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGYxWzFdLCBnMVsxXSwgZnJvbSldO1xyXG4gICAgICAgIGsxID0gW3RoaXMubGVycChoMVswXSwgajFbMF0sIGZyb20pLCB0aGlzLmxlcnAoaDFbMV0sIGoxWzFdLCBmcm9tKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2oxWzBdLCBqMVsxXSwgaDFbMF0sIGgxWzFdLCBrMVswXSwgazFbMV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCBnMVswXSwgZzFbMV0sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV1dO1xyXG5cclxuICAgICAgICBlMiA9IFt0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzBdLCB0byksIHRoaXMubGVycChzdGFydFZlcnRleFs1XSwgc3RhcnRWZXJ0ZXhbMV0sIHRvKV07XHJcbiAgICAgICAgZjIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzBdLCBlbmRWZXJ0ZXhbMl0sIHRvKSwgdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzFdLCBlbmRWZXJ0ZXhbM10sIHRvKV07XHJcbiAgICAgICAgZzIgPSBbdGhpcy5sZXJwKGVuZFZlcnRleFsyXSwgZW5kVmVydGV4WzRdLCB0byksIHRoaXMubGVycChlbmRWZXJ0ZXhbM10sIGVuZFZlcnRleFs1XSwgdG8pXTtcclxuXHJcbiAgICAgICAgaDIgPSBbdGhpcy5sZXJwKGUyWzBdLCBmMlswXSwgdG8pLCB0aGlzLmxlcnAoZTJbMV0sIGYyWzFdLCB0byldO1xyXG4gICAgICAgIGoyID0gW3RoaXMubGVycChmMlswXSwgZzJbMF0sIHRvKSwgdGhpcy5sZXJwKGYyWzFdLCBnMlsxXSwgdG8pXTtcclxuICAgICAgICBrMiA9IFt0aGlzLmxlcnAoaDJbMF0sIGoyWzBdLCB0byksIHRoaXMubGVycChoMlsxXSwgajJbMV0sIHRvKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2UyWzBdLCBlMlsxXSwgc3RhcnRWZXJ0ZXhbMl0sIHN0YXJ0VmVydGV4WzNdLCBzdGFydFZlcnRleFs0XSwgc3RhcnRWZXJ0ZXhbNV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtqMlswXSwgajJbMV0sIGgyWzBdLCBoMlsxXSwgazJbMF0sIGsyWzFdXTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydDogc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgZW5kOiBlbmRWZXJ0ZXhcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHZhciBzID0gMSAtIHQ7XHJcbiAgICByZXR1cm4gYSAqIHMgKyBiICogdDtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnN1bUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xyXG4gICAgZnVuY3Rpb24gYWRkKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gYSArIGI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoYWRkKTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmlzU3RyYWlnaHQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGN0cmwxWCwgY3RybDFZLCBjdHJsMlgsIGN0cmwyWSwgZW5kWCwgZW5kWSkge1xyXG4gICAgcmV0dXJuIHN0YXJ0WCA9PT0gY3RybDFYICYmIHN0YXJ0WSA9PT0gY3RybDFZICYmIGVuZFggPT09IGN0cmwyWCAmJiBlbmRZID09PSBjdHJsMlk7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9seXN0YXIoZGF0YSkge1xyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7IC8vIFRPRE8gPz9cclxuXHJcbiAgICB0aGlzLnN0YXJUeXBlID0gZGF0YS5zdGFyVHlwZTtcclxuICAgIHRoaXMucG9pbnRzID0gZGF0YS5wb2ludHMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9pbnRzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvaW50cyk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzID0gZGF0YS5pbm5lclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cyk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gZGF0YS5vdXRlclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cyk7XHJcblxyXG4gICAgLy9vcHRpbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcyA9IGRhdGEuaW5uZXJSb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpO1xyXG4gICAgaWYgKGRhdGEub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MgPSBkYXRhLm91dGVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKTtcclxufVxyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IHRoaXMucG9pbnRzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIGlubmVyUmFkaXVzID0gdGhpcy5pbm5lclJhZGl1cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBvdXRlclJhZGl1cyA9IHRoaXMub3V0ZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcclxuICAgICAgICByb3RhdGlvbiA9IHRoaXMucm90YXRpb24gPyB0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBpbm5lclJvdW5kbmVzcyA9IHRoaXMuaW5uZXJSb3VuZG5lc3MgPyB0aGlzLmlubmVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBvdXRlclJvdW5kbmVzcyA9IHRoaXMub3V0ZXJSb3VuZG5lc3MgPyB0aGlzLm91dGVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMDtcclxuXHJcbiAgICByb3RhdGlvbiA9IHRoaXMuZGVnMnJhZChyb3RhdGlvbik7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBvdXRlclJhZGl1cywgcm90YXRpb24pO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSk7XHJcbiAgICBjdHgubW92ZVRvKHN0YXJ0WzBdLCBzdGFydFsxXSk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHM7IGkrKykge1xyXG5cclxuICAgICAgICB2YXIgcElubmVyLFxyXG4gICAgICAgICAgICBwT3V0ZXIsXHJcbiAgICAgICAgICAgIHBPdXRlcjFUYW5nZW50LFxyXG4gICAgICAgICAgICBwT3V0ZXIyVGFuZ2VudCxcclxuICAgICAgICAgICAgcElubmVyMVRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBJbm5lcjJUYW5nZW50LFxyXG4gICAgICAgICAgICBvdXRlck9mZnNldCxcclxuICAgICAgICAgICAgaW5uZXJPZmZzZXQsXHJcbiAgICAgICAgICAgIHJvdDtcclxuXHJcbiAgICAgICAgcm90ID0gTWF0aC5QSSAvIHBvaW50cyAqIDI7XHJcblxyXG4gICAgICAgIHBJbm5lciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBPdXRlciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIC8vRkl4TUVcclxuICAgICAgICBpZiAoIW91dGVyT2Zmc2V0KSBvdXRlck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBvdXRlclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xyXG4gICAgICAgIGlmICghaW5uZXJPZmZzZXQpIGlubmVyT2Zmc2V0ID0gKHN0YXJ0WzBdICsgcElubmVyWzBdKSAqIGlubmVyUm91bmRuZXNzIC8gMTAwICogLjU1MjI4NDg7XHJcblxyXG4gICAgICAgIHBPdXRlcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBvdXRlck9mZnNldCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogaSkgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcElubmVyMVRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIGlubmVyT2Zmc2V0ICogLTEsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwSW5uZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgaW5uZXJPZmZzZXQsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwT3V0ZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQgKiAtMSwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgIC8vc3RhclxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBJbm5lcjFUYW5nZW50WzBdLCBwSW5uZXIxVGFuZ2VudFsxXSwgcElubmVyWzBdLCBwSW5uZXJbMV0pO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vcG9seWdvblxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9kZWJ1Z1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXJbMF0sIHBJbm5lclsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyWzBdLCBwT3V0ZXJbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJyZWRcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiZ3JlZW5cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYnJvd25cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnJvdGF0ZVBvaW50ID0gZnVuY3Rpb24gKGN4LCBjeSwgeCwgeSwgcmFkaWFucykge1xyXG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxyXG4gICAgICAgIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpLFxyXG4gICAgICAgIG54ID0gKGNvcyAqICh4IC0gY3gpKSAtIChzaW4gKiAoeSAtIGN5KSkgKyBjeCxcclxuICAgICAgICBueSA9IChzaW4gKiAoeCAtIGN4KSkgKyAoY29zICogKHkgLSBjeSkpICsgY3k7XHJcbiAgICByZXR1cm4gW254LCBueV07XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMucG9pbnRzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMucG9pbnRzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlzdGFyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9zaXRpb24oZGF0YSkge1xyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eS5jYWxsKHRoaXMsIGRhdGEpO1xyXG59XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlKTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxuICAgIHRoaXMuc2V0TW90aW9uUGF0aCgpO1xyXG59O1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLm1vdGlvbnBhdGgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb3Rpb25wYXRoLmdldFZhbHVlcyh0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUuc2V0TW90aW9uUGF0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKSB7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoID0gbmV3IEJlemllcih0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKTtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGguZ2V0TGVuZ3RoKHRoaXMubGFzdEZyYW1lLmxlbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gUHJvcGVydHkoZGF0YSkge1xyXG4gICAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIG51bGw7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGE7XHJcbn1cclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmZyYW1lc1swXS52O1xyXG59O1xyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbn07XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUmVjdChkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcclxuXHJcbiAgICAvL29wdGlvbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3MgPSBkYXRhLnJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEucm91bmRuZXNzKTtcclxufVxyXG5cclxuUmVjdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdW5kbmVzcyA9IHRoaXMucm91bmRuZXNzID8gdGhpcy5yb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwO1xyXG5cclxuICAgIGlmIChzaXplWzBdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVswXSAvIDI7XHJcbiAgICBpZiAoc2l6ZVsxXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMV0gLyAyO1xyXG5cclxuICAgIHZhciB4ID0gcG9zaXRpb25bMF0gLSBzaXplWzBdIC8gMixcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0gLSBzaXplWzFdIC8gMjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0djtcclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG4gICAgICAgIC8vVE9ETyBhZGQgdHJpbVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdHgubW92ZVRvKHggKyByb3VuZG5lc3MsIHkpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSwgeCArIHNpemVbMF0sIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSArIHNpemVbMV0sIHgsIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4LCB5ICsgc2l6ZVsxXSwgeCwgeSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCwgeSwgeCArIHNpemVbMF0sIHksIHJvdW5kbmVzcyk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuUmVjdC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuc2l6ZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gU3Ryb2tlKGRhdGEpIHtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5qb2luID0gZGF0YS5qb2luO1xyXG4gICAgICAgIHRoaXMuY2FwID0gZGF0YS5jYXA7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEubWl0ZXJMaW1pdC5sZW5ndGggPiAxKSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY29sb3IubGVuZ3RoID4gMSkgdGhpcy5jb2xvciA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5jb2xvciA9IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEub3BhY2l0eS5sZW5ndGggPiAxKSB0aGlzLm9wYWNpdHkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5vcGFjaXR5ID0gbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLndpZHRoLmxlbmd0aCA+IDEpIHRoaXMud2lkdGggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLndpZHRoKTtcclxuICAgICAgICBlbHNlIHRoaXMud2lkdGggPSBuZXcgUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblN0cm9rZS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5vcGFjaXR5LmdldFZhbHVlKHRpbWUpO1xyXG4gICAgY29sb3JbMF0gPSBNYXRoLnJvdW5kKGNvbG9yWzBdKTtcclxuICAgIGNvbG9yWzFdID0gTWF0aC5yb3VuZChjb2xvclsxXSk7XHJcbiAgICBjb2xvclsyXSA9IE1hdGgucm91bmQoY29sb3JbMl0pO1xyXG4gICAgdmFyIHMgPSBjb2xvci5qb2luKCcsICcpO1xyXG5cclxuICAgIHJldHVybiAncmdiYSgnICsgcyArICcsICcgKyBvcGFjaXR5ICsgJyknO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5zZXRTdHJva2UgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcbiAgICB2YXIgc3Ryb2tlQ29sb3IgPSB0aGlzLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHN0cm9rZVdpZHRoID0gdGhpcy53aWR0aC5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBzdHJva2VKb2luID0gdGhpcy5qb2luO1xyXG4gICAgaWYgKHN0cm9rZUpvaW4gPT09ICdtaXRlcicpIHZhciBtaXRlckxpbWl0ID0gdGhpcy5taXRlckxpbWl0LmdldFZhbHVlKHRpbWUpO1xyXG5cclxuICAgIGN0eC5saW5lV2lkdGggPSBzdHJva2VXaWR0aDtcclxuICAgIGN0eC5saW5lSm9pbiA9IHN0cm9rZUpvaW47XHJcbiAgICBpZiAobWl0ZXJMaW1pdCkgY3R4Lm1pdGVyTGltaXQgPSBtaXRlckxpbWl0O1xyXG4gICAgY3R4LmxpbmVDYXAgPSB0aGlzLmNhcDtcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZUNvbG9yO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5jb2xvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy53aWR0aC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5taXRlckxpbWl0KSB0aGlzLm1pdGVyTGltaXQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5jb2xvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy53aWR0aC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5taXRlckxpbWl0KSB0aGlzLm1pdGVyTGltaXQucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdHJva2U7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpLFxyXG4gICAgUG9zaXRpb24gPSByZXF1aXJlKCcuL1Bvc2l0aW9uJyk7XHJcblxyXG5mdW5jdGlvbiBUcmFuc2Zvcm0oZGF0YSkge1xyXG4gICAgaWYgKCFkYXRhKSByZXR1cm47XHJcblxyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcblxyXG4gICAgaWYgKGRhdGEucG9zaXRpb25YICYmIGRhdGEucG9zaXRpb25ZKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb25YLmxlbmd0aCA+IDEgJiYgZGF0YS5wb3NpdGlvblkubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25YKTtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvblgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChkYXRhLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvc2l0aW9uKGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLmFuY2hvcikgdGhpcy5hbmNob3IgPSBkYXRhLmFuY2hvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5hbmNob3IpIDogbmV3IFByb3BlcnR5KGRhdGEuYW5jaG9yKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWCkgdGhpcy5zY2FsZVggPSBkYXRhLnNjYWxlWC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVgpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVYKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWSkgdGhpcy5zY2FsZVkgPSBkYXRhLnNjYWxlWS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVkpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVZKTtcclxuICAgIGlmIChkYXRhLnNrZXcpIHRoaXMuc2tldyA9IGRhdGEuc2tldy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXcpO1xyXG4gICAgaWYgKGRhdGEuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMgPSBkYXRhLnNrZXdBeGlzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvc2l0aW9uWCwgcG9zaXRpb25ZLFxyXG4gICAgICAgIGFuY2hvciA9IHRoaXMuYW5jaG9yID8gdGhpcy5hbmNob3IuZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLnJvdGF0aW9uID8gdGhpcy5kZWcycmFkKHRoaXMucm90YXRpb24uZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3ID0gdGhpcy5za2V3ID8gdGhpcy5kZWcycmFkKHRoaXMuc2tldy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNrZXdBeGlzID0gdGhpcy5za2V3QXhpcyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXdBeGlzLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2NhbGVYID0gdGhpcy5zY2FsZVggPyB0aGlzLnNjYWxlWC5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgc2NhbGVZID0gdGhpcy5zY2FsZVkgPyB0aGlzLnNjYWxlWS5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSAqIGN0eC5nbG9iYWxBbHBoYSA6IGN0eC5nbG9iYWxBbHBoYTsgLy8gRklYTUUgd3JvbmcgdHJhbnNwYXJlbmN5IGlmIG5lc3RlZFxyXG5cclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWCAmJiB0aGlzLnBvc2l0aW9uWSkge1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHRoaXMucG9zaXRpb25YLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHRoaXMucG9zaXRpb25ZLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lLCBjdHgpO1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHBvc2l0aW9uWzBdO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHBvc2l0aW9uWzFdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwb3NpdGlvblggPSAwO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coY3R4LCBwb3NpdGlvblgsIHBvc2l0aW9uWSwgYW5jaG9yLCByb3RhdGlvbiwgc2tldywgc2tld0F4aXMsIHNjYWxlWCwgc2NhbGVZLCBvcGFjaXR5KTtcclxuXHJcbiAgICAvL29yZGVyIHZlcnkgdmVyeSBpbXBvcnRhbnQgOilcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgMCwgMSwgcG9zaXRpb25YIC0gYW5jaG9yWzBdLCBwb3NpdGlvblkgLSBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIHJvdGF0aW9uLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICB0aGlzLnNldFNrZXcoY3R4LCBza2V3LCBza2V3QXhpcywgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRTY2FsZShjdHgsIHNjYWxlWCwgc2NhbGVZLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIChjdHgsIHJhZCwgeCwgeSkge1xyXG4gICAgdmFyIGMgPSBNYXRoLmNvcyhyYWQpO1xyXG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gICAgdmFyIGR4ID0geCAtIGMgKiB4ICsgcyAqIHk7XHJcbiAgICB2YXIgZHkgPSB5IC0gcyAqIHggLSBjICogeTtcclxuICAgIGN0eC50cmFuc2Zvcm0oYywgcywgLXMsIGMsIGR4LCBkeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24gKGN0eCwgc3gsIHN5LCB4LCB5KSB7XHJcbiAgICBjdHgudHJhbnNmb3JtKHN4LCAwLCAwLCBzeSwgLXggKiBzeCArIHgsIC15ICogc3kgKyB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0U2tldyA9IGZ1bmN0aW9uIChjdHgsIHNrZXcsIGF4aXMsIHgsIHkpIHtcclxuICAgIHZhciB0ID0gTWF0aC50YW4oLXNrZXcpO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIC1heGlzLCB4LCB5KTtcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgdCwgMSwgLXkgKiB0LCAwKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCBheGlzLCB4LCB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBUcmltKGRhdGEpIHtcclxuXHJcbiAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGU7XHJcblxyXG4gICAgaWYgKGRhdGEuc3RhcnQpIHRoaXMuc3RhcnQgPSBkYXRhLnN0YXJ0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnN0YXJ0KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnN0YXJ0KTtcclxuICAgIGlmIChkYXRhLmVuZCkgdGhpcy5lbmQgPSBkYXRhLmVuZC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5lbmQpIDogbmV3IFByb3BlcnR5KGRhdGEuZW5kKTtcclxuICAgIC8vaWYgKGRhdGEub2Zmc2V0KSB0aGlzLm9mZnNldCA9IGRhdGEub2Zmc2V0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9mZnNldCkgOiBuZXcgUHJvcGVydHkoZGF0YS5vZmZzZXQpO1xyXG5cclxufVxyXG5cclxuVHJpbS5wcm90b3R5cGUuZ2V0VHJpbSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnN0YXJ0ID8gdGhpcy5zdGFydC5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgZW5kID0gdGhpcy5lbmQgPyB0aGlzLmVuZC5nZXRWYWx1ZSh0aW1lKSA6IDE7XHJcblxyXG4gICAgdmFyIHRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnQ6IE1hdGgubWluKHN0YXJ0LCBlbmQpLFxyXG4gICAgICAgIGVuZDogTWF0aC5tYXgoc3RhcnQsIGVuZClcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDAgJiYgdHJpbS5lbmQgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRyaW07XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcblRyaW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydCkgdGhpcy5zdGFydC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5lbmQpIHRoaXMuZW5kLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIC8vaWYgKHRoaXMub2Zmc2V0KSB0aGlzLm9mZnNldC5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmltO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiJdfQ==
