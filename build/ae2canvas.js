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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL0ltYWdlTGF5ZXIuanMiLCJzcmMvcnVudGltZS9NZXJnZS5qcyIsInNyYy9ydW50aW1lL1BhdGguanMiLCJzcmMvcnVudGltZS9Qb2x5c3Rhci5qcyIsInNyYy9ydW50aW1lL1Bvc2l0aW9uLmpzIiwic3JjL3J1bnRpbWUvUHJvcGVydHkuanMiLCJzcmMvcnVudGltZS9SZWN0LmpzIiwic3JjL3J1bnRpbWUvU3Ryb2tlLmpzIiwic3JjL3J1bnRpbWUvVHJhbnNmb3JtLmpzIiwic3JjL3J1bnRpbWUvVHJpbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBHcm91cCA9IHJlcXVpcmUoJy4vR3JvdXAnKSxcclxuICAgIEltYWdlTGF5ZXIgPSByZXF1aXJlKCcuL0ltYWdlTGF5ZXInKTtcclxuXHJcbnZhciBfYW5pbWF0aW9ucyA9IFtdLFxyXG4gICAgX2FuaW1hdGlvbnNMZW5ndGggPSAwO1xyXG5cclxuLy8gQGxpY2Vuc2UgaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxyXG4vLyBjb3B5cmlnaHQgUGF1bCBJcmlzaCAyMDE1XHJcbihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgaWYgKCdwZXJmb3JtYW5jZScgaW4gd2luZG93ID09IGZhbHNlKSB7XHJcbiAgICAgICAgd2luZG93LnBlcmZvcm1hbmNlID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCdub3cnIGluIHdpbmRvdy5wZXJmb3JtYW5jZSA9PSBmYWxzZSkge1xyXG5cclxuICAgICAgICB2YXIgbm93T2Zmc2V0ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICAgICAgaWYgKHBlcmZvcm1hbmNlLnRpbWluZyAmJiBwZXJmb3JtYW5jZS50aW1pbmcubmF2aWdhdGlvblN0YXJ0KSB7XHJcbiAgICAgICAgICAgIG5vd09mZnNldCA9IHBlcmZvcm1hbmNlLnRpbWluZy5uYXZpZ2F0aW9uU3RhcnRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSBmdW5jdGlvbiBub3coKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gbm93T2Zmc2V0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL1xyXG5cclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGlvbihvcHRpb25zKSB7XHJcbiAgICBpZiAoIW9wdGlvbnMuZGF0YSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ25vIGRhdGEnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgIHRoaXMuZHVyYXRpb24gPSBvcHRpb25zLmRhdGEuZHVyYXRpb247XHJcbiAgICB0aGlzLmJhc2VXaWR0aCA9IG9wdGlvbnMuZGF0YS53aWR0aDtcclxuICAgIHRoaXMuYmFzZUhlaWdodCA9IG9wdGlvbnMuZGF0YS5oZWlnaHQ7XHJcbiAgICB0aGlzLnJhdGlvID0gb3B0aW9ucy5kYXRhLndpZHRoIC8gb3B0aW9ucy5kYXRhLmhlaWdodDtcclxuXHJcbiAgICB0aGlzLm1hcmtlcnMgPSBvcHRpb25zLmRhdGEubWFya2VycztcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5sb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5kZXZpY2VQaXhlbFJhdGlvID0gb3B0aW9ucy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XHJcbiAgICB0aGlzLmZsdWlkID0gb3B0aW9ucy5mbHVpZCB8fCB0cnVlO1xyXG4gICAgdGhpcy5yZXZlcnNlZCA9IG9wdGlvbnMucmV2ZXJzZWQgfHwgZmFsc2U7XHJcbiAgICB0aGlzLmltYWdlQmFzZVBhdGggPSBvcHRpb25zLmltYWdlQmFzZVBhdGggfHwgJyc7XHJcbiAgICB0aGlzLm9uQ29tcGxldGUgPSBvcHRpb25zLm9uQ29tcGxldGUgfHwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5iYXNlV2lkdGg7XHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmJhc2VIZWlnaHQ7XHJcblxyXG4gICAgdGhpcy5idWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMuYnVmZmVyLndpZHRoID0gdGhpcy5iYXNlV2lkdGg7XHJcbiAgICB0aGlzLmJ1ZmZlci5oZWlnaHQgPSB0aGlzLmJhc2VIZWlnaHQ7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IHRoaXMuYnVmZmVyLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJ1ZmZlcilcclxuXHJcbiAgICB0aGlzLmxheWVycyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmRhdGEubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0udHlwZSA9PT0gJ3ZlY3RvcicpIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnMucHVzaChuZXcgR3JvdXAob3B0aW9ucy5kYXRhLmxheWVyc1tpXSwgdGhpcy5idWZmZXJDdHgsIDAsIHRoaXMuZHVyYXRpb24pKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0udHlwZSA9PT0gJ2ltYWdlJykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVycy5wdXNoKG5ldyBJbWFnZUxheWVyKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0sIHRoaXMuYnVmZmVyQ3R4LCAwLCB0aGlzLmR1cmF0aW9uLCB0aGlzLmltYWdlQmFzZVBhdGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLm51bUxheWVycyA9IHRoaXMubGF5ZXJzLmxlbmd0aDtcclxuXHJcbiAgICB0aGlzLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5yZXNpemUoKTtcclxuXHJcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG5cclxuICAgIF9hbmltYXRpb25zLnB1c2godGhpcyk7XHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IF9hbmltYXRpb25zLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0aW9uLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBwbGF5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzUGxheWluZykge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNQYXVzZWQpIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSB0aGlzLmNvbXBUaW1lO1xyXG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ290b0FuZFBsYXk6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLmdldE1hcmtlcihpZCk7XHJcbiAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gbWFya2VyLnRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnb3RvQW5kU3RvcDogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMuZ2V0TWFya2VyKGlkKTtcclxuICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcclxuICAgICAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE1hcmtlcjogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpZF07XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXJrZXJzW2ldLmNvbW1lbnQgPT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oJ01hcmtlciBub3QgZm91bmQnKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tTdG9wTWFya2VyczogZnVuY3Rpb24gKGZyb20sIHRvKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWFya2Vyc1tpXS5zdG9wICYmIHRoaXMubWFya2Vyc1tpXS50aW1lID4gZnJvbSAmJiB0aGlzLm1hcmtlcnNbaV0udGltZSA8IHRvKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0U3RlcDogZnVuY3Rpb24gKHN0ZXApIHtcclxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY29tcFRpbWUgPSBzdGVwICogdGhpcy5kdXJhdGlvbjtcclxuICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSB0aGlzLmNvbXBUaW1lO1xyXG4gICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0U3RlcDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBUaW1lIC8gdGhpcy5kdXJhdGlvbjtcclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIGlmICghdGhpcy50aGVuKSB0aGlzLnRoZW4gPSB0aW1lO1xyXG5cclxuICAgICAgICB2YXIgZGVsdGEgPSB0aW1lIC0gdGhpcy50aGVuO1xyXG4gICAgICAgIHRoaXMudGhlbiA9IHRpbWU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzUGxheWluZykge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuY29tcFRpbWUgLSBkZWx0YSA6IHRoaXMuY29tcFRpbWUgKyBkZWx0YTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdG9wTWFya2VyID0gdGhpcy5jaGVja1N0b3BNYXJrZXJzKHRoaXMuY29tcFRpbWUgLSBkZWx0YSwgdGhpcy5jb21wVGltZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wVGltZSA+IHRoaXMuZHVyYXRpb24gfHwgdGhpcy5yZXZlcnNlZCAmJiB0aGlzLmNvbXBUaW1lIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyAwIDogdGhpcy5kdXJhdGlvbiAtIDE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RvcE1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHN0b3BNYXJrZXIudGltZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhdyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5kcmF3RnJhbWUpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3KHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZHJhdzogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYXNlV2lkdGgsIHRoaXMuYmFzZUhlaWdodCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aW1lID49IHRoaXMubGF5ZXJzW2ldLmluICYmIHRpbWUgPCB0aGlzLmxheWVyc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmRyYXcodGhpcy5jdHgsIHRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBwcmVsb2FkOiBmdW5jdGlvbiAoY2IpIHtcclxuICAgICAgICB0aGlzLm9ubG9hZENCID0gY2I7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxheWVyc1tpXSBpbnN0YW5jZW9mIEltYWdlTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLnByZWxvYWQodGhpcy5vbmxvYWQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIG9ubG9hZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1MYXllcnM7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0gaW5zdGFuY2VvZiBJbWFnZUxheWVyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmxheWVyc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGF5ZXJzW2ldLmlzTG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vbmxvYWRDQiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aGlzLm9ubG9hZENCKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXRLZXlmcmFtZXM6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMub25Db21wbGV0ZSA9IG51bGw7XHJcbiAgICAgICAgdmFyIGkgPSBfYW5pbWF0aW9ucy5pbmRleE9mKHRoaXMpO1xyXG4gICAgICAgIGlmIChpID4gLTEpIHtcclxuICAgICAgICAgICAgX2FuaW1hdGlvbnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IF9hbmltYXRpb25zLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzLnBhcmVudE5vZGUpIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNpemU6IGZ1bmN0aW9uICh3KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZmx1aWQpIHtcclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gdyB8fCB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aCB8fCB0aGlzLmJhc2VXaWR0aDtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aCAqIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gd2lkdGggLyB0aGlzLnJhdGlvICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5idWZmZXIud2lkdGggPSB3aWR0aCAqIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIuaGVpZ2h0ID0gd2lkdGggLyB0aGlzLnJhdGlvICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zY2FsZSA9IHdpZHRoIC8gdGhpcy5iYXNlV2lkdGggKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnRyYW5zZm9ybSh0aGlzLnNjYWxlLCAwLCAwLCB0aGlzLnNjYWxlLCAwLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgudHJhbnNmb3JtKHRoaXMuc2NhbGUsIDAsIDAsIHRoaXMuc2NhbGUsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0IHJldmVyc2VkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yZXZlcnNlZDtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0IHJldmVyc2VkKGJvb2wpIHtcclxuICAgICAgICB0aGlzLl9yZXZlcnNlZCA9IGJvb2w7XHJcbiAgICAgICAgaWYgKHRoaXMucGF1c2VkVGltZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5wYXVzZWRUaW1lO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuaXNQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnJldmVyc2VkID8gdGhpcy5kdXJhdGlvbiA6IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgQW5pbWF0aW9uOiBBbmltYXRpb24sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHRpbWUgPSB0aW1lICE9PSB1bmRlZmluZWQgPyB0aW1lIDogd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9hbmltYXRpb25zTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgX2FuaW1hdGlvbnNbaV0udXBkYXRlKHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgQmV6aWVyRWFzaW5nID0gcmVxdWlyZSgnLi9CZXppZXJFYXNpbmcnKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkUGF0aChkYXRhKSB7XHJcbiAgICBQYXRoLmNhbGwodGhpcywgZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lQ291bnQgPSB0aGlzLmZyYW1lcy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuZmluaXNoZWQgJiYgdGltZSA+PSB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEZyYW1lO1xyXG4gICAgfSBlbHNlIGlmICghdGhpcy5zdGFydGVkICYmIHRpbWUgPD0gdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RGcmFtZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRpbWUgPiB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgKyAxID09PSB0aGlzLmZyYW1lQ291bnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRpbWUgPCB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgPCAyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlci0tO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlQXRUaW1lKHRpbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRpbWUgPCB0aGlzLmZyYW1lc1swXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRpbWUgPiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gdGhpcy5mcmFtZUNvdW50IC0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICAgIGlmICh0aW1lID49IHRoaXMuZnJhbWVzW2kgLSAxXS50ICYmIHRpbWUgPD0gdGhpcy5mcmFtZXNbaV0pIHtcclxuICAgICAgICAgICAgdGhpcy5wb2ludGVyID0gaTtcclxuICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1tpIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbaV07XHJcbiAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XHJcbiAgICByZXR1cm4gYSArIHQgKiAoYiAtIGEpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5zZXRFYXNpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5sYXN0RnJhbWUuZWFzZU91dCAmJiB0aGlzLm5leHRGcmFtZS5lYXNlSW4pIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG5ldyBCZXppZXJFYXNpbmcodGhpcy5sYXN0RnJhbWUuZWFzZU91dFswXSwgdGhpcy5sYXN0RnJhbWUuZWFzZU91dFsxXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzBdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMubGFzdEZyYW1lLnQgKTtcclxuICAgIHZhciBkdXJhdGlvbiA9IHRoaXMubmV4dEZyYW1lLnQgLSB0aGlzLmxhc3RGcmFtZS50O1xyXG4gICAgdmFyIGVsYXBzZWQgPSBkZWx0YSAvIGR1cmF0aW9uO1xyXG4gICAgaWYgKGVsYXBzZWQgPiAxKSBlbGFwc2VkID0gMTtcclxuICAgIGVsc2UgaWYgKGVsYXBzZWQgPCAwKSBlbGFwc2VkID0gMDtcclxuICAgIGVsc2UgaWYgKHRoaXMuZWFzaW5nKSBlbGFwc2VkID0gdGhpcy5lYXNpbmcoZWxhcHNlZCk7XHJcbiAgICB2YXIgYWN0dWFsVmVydGljZXMgPSBbXSxcclxuICAgICAgICBhY3R1YWxMZW5ndGggPSBbXTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGNwMXggPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVswXSwgdGhpcy5uZXh0RnJhbWUudltpXVswXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIGNwMXkgPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVsxXSwgdGhpcy5uZXh0RnJhbWUudltpXVsxXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIGNwMnggPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVsyXSwgdGhpcy5uZXh0RnJhbWUudltpXVsyXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIGNwMnkgPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVszXSwgdGhpcy5uZXh0RnJhbWUudltpXVszXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIHggPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVs0XSwgdGhpcy5uZXh0RnJhbWUudltpXVs0XSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIHkgPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVs1XSwgdGhpcy5uZXh0RnJhbWUudltpXVs1XSwgZWxhcHNlZCk7XHJcblxyXG4gICAgICAgIGFjdHVhbFZlcnRpY2VzLnB1c2goW2NwMXgsIGNwMXksIGNwMngsIGNwMnksIHgsIHldKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMudmVydGljZXNDb3VudCAtIDE7IGorKykge1xyXG4gICAgICAgIGFjdHVhbExlbmd0aC5wdXNoKHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS5sZW5bal0sIHRoaXMubmV4dEZyYW1lLmxlbltqXSwgZWxhcHNlZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdiAgOiBhY3R1YWxWZXJ0aWNlcyxcclxuICAgICAgICBsZW46IGFjdHVhbExlbmd0aFxyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnBvaW50ZXIgPSByZXZlcnNlZCA/IHRoaXMuZnJhbWVDb3VudCAtIDEgOiAxO1xyXG4gICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRlZFBhdGg7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBCZXppZXJFYXNpbmcgPSByZXF1aXJlKCcuL0JlemllckVhc2luZycpO1xyXG5cclxuZnVuY3Rpb24gQW5pbWF0ZWRQcm9wZXJ0eShkYXRhKSB7XHJcbiAgICBQcm9wZXJ0eS5jYWxsKHRoaXMsIGRhdGEpO1xyXG4gICAgdGhpcy5mcmFtZUNvdW50ID0gdGhpcy5mcmFtZXMubGVuZ3RoO1xyXG59XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUHJvcGVydHkucHJvdG90eXBlKTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xyXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIHZhciBhcnIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYXJyW2ldID0gYVtpXSArIHQgKiAoYltpXSAtIGFbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gYSArIHQgKiAoYiAtIGEpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuc2V0RWFzaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMubmV4dEZyYW1lLmVhc2VJbikge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbmV3IEJlemllckVhc2luZyh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzBdLCB0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzFdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMF0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblsxXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLmZpbmlzaGVkICYmIHRpbWUgPj0gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZS52O1xyXG4gICAgfSBlbHNlIGlmICghdGhpcy5zdGFydGVkICYmIHRpbWUgPD0gdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RGcmFtZS52O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGltZSA+IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciArIDEgPT09IHRoaXMuZnJhbWVDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXIrKztcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGltZSA8IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciA8IDIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyLS07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVBdFRpbWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZyh0aW1lLCB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAyXS50LCB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KTtcclxuXHJcbiAgICBpZiAodGltZSA8IHRoaXMuZnJhbWVzWzBdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGltZSA+IHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSB0aGlzLmZyYW1lQ291bnQgLSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuZnJhbWVDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5mcmFtZXNbaSAtIDFdLnQgJiYgdGltZSA8PSB0aGlzLmZyYW1lc1tpXS50KSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9pbnRlciA9IGk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbaSAtIDFdO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLm9uS2V5ZnJhbWVDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNldEVhc2luZygpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0RWxhcHNlZCA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAoIHRpbWUgLSB0aGlzLmxhc3RGcmFtZS50ICksXHJcbiAgICAgICAgZHVyYXRpb24gPSB0aGlzLm5leHRGcmFtZS50IC0gdGhpcy5sYXN0RnJhbWUudCxcclxuICAgICAgICBlbGFwc2VkID0gZGVsdGEgLyBkdXJhdGlvbjtcclxuXHJcbiAgICBpZiAoZWxhcHNlZCA+IDEpIGVsYXBzZWQgPSAxO1xyXG4gICAgZWxzZSBpZiAoZWxhcHNlZCA8IDApIGVsYXBzZWQgPSAwO1xyXG4gICAgZWxzZSBpZiAodGhpcy5lYXNpbmcpIGVsYXBzZWQgPSB0aGlzLmVhc2luZyhlbGFwc2VkKTtcclxuICAgIHJldHVybiBlbGFwc2VkO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgcmV0dXJuIHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52LCB0aGlzLm5leHRGcmFtZS52LCB0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5wb2ludGVyID0gcmV2ZXJzZWQgPyB0aGlzLmZyYW1lQ291bnQgLSAxIDogMTtcclxuICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0ZWRQcm9wZXJ0eTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBCZXppZXIocGF0aCkge1xyXG4gICAgdGhpcy5wYXRoID0gcGF0aDtcclxufVxyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbiAobGVuKSB7XHJcbiAgICB0aGlzLnN0ZXBzID0gTWF0aC5tYXgoTWF0aC5mbG9vcihsZW4gLyAxMCksIDEpO1xyXG4gICAgdGhpcy5hcmNMZW5ndGhzID0gbmV3IEFycmF5KHRoaXMuc3RlcHMgKyAxKTtcclxuICAgIHRoaXMuYXJjTGVuZ3Roc1swXSA9IDA7XHJcblxyXG4gICAgdmFyIG94ID0gdGhpcy5jdWJpY04oMCwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcclxuICAgICAgICBveSA9IHRoaXMuY3ViaWNOKDAsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSksXHJcbiAgICAgICAgY2xlbiA9IDAsXHJcbiAgICAgICAgaXRlcmF0b3IgPSAxIC8gdGhpcy5zdGVwcztcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSB0aGlzLnN0ZXBzOyBpICs9IDEpIHtcclxuICAgICAgICB2YXIgeCA9IHRoaXMuY3ViaWNOKGkgKiBpdGVyYXRvciwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcclxuICAgICAgICAgICAgeSA9IHRoaXMuY3ViaWNOKGkgKiBpdGVyYXRvciwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKTtcclxuXHJcbiAgICAgICAgdmFyIGR4ID0gb3ggLSB4LFxyXG4gICAgICAgICAgICBkeSA9IG95IC0geTtcclxuXHJcbiAgICAgICAgY2xlbiArPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xyXG4gICAgICAgIHRoaXMuYXJjTGVuZ3Roc1tpXSA9IGNsZW47XHJcblxyXG4gICAgICAgIG94ID0geDtcclxuICAgICAgICBveSA9IHk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5sZW5ndGggPSBjbGVuO1xyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAodSkge1xyXG4gICAgdmFyIHRhcmdldExlbmd0aCA9IHUgKiB0aGlzLmFyY0xlbmd0aHNbdGhpcy5zdGVwc107XHJcbiAgICB2YXIgbG93ID0gMCxcclxuICAgICAgICBoaWdoID0gdGhpcy5zdGVwcyxcclxuICAgICAgICBpbmRleCA9IDA7XHJcblxyXG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcclxuICAgICAgICBpbmRleCA9IGxvdyArICgoKGhpZ2ggLSBsb3cpIC8gMikgfCAwKTtcclxuICAgICAgICBpZiAodGhpcy5hcmNMZW5ndGhzW2luZGV4XSA8IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgICAgICBsb3cgPSBpbmRleCArIDE7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGhpZ2ggPSBpbmRleDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5hcmNMZW5ndGhzW2luZGV4XSA+IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgIGluZGV4LS07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxlbmd0aEJlZm9yZSA9IHRoaXMuYXJjTGVuZ3Roc1tpbmRleF07XHJcbiAgICBpZiAobGVuZ3RoQmVmb3JlID09PSB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICByZXR1cm4gaW5kZXggLyB0aGlzLnN0ZXBzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gKGluZGV4ICsgKHRhcmdldExlbmd0aCAtIGxlbmd0aEJlZm9yZSkgLyAodGhpcy5hcmNMZW5ndGhzW2luZGV4ICsgMV0gLSBsZW5ndGhCZWZvcmUpKSAvIHRoaXMuc3RlcHM7XHJcbiAgICB9XHJcbn07XHJcblxyXG5CZXppZXIucHJvdG90eXBlLmdldFZhbHVlcyA9IGZ1bmN0aW9uIChlbGFwc2VkKSB7XHJcbiAgICB2YXIgdCA9IHRoaXMubWFwKGVsYXBzZWQpLFxyXG4gICAgICAgIHggPSB0aGlzLmN1YmljTih0LCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgIHkgPSB0aGlzLmN1YmljTih0LCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pO1xyXG5cclxuICAgIHJldHVybiBbeCwgeV07XHJcbn07XHJcblxyXG5CZXppZXIucHJvdG90eXBlLmN1YmljTiA9IGZ1bmN0aW9uIChwY3QsIGEsIGIsIGMsIGQpIHtcclxuICAgIHZhciB0MiA9IHBjdCAqIHBjdDtcclxuICAgIHZhciB0MyA9IHQyICogcGN0O1xyXG4gICAgcmV0dXJuIGEgKyAoLWEgKiAzICsgcGN0ICogKDMgKiBhIC0gYSAqIHBjdCkpICogcGN0XHJcbiAgICAgICAgKyAoMyAqIGIgKyBwY3QgKiAoLTYgKiBiICsgYiAqIDMgKiBwY3QpKSAqIHBjdFxyXG4gICAgICAgICsgKGMgKiAzIC0gYyAqIDMgKiBwY3QpICogdDJcclxuICAgICAgICArIGQgKiB0MztcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmV6aWVyOyIsIi8qKlxyXG4gKiBCZXppZXJFYXNpbmcgLSB1c2UgYmV6aWVyIGN1cnZlIGZvciB0cmFuc2l0aW9uIGVhc2luZyBmdW5jdGlvblxyXG4gKiBpcyBiYXNlZCBvbiBGaXJlZm94J3MgbnNTTUlMS2V5U3BsaW5lLmNwcFxyXG4gKiBVc2FnZTpcclxuICogdmFyIHNwbGluZSA9IEJlemllckVhc2luZygwLjI1LCAwLjEsIDAuMjUsIDEuMClcclxuICogc3BsaW5lKHgpID0+IHJldHVybnMgdGhlIGVhc2luZyB2YWx1ZSB8IHggbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2VcclxuICpcclxuICovXHJcbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xyXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93LmRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB3aW5kb3cuZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIHdpbmRvdy5kZWZpbmUoW10sIGRlZmluaXRpb24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB3aW5kb3cuQmV6aWVyRWFzaW5nID0gZGVmaW5pdGlvbigpO1xyXG4gICAgfVxyXG59KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBUaGVzZSB2YWx1ZXMgYXJlIGVzdGFibGlzaGVkIGJ5IGVtcGlyaWNpc20gd2l0aCB0ZXN0cyAodHJhZGVvZmY6IHBlcmZvcm1hbmNlIFZTIHByZWNpc2lvbilcclxuICAgIHZhciBORVdUT05fSVRFUkFUSU9OUyA9IDQ7XHJcbiAgICB2YXIgTkVXVE9OX01JTl9TTE9QRSA9IDAuMDAxO1xyXG4gICAgdmFyIFNVQkRJVklTSU9OX1BSRUNJU0lPTiA9IDAuMDAwMDAwMTtcclxuICAgIHZhciBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwO1xyXG5cclxuICAgIHZhciBrU3BsaW5lVGFibGVTaXplID0gMTE7XHJcbiAgICB2YXIga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApO1xyXG5cclxuICAgIHZhciBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPSB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSBcImZ1bmN0aW9uXCI7XHJcblxyXG4gICAgZnVuY3Rpb24gQmV6aWVyRWFzaW5nIChtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcclxuXHJcbiAgICAgICAgLy8gVmFsaWRhdGUgYXJndW1lbnRzXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIHJlcXVpcmVzIDQgYXJndW1lbnRzLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPDQ7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSAhPT0gXCJudW1iZXJcIiB8fCBpc05hTihhcmd1bWVudHNbaV0pIHx8ICFpc0Zpbml0ZShhcmd1bWVudHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgYXJndW1lbnRzIHNob3VsZCBiZSBpbnRlZ2Vycy5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1YMSA8IDAgfHwgbVgxID4gMSB8fCBtWDIgPCAwIHx8IG1YMiA+IDEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIHggdmFsdWVzIG11c3QgYmUgaW4gWzAsIDFdIHJhbmdlLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBtU2FtcGxlVmFsdWVzID0gZmxvYXQzMkFycmF5U3VwcG9ydGVkID8gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKSA6IG5ldyBBcnJheShrU3BsaW5lVGFibGVTaXplKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gQSAoYUExLCBhQTIpIHsgcmV0dXJuIDEuMCAtIDMuMCAqIGFBMiArIDMuMCAqIGFBMTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEIgKGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBhQTIgLSA2LjAgKiBhQTE7IH1cclxuICAgICAgICBmdW5jdGlvbiBDIChhQTEpICAgICAgeyByZXR1cm4gMy4wICogYUExOyB9XHJcblxyXG4gICAgICAgIC8vIFJldHVybnMgeCh0KSBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciB5KHQpIGdpdmVuIHQsIHkxLCBhbmQgeTIuXHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY0JlemllciAoYVQsIGFBMSwgYUEyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoKEEoYUExLCBhQTIpKmFUICsgQihhQTEsIGFBMikpKmFUICsgQyhhQTEpKSphVDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJldHVybnMgZHgvZHQgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgZHkvZHQgZ2l2ZW4gdCwgeTEsIGFuZCB5Mi5cclxuICAgICAgICBmdW5jdGlvbiBnZXRTbG9wZSAoYVQsIGFBMSwgYUEyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAzLjAgKiBBKGFBMSwgYUEyKSphVCphVCArIDIuMCAqIEIoYUExLCBhQTIpICogYVQgKyBDKGFBMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBuZXd0b25SYXBoc29uSXRlcmF0ZSAoYVgsIGFHdWVzc1QpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBORVdUT05fSVRFUkFUSU9OUzsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSByZXR1cm4gYUd1ZXNzVDtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XHJcbiAgICAgICAgICAgICAgICBhR3Vlc3NUIC09IGN1cnJlbnRYIC8gY3VycmVudFNsb3BlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhR3Vlc3NUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY1NhbXBsZVZhbHVlcyAoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBtU2FtcGxlVmFsdWVzW2ldID0gY2FsY0JlemllcihpICoga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZSAoYVgsIGFBLCBhQikge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFgsIGN1cnJlbnRULCBpID0gMDtcclxuICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDIuMDtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFggPiAwLjApIHtcclxuICAgICAgICAgICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhQSA9IGN1cnJlbnRUO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IHdoaWxlIChNYXRoLmFicyhjdXJyZW50WCkgPiBTVUJESVZJU0lPTl9QUkVDSVNJT04gJiYgKytpIDwgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMpO1xyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRURm9yWCAoYVgpIHtcclxuICAgICAgICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwLjA7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50U2FtcGxlID0gMTtcclxuICAgICAgICAgICAgdmFyIGxhc3RTYW1wbGUgPSBrU3BsaW5lVGFibGVTaXplIC0gMTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9IGxhc3RTYW1wbGUgJiYgbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgKytjdXJyZW50U2FtcGxlKSB7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnZhbFN0YXJ0ICs9IGtTYW1wbGVTdGVwU2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAtLWN1cnJlbnRTYW1wbGU7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0byBwcm92aWRlIGFuIGluaXRpYWwgZ3Vlc3MgZm9yIHRcclxuICAgICAgICAgICAgdmFyIGRpc3QgPSAoYVggLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSAvIChtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUrMV0gLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKTtcclxuICAgICAgICAgICAgdmFyIGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplO1xyXG5cclxuICAgICAgICAgICAgdmFyIGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbFNsb3BlID49IE5FV1RPTl9NSU5fU0xPUEUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JUKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT0gMC4wKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ3Vlc3NGb3JUO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtWDEgIT0gbVkxIHx8IG1YMiAhPSBtWTIpXHJcbiAgICAgICAgICAgIGNhbGNTYW1wbGVWYWx1ZXMoKTtcclxuXHJcbiAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoYVgpIHtcclxuICAgICAgICAgICAgaWYgKG1YMSA9PT0gbVkxICYmIG1YMiA9PT0gbVkyKSByZXR1cm4gYVg7IC8vIGxpbmVhclxyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIEphdmFTY3JpcHQgbnVtYmVyIGFyZSBpbXByZWNpc2UsIHdlIHNob3VsZCBndWFyYW50ZWUgdGhlIGV4dHJlbWVzIGFyZSByaWdodC5cclxuICAgICAgICAgICAgaWYgKGFYID09PSAwKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgaWYgKGFYID09PSAxKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbGNCZXppZXIoZ2V0VEZvclgoYVgpLCBtWTEsIG1ZMik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc3RyID0gXCJCZXppZXJFYXNpbmcoXCIrW21YMSwgbVkxLCBtWDIsIG1ZMl0rXCIpXCI7XHJcbiAgICAgICAgZi50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0cjsgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGY7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ1NTIG1hcHBpbmdcclxuICAgIEJlemllckVhc2luZy5jc3MgPSB7XHJcbiAgICAgICAgXCJlYXNlXCI6ICAgICAgICBCZXppZXJFYXNpbmcoMC4yNSwgMC4xLCAwLjI1LCAxLjApLFxyXG4gICAgICAgIFwibGluZWFyXCI6ICAgICAgQmV6aWVyRWFzaW5nKDAuMDAsIDAuMCwgMS4wMCwgMS4wKSxcclxuICAgICAgICBcImVhc2UtaW5cIjogICAgIEJlemllckVhc2luZygwLjQyLCAwLjAsIDEuMDAsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLW91dFwiOiAgICBCZXppZXJFYXNpbmcoMC4wMCwgMC4wLCAwLjU4LCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1pbi1vdXRcIjogQmV6aWVyRWFzaW5nKDAuNDIsIDAuMCwgMC41OCwgMS4wKVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQmV6aWVyRWFzaW5nO1xyXG59KSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gRWxsaXBzZShkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcclxuICAgIC8vb3B0aW9uYWxcclxuICAgIGlmIChkYXRhLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uID0gZGF0YS5wb3NpdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbn1cclxuXHJcbkVsbGlwc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXRoLnByb3RvdHlwZSk7XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgdHJpbSkge1xyXG5cclxuICAgIHZhciBzaXplID0gdGhpcy5zaXplLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiA/IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSkgOiBbMCwgMF07XHJcblxyXG4gICAgdmFyIGksIGo7XHJcblxyXG4gICAgdmFyIHcgPSBzaXplWzBdIC8gMixcclxuICAgICAgICBoID0gc2l6ZVsxXSAvIDIsXHJcbiAgICAgICAgeCA9IHBvc2l0aW9uWzBdIC0gdyxcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0gLSBoLFxyXG4gICAgICAgIG93ID0gdyAqIC41NTIyODQ4LFxyXG4gICAgICAgIG9oID0gaCAqIC41NTIyODQ4O1xyXG5cclxuICAgIHZhciB2ZXJ0aWNlcyA9IFtcclxuICAgICAgICBbeCArIHcgKyBvdywgeSwgeCArIHcgLSBvdywgeSwgeCArIHcsIHldLFxyXG4gICAgICAgIFt4ICsgdyArIHcsIHkgKyBoICsgb2gsIHggKyB3ICsgdywgeSArIGggLSBvaCwgeCArIHcgKyB3LCB5ICsgaF0sXHJcbiAgICAgICAgW3ggKyB3IC0gb3csIHkgKyBoICsgaCwgeCArIHcgKyBvdywgeSArIGggKyBoLCB4ICsgdywgeSArIGggKyBoXSxcclxuICAgICAgICBbeCwgeSArIGggLSBvaCwgeCwgeSArIGggKyBvaCwgeCwgeSArIGhdXHJcbiAgICBdO1xyXG5cclxuICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgdmFyIHR2LFxyXG4gICAgICAgICAgICBsZW4gPSB3ICsgaDtcclxuXHJcbiAgICAgICAgdHJpbSA9IHRoaXMuZ2V0VHJpbVZhbHVlcyh0cmltKTtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xyXG4gICAgICAgICAgICBqID0gaSArIDE7XHJcbiAgICAgICAgICAgIGlmIChqID4gMykgaiA9IDA7XHJcbiAgICAgICAgICAgIGlmIChpID4gdHJpbS5zdGFydEluZGV4ICYmIGkgPCB0cmltLmVuZEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2ZXJ0aWNlc1tpXVswXSwgdmVydGljZXNbaV1bMV0sIHZlcnRpY2VzW2pdWzJdLCB2ZXJ0aWNlc1tqXVszXSwgdmVydGljZXNbal1bNF0sIHZlcnRpY2VzW2pdWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSB0cmltLnN0YXJ0SW5kZXggJiYgaSA9PT0gdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCB0cmltLnN0YXJ0LCB0cmltLmVuZCwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSB0cmltLnN0YXJ0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgdHJpbS5zdGFydCwgMSwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSB0cmltLmVuZEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIDAsIHRyaW0uZW5kLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdHgubW92ZVRvKHZlcnRpY2VzWzBdWzRdLCB2ZXJ0aWNlc1swXVs1XSk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xyXG4gICAgICAgICAgICBqID0gaSArIDE7XHJcbiAgICAgICAgICAgIGlmIChqID4gMykgaiA9IDA7XHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZlcnRpY2VzW2ldWzBdLCB2ZXJ0aWNlc1tpXVsxXSwgdmVydGljZXNbal1bMl0sIHZlcnRpY2VzW2pdWzNdLCB2ZXJ0aWNlc1tqXVs0XSwgdmVydGljZXNbal1bNV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLmdldFRyaW1WYWx1ZXMgPSBmdW5jdGlvbiAodHJpbSkge1xyXG4gICAgdmFyIHN0YXJ0SW5kZXggPSBNYXRoLmZsb29yKHRyaW0uc3RhcnQgKiA0KSxcclxuICAgICAgICBlbmRJbmRleCA9IE1hdGguZmxvb3IodHJpbS5lbmQgKiA0KSxcclxuICAgICAgICBzdGFydCA9ICh0cmltLnN0YXJ0IC0gc3RhcnRJbmRleCAqIDAuMjUpICogNCxcclxuICAgICAgICBlbmQgPSAodHJpbS5lbmQgLSBlbmRJbmRleCAqIDAuMjUpICogNDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXJ0SW5kZXg6IHN0YXJ0SW5kZXgsXHJcbiAgICAgICAgZW5kSW5kZXggIDogZW5kSW5kZXgsXHJcbiAgICAgICAgc3RhcnQgICAgIDogc3RhcnQsXHJcbiAgICAgICAgZW5kICAgICAgIDogZW5kXHJcbiAgICB9O1xyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuc2l6ZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5zaXplLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRWxsaXBzZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBGaWxsKGRhdGEpIHtcclxuICAgIHRoaXMuY29sb3IgPSBkYXRhLmNvbG9yLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmNvbG9yKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuICAgIGlmIChkYXRhLm9wYWNpdHkpIHRoaXMub3BhY2l0eSA9IGRhdGEub3BhY2l0eS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vcGFjaXR5KSA6IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG59XHJcblxyXG5GaWxsLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgY29sb3IgPSB0aGlzLmNvbG9yLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkgPyB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgOiAxO1xyXG4gICAgcmV0dXJuICdyZ2JhKCcgKyBNYXRoLnJvdW5kKGNvbG9yWzBdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzFdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzJdKSArICcsICcgKyBvcGFjaXR5ICsgJyknO1xyXG59O1xyXG5cclxuRmlsbC5wcm90b3R5cGUuc2V0Q29sb3IgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcbiAgICB2YXIgY29sb3IgPSB0aGlzLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yO1xyXG59O1xyXG5cclxuRmlsbC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuY29sb3Iuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmNvbG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGw7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFN0cm9rZSA9IHJlcXVpcmUoJy4vU3Ryb2tlJyksXHJcbiAgICBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBSZWN0ID0gcmVxdWlyZSgnLi9SZWN0JyksXHJcbiAgICBFbGxpcHNlID0gcmVxdWlyZSgnLi9FbGxpcHNlJyksXHJcbiAgICBQb2x5c3RhciA9IHJlcXVpcmUoJy4vUG9seXN0YXInKSxcclxuICAgIEFuaW1hdGVkUGF0aCA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQYXRoJyksXHJcbiAgICBGaWxsID0gcmVxdWlyZSgnLi9GaWxsJyksXHJcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxyXG4gICAgTWVyZ2UgPSByZXF1aXJlKCcuL01lcmdlJyksXHJcbiAgICBUcmltID0gcmVxdWlyZSgnLi9UcmltJyk7XHJcblxyXG5mdW5jdGlvbiBHcm91cChkYXRhLCBidWZmZXJDdHgsIHBhcmVudEluLCBwYXJlbnRPdXQpIHtcclxuXHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuaW4gPSBkYXRhLmluID8gZGF0YS5pbiA6IHBhcmVudEluO1xyXG4gICAgdGhpcy5vdXQgPSBkYXRhLm91dCA/IGRhdGEub3V0IDogcGFyZW50T3V0O1xyXG5cclxuICAgIGlmIChkYXRhLmZpbGwpIHRoaXMuZmlsbCA9IG5ldyBGaWxsKGRhdGEuZmlsbCk7XHJcbiAgICBpZiAoZGF0YS5zdHJva2UpIHRoaXMuc3Ryb2tlID0gbmV3IFN0cm9rZShkYXRhLnN0cm9rZSk7XHJcbiAgICBpZiAoZGF0YS50cmltKSB0aGlzLnRyaW0gPSBuZXcgVHJpbShkYXRhLnRyaW0pO1xyXG4gICAgaWYgKGRhdGEubWVyZ2UpIHRoaXMubWVyZ2UgPSBuZXcgTWVyZ2UoZGF0YS5tZXJnZSk7XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKGRhdGEudHJhbnNmb3JtKTtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gYnVmZmVyQ3R4O1xyXG5cclxuICAgIGlmIChkYXRhLmdyb3Vwcykge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwcy5wdXNoKG5ldyBHcm91cChkYXRhLmdyb3Vwc1tpXSwgdGhpcy5idWZmZXJDdHgsIHRoaXMuaW4sIHRoaXMub3V0KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLnNoYXBlcykge1xyXG4gICAgICAgIHRoaXMuc2hhcGVzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkYXRhLnNoYXBlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB2YXIgc2hhcGUgPSBkYXRhLnNoYXBlc1tqXTtcclxuICAgICAgICAgICAgaWYgKHNoYXBlLnR5cGUgPT09ICdwYXRoJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlLmlzQW5pbWF0ZWQpIHRoaXMuc2hhcGVzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChzaGFwZSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzLnNoYXBlcy5wdXNoKG5ldyBQYXRoKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3JlY3QnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBSZWN0KHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2VsbGlwc2UnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBFbGxpcHNlKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3BvbHlzdGFyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgUG9seXN0YXIoc2hhcGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5tYXNrcykge1xyXG4gICAgICAgIHRoaXMubWFza3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRhdGEubWFza3MubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgdmFyIG1hc2sgPSBkYXRhLm1hc2tzW2tdO1xyXG4gICAgICAgICAgICBpZiAobWFzay5pc0FuaW1hdGVkKSB0aGlzLm1hc2tzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChtYXNrKSk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5tYXNrcy5wdXNoKG5ldyBQYXRoKG1hc2spKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbkdyb3VwLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgcGFyZW50RmlsbCwgcGFyZW50U3Ryb2tlLCBwYXJlbnRUcmltLCBpc0J1ZmZlcikge1xyXG5cclxuICAgIHZhciBpO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eC5zYXZlKCk7XHJcblxyXG4gICAgLy9UT0RPIGNoZWNrIGlmIGNvbG9yL3N0cm9rZSBpcyBjaGFuZ2luZyBvdmVyIHRpbWVcclxuICAgIHZhciBmaWxsID0gdGhpcy5maWxsIHx8IHBhcmVudEZpbGw7XHJcbiAgICB2YXIgc3Ryb2tlID0gdGhpcy5zdHJva2UgfHwgcGFyZW50U3Ryb2tlO1xyXG4gICAgdmFyIHRyaW1WYWx1ZXMgPSB0aGlzLnRyaW0gPyB0aGlzLnRyaW0uZ2V0VHJpbSh0aW1lKSA6IHBhcmVudFRyaW07XHJcblxyXG4gICAgaWYgKGZpbGwpIGZpbGwuc2V0Q29sb3IoY3R4LCB0aW1lKTtcclxuICAgIGlmIChzdHJva2UpIHN0cm9rZS5zZXRTdHJva2UoY3R4LCB0aW1lKTtcclxuXHJcbiAgICBpZiAoIWlzQnVmZmVyKSB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0oY3R4LCB0aW1lKTtcclxuICAgIHRoaXMudHJhbnNmb3JtLnRyYW5zZm9ybSh0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XHJcblxyXG4gICAgaWYgKHRoaXMubWVyZ2UpIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5zYXZlKCk7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMud2lkdGgsIHRoaXMuYnVmZmVyQ3R4LmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgaWYgKGZpbGwpIGZpbGwuc2V0Q29sb3IodGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG4gICAgICAgIGlmIChzdHJva2UpIHN0cm9rZS5zZXRTdHJva2UodGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm1hc2tzKSB7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm1hc2tzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFza3NbaV0uZHJhdyhjdHgsIHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjdHguY2xpcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgIGlmICh0aGlzLnNoYXBlcykge1xyXG4gICAgICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLmRyYXcodGhpcy5idWZmZXJDdHgsIHRpbWUsIHRyaW1WYWx1ZXMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlsbCkgdGhpcy5idWZmZXJDdHguZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0cm9rZSkgdGhpcy5idWZmZXJDdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubWVyZ2Uuc2V0Q29tcG9zaXRlT3BlcmF0aW9uKHRoaXMuYnVmZmVyQ3R4KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmJ1ZmZlckN0eC5jYW52YXMsIDAsIDApO1xyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLmRyYXcoY3R4LCB0aW1lLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zaGFwZXNbdGhpcy5zaGFwZXMubGVuZ3RoIC0gMV0uY2xvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICAvL2N0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL1RPRE8gZ2V0IG9yZGVyXHJcbiAgICBpZiAoZmlsbCkgY3R4LmZpbGwoKTtcclxuICAgIGlmICghaXNCdWZmZXIgJiYgc3Ryb2tlKSBjdHguc3Ryb2tlKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubWVyZ2UpIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyh0aGlzLmJ1ZmZlckN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmJ1ZmZlckN0eC5jYW52YXMsIDAsIDApO1xyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lID49IHRoaXMuZ3JvdXBzW2ldLmluICYmIHRpbWUgPCB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KGN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5Hcm91cC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnNldEtleWZyYW1lcyh0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2pdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZmlsbCkgdGhpcy5maWxsLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnN0cm9rZSkgdGhpcy5zdHJva2Uuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMudHJpbSkgdGhpcy50cmltLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkdyb3VwLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG5cclxuICAgIGlmICh0aGlzLnNoYXBlcykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNbal0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zdHJva2UpIHRoaXMuc3Ryb2tlLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnRyaW0pIHRoaXMudHJpbS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyk7XHJcblxyXG5mdW5jdGlvbiBJbWFnZUxheWVyKGRhdGEsIGJ1ZmZlckN0eCwgcGFyZW50SW4sIHBhcmVudE91dCwgYmFzZVBhdGgpIHtcclxuXHJcbiAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XHJcblxyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLnNvdXJjZSA9IGJhc2VQYXRoICsgZGF0YS5zb3VyY2U7XHJcblxyXG4gICAgdGhpcy5pbiA9IGRhdGEuaW4gPyBkYXRhLmluIDogcGFyZW50SW47XHJcbiAgICB0aGlzLm91dCA9IGRhdGEub3V0ID8gZGF0YS5vdXQgOiBwYXJlbnRPdXQ7XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKGRhdGEudHJhbnNmb3JtKTtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gYnVmZmVyQ3R4O1xyXG59XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5wcmVsb2FkID0gZnVuY3Rpb24gKGNiKSB7XHJcbiAgICB0aGlzLmltZyA9IG5ldyBJbWFnZTtcclxuICAgIHRoaXMuaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuaW1nLnNyYyA9IHRoaXMuc291cmNlO1xyXG59O1xyXG5cclxuSW1hZ2VMYXllci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuXHJcbiAgICBpZiAoIXRoaXMuaXNMb2FkZWQpIHJldHVybjtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcblxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCk7XHJcblxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZUxheWVyO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gTWVyZ2UoZGF0YSkge1xyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG59XHJcblxyXG5NZXJnZS5wcm90b3R5cGUuc2V0Q29tcG9zaXRlT3BlcmF0aW9uID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW91dCc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2UtaW4nO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDU6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAneG9yJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lcmdlO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEJlemllciA9IHJlcXVpcmUoJy4vQmV6aWVyJyk7XHJcblxyXG5mdW5jdGlvbiBQYXRoKGRhdGEpIHtcclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSBkYXRhLmNsb3NlZDtcclxuICAgIHRoaXMuZnJhbWVzID0gZGF0YS5mcmFtZXM7XHJcbiAgICB0aGlzLnZlcnRpY2VzQ291bnQgPSB0aGlzLmZyYW1lc1swXS52Lmxlbmd0aDtcclxufVxyXG5cclxuUGF0aC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuICAgIHZhciBmcmFtZSA9IHRoaXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgdmVydGljZXMgPSBmcmFtZS52O1xyXG5cclxuICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgaWYgKCh0cmltLnN0YXJ0ID09PSAwICYmIHRyaW0uZW5kID09PSAwKSB8fFxyXG4gICAgICAgICAgICAodHJpbS5zdGFydCA9PT0gMSAmJiB0cmltLmVuZCA9PT0gMSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRyaW0gPSB0aGlzLmdldFRyaW1WYWx1ZXModHJpbSwgZnJhbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBqID0gMTsgaiA8IHZlcnRpY2VzLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXh0VmVydGV4ID0gdmVydGljZXNbal0sXHJcbiAgICAgICAgICAgIGxhc3RWZXJ0ZXggPSB2ZXJ0aWNlc1tqIC0gMV07XHJcblxyXG4gICAgICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgICAgIHZhciB0djtcclxuXHJcbiAgICAgICAgICAgIGlmIChqID09PSAxICYmIHRyaW0uc3RhcnRJbmRleCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChqID09PSB0cmltLnN0YXJ0SW5kZXggKyAxICYmIGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCB0cmltLnN0YXJ0LCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgdHJpbS5zdGFydCwgMSwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA9PT0gdHJpbS5lbmRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIDAsIHRyaW0uZW5kLCBmcmFtZS5sZW5baiAtIDFdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChqID4gdHJpbS5zdGFydEluZGV4ICsgMSAmJiBqIDwgdHJpbS5lbmRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGogPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8obGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghdHJpbSAmJiB0aGlzLmNsb3NlZCkge1xyXG4gICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKG5leHRWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMV0sIHZlcnRpY2VzWzBdWzJdLCB2ZXJ0aWNlc1swXVszXSwgdmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgIH1cclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltLCBmcmFtZSkge1xyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgdmFyIGFjdHVhbFRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogMCxcclxuICAgICAgICBlbmRJbmRleDogMCxcclxuICAgICAgICBzdGFydDogMCxcclxuICAgICAgICBlbmQ6IDBcclxuICAgIH07XHJcblxyXG4vLyBUT0RPIGNsZWFuIHVwXHJcbiAgICBpZiAodHJpbS5zdGFydCA9PT0gMCkge1xyXG4gICAgICAgIGlmICh0cmltLmVuZCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBmcmFtZS5sZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdG90YWxMZW4gPSB0aGlzLnN1bUFycmF5KGZyYW1lLmxlbiksXHJcbiAgICAgICAgdHJpbUF0TGVuO1xyXG5cclxuICAgIHRyaW1BdExlbiA9IHRvdGFsTGVuICogdHJpbS5zdGFydDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRyaW1BdExlbiA+IDAgJiYgdHJpbUF0TGVuIDwgZnJhbWUubGVuW2ldKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnQgPSB0cmltQXRMZW4gLyBmcmFtZS5sZW5baV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGZyYW1lLmxlbi5sZW5ndGg7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmQgPSAxO1xyXG4gICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0cmltQXRMZW4gPSB0b3RhbExlbiAqIHRyaW0uZW5kO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0cmltQXRMZW4gPiAwICYmIHRyaW1BdExlbiA8IGZyYW1lLmxlbltpXSkge1xyXG4gICAgICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IHRyaW1BdExlbiAvIGZyYW1lLmxlbltpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cmltQXRMZW4gLT0gZnJhbWUubGVuW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnRyaW0gPSBmdW5jdGlvbiAobGFzdFZlcnRleCwgbmV4dFZlcnRleCwgZnJvbSwgdG8sIGxlbikge1xyXG5cclxuICAgIGlmIChmcm9tID09PSAwICYmIHRvID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhcnQ6IGxhc3RWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZDogbmV4dFZlcnRleFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaXNTdHJhaWdodChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKSkge1xyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzFdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzRdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIGZyb20pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgZW5kVmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsyXSwgbmV4dFZlcnRleFsyXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbmV4dFZlcnRleFs1XSwgdG8pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYmV6aWVyID0gbmV3IEJlemllcihbbGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XV0pO1xyXG4gICAgICAgIHRoaXMuYmV6aWVyLmdldExlbmd0aChsZW4pO1xyXG4gICAgICAgIGZyb20gPSB0aGlzLmJlemllci5tYXAoZnJvbSk7XHJcbiAgICAgICAgdG8gPSB0aGlzLmJlemllci5tYXAodG8pO1xyXG4gICAgICAgIHRvID0gKHRvIC0gZnJvbSkgLyAoMSAtIGZyb20pO1xyXG5cclxuICAgICAgICB2YXIgZTEsIGYxLCBnMSwgaDEsIGoxLCBrMSxcclxuICAgICAgICAgICAgZTIsIGYyLCBnMiwgaDIsIGoyLCBrMixcclxuICAgICAgICAgICAgc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZFZlcnRleDtcclxuXHJcbiAgICAgICAgZTEgPSBbdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbMF0sIGZyb20pLCB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFsxXSwgZnJvbSldO1xyXG4gICAgICAgIGYxID0gW3RoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSwgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbM10sIGZyb20pXTtcclxuICAgICAgICBnMSA9IFt0aGlzLmxlcnAobmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFs0XSwgZnJvbSksIHRoaXMubGVycChuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzVdLCBmcm9tKV07XHJcbiAgICAgICAgaDEgPSBbdGhpcy5sZXJwKGUxWzBdLCBmMVswXSwgZnJvbSksIHRoaXMubGVycChlMVsxXSwgZjFbMV0sIGZyb20pXTtcclxuICAgICAgICBqMSA9IFt0aGlzLmxlcnAoZjFbMF0sIGcxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGYxWzFdLCBnMVsxXSwgZnJvbSldO1xyXG4gICAgICAgIGsxID0gW3RoaXMubGVycChoMVswXSwgajFbMF0sIGZyb20pLCB0aGlzLmxlcnAoaDFbMV0sIGoxWzFdLCBmcm9tKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2oxWzBdLCBqMVsxXSwgaDFbMF0sIGgxWzFdLCBrMVswXSwgazFbMV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCBnMVswXSwgZzFbMV0sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV1dO1xyXG5cclxuICAgICAgICBlMiA9IFt0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzBdLCB0byksIHRoaXMubGVycChzdGFydFZlcnRleFs1XSwgc3RhcnRWZXJ0ZXhbMV0sIHRvKV07XHJcbiAgICAgICAgZjIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzBdLCBlbmRWZXJ0ZXhbMl0sIHRvKSwgdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzFdLCBlbmRWZXJ0ZXhbM10sIHRvKV07XHJcbiAgICAgICAgZzIgPSBbdGhpcy5sZXJwKGVuZFZlcnRleFsyXSwgZW5kVmVydGV4WzRdLCB0byksIHRoaXMubGVycChlbmRWZXJ0ZXhbM10sIGVuZFZlcnRleFs1XSwgdG8pXTtcclxuXHJcbiAgICAgICAgaDIgPSBbdGhpcy5sZXJwKGUyWzBdLCBmMlswXSwgdG8pLCB0aGlzLmxlcnAoZTJbMV0sIGYyWzFdLCB0byldO1xyXG4gICAgICAgIGoyID0gW3RoaXMubGVycChmMlswXSwgZzJbMF0sIHRvKSwgdGhpcy5sZXJwKGYyWzFdLCBnMlsxXSwgdG8pXTtcclxuICAgICAgICBrMiA9IFt0aGlzLmxlcnAoaDJbMF0sIGoyWzBdLCB0byksIHRoaXMubGVycChoMlsxXSwgajJbMV0sIHRvKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2UyWzBdLCBlMlsxXSwgc3RhcnRWZXJ0ZXhbMl0sIHN0YXJ0VmVydGV4WzNdLCBzdGFydFZlcnRleFs0XSwgc3RhcnRWZXJ0ZXhbNV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtqMlswXSwgajJbMV0sIGgyWzBdLCBoMlsxXSwgazJbMF0sIGsyWzFdXTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydDogc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgZW5kOiBlbmRWZXJ0ZXhcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHZhciBzID0gMSAtIHQ7XHJcbiAgICByZXR1cm4gYSAqIHMgKyBiICogdDtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnN1bUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xyXG4gICAgZnVuY3Rpb24gYWRkKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gYSArIGI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoYWRkKTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmlzU3RyYWlnaHQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGN0cmwxWCwgY3RybDFZLCBjdHJsMlgsIGN0cmwyWSwgZW5kWCwgZW5kWSkge1xyXG4gICAgcmV0dXJuIHN0YXJ0WCA9PT0gY3RybDFYICYmIHN0YXJ0WSA9PT0gY3RybDFZICYmIGVuZFggPT09IGN0cmwyWCAmJiBlbmRZID09PSBjdHJsMlk7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9seXN0YXIoZGF0YSkge1xyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7IC8vIFRPRE8gPz9cclxuXHJcbiAgICB0aGlzLnN0YXJUeXBlID0gZGF0YS5zdGFyVHlwZTtcclxuICAgIHRoaXMucG9pbnRzID0gZGF0YS5wb2ludHMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9pbnRzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvaW50cyk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzID0gZGF0YS5pbm5lclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cyk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gZGF0YS5vdXRlclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cyk7XHJcblxyXG4gICAgLy9vcHRpbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcyA9IGRhdGEuaW5uZXJSb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpO1xyXG4gICAgaWYgKGRhdGEub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MgPSBkYXRhLm91dGVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKTtcclxufVxyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IHRoaXMucG9pbnRzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIGlubmVyUmFkaXVzID0gdGhpcy5pbm5lclJhZGl1cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBvdXRlclJhZGl1cyA9IHRoaXMub3V0ZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcclxuICAgICAgICByb3RhdGlvbiA9IHRoaXMucm90YXRpb24gPyB0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBpbm5lclJvdW5kbmVzcyA9IHRoaXMuaW5uZXJSb3VuZG5lc3MgPyB0aGlzLmlubmVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBvdXRlclJvdW5kbmVzcyA9IHRoaXMub3V0ZXJSb3VuZG5lc3MgPyB0aGlzLm91dGVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMDtcclxuXHJcbiAgICByb3RhdGlvbiA9IHRoaXMuZGVnMnJhZChyb3RhdGlvbik7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBvdXRlclJhZGl1cywgcm90YXRpb24pO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSk7XHJcbiAgICBjdHgubW92ZVRvKHN0YXJ0WzBdLCBzdGFydFsxXSk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHM7IGkrKykge1xyXG5cclxuICAgICAgICB2YXIgcElubmVyLFxyXG4gICAgICAgICAgICBwT3V0ZXIsXHJcbiAgICAgICAgICAgIHBPdXRlcjFUYW5nZW50LFxyXG4gICAgICAgICAgICBwT3V0ZXIyVGFuZ2VudCxcclxuICAgICAgICAgICAgcElubmVyMVRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBJbm5lcjJUYW5nZW50LFxyXG4gICAgICAgICAgICBvdXRlck9mZnNldCxcclxuICAgICAgICAgICAgaW5uZXJPZmZzZXQsXHJcbiAgICAgICAgICAgIHJvdDtcclxuXHJcbiAgICAgICAgcm90ID0gTWF0aC5QSSAvIHBvaW50cyAqIDI7XHJcblxyXG4gICAgICAgIHBJbm5lciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBPdXRlciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIC8vRkl4TUVcclxuICAgICAgICBpZiAoIW91dGVyT2Zmc2V0KSBvdXRlck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBvdXRlclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xyXG4gICAgICAgIGlmICghaW5uZXJPZmZzZXQpIGlubmVyT2Zmc2V0ID0gKHN0YXJ0WzBdICsgcElubmVyWzBdKSAqIGlubmVyUm91bmRuZXNzIC8gMTAwICogLjU1MjI4NDg7XHJcblxyXG4gICAgICAgIHBPdXRlcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBvdXRlck9mZnNldCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogaSkgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcElubmVyMVRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIGlubmVyT2Zmc2V0ICogLTEsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwSW5uZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgaW5uZXJPZmZzZXQsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwT3V0ZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQgKiAtMSwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgIC8vc3RhclxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBJbm5lcjFUYW5nZW50WzBdLCBwSW5uZXIxVGFuZ2VudFsxXSwgcElubmVyWzBdLCBwSW5uZXJbMV0pO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vcG9seWdvblxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9kZWJ1Z1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXJbMF0sIHBJbm5lclsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyWzBdLCBwT3V0ZXJbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJyZWRcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiZ3JlZW5cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYnJvd25cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnJvdGF0ZVBvaW50ID0gZnVuY3Rpb24gKGN4LCBjeSwgeCwgeSwgcmFkaWFucykge1xyXG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxyXG4gICAgICAgIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpLFxyXG4gICAgICAgIG54ID0gKGNvcyAqICh4IC0gY3gpKSAtIChzaW4gKiAoeSAtIGN5KSkgKyBjeCxcclxuICAgICAgICBueSA9IChzaW4gKiAoeCAtIGN4KSkgKyAoY29zICogKHkgLSBjeSkpICsgY3k7XHJcbiAgICByZXR1cm4gW254LCBueV07XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMucG9pbnRzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMucG9pbnRzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlzdGFyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9zaXRpb24oZGF0YSkge1xyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eS5jYWxsKHRoaXMsIGRhdGEpO1xyXG59XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlKTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxuICAgIHRoaXMuc2V0TW90aW9uUGF0aCgpO1xyXG59O1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLm1vdGlvbnBhdGgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb3Rpb25wYXRoLmdldFZhbHVlcyh0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUuc2V0TW90aW9uUGF0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKSB7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoID0gbmV3IEJlemllcih0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKTtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGguZ2V0TGVuZ3RoKHRoaXMubGFzdEZyYW1lLmxlbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gUHJvcGVydHkoZGF0YSkge1xyXG4gICAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIG51bGw7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGE7XHJcbn1cclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmZyYW1lc1swXS52O1xyXG59O1xyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbn07XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUmVjdChkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcclxuXHJcbiAgICAvL29wdGlvbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3MgPSBkYXRhLnJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEucm91bmRuZXNzKTtcclxufVxyXG5cclxuUmVjdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdW5kbmVzcyA9IHRoaXMucm91bmRuZXNzID8gdGhpcy5yb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwO1xyXG5cclxuICAgIGlmIChzaXplWzBdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVswXSAvIDI7XHJcbiAgICBpZiAoc2l6ZVsxXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMV0gLyAyO1xyXG5cclxuICAgIHZhciB4ID0gcG9zaXRpb25bMF0gLSBzaXplWzBdIC8gMixcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0gLSBzaXplWzFdIC8gMjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0djtcclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG4gICAgICAgIC8vVE9ETyBhZGQgdHJpbVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdHgubW92ZVRvKHggKyByb3VuZG5lc3MsIHkpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSwgeCArIHNpemVbMF0sIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSArIHNpemVbMV0sIHgsIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4LCB5ICsgc2l6ZVsxXSwgeCwgeSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCwgeSwgeCArIHNpemVbMF0sIHksIHJvdW5kbmVzcyk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuUmVjdC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuc2l6ZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gU3Ryb2tlKGRhdGEpIHtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5qb2luID0gZGF0YS5qb2luO1xyXG4gICAgICAgIHRoaXMuY2FwID0gZGF0YS5jYXA7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEubWl0ZXJMaW1pdC5sZW5ndGggPiAxKSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY29sb3IubGVuZ3RoID4gMSkgdGhpcy5jb2xvciA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5jb2xvciA9IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEub3BhY2l0eS5sZW5ndGggPiAxKSB0aGlzLm9wYWNpdHkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5vcGFjaXR5ID0gbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLndpZHRoLmxlbmd0aCA+IDEpIHRoaXMud2lkdGggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLndpZHRoKTtcclxuICAgICAgICBlbHNlIHRoaXMud2lkdGggPSBuZXcgUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblN0cm9rZS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5vcGFjaXR5LmdldFZhbHVlKHRpbWUpO1xyXG4gICAgY29sb3JbMF0gPSBNYXRoLnJvdW5kKGNvbG9yWzBdKTtcclxuICAgIGNvbG9yWzFdID0gTWF0aC5yb3VuZChjb2xvclsxXSk7XHJcbiAgICBjb2xvclsyXSA9IE1hdGgucm91bmQoY29sb3JbMl0pO1xyXG4gICAgdmFyIHMgPSBjb2xvci5qb2luKCcsICcpO1xyXG5cclxuICAgIHJldHVybiAncmdiYSgnICsgcyArICcsICcgKyBvcGFjaXR5ICsgJyknO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5zZXRTdHJva2UgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcbiAgICB2YXIgc3Ryb2tlQ29sb3IgPSB0aGlzLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHN0cm9rZVdpZHRoID0gdGhpcy53aWR0aC5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBzdHJva2VKb2luID0gdGhpcy5qb2luO1xyXG4gICAgaWYgKHN0cm9rZUpvaW4gPT09ICdtaXRlcicpIHZhciBtaXRlckxpbWl0ID0gdGhpcy5taXRlckxpbWl0LmdldFZhbHVlKHRpbWUpO1xyXG5cclxuICAgIGN0eC5saW5lV2lkdGggPSBzdHJva2VXaWR0aDtcclxuICAgIGN0eC5saW5lSm9pbiA9IHN0cm9rZUpvaW47XHJcbiAgICBpZiAobWl0ZXJMaW1pdCkgY3R4Lm1pdGVyTGltaXQgPSBtaXRlckxpbWl0O1xyXG4gICAgY3R4LmxpbmVDYXAgPSB0aGlzLmNhcDtcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZUNvbG9yO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5jb2xvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy53aWR0aC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5taXRlckxpbWl0KSB0aGlzLm1pdGVyTGltaXQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5jb2xvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy53aWR0aC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5taXRlckxpbWl0KSB0aGlzLm1pdGVyTGltaXQucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdHJva2U7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpLFxyXG4gICAgUG9zaXRpb24gPSByZXF1aXJlKCcuL1Bvc2l0aW9uJyk7XHJcblxyXG5mdW5jdGlvbiBUcmFuc2Zvcm0oZGF0YSkge1xyXG4gICAgaWYgKCFkYXRhKSByZXR1cm47XHJcblxyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcblxyXG4gICAgaWYgKGRhdGEucG9zaXRpb25YICYmIGRhdGEucG9zaXRpb25ZKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb25YLmxlbmd0aCA+IDEgJiYgZGF0YS5wb3NpdGlvblkubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25YKTtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvblgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChkYXRhLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvc2l0aW9uKGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLmFuY2hvcikgdGhpcy5hbmNob3IgPSBkYXRhLmFuY2hvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5hbmNob3IpIDogbmV3IFByb3BlcnR5KGRhdGEuYW5jaG9yKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWCkgdGhpcy5zY2FsZVggPSBkYXRhLnNjYWxlWC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVgpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVYKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWSkgdGhpcy5zY2FsZVkgPSBkYXRhLnNjYWxlWS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVkpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVZKTtcclxuICAgIGlmIChkYXRhLnNrZXcpIHRoaXMuc2tldyA9IGRhdGEuc2tldy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXcpO1xyXG4gICAgaWYgKGRhdGEuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMgPSBkYXRhLnNrZXdBeGlzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvc2l0aW9uWCwgcG9zaXRpb25ZLFxyXG4gICAgICAgIGFuY2hvciA9IHRoaXMuYW5jaG9yID8gdGhpcy5hbmNob3IuZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLnJvdGF0aW9uID8gdGhpcy5kZWcycmFkKHRoaXMucm90YXRpb24uZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3ID0gdGhpcy5za2V3ID8gdGhpcy5kZWcycmFkKHRoaXMuc2tldy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNrZXdBeGlzID0gdGhpcy5za2V3QXhpcyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXdBeGlzLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2NhbGVYID0gdGhpcy5zY2FsZVggPyB0aGlzLnNjYWxlWC5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgc2NhbGVZID0gdGhpcy5zY2FsZVkgPyB0aGlzLnNjYWxlWS5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSAqIGN0eC5nbG9iYWxBbHBoYSA6IGN0eC5nbG9iYWxBbHBoYTsgLy8gRklYTUUgd3JvbmcgdHJhbnNwYXJlbmN5IGlmIG5lc3RlZFxyXG5cclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWCAmJiB0aGlzLnBvc2l0aW9uWSkge1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHRoaXMucG9zaXRpb25YLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHRoaXMucG9zaXRpb25ZLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lLCBjdHgpO1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHBvc2l0aW9uWzBdO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHBvc2l0aW9uWzFdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwb3NpdGlvblggPSAwO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coY3R4LCBwb3NpdGlvblgsIHBvc2l0aW9uWSwgYW5jaG9yLCByb3RhdGlvbiwgc2tldywgc2tld0F4aXMsIHNjYWxlWCwgc2NhbGVZLCBvcGFjaXR5KTtcclxuXHJcbiAgICAvL29yZGVyIHZlcnkgdmVyeSBpbXBvcnRhbnQgOilcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgMCwgMSwgcG9zaXRpb25YIC0gYW5jaG9yWzBdLCBwb3NpdGlvblkgLSBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIHJvdGF0aW9uLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICB0aGlzLnNldFNrZXcoY3R4LCBza2V3LCBza2V3QXhpcywgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRTY2FsZShjdHgsIHNjYWxlWCwgc2NhbGVZLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIChjdHgsIHJhZCwgeCwgeSkge1xyXG4gICAgdmFyIGMgPSBNYXRoLmNvcyhyYWQpO1xyXG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gICAgdmFyIGR4ID0geCAtIGMgKiB4ICsgcyAqIHk7XHJcbiAgICB2YXIgZHkgPSB5IC0gcyAqIHggLSBjICogeTtcclxuICAgIGN0eC50cmFuc2Zvcm0oYywgcywgLXMsIGMsIGR4LCBkeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24gKGN0eCwgc3gsIHN5LCB4LCB5KSB7XHJcbiAgICBjdHgudHJhbnNmb3JtKHN4LCAwLCAwLCBzeSwgLXggKiBzeCArIHgsIC15ICogc3kgKyB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0U2tldyA9IGZ1bmN0aW9uIChjdHgsIHNrZXcsIGF4aXMsIHgsIHkpIHtcclxuICAgIHZhciB0ID0gTWF0aC50YW4oLXNrZXcpO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIC1heGlzLCB4LCB5KTtcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgdCwgMSwgLXkgKiB0LCAwKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCBheGlzLCB4LCB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBUcmltKGRhdGEpIHtcclxuXHJcbiAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGU7XHJcblxyXG4gICAgaWYgKGRhdGEuc3RhcnQpIHRoaXMuc3RhcnQgPSBkYXRhLnN0YXJ0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnN0YXJ0KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnN0YXJ0KTtcclxuICAgIGlmIChkYXRhLmVuZCkgdGhpcy5lbmQgPSBkYXRhLmVuZC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5lbmQpIDogbmV3IFByb3BlcnR5KGRhdGEuZW5kKTtcclxuICAgIC8vaWYgKGRhdGEub2Zmc2V0KSB0aGlzLm9mZnNldCA9IGRhdGEub2Zmc2V0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9mZnNldCkgOiBuZXcgUHJvcGVydHkoZGF0YS5vZmZzZXQpO1xyXG5cclxufVxyXG5cclxuVHJpbS5wcm90b3R5cGUuZ2V0VHJpbSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnN0YXJ0ID8gdGhpcy5zdGFydC5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgZW5kID0gdGhpcy5lbmQgPyB0aGlzLmVuZC5nZXRWYWx1ZSh0aW1lKSA6IDE7XHJcblxyXG4gICAgdmFyIHRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnQ6IE1hdGgubWluKHN0YXJ0LCBlbmQpLFxyXG4gICAgICAgIGVuZDogTWF0aC5tYXgoc3RhcnQsIGVuZClcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDAgJiYgdHJpbS5lbmQgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRyaW07XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcblRyaW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydCkgdGhpcy5zdGFydC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5lbmQpIHRoaXMuZW5kLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIC8vaWYgKHRoaXMub2Zmc2V0KSB0aGlzLm9mZnNldC5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmltO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiJdfQ==
