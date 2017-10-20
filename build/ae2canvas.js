(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AE2Canvas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"D:\\Code\\ae2canvas\\src\\runtime\\AE2Canvas.js":[function(_dereq_,module,exports){
'use strict';

var Group = _dereq_('./Group'),
    ImageLayer = _dereq_('./ImageLayer');

var _animations = [],
    _animationsLength = 0;

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
    this.devicePixelRatio = options.devicePixelRatio || window && window.devicePixelRatio ? window.devicePixelRatio : 1;
    this.fluid = options.fluid || true;
    this.reversed = options.reversed || false;
    this.imageBasePath = options.imageBasePath || '';
    this.onUpdate = options.onUpdate || function () {
        };
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
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\GradientFill.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function GradientFill(data) {
    this.colors = data.colors;
    this.type = data.type;
    this.startPoint = data.startPoint.length > 1 ? new AnimatedProperty(data.startPoint) : new Property(data.startPoint);
    this.endPoint = data.endPoint.length > 1 ? new AnimatedProperty(data.endPoint) : new Property(data.endPoint);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity);
}

GradientFill.prototype.setColor = function (ctx, time, transform) {

    var positionX = 0;
    var positionY = 0;

    if (transform.position) {
        var position = transform.position.getValue(time, ctx);
        positionX = position[0];
        positionY = position[1];
    } else {
        positionX = transform.positionX ? transform.positionX.getValue(time) : 0;
        positionY = transform.positionY ? transform.positionY.getValue(time) : 0;
    }

    var startPoint = this.startPoint.getValue(time);
    var endPoint = this.endPoint.getValue(time);

    var startX = startPoint[0] - positionX;
    var startY = startPoint[1] - positionY;
    var endX = endPoint[0] - positionX;
    var endY = endPoint[1] - positionY;

    var radius = 0;

    if (this.type === 'radial') {
        var distX = startX - endX;
        var distY = startY - endY;
        radius = Math.sqrt(distX * distX + distY * distY);
    }

    var gradient = this.type === 'radial' ?
        ctx.createRadialGradient(startX, startY, 0, startX, startY, radius) :
        ctx.createLinearGradient(startX, startY, endX, endY);

    var opacity = this.opacity ? this.opacity.getValue(time) : 1;

    gradient.addColorStop(0, 'rgba(' + this.colors[0][0] + ', ' + this.colors[0][1] + ', ' + this.colors[0][2] + ', ' + this.colors[0][3] * opacity + ')');
    gradient.addColorStop(1, 'rgba(' + this.colors[1][0] + ', ' + this.colors[1][1] + ', ' + this.colors[1][2] + ', ' + this.colors[1][3] * opacity + ')');
    ctx.fillStyle = gradient;
};

GradientFill.prototype.setKeyframes = function (time) {
    if (this.opacity) this.opacity.setKeyframes(time);
    this.startPoint.setKeyframes(time);
    this.endPoint.setKeyframes(time);
};

GradientFill.prototype.reset = function (reversed) {
    if (this.opacity) this.opacity.setKeyframes(reversed);
    this.startPoint.setKeyframes(reversed);
    this.endPoint.setKeyframes(reversed);
};

module.exports = GradientFill;
},{"./AnimatedProperty":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"D:\\Code\\ae2canvas\\src\\runtime\\Property.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Group.js":[function(_dereq_,module,exports){
'use strict';

var Stroke = _dereq_('./Stroke'),
    Path = _dereq_('./Path'),
    Rect = _dereq_('./Rect'),
    Ellipse = _dereq_('./Ellipse'),
    Polystar = _dereq_('./Polystar'),
    AnimatedPath = _dereq_('./AnimatedPath'),
    Fill = _dereq_('./Fill'),
    GradientFill = _dereq_('./GradientFill'),
    Transform = _dereq_('./Transform'),
    Merge = _dereq_('./Merge'),
    Trim = _dereq_('./Trim');

function Group(data, bufferCtx, parentIn, parentOut) {

    //this.name = data.name;
    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

    if (data.fill) this.fill = new Fill(data.fill);
    if (data.gradientFill) this.fill = new GradientFill(data.gradientFill);
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

    if (fill) fill.setColor(ctx, time, this.transform);
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
                if (time >= this.groups[i].in && time <= this.groups[i].out) {
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
                if (time >= this.groups[i].in && time <= this.groups[i].out) {
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


























},{"./AnimatedPath":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedPath.js","./Ellipse":"D:\\Code\\ae2canvas\\src\\runtime\\Ellipse.js","./Fill":"D:\\Code\\ae2canvas\\src\\runtime\\Fill.js","./GradientFill":"D:\\Code\\ae2canvas\\src\\runtime\\GradientFill.js","./Merge":"D:\\Code\\ae2canvas\\src\\runtime\\Merge.js","./Path":"D:\\Code\\ae2canvas\\src\\runtime\\Path.js","./Polystar":"D:\\Code\\ae2canvas\\src\\runtime\\Polystar.js","./Rect":"D:\\Code\\ae2canvas\\src\\runtime\\Rect.js","./Stroke":"D:\\Code\\ae2canvas\\src\\runtime\\Stroke.js","./Transform":"D:\\Code\\ae2canvas\\src\\runtime\\Transform.js","./Trim":"D:\\Code\\ae2canvas\\src\\runtime\\Trim.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\ImageLayer.js":[function(_dereq_,module,exports){
'use strict';

var Transform = _dereq_('./Transform');
var Path = _dereq_('./Path');
var AnimatedPath = _dereq_('./AnimatedPath');

function ImageLayer(data, bufferCtx, parentIn, parentOut, basePath) {

    this.isLoaded = false;

    //this.name = data.name;
    this.source = basePath + data.source;

    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

    this.transform = new Transform(data.transform);
    this.bufferCtx = bufferCtx;

    if (data.masks) {
        this.masks = [];
        for (var k = 0; k < data.masks.length; k++) {
            var mask = data.masks[k];
            if (mask.isAnimated) this.masks.push(new AnimatedPath(mask));
            else this.masks.push(new Path(mask));
        }
    }
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

    if (this.masks) {
        ctx.beginPath();
        for (var i = 0; i < this.masks.length; i++) {
            this.masks[i].draw(ctx, time);
        }
        ctx.clip();
    }

    ctx.drawImage(this.img, 0, 0);

    ctx.restore();
};

ImageLayer.prototype.setKeyframes = function (time) {
    this.transform.setKeyframes(time);
    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].setKeyframes(time);
        }
    }
};

ImageLayer.prototype.reset = function (reversed) {
    this.transform.reset(reversed);

    if (this.masks) {
        for (var j = 0; j < this.masks.length; j++) {
            this.masks[j].reset(reversed);
        }
    }
};

module.exports = ImageLayer;


























},{"./AnimatedPath":"D:\\Code\\ae2canvas\\src\\runtime\\AnimatedPath.js","./Path":"D:\\Code\\ae2canvas\\src\\runtime\\Path.js","./Transform":"D:\\Code\\ae2canvas\\src\\runtime\\Transform.js"}],"D:\\Code\\ae2canvas\\src\\runtime\\Merge.js":[function(_dereq_,module,exports){
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
        if (!nextVertex) debugger;
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

        if (data.dashes) {
            this.dashes = {};

            if (data.dashes.dash.length > 1) this.dashes.dash = new AnimatedProperty(data.dashes.dash);
            else this.dashes.dash = new Property(data.dashes.dash);

            if (data.dashes.gap.length > 1) this.dashes.gap = new AnimatedProperty(data.dashes.gap);
            else this.dashes.gap = new Property(data.dashes.gap);

            if (data.dashes.offset.length > 1) this.dashes.offset = new AnimatedProperty(data.dashes.offset);
            else this.dashes.offset = new Property(data.dashes.offset);
        }
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

    if (this.dashes) {
        ctx.setLineDash([
            this.dashes.dash.getValue(time),
            this.dashes.gap.getValue(time)
        ]);
        ctx.lineDashOffset = this.dashes.offset.getValue(time);
    }
};

Stroke.prototype.setKeyframes = function (time) {
    this.color.setKeyframes(time);
    this.opacity.setKeyframes(time);
    this.width.setKeyframes(time);
    if (this.miterLimit) this.miterLimit.setKeyframes(time);
    if (this.dashes) {
        this.dashes.dash.setKeyframes(time);
        this.dashes.gap.setKeyframes(time);
        this.dashes.offset.setKeyframes(time);
    }
};

Stroke.prototype.reset = function (reversed) {
    this.color.reset(reversed);
    this.opacity.reset(reversed);
    this.width.reset(reversed);
    if (this.miterLimit) this.miterLimit.reset(reversed);
    if (this.dashes) {
        this.dashes.dash.reset(reversed);
        this.dashes.gap.reset(reversed);
        this.dashes.offset.reset(reversed);
    }
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

    if (data.position) {
        if (data.position.length > 1) {
            this.position = new Position(data.position);
        } else {
            this.position = new Property(data.position);
        }
    }

    if (data.positionX) this.positionX = data.positionX.length > 1 ? new AnimatedProperty(data.positionX) : new Property(data.positionX);
    if (data.positionY) this.positionY = data.positionY.length > 1 ? new AnimatedProperty(data.positionY) : new Property(data.positionY);
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

    if (this.position) {
        var position = this.position.getValue(time, ctx);
        positionX = position[0];
        positionY = position[1];
    } else {
        positionX = this.positionX ? this.positionX.getValue(time) : 0;
        positionY = this.positionY ? this.positionY.getValue(time) : 0;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9HcmFkaWVudEZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL0ltYWdlTGF5ZXIuanMiLCJzcmMvcnVudGltZS9NZXJnZS5qcyIsInNyYy9ydW50aW1lL1BhdGguanMiLCJzcmMvcnVudGltZS9Qb2x5c3Rhci5qcyIsInNyYy9ydW50aW1lL1Bvc2l0aW9uLmpzIiwic3JjL3J1bnRpbWUvUHJvcGVydHkuanMiLCJzcmMvcnVudGltZS9SZWN0LmpzIiwic3JjL3J1bnRpbWUvU3Ryb2tlLmpzIiwic3JjL3J1bnRpbWUvVHJhbnNmb3JtLmpzIiwic3JjL3J1bnRpbWUvVHJpbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgR3JvdXAgPSByZXF1aXJlKCcuL0dyb3VwJyksXHJcbiAgICBJbWFnZUxheWVyID0gcmVxdWlyZSgnLi9JbWFnZUxheWVyJyk7XHJcblxyXG52YXIgX2FuaW1hdGlvbnMgPSBbXSxcclxuICAgIF9hbmltYXRpb25zTGVuZ3RoID0gMDtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGlvbihvcHRpb25zKSB7XHJcbiAgICBpZiAoIW9wdGlvbnMuZGF0YSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ25vIGRhdGEnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgIHRoaXMuZHVyYXRpb24gPSBvcHRpb25zLmRhdGEuZHVyYXRpb247XHJcbiAgICB0aGlzLmJhc2VXaWR0aCA9IG9wdGlvbnMuZGF0YS53aWR0aDtcclxuICAgIHRoaXMuYmFzZUhlaWdodCA9IG9wdGlvbnMuZGF0YS5oZWlnaHQ7XHJcbiAgICB0aGlzLnJhdGlvID0gb3B0aW9ucy5kYXRhLndpZHRoIC8gb3B0aW9ucy5kYXRhLmhlaWdodDtcclxuXHJcbiAgICB0aGlzLm1hcmtlcnMgPSBvcHRpb25zLmRhdGEubWFya2VycztcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5sb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5kZXZpY2VQaXhlbFJhdGlvID0gb3B0aW9ucy5kZXZpY2VQaXhlbFJhdGlvIHx8IHdpbmRvdyAmJiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA/IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIDogMTtcclxuICAgIHRoaXMuZmx1aWQgPSBvcHRpb25zLmZsdWlkIHx8IHRydWU7XHJcbiAgICB0aGlzLnJldmVyc2VkID0gb3B0aW9ucy5yZXZlcnNlZCB8fCBmYWxzZTtcclxuICAgIHRoaXMuaW1hZ2VCYXNlUGF0aCA9IG9wdGlvbnMuaW1hZ2VCYXNlUGF0aCB8fCAnJztcclxuICAgIHRoaXMub25VcGRhdGUgPSBvcHRpb25zLm9uVXBkYXRlIHx8IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB9O1xyXG4gICAgdGhpcy5vbkNvbXBsZXRlID0gb3B0aW9ucy5vbkNvbXBsZXRlIHx8IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmJhc2VXaWR0aDtcclxuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcclxuXHJcbiAgICB0aGlzLmJ1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5idWZmZXIud2lkdGggPSB0aGlzLmJhc2VXaWR0aDtcclxuICAgIHRoaXMuYnVmZmVyLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gdGhpcy5idWZmZXIuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICB0aGlzLmxheWVycyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmRhdGEubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0udHlwZSA9PT0gJ3ZlY3RvcicpIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnMucHVzaChuZXcgR3JvdXAob3B0aW9ucy5kYXRhLmxheWVyc1tpXSwgdGhpcy5idWZmZXJDdHgsIDAsIHRoaXMuZHVyYXRpb24pKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0udHlwZSA9PT0gJ2ltYWdlJykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVycy5wdXNoKG5ldyBJbWFnZUxheWVyKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0sIHRoaXMuYnVmZmVyQ3R4LCAwLCB0aGlzLmR1cmF0aW9uLCB0aGlzLmltYWdlQmFzZVBhdGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLm51bUxheWVycyA9IHRoaXMubGF5ZXJzLmxlbmd0aDtcclxuXHJcbiAgICB0aGlzLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5yZXNpemUoKTtcclxuXHJcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG5cclxuICAgIF9hbmltYXRpb25zLnB1c2godGhpcyk7XHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IF9hbmltYXRpb25zLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0aW9uLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBwbGF5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzUGxheWluZykge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNQYXVzZWQpIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSB0aGlzLmNvbXBUaW1lO1xyXG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ290b0FuZFBsYXk6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLmdldE1hcmtlcihpZCk7XHJcbiAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gbWFya2VyLnRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnb3RvQW5kU3RvcDogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMuZ2V0TWFya2VyKGlkKTtcclxuICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcclxuICAgICAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE1hcmtlcjogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpZF07XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXJrZXJzW2ldLmNvbW1lbnQgPT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oJ01hcmtlciBub3QgZm91bmQnKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tTdG9wTWFya2VyczogZnVuY3Rpb24gKGZyb20sIHRvKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWFya2Vyc1tpXS5zdG9wICYmIHRoaXMubWFya2Vyc1tpXS50aW1lID4gZnJvbSAmJiB0aGlzLm1hcmtlcnNbaV0udGltZSA8IHRvKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0U3RlcDogZnVuY3Rpb24gKHN0ZXApIHtcclxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY29tcFRpbWUgPSBzdGVwICogdGhpcy5kdXJhdGlvbjtcclxuICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSB0aGlzLmNvbXBUaW1lO1xyXG4gICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0U3RlcDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBUaW1lIC8gdGhpcy5kdXJhdGlvbjtcclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIGlmICghdGhpcy50aGVuKSB0aGlzLnRoZW4gPSB0aW1lO1xyXG5cclxuICAgICAgICB2YXIgZGVsdGEgPSB0aW1lIC0gdGhpcy50aGVuO1xyXG4gICAgICAgIHRoaXMudGhlbiA9IHRpbWU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzUGxheWluZykge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuY29tcFRpbWUgLSBkZWx0YSA6IHRoaXMuY29tcFRpbWUgKyBkZWx0YTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdG9wTWFya2VyID0gdGhpcy5jaGVja1N0b3BNYXJrZXJzKHRoaXMuY29tcFRpbWUgLSBkZWx0YSwgdGhpcy5jb21wVGltZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wVGltZSA+IHRoaXMuZHVyYXRpb24gfHwgdGhpcy5yZXZlcnNlZCAmJiB0aGlzLmNvbXBUaW1lIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyAwIDogdGhpcy5kdXJhdGlvbiAtIDE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RvcE1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHN0b3BNYXJrZXIudGltZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhdyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9uVXBkYXRlKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRyYXdGcmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMub25VcGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRyYXc6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuYmFzZVdpZHRoLCB0aGlzLmJhc2VIZWlnaHQpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1MYXllcnM7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmxheWVyc1tpXS5pbiAmJiB0aW1lIDw9IHRoaXMubGF5ZXJzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uZHJhdyh0aGlzLmN0eCwgdGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uIChjYikge1xyXG4gICAgICAgIHRoaXMub25sb2FkQ0IgPSBjYjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldIGluc3RhbmNlb2YgSW1hZ2VMYXllcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ucHJlbG9hZCh0aGlzLm9ubG9hZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgb25sb2FkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxheWVyc1tpXSBpbnN0YW5jZW9mIEltYWdlTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sYXllcnNbaV0uaXNMb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9ubG9hZENCID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25sb2FkQ0IoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuZHVyYXRpb24gOiAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1MYXllcnM7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNldEtleWZyYW1lczogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbnVsbDtcclxuICAgICAgICB2YXIgaSA9IF9hbmltYXRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgaWYgKGkgPiAtMSkge1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9ucy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zTGVuZ3RoID0gX2FuaW1hdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jYW52YXMucGFyZW50Tm9kZSkgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2l6ZTogZnVuY3Rpb24gKHcpIHtcclxuICAgICAgICBpZiAodGhpcy5mbHVpZCkge1xyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSB3IHx8IHRoaXMuY2FudmFzLmNsaWVudFdpZHRoIHx8IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aWR0aCAvIHRoaXMucmF0aW8gKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcblxyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlci53aWR0aCA9IHdpZHRoICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlci5oZWlnaHQgPSB3aWR0aCAvIHRoaXMucmF0aW8gKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNjYWxlID0gd2lkdGggLyB0aGlzLmJhc2VXaWR0aCAqIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgdGhpcy5jdHgudHJhbnNmb3JtKHRoaXMuc2NhbGUsIDAsIDAsIHRoaXMuc2NhbGUsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC50cmFuc2Zvcm0odGhpcy5zY2FsZSwgMCwgMCwgdGhpcy5zY2FsZSwgMCwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXQgcmV2ZXJzZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2VkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXQgcmV2ZXJzZWQoYm9vbCkge1xyXG4gICAgICAgIHRoaXMuX3JldmVyc2VkID0gYm9vbDtcclxuICAgICAgICBpZiAodGhpcy5wYXVzZWRUaW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnBhdXNlZFRpbWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICBBbmltYXRpb246IEFuaW1hdGlvbixcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgdGltZSA9IHRpbWUgIT09IHVuZGVmaW5lZCA/IHRpbWUgOiBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfYW5pbWF0aW9uc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zW2ldLnVwZGF0ZSh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4vQmV6aWVyRWFzaW5nJyk7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRlZFBhdGgoZGF0YSkge1xyXG4gICAgUGF0aC5jYWxsKHRoaXMsIGRhdGEpO1xyXG4gICAgdGhpcy5mcmFtZUNvdW50ID0gdGhpcy5mcmFtZXMubGVuZ3RoO1xyXG59XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXRoLnByb3RvdHlwZSk7XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLmZpbmlzaGVkICYmIHRpbWUgPj0gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZTtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCAmJiB0aW1lIDw9IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXN0RnJhbWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyICsgMSA9PT0gdGhpcy5mcmFtZUNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyIDwgMikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXItLTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZUF0VGltZSh0aW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aW1lID4gdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5mcmFtZUNvdW50OyBpKyspIHtcclxuICAgICAgICBpZiAodGltZSA+PSB0aGlzLmZyYW1lc1tpIC0gMV0udCAmJiB0aW1lIDw9IHRoaXMuZnJhbWVzW2ldKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9pbnRlciA9IGk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbaSAtIDFdO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xyXG4gICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuc2V0RWFzaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMubGFzdEZyYW1lLmVhc2VPdXQgJiYgdGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBuZXcgQmV6aWVyRWFzaW5nKHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMF0sIHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMV0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblswXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzFdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAoIHRpbWUgLSB0aGlzLmxhc3RGcmFtZS50ICk7XHJcbiAgICB2YXIgZHVyYXRpb24gPSB0aGlzLm5leHRGcmFtZS50IC0gdGhpcy5sYXN0RnJhbWUudDtcclxuICAgIHZhciBlbGFwc2VkID0gZGVsdGEgLyBkdXJhdGlvbjtcclxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XHJcbiAgICBlbHNlIGlmIChlbGFwc2VkIDwgMCkgZWxhcHNlZCA9IDA7XHJcbiAgICBlbHNlIGlmICh0aGlzLmVhc2luZykgZWxhcHNlZCA9IHRoaXMuZWFzaW5nKGVsYXBzZWQpO1xyXG4gICAgdmFyIGFjdHVhbFZlcnRpY2VzID0gW10sXHJcbiAgICAgICAgYWN0dWFsTGVuZ3RoID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzQ291bnQ7IGkrKykge1xyXG4gICAgICAgIHZhciBjcDF4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMF0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDF5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMV0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMV0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDJ4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMl0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMl0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDJ5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bM10sIHRoaXMubmV4dEZyYW1lLnZbaV1bM10sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICB4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bNF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bNF0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICB5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bNV0sIHRoaXMubmV4dEZyYW1lLnZbaV1bNV0sIGVsYXBzZWQpO1xyXG5cclxuICAgICAgICBhY3R1YWxWZXJ0aWNlcy5wdXNoKFtjcDF4LCBjcDF5LCBjcDJ4LCBjcDJ5LCB4LCB5XSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnZlcnRpY2VzQ291bnQgLSAxOyBqKyspIHtcclxuICAgICAgICBhY3R1YWxMZW5ndGgucHVzaCh0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUubGVuW2pdLCB0aGlzLm5leHRGcmFtZS5sZW5bal0sIGVsYXBzZWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHYgIDogYWN0dWFsVmVydGljZXMsXHJcbiAgICAgICAgbGVuOiBhY3R1YWxMZW5ndGhcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5wb2ludGVyID0gcmV2ZXJzZWQgPyB0aGlzLmZyYW1lQ291bnQgLSAxIDogMTtcclxuICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0ZWRQYXRoO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQmV6aWVyRWFzaW5nID0gcmVxdWlyZSgnLi9CZXppZXJFYXNpbmcnKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkUHJvcGVydHkoZGF0YSkge1xyXG4gICAgUHJvcGVydHkuY2FsbCh0aGlzLCBkYXRhKTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFByb3BlcnR5LnByb3RvdHlwZSk7XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICB2YXIgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFycltpXSA9IGFbaV0gKyB0ICogKGJbaV0gLSBhW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEVhc2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLm5leHRGcmFtZS5lYXNlSW4pIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG5ldyBCZXppZXJFYXNpbmcodGhpcy5sYXN0RnJhbWUuZWFzZU91dFswXSwgdGhpcy5sYXN0RnJhbWUuZWFzZU91dFsxXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzBdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCAmJiB0aW1lID49IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0RnJhbWUudjtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCAmJiB0aW1lIDw9IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXN0RnJhbWUudjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRpbWUgPiB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgKyAxID09PSB0aGlzLmZyYW1lQ291bnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRpbWUgPCB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgPCAyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlci0tO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlQXRUaW1lKHRpbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIC8vY29uc29sZS5sb2codGltZSwgdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMl0udCwgdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCk7XHJcblxyXG4gICAgaWYgKHRpbWUgPCB0aGlzLmZyYW1lc1swXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRpbWUgPiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gdGhpcy5mcmFtZUNvdW50IC0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICAgIGlmICh0aW1lID49IHRoaXMuZnJhbWVzW2kgLSAxXS50ICYmIHRpbWUgPD0gdGhpcy5mcmFtZXNbaV0udCkge1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXIgPSBpO1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW2kgLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldEVsYXBzZWQgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5sYXN0RnJhbWUudCApLFxyXG4gICAgICAgIGR1cmF0aW9uID0gdGhpcy5uZXh0RnJhbWUudCAtIHRoaXMubGFzdEZyYW1lLnQsXHJcbiAgICAgICAgZWxhcHNlZCA9IGRlbHRhIC8gZHVyYXRpb247XHJcblxyXG4gICAgaWYgKGVsYXBzZWQgPiAxKSBlbGFwc2VkID0gMTtcclxuICAgIGVsc2UgaWYgKGVsYXBzZWQgPCAwKSBlbGFwc2VkID0gMDtcclxuICAgIGVsc2UgaWYgKHRoaXMuZWFzaW5nKSBlbGFwc2VkID0gdGhpcy5lYXNpbmcoZWxhcHNlZCk7XHJcbiAgICByZXR1cm4gZWxhcHNlZDtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHJldHVybiB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudiwgdGhpcy5uZXh0RnJhbWUudiwgdGhpcy5nZXRFbGFwc2VkKHRpbWUpKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMucG9pbnRlciA9IHJldmVyc2VkID8gdGhpcy5mcmFtZUNvdW50IC0gMSA6IDE7XHJcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGVkUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gQmV6aWVyKHBhdGgpIHtcclxuICAgIHRoaXMucGF0aCA9IHBhdGg7XHJcbn1cclxuXHJcbkJlemllci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xyXG4gICAgdGhpcy5zdGVwcyA9IE1hdGgubWF4KE1hdGguZmxvb3IobGVuIC8gMTApLCAxKTtcclxuICAgIHRoaXMuYXJjTGVuZ3RocyA9IG5ldyBBcnJheSh0aGlzLnN0ZXBzICsgMSk7XHJcbiAgICB0aGlzLmFyY0xlbmd0aHNbMF0gPSAwO1xyXG5cclxuICAgIHZhciBveCA9IHRoaXMuY3ViaWNOKDAsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgb3kgPSB0aGlzLmN1YmljTigwLCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pLFxyXG4gICAgICAgIGNsZW4gPSAwLFxyXG4gICAgICAgIGl0ZXJhdG9yID0gMSAvIHRoaXMuc3RlcHM7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gdGhpcy5zdGVwczsgaSArPSAxKSB7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLmN1YmljTihpICogaXRlcmF0b3IsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgICAgIHkgPSB0aGlzLmN1YmljTihpICogaXRlcmF0b3IsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSk7XHJcblxyXG4gICAgICAgIHZhciBkeCA9IG94IC0geCxcclxuICAgICAgICAgICAgZHkgPSBveSAtIHk7XHJcblxyXG4gICAgICAgIGNsZW4gKz0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcclxuICAgICAgICB0aGlzLmFyY0xlbmd0aHNbaV0gPSBjbGVuO1xyXG5cclxuICAgICAgICBveCA9IHg7XHJcbiAgICAgICAgb3kgPSB5O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubGVuZ3RoID0gY2xlbjtcclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKHUpIHtcclxuICAgIHZhciB0YXJnZXRMZW5ndGggPSB1ICogdGhpcy5hcmNMZW5ndGhzW3RoaXMuc3RlcHNdO1xyXG4gICAgdmFyIGxvdyA9IDAsXHJcbiAgICAgICAgaGlnaCA9IHRoaXMuc3RlcHMsXHJcbiAgICAgICAgaW5kZXggPSAwO1xyXG5cclxuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XHJcbiAgICAgICAgaW5kZXggPSBsb3cgKyAoKChoaWdoIC0gbG93KSAvIDIpIHwgMCk7XHJcbiAgICAgICAgaWYgKHRoaXMuYXJjTGVuZ3Roc1tpbmRleF0gPCB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICAgICAgbG93ID0gaW5kZXggKyAxO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoaWdoID0gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuYXJjTGVuZ3Roc1tpbmRleF0gPiB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICBpbmRleC0tO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsZW5ndGhCZWZvcmUgPSB0aGlzLmFyY0xlbmd0aHNbaW5kZXhdO1xyXG4gICAgaWYgKGxlbmd0aEJlZm9yZSA9PT0gdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4IC8gdGhpcy5zdGVwcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIChpbmRleCArICh0YXJnZXRMZW5ndGggLSBsZW5ndGhCZWZvcmUpIC8gKHRoaXMuYXJjTGVuZ3Roc1tpbmRleCArIDFdIC0gbGVuZ3RoQmVmb3JlKSkgLyB0aGlzLnN0ZXBzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5nZXRWYWx1ZXMgPSBmdW5jdGlvbiAoZWxhcHNlZCkge1xyXG4gICAgdmFyIHQgPSB0aGlzLm1hcChlbGFwc2VkKSxcclxuICAgICAgICB4ID0gdGhpcy5jdWJpY04odCwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcclxuICAgICAgICB5ID0gdGhpcy5jdWJpY04odCwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKTtcclxuXHJcbiAgICByZXR1cm4gW3gsIHldO1xyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5jdWJpY04gPSBmdW5jdGlvbiAocGN0LCBhLCBiLCBjLCBkKSB7XHJcbiAgICB2YXIgdDIgPSBwY3QgKiBwY3Q7XHJcbiAgICB2YXIgdDMgPSB0MiAqIHBjdDtcclxuICAgIHJldHVybiBhICsgKC1hICogMyArIHBjdCAqICgzICogYSAtIGEgKiBwY3QpKSAqIHBjdFxyXG4gICAgICAgICsgKDMgKiBiICsgcGN0ICogKC02ICogYiArIGIgKiAzICogcGN0KSkgKiBwY3RcclxuICAgICAgICArIChjICogMyAtIGMgKiAzICogcGN0KSAqIHQyXHJcbiAgICAgICAgKyBkICogdDM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJlemllcjsiLCIvKipcclxuICogQmV6aWVyRWFzaW5nIC0gdXNlIGJlemllciBjdXJ2ZSBmb3IgdHJhbnNpdGlvbiBlYXNpbmcgZnVuY3Rpb25cclxuICogaXMgYmFzZWQgb24gRmlyZWZveCdzIG5zU01JTEtleVNwbGluZS5jcHBcclxuICogVXNhZ2U6XHJcbiAqIHZhciBzcGxpbmUgPSBCZXppZXJFYXNpbmcoMC4yNSwgMC4xLCAwLjI1LCAxLjApXHJcbiAqIHNwbGluZSh4KSA9PiByZXR1cm5zIHRoZSBlYXNpbmcgdmFsdWUgfCB4IG11c3QgYmUgaW4gWzAsIDFdIHJhbmdlXHJcbiAqXHJcbiAqL1xyXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcclxuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdy5kZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgd2luZG93LmRlZmluZS5hbWQpIHtcclxuICAgICAgICB3aW5kb3cuZGVmaW5lKFtdLCBkZWZpbml0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgd2luZG93LkJlemllckVhc2luZyA9IGRlZmluaXRpb24oKTtcclxuICAgIH1cclxufShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gVGhlc2UgdmFsdWVzIGFyZSBlc3RhYmxpc2hlZCBieSBlbXBpcmljaXNtIHdpdGggdGVzdHMgKHRyYWRlb2ZmOiBwZXJmb3JtYW5jZSBWUyBwcmVjaXNpb24pXHJcbiAgICB2YXIgTkVXVE9OX0lURVJBVElPTlMgPSA0O1xyXG4gICAgdmFyIE5FV1RPTl9NSU5fU0xPUEUgPSAwLjAwMTtcclxuICAgIHZhciBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDE7XHJcbiAgICB2YXIgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMgPSAxMDtcclxuXHJcbiAgICB2YXIga1NwbGluZVRhYmxlU2l6ZSA9IDExO1xyXG4gICAgdmFyIGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKTtcclxuXHJcbiAgICB2YXIgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gXCJmdW5jdGlvblwiO1xyXG5cclxuICAgIGZ1bmN0aW9uIEJlemllckVhc2luZyAobVgxLCBtWTEsIG1YMiwgbVkyKSB7XHJcblxyXG4gICAgICAgIC8vIFZhbGlkYXRlIGFyZ3VtZW50c1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICE9PSA0KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyByZXF1aXJlcyA0IGFyZ3VtZW50cy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTw0OyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gIT09IFwibnVtYmVyXCIgfHwgaXNOYU4oYXJndW1lbnRzW2ldKSB8fCAhaXNGaW5pdGUoYXJndW1lbnRzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIGFyZ3VtZW50cyBzaG91bGQgYmUgaW50ZWdlcnMuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtWDEgPCAwIHx8IG1YMSA+IDEgfHwgbVgyIDwgMCB8fCBtWDIgPiAxKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyB4IHZhbHVlcyBtdXN0IGJlIGluIFswLCAxXSByYW5nZS5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbVNhbXBsZVZhbHVlcyA9IGZsb2F0MzJBcnJheVN1cHBvcnRlZCA/IG5ldyBGbG9hdDMyQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSkgOiBuZXcgQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIEEgKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTE7IH1cclxuICAgICAgICBmdW5jdGlvbiBCIChhQTEsIGFBMikgeyByZXR1cm4gMy4wICogYUEyIC0gNi4wICogYUExOyB9XHJcbiAgICAgICAgZnVuY3Rpb24gQyAoYUExKSAgICAgIHsgcmV0dXJuIDMuMCAqIGFBMTsgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm5zIHgodCkgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgeSh0KSBnaXZlbiB0LCB5MSwgYW5kIHkyLlxyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNCZXppZXIgKGFULCBhQTEsIGFBMikge1xyXG4gICAgICAgICAgICByZXR1cm4gKChBKGFBMSwgYUEyKSphVCArIEIoYUExLCBhQTIpKSphVCArIEMoYUExKSkqYVQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm5zIGR4L2R0IGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIGR5L2R0IGdpdmVuIHQsIHkxLCBhbmQgeTIuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0U2xvcGUgKGFULCBhQTEsIGFBMikge1xyXG4gICAgICAgICAgICByZXR1cm4gMy4wICogQShhQTEsIGFBMikqYVQqYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUgKGFYLCBhR3Vlc3NUKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTkVXVE9OX0lURVJBVElPTlM7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRTbG9wZSA9IGdldFNsb3BlKGFHdWVzc1QsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2xvcGUgPT09IDAuMCkgcmV0dXJuIGFHdWVzc1Q7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xyXG4gICAgICAgICAgICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYUd1ZXNzVDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNTYW1wbGVWYWx1ZXMgKCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgbVNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBiaW5hcnlTdWJkaXZpZGUgKGFYLCBhQSwgYUIpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XHJcbiAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50WCA9IGNhbGNCZXppZXIoY3VycmVudFQsIG1YMSwgbVgyKSAtIGFYO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRYID4gMC4wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYUIgPSBjdXJyZW50VDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYUEgPSBjdXJyZW50VDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gU1VCRElWSVNJT05fUFJFQ0lTSU9OICYmICsraSA8IFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TKTtcclxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0VEZvclggKGFYKSB7XHJcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbFN0YXJ0ID0gMC4wO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFNhbXBsZSA9IDE7XHJcbiAgICAgICAgICAgIHZhciBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgY3VycmVudFNhbXBsZSAhPSBsYXN0U2FtcGxlICYmIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0gPD0gYVg7ICsrY3VycmVudFNhbXBsZSkge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLS1jdXJyZW50U2FtcGxlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW50ZXJwb2xhdGUgdG8gcHJvdmlkZSBhbiBpbml0aWFsIGd1ZXNzIGZvciB0XHJcbiAgICAgICAgICAgIHZhciBkaXN0ID0gKGFYIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAobVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlKzFdIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSk7XHJcbiAgICAgICAgICAgIHZhciBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSBORVdUT05fTUlOX1NMT1BFKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGd1ZXNzRm9yVCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09IDAuMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobVgxICE9IG1ZMSB8fCBtWDIgIT0gbVkyKVxyXG4gICAgICAgICAgICBjYWxjU2FtcGxlVmFsdWVzKCk7XHJcblxyXG4gICAgICAgIHZhciBmID0gZnVuY3Rpb24gKGFYKSB7XHJcbiAgICAgICAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgcmV0dXJuIGFYOyAvLyBsaW5lYXJcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBKYXZhU2NyaXB0IG51bWJlciBhcmUgaW1wcmVjaXNlLCB3ZSBzaG91bGQgZ3VhcmFudGVlIHRoZSBleHRyZW1lcyBhcmUgcmlnaHQuXHJcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMCkgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMSkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKGFYKSwgbVkxLCBtWTIpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHN0ciA9IFwiQmV6aWVyRWFzaW5nKFwiK1ttWDEsIG1ZMSwgbVgyLCBtWTJdK1wiKVwiO1xyXG4gICAgICAgIGYudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzdHI7IH07XHJcblxyXG4gICAgICAgIHJldHVybiBmO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENTUyBtYXBwaW5nXHJcbiAgICBCZXppZXJFYXNpbmcuY3NzID0ge1xyXG4gICAgICAgIFwiZWFzZVwiOiAgICAgICAgQmV6aWVyRWFzaW5nKDAuMjUsIDAuMSwgMC4yNSwgMS4wKSxcclxuICAgICAgICBcImxpbmVhclwiOiAgICAgIEJlemllckVhc2luZygwLjAwLCAwLjAsIDEuMDAsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLWluXCI6ICAgICBCZXppZXJFYXNpbmcoMC40MiwgMC4wLCAxLjAwLCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1vdXRcIjogICAgQmV6aWVyRWFzaW5nKDAuMDAsIDAuMCwgMC41OCwgMS4wKSxcclxuICAgICAgICBcImVhc2UtaW4tb3V0XCI6IEJlemllckVhc2luZygwLjQyLCAwLjAsIDAuNTgsIDEuMClcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEJlemllckVhc2luZztcclxufSkpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEVsbGlwc2UoZGF0YSkge1xyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5zaXplID0gZGF0YS5zaXplLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNpemUpIDogbmV3IFByb3BlcnR5KGRhdGEuc2l6ZSk7XHJcbiAgICAvL29wdGlvbmFsXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbiA9IGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG59XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdO1xyXG5cclxuICAgIHZhciBpLCBqO1xyXG5cclxuICAgIHZhciB3ID0gc2l6ZVswXSAvIDIsXHJcbiAgICAgICAgaCA9IHNpemVbMV0gLyAyLFxyXG4gICAgICAgIHggPSBwb3NpdGlvblswXSAtIHcsXHJcbiAgICAgICAgeSA9IHBvc2l0aW9uWzFdIC0gaCxcclxuICAgICAgICBvdyA9IHcgKiAuNTUyMjg0OCxcclxuICAgICAgICBvaCA9IGggKiAuNTUyMjg0ODtcclxuXHJcbiAgICB2YXIgdmVydGljZXMgPSBbXHJcbiAgICAgICAgW3ggKyB3ICsgb3csIHksIHggKyB3IC0gb3csIHksIHggKyB3LCB5XSxcclxuICAgICAgICBbeCArIHcgKyB3LCB5ICsgaCArIG9oLCB4ICsgdyArIHcsIHkgKyBoIC0gb2gsIHggKyB3ICsgdywgeSArIGhdLFxyXG4gICAgICAgIFt4ICsgdyAtIG93LCB5ICsgaCArIGgsIHggKyB3ICsgb3csIHkgKyBoICsgaCwgeCArIHcsIHkgKyBoICsgaF0sXHJcbiAgICAgICAgW3gsIHkgKyBoIC0gb2gsIHgsIHkgKyBoICsgb2gsIHgsIHkgKyBoXVxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0dixcclxuICAgICAgICAgICAgbGVuID0gdyArIGg7XHJcblxyXG4gICAgICAgIHRyaW0gPSB0aGlzLmdldFRyaW1WYWx1ZXModHJpbSk7XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICBpZiAoaiA+IDMpIGogPSAwO1xyXG4gICAgICAgICAgICBpZiAoaSA+IHRyaW0uc3RhcnRJbmRleCAmJiBpIDwgdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odmVydGljZXNbaV1bMF0sIHZlcnRpY2VzW2ldWzFdLCB2ZXJ0aWNlc1tqXVsyXSwgdmVydGljZXNbal1bM10sIHZlcnRpY2VzW2pdWzRdLCB2ZXJ0aWNlc1tqXVs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5zdGFydEluZGV4ICYmIGkgPT09IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5zdGFydEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIHRyaW0uc3RhcnQsIDEsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCAwLCB0cmltLmVuZCwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyh2ZXJ0aWNlc1swXVs0XSwgdmVydGljZXNbMF1bNV0pO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICBpZiAoaiA+IDMpIGogPSAwO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2ZXJ0aWNlc1tpXVswXSwgdmVydGljZXNbaV1bMV0sIHZlcnRpY2VzW2pdWzJdLCB2ZXJ0aWNlc1tqXVszXSwgdmVydGljZXNbal1bNF0sIHZlcnRpY2VzW2pdWzVdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5nZXRUcmltVmFsdWVzID0gZnVuY3Rpb24gKHRyaW0pIHtcclxuICAgIHZhciBzdGFydEluZGV4ID0gTWF0aC5mbG9vcih0cmltLnN0YXJ0ICogNCksXHJcbiAgICAgICAgZW5kSW5kZXggPSBNYXRoLmZsb29yKHRyaW0uZW5kICogNCksXHJcbiAgICAgICAgc3RhcnQgPSAodHJpbS5zdGFydCAtIHN0YXJ0SW5kZXggKiAwLjI1KSAqIDQsXHJcbiAgICAgICAgZW5kID0gKHRyaW0uZW5kIC0gZW5kSW5kZXggKiAwLjI1KSAqIDQ7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydEluZGV4OiBzdGFydEluZGV4LFxyXG4gICAgICAgIGVuZEluZGV4ICA6IGVuZEluZGV4LFxyXG4gICAgICAgIHN0YXJ0ICAgICA6IHN0YXJ0LFxyXG4gICAgICAgIGVuZCAgICAgICA6IGVuZFxyXG4gICAgfTtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnNpemUuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuc2l6ZS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVsbGlwc2U7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gRmlsbChkYXRhKSB7XHJcbiAgICB0aGlzLmNvbG9yID0gZGF0YS5jb2xvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5jb2xvcikgOiBuZXcgUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuRmlsbC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5vcGFjaXR5ID8gdGhpcy5vcGFjaXR5LmdldFZhbHVlKHRpbWUpIDogMTtcclxuICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChjb2xvclswXSkgKyAnLCAnICsgTWF0aC5yb3VuZChjb2xvclsxXSkgKyAnLCAnICsgTWF0aC5yb3VuZChjb2xvclsyXSkgKyAnLCAnICsgb3BhY2l0eSArICcpJztcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnNldENvbG9yID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcjtcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLmNvbG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5jb2xvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGaWxsOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEdyYWRpZW50RmlsbChkYXRhKSB7XHJcbiAgICB0aGlzLmNvbG9ycyA9IGRhdGEuY29sb3JzO1xyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gZGF0YS5zdGFydFBvaW50Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnN0YXJ0UG9pbnQpIDogbmV3IFByb3BlcnR5KGRhdGEuc3RhcnRQb2ludCk7XHJcbiAgICB0aGlzLmVuZFBvaW50ID0gZGF0YS5lbmRQb2ludC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5lbmRQb2ludCkgOiBuZXcgUHJvcGVydHkoZGF0YS5lbmRQb2ludCk7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuR3JhZGllbnRGaWxsLnByb3RvdHlwZS5zZXRDb2xvciA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyYW5zZm9ybSkge1xyXG5cclxuICAgIHZhciBwb3NpdGlvblggPSAwO1xyXG4gICAgdmFyIHBvc2l0aW9uWSA9IDA7XHJcblxyXG4gICAgaWYgKHRyYW5zZm9ybS5wb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHRyYW5zZm9ybS5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lLCBjdHgpO1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHBvc2l0aW9uWzBdO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHBvc2l0aW9uWzFdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwb3NpdGlvblggPSB0cmFuc2Zvcm0ucG9zaXRpb25YID8gdHJhbnNmb3JtLnBvc2l0aW9uWC5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcbiAgICAgICAgcG9zaXRpb25ZID0gdHJhbnNmb3JtLnBvc2l0aW9uWSA/IHRyYW5zZm9ybS5wb3NpdGlvblkuZ2V0VmFsdWUodGltZSkgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzdGFydFBvaW50ID0gdGhpcy5zdGFydFBvaW50LmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIGVuZFBvaW50ID0gdGhpcy5lbmRQb2ludC5nZXRWYWx1ZSh0aW1lKTtcclxuXHJcbiAgICB2YXIgc3RhcnRYID0gc3RhcnRQb2ludFswXSAtIHBvc2l0aW9uWDtcclxuICAgIHZhciBzdGFydFkgPSBzdGFydFBvaW50WzFdIC0gcG9zaXRpb25ZO1xyXG4gICAgdmFyIGVuZFggPSBlbmRQb2ludFswXSAtIHBvc2l0aW9uWDtcclxuICAgIHZhciBlbmRZID0gZW5kUG9pbnRbMV0gLSBwb3NpdGlvblk7XHJcblxyXG4gICAgdmFyIHJhZGl1cyA9IDA7XHJcblxyXG4gICAgaWYgKHRoaXMudHlwZSA9PT0gJ3JhZGlhbCcpIHtcclxuICAgICAgICB2YXIgZGlzdFggPSBzdGFydFggLSBlbmRYO1xyXG4gICAgICAgIHZhciBkaXN0WSA9IHN0YXJ0WSAtIGVuZFk7XHJcbiAgICAgICAgcmFkaXVzID0gTWF0aC5zcXJ0KGRpc3RYICogZGlzdFggKyBkaXN0WSAqIGRpc3RZKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZ3JhZGllbnQgPSB0aGlzLnR5cGUgPT09ICdyYWRpYWwnID9cclxuICAgICAgICBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoc3RhcnRYLCBzdGFydFksIDAsIHN0YXJ0WCwgc3RhcnRZLCByYWRpdXMpIDpcclxuICAgICAgICBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFkpO1xyXG5cclxuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5vcGFjaXR5ID8gdGhpcy5vcGFjaXR5LmdldFZhbHVlKHRpbWUpIDogMTtcclxuXHJcbiAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoJyArIHRoaXMuY29sb3JzWzBdWzBdICsgJywgJyArIHRoaXMuY29sb3JzWzBdWzFdICsgJywgJyArIHRoaXMuY29sb3JzWzBdWzJdICsgJywgJyArIHRoaXMuY29sb3JzWzBdWzNdICogb3BhY2l0eSArICcpJyk7XHJcbiAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoJyArIHRoaXMuY29sb3JzWzFdWzBdICsgJywgJyArIHRoaXMuY29sb3JzWzFdWzFdICsgJywgJyArIHRoaXMuY29sb3JzWzFdWzJdICsgJywgJyArIHRoaXMuY29sb3JzWzFdWzNdICogb3BhY2l0eSArICcpJyk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbn07XHJcblxyXG5HcmFkaWVudEZpbGwucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5zdGFydFBvaW50LnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMuZW5kUG9pbnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuR3JhZGllbnRGaWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnNldEtleWZyYW1lcyhyZXZlcnNlZCk7XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQuc2V0S2V5ZnJhbWVzKHJldmVyc2VkKTtcclxuICAgIHRoaXMuZW5kUG9pbnQuc2V0S2V5ZnJhbWVzKHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR3JhZGllbnRGaWxsOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTdHJva2UgPSByZXF1aXJlKCcuL1N0cm9rZScpLFxyXG4gICAgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpLFxyXG4gICAgRWxsaXBzZSA9IHJlcXVpcmUoJy4vRWxsaXBzZScpLFxyXG4gICAgUG9seXN0YXIgPSByZXF1aXJlKCcuL1BvbHlzdGFyJyksXHJcbiAgICBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpLFxyXG4gICAgRmlsbCA9IHJlcXVpcmUoJy4vRmlsbCcpLFxyXG4gICAgR3JhZGllbnRGaWxsID0gcmVxdWlyZSgnLi9HcmFkaWVudEZpbGwnKSxcclxuICAgIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXHJcbiAgICBNZXJnZSA9IHJlcXVpcmUoJy4vTWVyZ2UnKSxcclxuICAgIFRyaW0gPSByZXF1aXJlKCcuL1RyaW0nKTtcclxuXHJcbmZ1bmN0aW9uIEdyb3VwKGRhdGEsIGJ1ZmZlckN0eCwgcGFyZW50SW4sIHBhcmVudE91dCkge1xyXG5cclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5pbiA9IGRhdGEuaW4gPyBkYXRhLmluIDogcGFyZW50SW47XHJcbiAgICB0aGlzLm91dCA9IGRhdGEub3V0ID8gZGF0YS5vdXQgOiBwYXJlbnRPdXQ7XHJcblxyXG4gICAgaWYgKGRhdGEuZmlsbCkgdGhpcy5maWxsID0gbmV3IEZpbGwoZGF0YS5maWxsKTtcclxuICAgIGlmIChkYXRhLmdyYWRpZW50RmlsbCkgdGhpcy5maWxsID0gbmV3IEdyYWRpZW50RmlsbChkYXRhLmdyYWRpZW50RmlsbCk7XHJcbiAgICBpZiAoZGF0YS5zdHJva2UpIHRoaXMuc3Ryb2tlID0gbmV3IFN0cm9rZShkYXRhLnN0cm9rZSk7XHJcbiAgICBpZiAoZGF0YS50cmltKSB0aGlzLnRyaW0gPSBuZXcgVHJpbShkYXRhLnRyaW0pO1xyXG4gICAgaWYgKGRhdGEubWVyZ2UpIHRoaXMubWVyZ2UgPSBuZXcgTWVyZ2UoZGF0YS5tZXJnZSk7XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKGRhdGEudHJhbnNmb3JtKTtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gYnVmZmVyQ3R4O1xyXG5cclxuICAgIGlmIChkYXRhLmdyb3Vwcykge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwcy5wdXNoKG5ldyBHcm91cChkYXRhLmdyb3Vwc1tpXSwgdGhpcy5idWZmZXJDdHgsIHRoaXMuaW4sIHRoaXMub3V0KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLnNoYXBlcykge1xyXG4gICAgICAgIHRoaXMuc2hhcGVzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkYXRhLnNoYXBlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB2YXIgc2hhcGUgPSBkYXRhLnNoYXBlc1tqXTtcclxuICAgICAgICAgICAgaWYgKHNoYXBlLnR5cGUgPT09ICdwYXRoJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlLmlzQW5pbWF0ZWQpIHRoaXMuc2hhcGVzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChzaGFwZSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzLnNoYXBlcy5wdXNoKG5ldyBQYXRoKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3JlY3QnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBSZWN0KHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2VsbGlwc2UnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBFbGxpcHNlKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3BvbHlzdGFyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgUG9seXN0YXIoc2hhcGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5tYXNrcykge1xyXG4gICAgICAgIHRoaXMubWFza3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRhdGEubWFza3MubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgdmFyIG1hc2sgPSBkYXRhLm1hc2tzW2tdO1xyXG4gICAgICAgICAgICBpZiAobWFzay5pc0FuaW1hdGVkKSB0aGlzLm1hc2tzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChtYXNrKSk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5tYXNrcy5wdXNoKG5ldyBQYXRoKG1hc2spKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbkdyb3VwLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgcGFyZW50RmlsbCwgcGFyZW50U3Ryb2tlLCBwYXJlbnRUcmltLCBpc0J1ZmZlcikge1xyXG5cclxuICAgIHZhciBpO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eC5zYXZlKCk7XHJcblxyXG4gICAgLy9UT0RPIGNoZWNrIGlmIGNvbG9yL3N0cm9rZSBpcyBjaGFuZ2luZyBvdmVyIHRpbWVcclxuICAgIHZhciBmaWxsID0gdGhpcy5maWxsIHx8IHBhcmVudEZpbGw7XHJcbiAgICB2YXIgc3Ryb2tlID0gdGhpcy5zdHJva2UgfHwgcGFyZW50U3Ryb2tlO1xyXG4gICAgdmFyIHRyaW1WYWx1ZXMgPSB0aGlzLnRyaW0gPyB0aGlzLnRyaW0uZ2V0VHJpbSh0aW1lKSA6IHBhcmVudFRyaW07XHJcblxyXG4gICAgaWYgKGZpbGwpIGZpbGwuc2V0Q29sb3IoY3R4LCB0aW1lLCB0aGlzLnRyYW5zZm9ybSk7XHJcbiAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKGN0eCwgdGltZSk7XHJcblxyXG4gICAgaWYgKCFpc0J1ZmZlcikgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0odGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG5cclxuICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5idWZmZXJDdHguY2FudmFzLndpZHRoLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgICAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5tYXNrcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLm1hc2tzW2ldLmRyYXcoY3R4LCB0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY3R4LmNsaXAoKTtcclxuICAgIH1cclxuXHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGwpIHRoaXMuYnVmZmVyQ3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJva2UpIHRoaXMuYnVmZmVyQ3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KGN0eCwgdGltZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuc2hhcGVzW3RoaXMuc2hhcGVzLmxlbmd0aCAtIDFdLmNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgLy9jdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9UT0RPIGdldCBvcmRlclxyXG4gICAgaWYgKGZpbGwpIGN0eC5maWxsKCk7XHJcbiAgICBpZiAoIWlzQnVmZmVyICYmIHN0cm9rZSkgY3R4LnN0cm9rZSgpO1xyXG5cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8PSB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCBmaWxsLCBzdHJva2UsIHRyaW1WYWx1ZXMsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVyZ2Uuc2V0Q29tcG9zaXRlT3BlcmF0aW9uKHRoaXMuYnVmZmVyQ3R4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuYnVmZmVyQ3R4LmNhbnZhcywgMCwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LnJlc3RvcmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8PSB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KGN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5Hcm91cC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnNldEtleWZyYW1lcyh0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5tYXNrcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLm1hc2tzW2pdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2tdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZmlsbCkgdGhpcy5maWxsLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnN0cm9rZSkgdGhpcy5zdHJva2Uuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMudHJpbSkgdGhpcy50cmltLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkdyb3VwLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG5cclxuICAgIGlmICh0aGlzLnNoYXBlcykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLm1hc2tzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLm1hc2tzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFza3Nbal0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNba10ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zdHJva2UpIHRoaXMuc3Ryb2tlLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnRyaW0pIHRoaXMudHJpbS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyk7XHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyk7XHJcbnZhciBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpO1xyXG5cclxuZnVuY3Rpb24gSW1hZ2VMYXllcihkYXRhLCBidWZmZXJDdHgsIHBhcmVudEluLCBwYXJlbnRPdXQsIGJhc2VQYXRoKSB7XHJcblxyXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5zb3VyY2UgPSBiYXNlUGF0aCArIGRhdGEuc291cmNlO1xyXG5cclxuICAgIHRoaXMuaW4gPSBkYXRhLmluID8gZGF0YS5pbiA6IHBhcmVudEluO1xyXG4gICAgdGhpcy5vdXQgPSBkYXRhLm91dCA/IGRhdGEub3V0IDogcGFyZW50T3V0O1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybShkYXRhLnRyYW5zZm9ybSk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IGJ1ZmZlckN0eDtcclxuXHJcbiAgICBpZiAoZGF0YS5tYXNrcykge1xyXG4gICAgICAgIHRoaXMubWFza3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRhdGEubWFza3MubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgdmFyIG1hc2sgPSBkYXRhLm1hc2tzW2tdO1xyXG4gICAgICAgICAgICBpZiAobWFzay5pc0FuaW1hdGVkKSB0aGlzLm1hc2tzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChtYXNrKSk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5tYXNrcy5wdXNoKG5ldyBQYXRoKG1hc2spKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbiAoY2IpIHtcclxuICAgIHRoaXMuaW1nID0gbmV3IEltYWdlO1xyXG4gICAgdGhpcy5pbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgY2IoKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5pbWcuc3JjID0gdGhpcy5zb3VyY2U7XHJcbn07XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIGlmICghdGhpcy5pc0xvYWRlZCkgcmV0dXJuO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0oY3R4LCB0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFza3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5tYXNrc1tpXS5kcmF3KGN0eCwgdGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN0eC5jbGlwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCk7XHJcblxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5tYXNrcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLm1hc2tzW2pdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG5cclxuICAgIGlmICh0aGlzLm1hc2tzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLm1hc2tzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFza3Nbal0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMYXllcjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIE1lcmdlKGRhdGEpIHtcclxuICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZTtcclxufVxyXG5cclxuTWVyZ2UucHJvdG90eXBlLnNldENvbXBvc2l0ZU9wZXJhdGlvbiA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdXQnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWluJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3hvcic7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXJnZTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpO1xyXG5cclxuZnVuY3Rpb24gUGF0aChkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gZGF0YS5jbG9zZWQ7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGEuZnJhbWVzO1xyXG4gICAgdGhpcy52ZXJ0aWNlc0NvdW50ID0gdGhpcy5mcmFtZXNbMF0udi5sZW5ndGg7XHJcbn1cclxuXHJcblBhdGgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcbiAgICB2YXIgZnJhbWUgPSB0aGlzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHZlcnRpY2VzID0gZnJhbWUudjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIGlmICgodHJpbS5zdGFydCA9PT0gMCAmJiB0cmltLmVuZCA9PT0gMCkgfHxcclxuICAgICAgICAgICAgKHRyaW0uc3RhcnQgPT09IDEgJiYgdHJpbS5lbmQgPT09IDEpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0sIGZyYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDE7IGogPCB2ZXJ0aWNlcy5sZW5ndGg7IGorKykge1xyXG5cclxuICAgICAgICB2YXIgbmV4dFZlcnRleCA9IHZlcnRpY2VzW2pdLFxyXG4gICAgICAgICAgICBsYXN0VmVydGV4ID0gdmVydGljZXNbaiAtIDFdO1xyXG5cclxuICAgICAgICBpZiAodHJpbSkge1xyXG4gICAgICAgICAgICB2YXIgdHY7XHJcblxyXG4gICAgICAgICAgICBpZiAoaiA9PT0gMSAmJiB0cmltLnN0YXJ0SW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSAmJiBqID09PSB0cmltLmVuZEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uc3RhcnRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIHRyaW0uc3RhcnQsIDEsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCAwLCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA+IHRyaW0uc3RhcnRJbmRleCArIDEgJiYgaiA8IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChqID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRyaW0gJiYgdGhpcy5jbG9zZWQpIHtcclxuICAgICAgICBpZiAoIW5leHRWZXJ0ZXgpIGRlYnVnZ2VyO1xyXG4gICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKG5leHRWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMV0sIHZlcnRpY2VzWzBdWzJdLCB2ZXJ0aWNlc1swXVszXSwgdmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgIH1cclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltLCBmcmFtZSkge1xyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgdmFyIGFjdHVhbFRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogMCxcclxuICAgICAgICBlbmRJbmRleDogMCxcclxuICAgICAgICBzdGFydDogMCxcclxuICAgICAgICBlbmQ6IDBcclxuICAgIH07XHJcblxyXG4vLyBUT0RPIGNsZWFuIHVwXHJcbiAgICBpZiAodHJpbS5zdGFydCA9PT0gMCkge1xyXG4gICAgICAgIGlmICh0cmltLmVuZCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBmcmFtZS5sZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdG90YWxMZW4gPSB0aGlzLnN1bUFycmF5KGZyYW1lLmxlbiksXHJcbiAgICAgICAgdHJpbUF0TGVuO1xyXG5cclxuICAgIHRyaW1BdExlbiA9IHRvdGFsTGVuICogdHJpbS5zdGFydDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRyaW1BdExlbiA+IDAgJiYgdHJpbUF0TGVuIDwgZnJhbWUubGVuW2ldKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnQgPSB0cmltQXRMZW4gLyBmcmFtZS5sZW5baV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGZyYW1lLmxlbi5sZW5ndGg7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmQgPSAxO1xyXG4gICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0cmltQXRMZW4gPSB0b3RhbExlbiAqIHRyaW0uZW5kO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0cmltQXRMZW4gPiAwICYmIHRyaW1BdExlbiA8IGZyYW1lLmxlbltpXSkge1xyXG4gICAgICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IHRyaW1BdExlbiAvIGZyYW1lLmxlbltpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cmltQXRMZW4gLT0gZnJhbWUubGVuW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnRyaW0gPSBmdW5jdGlvbiAobGFzdFZlcnRleCwgbmV4dFZlcnRleCwgZnJvbSwgdG8sIGxlbikge1xyXG5cclxuICAgIGlmIChmcm9tID09PSAwICYmIHRvID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhcnQ6IGxhc3RWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZDogbmV4dFZlcnRleFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaXNTdHJhaWdodChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKSkge1xyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzFdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzRdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIGZyb20pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgZW5kVmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsyXSwgbmV4dFZlcnRleFsyXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbmV4dFZlcnRleFs1XSwgdG8pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYmV6aWVyID0gbmV3IEJlemllcihbbGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XV0pO1xyXG4gICAgICAgIHRoaXMuYmV6aWVyLmdldExlbmd0aChsZW4pO1xyXG4gICAgICAgIGZyb20gPSB0aGlzLmJlemllci5tYXAoZnJvbSk7XHJcbiAgICAgICAgdG8gPSB0aGlzLmJlemllci5tYXAodG8pO1xyXG4gICAgICAgIHRvID0gKHRvIC0gZnJvbSkgLyAoMSAtIGZyb20pO1xyXG5cclxuICAgICAgICB2YXIgZTEsIGYxLCBnMSwgaDEsIGoxLCBrMSxcclxuICAgICAgICAgICAgZTIsIGYyLCBnMiwgaDIsIGoyLCBrMixcclxuICAgICAgICAgICAgc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZFZlcnRleDtcclxuXHJcbiAgICAgICAgZTEgPSBbdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbMF0sIGZyb20pLCB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFsxXSwgZnJvbSldO1xyXG4gICAgICAgIGYxID0gW3RoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSwgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbM10sIGZyb20pXTtcclxuICAgICAgICBnMSA9IFt0aGlzLmxlcnAobmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFs0XSwgZnJvbSksIHRoaXMubGVycChuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzVdLCBmcm9tKV07XHJcbiAgICAgICAgaDEgPSBbdGhpcy5sZXJwKGUxWzBdLCBmMVswXSwgZnJvbSksIHRoaXMubGVycChlMVsxXSwgZjFbMV0sIGZyb20pXTtcclxuICAgICAgICBqMSA9IFt0aGlzLmxlcnAoZjFbMF0sIGcxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGYxWzFdLCBnMVsxXSwgZnJvbSldO1xyXG4gICAgICAgIGsxID0gW3RoaXMubGVycChoMVswXSwgajFbMF0sIGZyb20pLCB0aGlzLmxlcnAoaDFbMV0sIGoxWzFdLCBmcm9tKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2oxWzBdLCBqMVsxXSwgaDFbMF0sIGgxWzFdLCBrMVswXSwgazFbMV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCBnMVswXSwgZzFbMV0sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV1dO1xyXG5cclxuICAgICAgICBlMiA9IFt0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzBdLCB0byksIHRoaXMubGVycChzdGFydFZlcnRleFs1XSwgc3RhcnRWZXJ0ZXhbMV0sIHRvKV07XHJcbiAgICAgICAgZjIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzBdLCBlbmRWZXJ0ZXhbMl0sIHRvKSwgdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzFdLCBlbmRWZXJ0ZXhbM10sIHRvKV07XHJcbiAgICAgICAgZzIgPSBbdGhpcy5sZXJwKGVuZFZlcnRleFsyXSwgZW5kVmVydGV4WzRdLCB0byksIHRoaXMubGVycChlbmRWZXJ0ZXhbM10sIGVuZFZlcnRleFs1XSwgdG8pXTtcclxuXHJcbiAgICAgICAgaDIgPSBbdGhpcy5sZXJwKGUyWzBdLCBmMlswXSwgdG8pLCB0aGlzLmxlcnAoZTJbMV0sIGYyWzFdLCB0byldO1xyXG4gICAgICAgIGoyID0gW3RoaXMubGVycChmMlswXSwgZzJbMF0sIHRvKSwgdGhpcy5sZXJwKGYyWzFdLCBnMlsxXSwgdG8pXTtcclxuICAgICAgICBrMiA9IFt0aGlzLmxlcnAoaDJbMF0sIGoyWzBdLCB0byksIHRoaXMubGVycChoMlsxXSwgajJbMV0sIHRvKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2UyWzBdLCBlMlsxXSwgc3RhcnRWZXJ0ZXhbMl0sIHN0YXJ0VmVydGV4WzNdLCBzdGFydFZlcnRleFs0XSwgc3RhcnRWZXJ0ZXhbNV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtqMlswXSwgajJbMV0sIGgyWzBdLCBoMlsxXSwgazJbMF0sIGsyWzFdXTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydDogc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgZW5kOiBlbmRWZXJ0ZXhcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHZhciBzID0gMSAtIHQ7XHJcbiAgICByZXR1cm4gYSAqIHMgKyBiICogdDtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnN1bUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xyXG4gICAgZnVuY3Rpb24gYWRkKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gYSArIGI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoYWRkKTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmlzU3RyYWlnaHQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGN0cmwxWCwgY3RybDFZLCBjdHJsMlgsIGN0cmwyWSwgZW5kWCwgZW5kWSkge1xyXG4gICAgcmV0dXJuIHN0YXJ0WCA9PT0gY3RybDFYICYmIHN0YXJ0WSA9PT0gY3RybDFZICYmIGVuZFggPT09IGN0cmwyWCAmJiBlbmRZID09PSBjdHJsMlk7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9seXN0YXIoZGF0YSkge1xyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7IC8vIFRPRE8gPz9cclxuXHJcbiAgICB0aGlzLnN0YXJUeXBlID0gZGF0YS5zdGFyVHlwZTtcclxuICAgIHRoaXMucG9pbnRzID0gZGF0YS5wb2ludHMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9pbnRzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvaW50cyk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzID0gZGF0YS5pbm5lclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cyk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gZGF0YS5vdXRlclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cyk7XHJcblxyXG4gICAgLy9vcHRpbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcyA9IGRhdGEuaW5uZXJSb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpO1xyXG4gICAgaWYgKGRhdGEub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MgPSBkYXRhLm91dGVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKTtcclxufVxyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IHRoaXMucG9pbnRzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIGlubmVyUmFkaXVzID0gdGhpcy5pbm5lclJhZGl1cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBvdXRlclJhZGl1cyA9IHRoaXMub3V0ZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcclxuICAgICAgICByb3RhdGlvbiA9IHRoaXMucm90YXRpb24gPyB0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBpbm5lclJvdW5kbmVzcyA9IHRoaXMuaW5uZXJSb3VuZG5lc3MgPyB0aGlzLmlubmVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBvdXRlclJvdW5kbmVzcyA9IHRoaXMub3V0ZXJSb3VuZG5lc3MgPyB0aGlzLm91dGVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMDtcclxuXHJcbiAgICByb3RhdGlvbiA9IHRoaXMuZGVnMnJhZChyb3RhdGlvbik7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBvdXRlclJhZGl1cywgcm90YXRpb24pO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSk7XHJcbiAgICBjdHgubW92ZVRvKHN0YXJ0WzBdLCBzdGFydFsxXSk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHM7IGkrKykge1xyXG5cclxuICAgICAgICB2YXIgcElubmVyLFxyXG4gICAgICAgICAgICBwT3V0ZXIsXHJcbiAgICAgICAgICAgIHBPdXRlcjFUYW5nZW50LFxyXG4gICAgICAgICAgICBwT3V0ZXIyVGFuZ2VudCxcclxuICAgICAgICAgICAgcElubmVyMVRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBJbm5lcjJUYW5nZW50LFxyXG4gICAgICAgICAgICBvdXRlck9mZnNldCxcclxuICAgICAgICAgICAgaW5uZXJPZmZzZXQsXHJcbiAgICAgICAgICAgIHJvdDtcclxuXHJcbiAgICAgICAgcm90ID0gTWF0aC5QSSAvIHBvaW50cyAqIDI7XHJcblxyXG4gICAgICAgIHBJbm5lciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBPdXRlciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIC8vRkl4TUVcclxuICAgICAgICBpZiAoIW91dGVyT2Zmc2V0KSBvdXRlck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBvdXRlclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xyXG4gICAgICAgIGlmICghaW5uZXJPZmZzZXQpIGlubmVyT2Zmc2V0ID0gKHN0YXJ0WzBdICsgcElubmVyWzBdKSAqIGlubmVyUm91bmRuZXNzIC8gMTAwICogLjU1MjI4NDg7XHJcblxyXG4gICAgICAgIHBPdXRlcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBvdXRlck9mZnNldCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogaSkgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcElubmVyMVRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIGlubmVyT2Zmc2V0ICogLTEsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwSW5uZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgaW5uZXJPZmZzZXQsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwT3V0ZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQgKiAtMSwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgIC8vc3RhclxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBJbm5lcjFUYW5nZW50WzBdLCBwSW5uZXIxVGFuZ2VudFsxXSwgcElubmVyWzBdLCBwSW5uZXJbMV0pO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vcG9seWdvblxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9kZWJ1Z1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXJbMF0sIHBJbm5lclsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyWzBdLCBwT3V0ZXJbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJyZWRcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiZ3JlZW5cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYnJvd25cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnJvdGF0ZVBvaW50ID0gZnVuY3Rpb24gKGN4LCBjeSwgeCwgeSwgcmFkaWFucykge1xyXG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxyXG4gICAgICAgIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpLFxyXG4gICAgICAgIG54ID0gKGNvcyAqICh4IC0gY3gpKSAtIChzaW4gKiAoeSAtIGN5KSkgKyBjeCxcclxuICAgICAgICBueSA9IChzaW4gKiAoeCAtIGN4KSkgKyAoY29zICogKHkgLSBjeSkpICsgY3k7XHJcbiAgICByZXR1cm4gW254LCBueV07XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMucG9pbnRzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMucG9pbnRzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlzdGFyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9zaXRpb24oZGF0YSkge1xyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eS5jYWxsKHRoaXMsIGRhdGEpO1xyXG59XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlKTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxuICAgIHRoaXMuc2V0TW90aW9uUGF0aCgpO1xyXG59O1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLm1vdGlvbnBhdGgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb3Rpb25wYXRoLmdldFZhbHVlcyh0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUuc2V0TW90aW9uUGF0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKSB7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoID0gbmV3IEJlemllcih0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKTtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGguZ2V0TGVuZ3RoKHRoaXMubGFzdEZyYW1lLmxlbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gUHJvcGVydHkoZGF0YSkge1xyXG4gICAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIG51bGw7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGE7XHJcbn1cclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmZyYW1lc1swXS52O1xyXG59O1xyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbn07XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUmVjdChkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcclxuXHJcbiAgICAvL29wdGlvbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3MgPSBkYXRhLnJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEucm91bmRuZXNzKTtcclxufVxyXG5cclxuUmVjdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdW5kbmVzcyA9IHRoaXMucm91bmRuZXNzID8gdGhpcy5yb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwO1xyXG5cclxuICAgIGlmIChzaXplWzBdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVswXSAvIDI7XHJcbiAgICBpZiAoc2l6ZVsxXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMV0gLyAyO1xyXG5cclxuICAgIHZhciB4ID0gcG9zaXRpb25bMF0gLSBzaXplWzBdIC8gMixcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0gLSBzaXplWzFdIC8gMjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0djtcclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG4gICAgICAgIC8vVE9ETyBhZGQgdHJpbVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdHgubW92ZVRvKHggKyByb3VuZG5lc3MsIHkpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSwgeCArIHNpemVbMF0sIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSArIHNpemVbMV0sIHgsIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4LCB5ICsgc2l6ZVsxXSwgeCwgeSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCwgeSwgeCArIHNpemVbMF0sIHksIHJvdW5kbmVzcyk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuUmVjdC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuc2l6ZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gU3Ryb2tlKGRhdGEpIHtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5qb2luID0gZGF0YS5qb2luO1xyXG4gICAgICAgIHRoaXMuY2FwID0gZGF0YS5jYXA7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEubWl0ZXJMaW1pdC5sZW5ndGggPiAxKSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY29sb3IubGVuZ3RoID4gMSkgdGhpcy5jb2xvciA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5jb2xvciA9IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEub3BhY2l0eS5sZW5ndGggPiAxKSB0aGlzLm9wYWNpdHkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5vcGFjaXR5ID0gbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLndpZHRoLmxlbmd0aCA+IDEpIHRoaXMud2lkdGggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLndpZHRoKTtcclxuICAgICAgICBlbHNlIHRoaXMud2lkdGggPSBuZXcgUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLmRhc2hlcykge1xyXG4gICAgICAgICAgICB0aGlzLmRhc2hlcyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEuZGFzaGVzLmRhc2gubGVuZ3RoID4gMSkgdGhpcy5kYXNoZXMuZGFzaCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZGFzaGVzLmRhc2gpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMuZGFzaGVzLmRhc2ggPSBuZXcgUHJvcGVydHkoZGF0YS5kYXNoZXMuZGFzaCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF0YS5kYXNoZXMuZ2FwLmxlbmd0aCA+IDEpIHRoaXMuZGFzaGVzLmdhcCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZGFzaGVzLmdhcCk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5kYXNoZXMuZ2FwID0gbmV3IFByb3BlcnR5KGRhdGEuZGFzaGVzLmdhcCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF0YS5kYXNoZXMub2Zmc2V0Lmxlbmd0aCA+IDEpIHRoaXMuZGFzaGVzLm9mZnNldCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZGFzaGVzLm9mZnNldCk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5kYXNoZXMub2Zmc2V0ID0gbmV3IFByb3BlcnR5KGRhdGEuZGFzaGVzLm9mZnNldCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5TdHJva2UucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuY29sb3IuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIGNvbG9yWzBdID0gTWF0aC5yb3VuZChjb2xvclswXSk7XHJcbiAgICBjb2xvclsxXSA9IE1hdGgucm91bmQoY29sb3JbMV0pO1xyXG4gICAgY29sb3JbMl0gPSBNYXRoLnJvdW5kKGNvbG9yWzJdKTtcclxuICAgIHZhciBzID0gY29sb3Iuam9pbignLCAnKTtcclxuXHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIHMgKyAnLCAnICsgb3BhY2l0eSArICcpJztcclxufTtcclxuXHJcblN0cm9rZS5wcm90b3R5cGUuc2V0U3Ryb2tlID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG4gICAgdmFyIHN0cm9rZUNvbG9yID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBzdHJva2VXaWR0aCA9IHRoaXMud2lkdGguZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgc3Ryb2tlSm9pbiA9IHRoaXMuam9pbjtcclxuICAgIGlmIChzdHJva2VKb2luID09PSAnbWl0ZXInKSB2YXIgbWl0ZXJMaW1pdCA9IHRoaXMubWl0ZXJMaW1pdC5nZXRWYWx1ZSh0aW1lKTtcclxuXHJcbiAgICBjdHgubGluZVdpZHRoID0gc3Ryb2tlV2lkdGg7XHJcbiAgICBjdHgubGluZUpvaW4gPSBzdHJva2VKb2luO1xyXG4gICAgaWYgKG1pdGVyTGltaXQpIGN0eC5taXRlckxpbWl0ID0gbWl0ZXJMaW1pdDtcclxuICAgIGN0eC5saW5lQ2FwID0gdGhpcy5jYXA7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2VDb2xvcjtcclxuXHJcbiAgICBpZiAodGhpcy5kYXNoZXMpIHtcclxuICAgICAgICBjdHguc2V0TGluZURhc2goW1xyXG4gICAgICAgICAgICB0aGlzLmRhc2hlcy5kYXNoLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgICAgICB0aGlzLmRhc2hlcy5nYXAuZ2V0VmFsdWUodGltZSlcclxuICAgICAgICBdKTtcclxuICAgICAgICBjdHgubGluZURhc2hPZmZzZXQgPSB0aGlzLmRhc2hlcy5vZmZzZXQuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLmNvbG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLndpZHRoLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5kYXNoZXMpIHtcclxuICAgICAgICB0aGlzLmRhc2hlcy5kYXNoLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB0aGlzLmRhc2hlcy5nYXAuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgICAgIHRoaXMuZGFzaGVzLm9mZnNldC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmNvbG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLndpZHRoLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5kYXNoZXMpIHtcclxuICAgICAgICB0aGlzLmRhc2hlcy5kYXNoLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB0aGlzLmRhc2hlcy5nYXAucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIHRoaXMuZGFzaGVzLm9mZnNldC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0cm9rZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5JyksXHJcbiAgICBQb3NpdGlvbiA9IHJlcXVpcmUoJy4vUG9zaXRpb24nKTtcclxuXHJcbmZ1bmN0aW9uIFRyYW5zZm9ybShkYXRhKSB7XHJcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcclxuXHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvbikge1xyXG4gICAgICAgIGlmIChkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb3NpdGlvbihkYXRhLnBvc2l0aW9uKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YID0gZGF0YS5wb3NpdGlvblgubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25YKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWCk7XHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZID0gZGF0YS5wb3NpdGlvblkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25ZKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICBpZiAoZGF0YS5hbmNob3IpIHRoaXMuYW5jaG9yID0gZGF0YS5hbmNob3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuYW5jaG9yKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmFuY2hvcik7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVgpIHRoaXMuc2NhbGVYID0gZGF0YS5zY2FsZVgubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVYKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWCk7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVkpIHRoaXMuc2NhbGVZID0gZGF0YS5zY2FsZVkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVZKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWSk7XHJcbiAgICBpZiAoZGF0YS5za2V3KSB0aGlzLnNrZXcgPSBkYXRhLnNrZXcubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2tldykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3KTtcclxuICAgIGlmIChkYXRhLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzID0gZGF0YS5za2V3QXhpcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3QXhpcykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3QXhpcyk7XHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm90YXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucm90YXRpb24pO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIHZhciBwb3NpdGlvblgsIHBvc2l0aW9uWSxcclxuICAgICAgICBhbmNob3IgPSB0aGlzLmFuY2hvciA/IHRoaXMuYW5jaG9yLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbiA/IHRoaXMuZGVnMnJhZCh0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2tldyA9IHRoaXMuc2tldyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXcuZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3QXhpcyA9IHRoaXMuc2tld0F4aXMgPyB0aGlzLmRlZzJyYWQodGhpcy5za2V3QXhpcy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNjYWxlWCA9IHRoaXMuc2NhbGVYID8gdGhpcy5zY2FsZVguZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIHNjYWxlWSA9IHRoaXMuc2NhbGVZID8gdGhpcy5zY2FsZVkuZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkgPyB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgKiBjdHguZ2xvYmFsQWxwaGEgOiBjdHguZ2xvYmFsQWxwaGE7IC8vIEZJWE1FIHdyb25nIHRyYW5zcGFyZW5jeSBpZiBuZXN0ZWRcclxuXHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSwgY3R4KTtcclxuICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblswXTtcclxuICAgICAgICBwb3NpdGlvblkgPSBwb3NpdGlvblsxXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcG9zaXRpb25YID0gdGhpcy5wb3NpdGlvblggPyB0aGlzLnBvc2l0aW9uWC5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcbiAgICAgICAgcG9zaXRpb25ZID0gdGhpcy5wb3NpdGlvblkgPyB0aGlzLnBvc2l0aW9uWS5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coY3R4LCBwb3NpdGlvblgsIHBvc2l0aW9uWSwgYW5jaG9yLCByb3RhdGlvbiwgc2tldywgc2tld0F4aXMsIHNjYWxlWCwgc2NhbGVZLCBvcGFjaXR5KTtcclxuXHJcbiAgICAvL29yZGVyIHZlcnkgdmVyeSBpbXBvcnRhbnQgOilcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgMCwgMSwgcG9zaXRpb25YIC0gYW5jaG9yWzBdLCBwb3NpdGlvblkgLSBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIHJvdGF0aW9uLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICB0aGlzLnNldFNrZXcoY3R4LCBza2V3LCBza2V3QXhpcywgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRTY2FsZShjdHgsIHNjYWxlWCwgc2NhbGVZLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIChjdHgsIHJhZCwgeCwgeSkge1xyXG4gICAgdmFyIGMgPSBNYXRoLmNvcyhyYWQpO1xyXG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gICAgdmFyIGR4ID0geCAtIGMgKiB4ICsgcyAqIHk7XHJcbiAgICB2YXIgZHkgPSB5IC0gcyAqIHggLSBjICogeTtcclxuICAgIGN0eC50cmFuc2Zvcm0oYywgcywgLXMsIGMsIGR4LCBkeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24gKGN0eCwgc3gsIHN5LCB4LCB5KSB7XHJcbiAgICBjdHgudHJhbnNmb3JtKHN4LCAwLCAwLCBzeSwgLXggKiBzeCArIHgsIC15ICogc3kgKyB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0U2tldyA9IGZ1bmN0aW9uIChjdHgsIHNrZXcsIGF4aXMsIHgsIHkpIHtcclxuICAgIHZhciB0ID0gTWF0aC50YW4oLXNrZXcpO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIC1heGlzLCB4LCB5KTtcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgdCwgMSwgLXkgKiB0LCAwKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCBheGlzLCB4LCB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBUcmltKGRhdGEpIHtcclxuXHJcbiAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGU7XHJcblxyXG4gICAgaWYgKGRhdGEuc3RhcnQpIHRoaXMuc3RhcnQgPSBkYXRhLnN0YXJ0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnN0YXJ0KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnN0YXJ0KTtcclxuICAgIGlmIChkYXRhLmVuZCkgdGhpcy5lbmQgPSBkYXRhLmVuZC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5lbmQpIDogbmV3IFByb3BlcnR5KGRhdGEuZW5kKTtcclxuICAgIC8vaWYgKGRhdGEub2Zmc2V0KSB0aGlzLm9mZnNldCA9IGRhdGEub2Zmc2V0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9mZnNldCkgOiBuZXcgUHJvcGVydHkoZGF0YS5vZmZzZXQpO1xyXG5cclxufVxyXG5cclxuVHJpbS5wcm90b3R5cGUuZ2V0VHJpbSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnN0YXJ0ID8gdGhpcy5zdGFydC5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgZW5kID0gdGhpcy5lbmQgPyB0aGlzLmVuZC5nZXRWYWx1ZSh0aW1lKSA6IDE7XHJcblxyXG4gICAgdmFyIHRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnQ6IE1hdGgubWluKHN0YXJ0LCBlbmQpLFxyXG4gICAgICAgIGVuZDogTWF0aC5tYXgoc3RhcnQsIGVuZClcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDAgJiYgdHJpbS5lbmQgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRyaW07XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcblRyaW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydCkgdGhpcy5zdGFydC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5lbmQpIHRoaXMuZW5kLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIC8vaWYgKHRoaXMub2Zmc2V0KSB0aGlzLm9mZnNldC5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmltO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiJdfQ==
