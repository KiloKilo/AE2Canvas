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

    this.gradients = {};
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
            this.layers.push(new Group(options.data.layers[i], this.bufferCtx, 0, this.duration, this.gradients));
        } else if (options.data.layers[i].type === 'image') {
            this.layers.push(new ImageLayer(options.data.layers[i], 0, this.duration, this.imageBasePath));
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

function GradientFill(data, gradients) {
    if (!gradients[data.name]) gradients[data.name] = [];
    gradients[data.name].push(this);

    this.stops = data.stops;
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

    // var startX = startPoint[0] - positionX;
    // var startY = startPoint[1] - positionY;
    // var endX = endPoint[0] - positionX;
    // var endY = endPoint[1] - positionY;
    //
    var startX = startPoint[0];
    var startY = startPoint[1];
    var endX = endPoint[0];
    var endY = endPoint[1];

    console.log(positionX, positionY);
    console.log(startX, startY);
    console.log(endX, endY);

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

    for (var i = 0; i < this.stops.length; i++) {
        var stop = this.stops[i];
        var color = stop.color;
        gradient.addColorStop(stop.location, 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + color[3] * opacity + ')');
        // gradient.addColorStop(stop.location, 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + 0.25 + ')');
    }

    ctx.save();
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, 20, 20);
    ctx.fillStyle = 'red';
    ctx.fillRect(startX, startY, 20, 20);
    ctx.fillStyle = 'blue';
    ctx.fillRect(endX, endY, 20, 20);
    ctx.restore();

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

function Group(data, bufferCtx, parentIn, parentOut, gradients) {

    this.index = data.index;
    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

    if (data.parent) this.parent = data.parent;
    if (data.fill) this.fill = new Fill(data.fill);
    if (data.gradientFill) this.fill = new GradientFill(data.gradientFill, gradients);
    if (data.stroke) this.stroke = new Stroke(data.stroke);
    if (data.trim) this.trim = new Trim(data.trim);
    if (data.merge) this.merge = new Merge(data.merge);

    this.transform = new Transform(data.transform);
    this.bufferCtx = bufferCtx;

    if (data.groups) {
        this.groups = [];
        for (var i = 0; i < data.groups.length; i++) {
            this.groups.push(new Group(data.groups[i], this.bufferCtx, this.in, this.out, gradients));
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

    if (this.transform.opacity && this.transform.opacity.getValue(time) === 0) return;

    var i;

    ctx.save();
    this.bufferCtx.save();

    //TODO check if color/stroke is changing over time
    var fill = this.fill || parentFill;
    var stroke = this.stroke || parentStroke;
    var trimValues = this.trim ? this.trim.getTrim(time) : parentTrim;

    if (fill) fill.setColor(ctx, time, this.transform);
    if (stroke) stroke.setStroke(ctx, time);

    if (!isBuffer) {
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);
    }
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
    if (this.shapes) this.drawShapes(ctx, time, fill, stroke, trimValues);

    //TODO get order
    if (fill) ctx.fill();
    if (!isBuffer && stroke) ctx.stroke();

    if (this.groups) this.drawGroups(ctx, time, fill, stroke, trimValues);

    ctx.restore();
    this.bufferCtx.restore();
};

Group.prototype.drawShapes = function (ctx, time, fill, stroke, trimValues) {
    var i;
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
};


Group.prototype.drawGroups = function (ctx, time, fill, stroke, trimValues) {
    var i;
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
                this.groups[i].draw(ctx, time, fill, stroke, trimValues, false);
            }
        }
    }
};

Group.prototype.setParentTransform = function (ctx, time) {
    if (this.parent) this.parent.setParentTransform(ctx, time);
    this.transform.transform(ctx, time);
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

function ImageLayer(data, parentIn, parentOut, basePath) {

    this.isLoaded = false;

    this.index = data.index;
    this.source = basePath + data.source;
    this.in = data.in ? data.in : parentIn;
    this.out = data.out ? data.out : parentOut;

    if (data.parent) this.parent = data.parent;

    this.transform = new Transform(data.transform);

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
    if (this.parent) this.parent.setParentTransform(ctx, time);
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

ImageLayer.prototype.setParentTransform = function (ctx, time) {
    if (this.parent) this.parent.setParentTransform(ctx, time);
    this.transform.transform(ctx, time);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9HcmFkaWVudEZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL0ltYWdlTGF5ZXIuanMiLCJzcmMvcnVudGltZS9NZXJnZS5qcyIsInNyYy9ydW50aW1lL1BhdGguanMiLCJzcmMvcnVudGltZS9Qb2x5c3Rhci5qcyIsInNyYy9ydW50aW1lL1Bvc2l0aW9uLmpzIiwic3JjL3J1bnRpbWUvUHJvcGVydHkuanMiLCJzcmMvcnVudGltZS9SZWN0LmpzIiwic3JjL3J1bnRpbWUvU3Ryb2tlLmpzIiwic3JjL3J1bnRpbWUvVHJhbnNmb3JtLmpzIiwic3JjL3J1bnRpbWUvVHJpbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEdyb3VwID0gcmVxdWlyZSgnLi9Hcm91cCcpLFxyXG4gICAgSW1hZ2VMYXllciA9IHJlcXVpcmUoJy4vSW1hZ2VMYXllcicpO1xyXG5cclxudmFyIF9hbmltYXRpb25zID0gW10sXHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IDA7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRpb24ob3B0aW9ucykge1xyXG4gICAgaWYgKCFvcHRpb25zLmRhdGEpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdubyBkYXRhJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZ3JhZGllbnRzID0ge307XHJcbiAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgdGhpcy5kdXJhdGlvbiA9IG9wdGlvbnMuZGF0YS5kdXJhdGlvbjtcclxuICAgIHRoaXMuYmFzZVdpZHRoID0gb3B0aW9ucy5kYXRhLndpZHRoO1xyXG4gICAgdGhpcy5iYXNlSGVpZ2h0ID0gb3B0aW9ucy5kYXRhLmhlaWdodDtcclxuICAgIHRoaXMucmF0aW8gPSBvcHRpb25zLmRhdGEud2lkdGggLyBvcHRpb25zLmRhdGEuaGVpZ2h0O1xyXG5cclxuICAgIHRoaXMubWFya2VycyA9IG9wdGlvbnMuZGF0YS5tYXJrZXJzO1xyXG5cclxuICAgIHRoaXMuY2FudmFzID0gb3B0aW9ucy5jYW52YXMgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmxvb3AgPSBvcHRpb25zLmxvb3AgfHwgZmFsc2U7XHJcbiAgICB0aGlzLmRldmljZVBpeGVsUmF0aW8gPSBvcHRpb25zLmRldmljZVBpeGVsUmF0aW8gfHwgd2luZG93ICYmIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID8gd2luZG93LmRldmljZVBpeGVsUmF0aW8gOiAxO1xyXG4gICAgdGhpcy5mbHVpZCA9IG9wdGlvbnMuZmx1aWQgfHwgdHJ1ZTtcclxuICAgIHRoaXMucmV2ZXJzZWQgPSBvcHRpb25zLnJldmVyc2VkIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5pbWFnZUJhc2VQYXRoID0gb3B0aW9ucy5pbWFnZUJhc2VQYXRoIHx8ICcnO1xyXG4gICAgdGhpcy5vblVwZGF0ZSA9IG9wdGlvbnMub25VcGRhdGUgfHwgZnVuY3Rpb24gKCkge1xyXG4gICAgfTtcclxuICAgIHRoaXMub25Db21wbGV0ZSA9IG9wdGlvbnMub25Db21wbGV0ZSB8fCBmdW5jdGlvbiAoKSB7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5iYXNlSGVpZ2h0O1xyXG5cclxuICAgIHRoaXMuYnVmZmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmJ1ZmZlci53aWR0aCA9IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgdGhpcy5idWZmZXIuaGVpZ2h0ID0gdGhpcy5iYXNlSGVpZ2h0O1xyXG4gICAgdGhpcy5idWZmZXJDdHggPSB0aGlzLmJ1ZmZlci5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIHRoaXMubGF5ZXJzID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuZGF0YS5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAob3B0aW9ucy5kYXRhLmxheWVyc1tpXS50eXBlID09PSAndmVjdG9yJykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVycy5wdXNoKG5ldyBHcm91cChvcHRpb25zLmRhdGEubGF5ZXJzW2ldLCB0aGlzLmJ1ZmZlckN0eCwgMCwgdGhpcy5kdXJhdGlvbiwgdGhpcy5ncmFkaWVudHMpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0udHlwZSA9PT0gJ2ltYWdlJykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVycy5wdXNoKG5ldyBJbWFnZUxheWVyKG9wdGlvbnMuZGF0YS5sYXllcnNbaV0sIDAsIHRoaXMuZHVyYXRpb24sIHRoaXMuaW1hZ2VCYXNlUGF0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubnVtTGF5ZXJzID0gdGhpcy5sYXllcnMubGVuZ3RoO1xyXG5cclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLmxheWVyc1tqXTtcclxuICAgICAgICBpZiAobGF5ZXIucGFyZW50KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgICAgIC8vVE9ETyBzdG9wIGxvb3BcclxuICAgICAgICAgICAgICAgIGlmIChsYXllci5wYXJlbnQgPT09IHRoaXMubGF5ZXJzW2tdLmluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIucGFyZW50ID0gdGhpcy5sYXllcnNba107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgIHRoaXMucmVzaXplKCk7XHJcblxyXG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuXHJcbiAgICBfYW5pbWF0aW9ucy5wdXNoKHRoaXMpO1xyXG4gICAgX2FuaW1hdGlvbnNMZW5ndGggPSBfYW5pbWF0aW9ucy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGlvbi5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgcGxheTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzUGF1c2VkKSB0aGlzLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgICAgICAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXVzZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmlzUGxheWluZykge1xyXG4gICAgICAgICAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gdGhpcy5jb21wVGltZTtcclxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdvdG9BbmRQbGF5OiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xyXG4gICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IG1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ290b0FuZFN0b3A6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLmdldE1hcmtlcihpZCk7XHJcbiAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gbWFya2VyLnRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRNYXJrZXI6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgaWQgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtlcnNbaWRdO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlkID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWFya2Vyc1tpXS5jb21tZW50ID09PSBpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtlcnNbaV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdNYXJrZXIgbm90IGZvdW5kJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoZWNrU3RvcE1hcmtlcnM6IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcnNbaV0uc3RvcCAmJiB0aGlzLm1hcmtlcnNbaV0udGltZSA+IGZyb20gJiYgdGhpcy5tYXJrZXJzW2ldLnRpbWUgPCB0bykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFN0ZXA6IGZ1bmN0aW9uIChzdGVwKSB7XHJcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gc3RlcCAqIHRoaXMuZHVyYXRpb247XHJcbiAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gdGhpcy5jb21wVGltZTtcclxuICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFN0ZXA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21wVGltZSAvIHRoaXMuZHVyYXRpb247XHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICBpZiAoIXRoaXMudGhlbikgdGhpcy50aGVuID0gdGltZTtcclxuXHJcbiAgICAgICAgdmFyIGRlbHRhID0gdGltZSAtIHRoaXMudGhlbjtcclxuICAgICAgICB0aGlzLnRoZW4gPSB0aW1lO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmNvbXBUaW1lIC0gZGVsdGEgOiB0aGlzLmNvbXBUaW1lICsgZGVsdGE7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RvcE1hcmtlciA9IHRoaXMuY2hlY2tTdG9wTWFya2Vycyh0aGlzLmNvbXBUaW1lIC0gZGVsdGEsIHRoaXMuY29tcFRpbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcFRpbWUgPiB0aGlzLmR1cmF0aW9uIHx8IHRoaXMucmV2ZXJzZWQgJiYgdGhpcy5jb21wVGltZSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnJldmVyc2VkID8gMCA6IHRoaXMuZHVyYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25Db21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9vcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0b3BNYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBzdG9wTWFya2VyLnRpbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vblVwZGF0ZSgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5kcmF3RnJhbWUpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3KHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLm9uVXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBkcmF3OiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhc2VXaWR0aCwgdGhpcy5iYXNlSGVpZ2h0KTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5sYXllcnNbaV0uaW4gJiYgdGltZSA8PSB0aGlzLmxheWVyc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmRyYXcodGhpcy5jdHgsIHRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBwcmVsb2FkOiBmdW5jdGlvbiAoY2IpIHtcclxuICAgICAgICB0aGlzLm9ubG9hZENCID0gY2I7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxheWVyc1tpXSBpbnN0YW5jZW9mIEltYWdlTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLnByZWxvYWQodGhpcy5vbmxvYWQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIG9ubG9hZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1MYXllcnM7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0gaW5zdGFuY2VvZiBJbWFnZUxheWVyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGF5ZXJzW2ldLmlzTG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vbmxvYWRDQiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aGlzLm9ubG9hZENCKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtTGF5ZXJzOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXRLZXlmcmFtZXM6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bUxheWVyczsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMub25Db21wbGV0ZSA9IG51bGw7XHJcbiAgICAgICAgdmFyIGkgPSBfYW5pbWF0aW9ucy5pbmRleE9mKHRoaXMpO1xyXG4gICAgICAgIGlmIChpID4gLTEpIHtcclxuICAgICAgICAgICAgX2FuaW1hdGlvbnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IF9hbmltYXRpb25zLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzLnBhcmVudE5vZGUpIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNpemU6IGZ1bmN0aW9uICh3KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZmx1aWQpIHtcclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gdyB8fCB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aCB8fCB0aGlzLmJhc2VXaWR0aDtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aCAqIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gd2lkdGggLyB0aGlzLnJhdGlvICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5idWZmZXIud2lkdGggPSB3aWR0aCAqIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIuaGVpZ2h0ID0gd2lkdGggLyB0aGlzLnJhdGlvICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zY2FsZSA9IHdpZHRoIC8gdGhpcy5iYXNlV2lkdGggKiB0aGlzLmRldmljZVBpeGVsUmF0aW87XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnRyYW5zZm9ybSh0aGlzLnNjYWxlLCAwLCAwLCB0aGlzLnNjYWxlLCAwLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgudHJhbnNmb3JtKHRoaXMuc2NhbGUsIDAsIDAsIHRoaXMuc2NhbGUsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2V0R3JhZGllbnRzOiBmdW5jdGlvbiAobmFtZSwgc3RvcHMpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZ3JhZGllbnRzW25hbWVdKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignR3JhZGllbnQgd2l0aCBuYW1lOiAnICsgbmFtZSArICcgbm90IGZvdW5kLicpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmdyYWRpZW50c1tuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uIChncmFkaWVudCkge1xyXG4gICAgICAgICAgICBncmFkaWVudC5zdG9wcyA9IHN0b3BzO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQgcmV2ZXJzZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2VkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXQgcmV2ZXJzZWQoYm9vbCkge1xyXG4gICAgICAgIHRoaXMuX3JldmVyc2VkID0gYm9vbDtcclxuICAgICAgICBpZiAodGhpcy5wYXVzZWRUaW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnBhdXNlZFRpbWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5pc1BsYXlpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgQW5pbWF0aW9uOiBBbmltYXRpb24sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHRpbWUgPSB0aW1lICE9PSB1bmRlZmluZWQgPyB0aW1lIDogcGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2FuaW1hdGlvbnNMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9uc1tpXS51cGRhdGUodGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBCZXppZXJFYXNpbmcgPSByZXF1aXJlKCcuL0JlemllckVhc2luZycpO1xyXG5cclxuZnVuY3Rpb24gQW5pbWF0ZWRQYXRoKGRhdGEpIHtcclxuICAgIFBhdGguY2FsbCh0aGlzLCBkYXRhKTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCAmJiB0aW1lID49IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0RnJhbWU7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQgJiYgdGltZSA8PSB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEZyYW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGltZSA+IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciArIDEgPT09IHRoaXMuZnJhbWVDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXIrKztcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGltZSA8IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciA8IDIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyLS07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVBdFRpbWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGltZSA8IHRoaXMuZnJhbWVzWzBdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGltZSA+IHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSB0aGlzLmZyYW1lQ291bnQgLSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuZnJhbWVDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5mcmFtZXNbaSAtIDFdLnQgJiYgdGltZSA8PSB0aGlzLmZyYW1lc1tpXSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXIgPSBpO1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW2kgLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLm9uS2V5ZnJhbWVDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNldEVhc2luZygpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHJldHVybiBhICsgdCAqIChiIC0gYSk7XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnNldEVhc2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0ICYmIHRoaXMubmV4dEZyYW1lLmVhc2VJbikge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbmV3IEJlemllckVhc2luZyh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzBdLCB0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzFdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMF0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblsxXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5sYXN0RnJhbWUudCApO1xyXG4gICAgdmFyIGR1cmF0aW9uID0gdGhpcy5uZXh0RnJhbWUudCAtIHRoaXMubGFzdEZyYW1lLnQ7XHJcbiAgICB2YXIgZWxhcHNlZCA9IGRlbHRhIC8gZHVyYXRpb247XHJcbiAgICBpZiAoZWxhcHNlZCA+IDEpIGVsYXBzZWQgPSAxO1xyXG4gICAgZWxzZSBpZiAoZWxhcHNlZCA8IDApIGVsYXBzZWQgPSAwO1xyXG4gICAgZWxzZSBpZiAodGhpcy5lYXNpbmcpIGVsYXBzZWQgPSB0aGlzLmVhc2luZyhlbGFwc2VkKTtcclxuICAgIHZhciBhY3R1YWxWZXJ0aWNlcyA9IFtdLFxyXG4gICAgICAgIGFjdHVhbExlbmd0aCA9IFtdO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlc0NvdW50OyBpKyspIHtcclxuICAgICAgICB2YXIgY3AxeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzBdLCB0aGlzLm5leHRGcmFtZS52W2ldWzBdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AxeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzFdLCB0aGlzLm5leHRGcmFtZS52W2ldWzFdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzJdLCB0aGlzLm5leHRGcmFtZS52W2ldWzJdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzNdLCB0aGlzLm5leHRGcmFtZS52W2ldWzNdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzRdLCB0aGlzLm5leHRGcmFtZS52W2ldWzRdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzVdLCB0aGlzLm5leHRGcmFtZS52W2ldWzVdLCBlbGFwc2VkKTtcclxuXHJcbiAgICAgICAgYWN0dWFsVmVydGljZXMucHVzaChbY3AxeCwgY3AxeSwgY3AyeCwgY3AyeSwgeCwgeV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy52ZXJ0aWNlc0NvdW50IC0gMTsgaisrKSB7XHJcbiAgICAgICAgYWN0dWFsTGVuZ3RoLnB1c2godGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLmxlbltqXSwgdGhpcy5uZXh0RnJhbWUubGVuW2pdLCBlbGFwc2VkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ICA6IGFjdHVhbFZlcnRpY2VzLFxyXG4gICAgICAgIGxlbjogYWN0dWFsTGVuZ3RoXHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMucG9pbnRlciA9IHJldmVyc2VkID8gdGhpcy5mcmFtZUNvdW50IC0gMSA6IDE7XHJcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGVkUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4vQmV6aWVyRWFzaW5nJyk7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRlZFByb3BlcnR5KGRhdGEpIHtcclxuICAgIFByb3BlcnR5LmNhbGwodGhpcywgZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lQ291bnQgPSB0aGlzLmZyYW1lcy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQcm9wZXJ0eS5wcm90b3R5cGUpO1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XHJcbiAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgdmFyIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBhcnJbaV0gPSBhW2ldICsgdCAqIChiW2ldIC0gYVtpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBhICsgdCAqIChiIC0gYSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5zZXRFYXNpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBuZXcgQmV6aWVyRWFzaW5nKHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMF0sIHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMV0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblswXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzFdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuZmluaXNoZWQgJiYgdGltZSA+PSB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEZyYW1lLnY7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQgJiYgdGltZSA8PSB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEZyYW1lLnY7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyICsgMSA9PT0gdGhpcy5mcmFtZUNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyIDwgMikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXItLTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZUF0VGltZSh0aW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKHRpbWUsIHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDJdLnQsIHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpO1xyXG5cclxuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aW1lID4gdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5mcmFtZUNvdW50OyBpKyspIHtcclxuICAgICAgICBpZiAodGltZSA+PSB0aGlzLmZyYW1lc1tpIC0gMV0udCAmJiB0aW1lIDw9IHRoaXMuZnJhbWVzW2ldLnQpIHtcclxuICAgICAgICAgICAgdGhpcy5wb2ludGVyID0gaTtcclxuICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1tpIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbaV07XHJcbiAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRFbGFwc2VkID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMubGFzdEZyYW1lLnQgKSxcclxuICAgICAgICBkdXJhdGlvbiA9IHRoaXMubmV4dEZyYW1lLnQgLSB0aGlzLmxhc3RGcmFtZS50LFxyXG4gICAgICAgIGVsYXBzZWQgPSBkZWx0YSAvIGR1cmF0aW9uO1xyXG5cclxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XHJcbiAgICBlbHNlIGlmIChlbGFwc2VkIDwgMCkgZWxhcHNlZCA9IDA7XHJcbiAgICBlbHNlIGlmICh0aGlzLmVhc2luZykgZWxhcHNlZCA9IHRoaXMuZWFzaW5nKGVsYXBzZWQpO1xyXG4gICAgcmV0dXJuIGVsYXBzZWQ7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnBvaW50ZXIgPSByZXZlcnNlZCA/IHRoaXMuZnJhbWVDb3VudCAtIDEgOiAxO1xyXG4gICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRlZFByb3BlcnR5OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIEJlemllcihwYXRoKSB7XHJcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xyXG59XHJcblxyXG5CZXppZXIucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uIChsZW4pIHtcclxuICAgIHRoaXMuc3RlcHMgPSBNYXRoLm1heChNYXRoLmZsb29yKGxlbiAvIDEwKSwgMSk7XHJcbiAgICB0aGlzLmFyY0xlbmd0aHMgPSBuZXcgQXJyYXkodGhpcy5zdGVwcyArIDEpO1xyXG4gICAgdGhpcy5hcmNMZW5ndGhzWzBdID0gMDtcclxuXHJcbiAgICB2YXIgb3ggPSB0aGlzLmN1YmljTigwLCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgIG95ID0gdGhpcy5jdWJpY04oMCwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKSxcclxuICAgICAgICBjbGVuID0gMCxcclxuICAgICAgICBpdGVyYXRvciA9IDEgLyB0aGlzLnN0ZXBzO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IHRoaXMuc3RlcHM7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcy5jdWJpY04oaSAqIGl0ZXJhdG9yLCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgICAgICB5ID0gdGhpcy5jdWJpY04oaSAqIGl0ZXJhdG9yLCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pO1xyXG5cclxuICAgICAgICB2YXIgZHggPSBveCAtIHgsXHJcbiAgICAgICAgICAgIGR5ID0gb3kgLSB5O1xyXG5cclxuICAgICAgICBjbGVuICs9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XHJcbiAgICAgICAgdGhpcy5hcmNMZW5ndGhzW2ldID0gY2xlbjtcclxuXHJcbiAgICAgICAgb3ggPSB4O1xyXG4gICAgICAgIG95ID0geTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxlbmd0aCA9IGNsZW47XHJcbn07XHJcblxyXG5CZXppZXIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uICh1KSB7XHJcbiAgICB2YXIgdGFyZ2V0TGVuZ3RoID0gdSAqIHRoaXMuYXJjTGVuZ3Roc1t0aGlzLnN0ZXBzXTtcclxuICAgIHZhciBsb3cgPSAwLFxyXG4gICAgICAgIGhpZ2ggPSB0aGlzLnN0ZXBzLFxyXG4gICAgICAgIGluZGV4ID0gMDtcclxuXHJcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xyXG4gICAgICAgIGluZGV4ID0gbG93ICsgKCgoaGlnaCAtIGxvdykgLyAyKSB8IDApO1xyXG4gICAgICAgIGlmICh0aGlzLmFyY0xlbmd0aHNbaW5kZXhdIDwgdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxvdyA9IGluZGV4ICsgMTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGlnaCA9IGluZGV4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmFyY0xlbmd0aHNbaW5kZXhdID4gdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgaW5kZXgtLTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbGVuZ3RoQmVmb3JlID0gdGhpcy5hcmNMZW5ndGhzW2luZGV4XTtcclxuICAgIGlmIChsZW5ndGhCZWZvcmUgPT09IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBpbmRleCAvIHRoaXMuc3RlcHM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiAoaW5kZXggKyAodGFyZ2V0TGVuZ3RoIC0gbGVuZ3RoQmVmb3JlKSAvICh0aGlzLmFyY0xlbmd0aHNbaW5kZXggKyAxXSAtIGxlbmd0aEJlZm9yZSkpIC8gdGhpcy5zdGVwcztcclxuICAgIH1cclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUuZ2V0VmFsdWVzID0gZnVuY3Rpb24gKGVsYXBzZWQpIHtcclxuICAgIHZhciB0ID0gdGhpcy5tYXAoZWxhcHNlZCksXHJcbiAgICAgICAgeCA9IHRoaXMuY3ViaWNOKHQsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgeSA9IHRoaXMuY3ViaWNOKHQsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSk7XHJcblxyXG4gICAgcmV0dXJuIFt4LCB5XTtcclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUuY3ViaWNOID0gZnVuY3Rpb24gKHBjdCwgYSwgYiwgYywgZCkge1xyXG4gICAgdmFyIHQyID0gcGN0ICogcGN0O1xyXG4gICAgdmFyIHQzID0gdDIgKiBwY3Q7XHJcbiAgICByZXR1cm4gYSArICgtYSAqIDMgKyBwY3QgKiAoMyAqIGEgLSBhICogcGN0KSkgKiBwY3RcclxuICAgICAgICArICgzICogYiArIHBjdCAqICgtNiAqIGIgKyBiICogMyAqIHBjdCkpICogcGN0XHJcbiAgICAgICAgKyAoYyAqIDMgLSBjICogMyAqIHBjdCkgKiB0MlxyXG4gICAgICAgICsgZCAqIHQzO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCZXppZXI7IiwiLyoqXHJcbiAqIEJlemllckVhc2luZyAtIHVzZSBiZXppZXIgY3VydmUgZm9yIHRyYW5zaXRpb24gZWFzaW5nIGZ1bmN0aW9uXHJcbiAqIGlzIGJhc2VkIG9uIEZpcmVmb3gncyBuc1NNSUxLZXlTcGxpbmUuY3BwXHJcbiAqIFVzYWdlOlxyXG4gKiB2YXIgc3BsaW5lID0gQmV6aWVyRWFzaW5nKDAuMjUsIDAuMSwgMC4yNSwgMS4wKVxyXG4gKiBzcGxpbmUoeCkgPT4gcmV0dXJucyB0aGUgZWFzaW5nIHZhbHVlIHwgeCBtdXN0IGJlIGluIFswLCAxXSByYW5nZVxyXG4gKlxyXG4gKi9cclxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XHJcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cuZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHdpbmRvdy5kZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgd2luZG93LmRlZmluZShbXSwgZGVmaW5pdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdpbmRvdy5CZXppZXJFYXNpbmcgPSBkZWZpbml0aW9uKCk7XHJcbiAgICB9XHJcbn0oZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8vIFRoZXNlIHZhbHVlcyBhcmUgZXN0YWJsaXNoZWQgYnkgZW1waXJpY2lzbSB3aXRoIHRlc3RzICh0cmFkZW9mZjogcGVyZm9ybWFuY2UgVlMgcHJlY2lzaW9uKVxyXG4gICAgdmFyIE5FV1RPTl9JVEVSQVRJT05TID0gNDtcclxuICAgIHZhciBORVdUT05fTUlOX1NMT1BFID0gMC4wMDE7XHJcbiAgICB2YXIgU1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxO1xyXG4gICAgdmFyIFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TID0gMTA7XHJcblxyXG4gICAgdmFyIGtTcGxpbmVUYWJsZVNpemUgPSAxMTtcclxuICAgIHZhciBrU2FtcGxlU3RlcFNpemUgPSAxLjAgLyAoa1NwbGluZVRhYmxlU2l6ZSAtIDEuMCk7XHJcblxyXG4gICAgdmFyIGZsb2F0MzJBcnJheVN1cHBvcnRlZCA9IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09IFwiZnVuY3Rpb25cIjtcclxuXHJcbiAgICBmdW5jdGlvbiBCZXppZXJFYXNpbmcgKG1YMSwgbVkxLCBtWDIsIG1ZMikge1xyXG5cclxuICAgICAgICAvLyBWYWxpZGF0ZSBhcmd1bWVudHNcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gNCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgcmVxdWlyZXMgNCBhcmd1bWVudHMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8NDsgKytpKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGlzTmFOKGFyZ3VtZW50c1tpXSkgfHwgIWlzRmluaXRlKGFyZ3VtZW50c1tpXSkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyBhcmd1bWVudHMgc2hvdWxkIGJlIGludGVnZXJzLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobVgxIDwgMCB8fCBtWDEgPiAxIHx8IG1YMiA8IDAgfHwgbVgyID4gMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgeCB2YWx1ZXMgbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2UuXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG1TYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBBIChhQTEsIGFBMikgeyByZXR1cm4gMS4wIC0gMy4wICogYUEyICsgMy4wICogYUExOyB9XHJcbiAgICAgICAgZnVuY3Rpb24gQiAoYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEMgKGFBMSkgICAgICB7IHJldHVybiAzLjAgKiBhQTE7IH1cclxuXHJcbiAgICAgICAgLy8gUmV0dXJucyB4KHQpIGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIHkodCkgZ2l2ZW4gdCwgeTEsIGFuZCB5Mi5cclxuICAgICAgICBmdW5jdGlvbiBjYWxjQmV6aWVyIChhVCwgYUExLCBhQTIpIHtcclxuICAgICAgICAgICAgcmV0dXJuICgoQShhQTEsIGFBMikqYVQgKyBCKGFBMSwgYUEyKSkqYVQgKyBDKGFBMSkpKmFUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmV0dXJucyBkeC9kdCBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciBkeS9kdCBnaXZlbiB0LCB5MSwgYW5kIHkyLlxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFNsb3BlIChhVCwgYUExLCBhQTIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDMuMCAqIEEoYUExLCBhQTIpKmFUKmFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlIChhWCwgYUd1ZXNzVCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNsb3BlID09PSAwLjApIHJldHVybiBhR3Vlc3NUO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRYID0gY2FsY0JlemllcihhR3Vlc3NULCBtWDEsIG1YMikgLSBhWDtcclxuICAgICAgICAgICAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjYWxjU2FtcGxlVmFsdWVzICgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrU3BsaW5lVGFibGVTaXplOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIG1TYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlIChhWCwgYUEsIGFCKSB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50WCwgY3VycmVudFQsIGkgPSAwO1xyXG4gICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMi4wO1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50WCA+IDAuMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFCID0gY3VycmVudFQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IFNVQkRJVklTSU9OX1BSRUNJU0lPTiAmJiArK2kgPCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyk7XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50VDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFRGb3JYIChhWCkge1xyXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxTdGFydCA9IDAuMDtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTYW1wbGUgPSAxO1xyXG4gICAgICAgICAgICB2YXIgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT0gbGFzdFNhbXBsZSAmJiBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyArK2N1cnJlbnRTYW1wbGUpIHtcclxuICAgICAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC0tY3VycmVudFNhbXBsZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludGVycG9sYXRlIHRvIHByb3ZpZGUgYW4gaW5pdGlhbCBndWVzcyBmb3IgdFxyXG4gICAgICAgICAgICB2YXIgZGlzdCA9IChhWCAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZSsxXSAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pO1xyXG4gICAgICAgICAgICB2YXIgZ3Vlc3NGb3JUID0gaW50ZXJ2YWxTdGFydCArIGRpc3QgKiBrU2FtcGxlU3RlcFNpemU7XHJcblxyXG4gICAgICAgICAgICB2YXIgaW5pdGlhbFNsb3BlID0gZ2V0U2xvcGUoZ3Vlc3NGb3JULCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsU2xvcGUgPj0gTkVXVE9OX01JTl9TTE9QRSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBndWVzc0ZvclQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluaXRpYWxTbG9wZSA9PSAwLjApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBndWVzc0ZvclQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmluYXJ5U3ViZGl2aWRlKGFYLCBpbnRlcnZhbFN0YXJ0LCBpbnRlcnZhbFN0YXJ0ICsga1NhbXBsZVN0ZXBTaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1YMSAhPSBtWTEgfHwgbVgyICE9IG1ZMilcclxuICAgICAgICAgICAgY2FsY1NhbXBsZVZhbHVlcygpO1xyXG5cclxuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChhWCkge1xyXG4gICAgICAgICAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHJldHVybiBhWDsgLy8gbGluZWFyXHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2UgSmF2YVNjcmlwdCBudW1iZXIgYXJlIGltcHJlY2lzZSwgd2Ugc2hvdWxkIGd1YXJhbnRlZSB0aGUgZXh0cmVtZXMgYXJlIHJpZ2h0LlxyXG4gICAgICAgICAgICBpZiAoYVggPT09IDApIHJldHVybiAwO1xyXG4gICAgICAgICAgICBpZiAoYVggPT09IDEpIHJldHVybiAxO1xyXG4gICAgICAgICAgICByZXR1cm4gY2FsY0JlemllcihnZXRURm9yWChhWCksIG1ZMSwgbVkyKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBzdHIgPSBcIkJlemllckVhc2luZyhcIitbbVgxLCBtWTEsIG1YMiwgbVkyXStcIilcIjtcclxuICAgICAgICBmLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gc3RyOyB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDU1MgbWFwcGluZ1xyXG4gICAgQmV6aWVyRWFzaW5nLmNzcyA9IHtcclxuICAgICAgICBcImVhc2VcIjogICAgICAgIEJlemllckVhc2luZygwLjI1LCAwLjEsIDAuMjUsIDEuMCksXHJcbiAgICAgICAgXCJsaW5lYXJcIjogICAgICBCZXppZXJFYXNpbmcoMC4wMCwgMC4wLCAxLjAwLCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1pblwiOiAgICAgQmV6aWVyRWFzaW5nKDAuNDIsIDAuMCwgMS4wMCwgMS4wKSxcclxuICAgICAgICBcImVhc2Utb3V0XCI6ICAgIEJlemllckVhc2luZygwLjAwLCAwLjAsIDAuNTgsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLWluLW91dFwiOiBCZXppZXJFYXNpbmcoMC40MiwgMC4wLCAwLjU4LCAxLjApXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBCZXppZXJFYXNpbmc7XHJcbn0pKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBFbGxpcHNlKGRhdGEpIHtcclxuICAgIC8vdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuc2l6ZSA9IGRhdGEuc2l6ZS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zaXplKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNpemUpO1xyXG4gICAgLy9vcHRpb25hbFxyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxufVxyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcblxyXG4gICAgdmFyIHNpemUgPSB0aGlzLnNpemUuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXTtcclxuXHJcbiAgICB2YXIgaSwgajtcclxuXHJcbiAgICB2YXIgdyA9IHNpemVbMF0gLyAyLFxyXG4gICAgICAgIGggPSBzaXplWzFdIC8gMixcclxuICAgICAgICB4ID0gcG9zaXRpb25bMF0gLSB3LFxyXG4gICAgICAgIHkgPSBwb3NpdGlvblsxXSAtIGgsXHJcbiAgICAgICAgb3cgPSB3ICogLjU1MjI4NDgsXHJcbiAgICAgICAgb2ggPSBoICogLjU1MjI4NDg7XHJcblxyXG4gICAgdmFyIHZlcnRpY2VzID0gW1xyXG4gICAgICAgIFt4ICsgdyArIG93LCB5LCB4ICsgdyAtIG93LCB5LCB4ICsgdywgeV0sXHJcbiAgICAgICAgW3ggKyB3ICsgdywgeSArIGggKyBvaCwgeCArIHcgKyB3LCB5ICsgaCAtIG9oLCB4ICsgdyArIHcsIHkgKyBoXSxcclxuICAgICAgICBbeCArIHcgLSBvdywgeSArIGggKyBoLCB4ICsgdyArIG93LCB5ICsgaCArIGgsIHggKyB3LCB5ICsgaCArIGhdLFxyXG4gICAgICAgIFt4LCB5ICsgaCAtIG9oLCB4LCB5ICsgaCArIG9oLCB4LCB5ICsgaF1cclxuICAgIF07XHJcblxyXG4gICAgaWYgKHRyaW0pIHtcclxuICAgICAgICB2YXIgdHYsXHJcbiAgICAgICAgICAgIGxlbiA9IHcgKyBoO1xyXG5cclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGogPSBpICsgMTtcclxuICAgICAgICAgICAgaWYgKGogPiAzKSBqID0gMDtcclxuICAgICAgICAgICAgaWYgKGkgPiB0cmltLnN0YXJ0SW5kZXggJiYgaSA8IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZlcnRpY2VzW2ldWzBdLCB2ZXJ0aWNlc1tpXVsxXSwgdmVydGljZXNbal1bMl0sIHZlcnRpY2VzW2pdWzNdLCB2ZXJ0aWNlc1tqXVs0XSwgdmVydGljZXNbal1bNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uc3RhcnRJbmRleCAmJiBpID09PSB0cmltLmVuZEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIHRyaW0uc3RhcnQsIHRyaW0uZW5kLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uc3RhcnRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCB0cmltLnN0YXJ0LCAxLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgMCwgdHJpbS5lbmQsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGogPSBpICsgMTtcclxuICAgICAgICAgICAgaWYgKGogPiAzKSBqID0gMDtcclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odmVydGljZXNbaV1bMF0sIHZlcnRpY2VzW2ldWzFdLCB2ZXJ0aWNlc1tqXVsyXSwgdmVydGljZXNbal1bM10sIHZlcnRpY2VzW2pdWzRdLCB2ZXJ0aWNlc1tqXVs1XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltKSB7XHJcbiAgICB2YXIgc3RhcnRJbmRleCA9IE1hdGguZmxvb3IodHJpbS5zdGFydCAqIDQpLFxyXG4gICAgICAgIGVuZEluZGV4ID0gTWF0aC5mbG9vcih0cmltLmVuZCAqIDQpLFxyXG4gICAgICAgIHN0YXJ0ID0gKHRyaW0uc3RhcnQgLSBzdGFydEluZGV4ICogMC4yNSkgKiA0LFxyXG4gICAgICAgIGVuZCA9ICh0cmltLmVuZCAtIGVuZEluZGV4ICogMC4yNSkgKiA0O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogc3RhcnRJbmRleCxcclxuICAgICAgICBlbmRJbmRleCAgOiBlbmRJbmRleCxcclxuICAgICAgICBzdGFydCAgICAgOiBzdGFydCxcclxuICAgICAgICBlbmQgICAgICAgOiBlbmRcclxuICAgIH07XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5zaXplLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbGxpcHNlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEZpbGwoZGF0YSkge1xyXG4gICAgdGhpcy5jb2xvciA9IGRhdGEuY29sb3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpIDogbmV3IFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcbkZpbGwucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuY29sb3IuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSA6IDE7XHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoY29sb3JbMF0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMV0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMl0pICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5zZXRDb2xvciA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuZ2V0VmFsdWUodGltZSk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5jb2xvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuRmlsbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuY29sb3IucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsbDsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBHcmFkaWVudEZpbGwoZGF0YSwgZ3JhZGllbnRzKSB7XHJcbiAgICBpZiAoIWdyYWRpZW50c1tkYXRhLm5hbWVdKSBncmFkaWVudHNbZGF0YS5uYW1lXSA9IFtdO1xyXG4gICAgZ3JhZGllbnRzW2RhdGEubmFtZV0ucHVzaCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnN0b3BzID0gZGF0YS5zdG9wcztcclxuICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZTtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IGRhdGEuc3RhcnRQb2ludC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zdGFydFBvaW50KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnN0YXJ0UG9pbnQpO1xyXG4gICAgdGhpcy5lbmRQb2ludCA9IGRhdGEuZW5kUG9pbnQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZW5kUG9pbnQpIDogbmV3IFByb3BlcnR5KGRhdGEuZW5kUG9pbnQpO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcbkdyYWRpZW50RmlsbC5wcm90b3R5cGUuc2V0Q29sb3IgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmFuc2Zvcm0pIHtcclxuXHJcbiAgICB2YXIgcG9zaXRpb25YID0gMDtcclxuICAgIHZhciBwb3NpdGlvblkgPSAwO1xyXG5cclxuICAgIGlmICh0cmFuc2Zvcm0ucG9zaXRpb24pIHtcclxuICAgICAgICB2YXIgcG9zaXRpb24gPSB0cmFuc2Zvcm0ucG9zaXRpb24uZ2V0VmFsdWUodGltZSwgY3R4KTtcclxuICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblswXTtcclxuICAgICAgICBwb3NpdGlvblkgPSBwb3NpdGlvblsxXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcG9zaXRpb25YID0gdHJhbnNmb3JtLnBvc2l0aW9uWCA/IHRyYW5zZm9ybS5wb3NpdGlvblguZ2V0VmFsdWUodGltZSkgOiAwO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHRyYW5zZm9ybS5wb3NpdGlvblkgPyB0cmFuc2Zvcm0ucG9zaXRpb25ZLmdldFZhbHVlKHRpbWUpIDogMDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc3RhcnRQb2ludCA9IHRoaXMuc3RhcnRQb2ludC5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBlbmRQb2ludCA9IHRoaXMuZW5kUG9pbnQuZ2V0VmFsdWUodGltZSk7XHJcblxyXG4gICAgLy8gdmFyIHN0YXJ0WCA9IHN0YXJ0UG9pbnRbMF0gLSBwb3NpdGlvblg7XHJcbiAgICAvLyB2YXIgc3RhcnRZID0gc3RhcnRQb2ludFsxXSAtIHBvc2l0aW9uWTtcclxuICAgIC8vIHZhciBlbmRYID0gZW5kUG9pbnRbMF0gLSBwb3NpdGlvblg7XHJcbiAgICAvLyB2YXIgZW5kWSA9IGVuZFBvaW50WzFdIC0gcG9zaXRpb25ZO1xyXG4gICAgLy9cclxuICAgIHZhciBzdGFydFggPSBzdGFydFBvaW50WzBdO1xyXG4gICAgdmFyIHN0YXJ0WSA9IHN0YXJ0UG9pbnRbMV07XHJcbiAgICB2YXIgZW5kWCA9IGVuZFBvaW50WzBdO1xyXG4gICAgdmFyIGVuZFkgPSBlbmRQb2ludFsxXTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhwb3NpdGlvblgsIHBvc2l0aW9uWSk7XHJcbiAgICBjb25zb2xlLmxvZyhzdGFydFgsIHN0YXJ0WSk7XHJcbiAgICBjb25zb2xlLmxvZyhlbmRYLCBlbmRZKTtcclxuXHJcbiAgICB2YXIgcmFkaXVzID0gMDtcclxuXHJcbiAgICBpZiAodGhpcy50eXBlID09PSAncmFkaWFsJykge1xyXG4gICAgICAgIHZhciBkaXN0WCA9IHN0YXJ0WCAtIGVuZFg7XHJcbiAgICAgICAgdmFyIGRpc3RZID0gc3RhcnRZIC0gZW5kWTtcclxuICAgICAgICByYWRpdXMgPSBNYXRoLnNxcnQoZGlzdFggKiBkaXN0WCArIGRpc3RZICogZGlzdFkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBncmFkaWVudCA9IHRoaXMudHlwZSA9PT0gJ3JhZGlhbCcgP1xyXG4gICAgICAgIGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChzdGFydFgsIHN0YXJ0WSwgMCwgc3RhcnRYLCBzdGFydFksIHJhZGl1cykgOlxyXG4gICAgICAgIGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudChzdGFydFgsIHN0YXJ0WSwgZW5kWCwgZW5kWSk7XHJcblxyXG4gICAgdmFyIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkgPyB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgOiAxO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdG9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBzdG9wID0gdGhpcy5zdG9wc1tpXTtcclxuICAgICAgICB2YXIgY29sb3IgPSBzdG9wLmNvbG9yO1xyXG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChzdG9wLmxvY2F0aW9uLCAncmdiYSgnICsgY29sb3JbMF0gKyAnLCAnICsgY29sb3JbMV0gKyAnLCAnICsgY29sb3JbMl0gKyAnLCAnICsgY29sb3JbM10gKiBvcGFjaXR5ICsgJyknKTtcclxuICAgICAgICAvLyBncmFkaWVudC5hZGRDb2xvclN0b3Aoc3RvcC5sb2NhdGlvbiwgJ3JnYmEoJyArIGNvbG9yWzBdICsgJywgJyArIGNvbG9yWzFdICsgJywgJyArIGNvbG9yWzJdICsgJywgJyArIDAuMjUgKyAnKScpO1xyXG4gICAgfVxyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gJ2dyZWVuJztcclxuICAgIGN0eC5maWxsUmVjdCgwLCAwLCAyMCwgMjApO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdyZWQnO1xyXG4gICAgY3R4LmZpbGxSZWN0KHN0YXJ0WCwgc3RhcnRZLCAyMCwgMjApO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdibHVlJztcclxuICAgIGN0eC5maWxsUmVjdChlbmRYLCBlbmRZLCAyMCwgMjApO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbn07XHJcblxyXG5HcmFkaWVudEZpbGwucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5zdGFydFBvaW50LnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMuZW5kUG9pbnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuR3JhZGllbnRGaWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnNldEtleWZyYW1lcyhyZXZlcnNlZCk7XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQuc2V0S2V5ZnJhbWVzKHJldmVyc2VkKTtcclxuICAgIHRoaXMuZW5kUG9pbnQuc2V0S2V5ZnJhbWVzKHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR3JhZGllbnRGaWxsOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTdHJva2UgPSByZXF1aXJlKCcuL1N0cm9rZScpLFxyXG4gICAgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpLFxyXG4gICAgRWxsaXBzZSA9IHJlcXVpcmUoJy4vRWxsaXBzZScpLFxyXG4gICAgUG9seXN0YXIgPSByZXF1aXJlKCcuL1BvbHlzdGFyJyksXHJcbiAgICBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpLFxyXG4gICAgRmlsbCA9IHJlcXVpcmUoJy4vRmlsbCcpLFxyXG4gICAgR3JhZGllbnRGaWxsID0gcmVxdWlyZSgnLi9HcmFkaWVudEZpbGwnKSxcclxuICAgIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXHJcbiAgICBNZXJnZSA9IHJlcXVpcmUoJy4vTWVyZ2UnKSxcclxuICAgIFRyaW0gPSByZXF1aXJlKCcuL1RyaW0nKTtcclxuXHJcbmZ1bmN0aW9uIEdyb3VwKGRhdGEsIGJ1ZmZlckN0eCwgcGFyZW50SW4sIHBhcmVudE91dCwgZ3JhZGllbnRzKSB7XHJcblxyXG4gICAgdGhpcy5pbmRleCA9IGRhdGEuaW5kZXg7XHJcbiAgICB0aGlzLmluID0gZGF0YS5pbiA/IGRhdGEuaW4gOiBwYXJlbnRJbjtcclxuICAgIHRoaXMub3V0ID0gZGF0YS5vdXQgPyBkYXRhLm91dCA6IHBhcmVudE91dDtcclxuXHJcbiAgICBpZiAoZGF0YS5wYXJlbnQpIHRoaXMucGFyZW50ID0gZGF0YS5wYXJlbnQ7XHJcbiAgICBpZiAoZGF0YS5maWxsKSB0aGlzLmZpbGwgPSBuZXcgRmlsbChkYXRhLmZpbGwpO1xyXG4gICAgaWYgKGRhdGEuZ3JhZGllbnRGaWxsKSB0aGlzLmZpbGwgPSBuZXcgR3JhZGllbnRGaWxsKGRhdGEuZ3JhZGllbnRGaWxsLCBncmFkaWVudHMpO1xyXG4gICAgaWYgKGRhdGEuc3Ryb2tlKSB0aGlzLnN0cm9rZSA9IG5ldyBTdHJva2UoZGF0YS5zdHJva2UpO1xyXG4gICAgaWYgKGRhdGEudHJpbSkgdGhpcy50cmltID0gbmV3IFRyaW0oZGF0YS50cmltKTtcclxuICAgIGlmIChkYXRhLm1lcmdlKSB0aGlzLm1lcmdlID0gbmV3IE1lcmdlKGRhdGEubWVyZ2UpO1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybShkYXRhLnRyYW5zZm9ybSk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IGJ1ZmZlckN0eDtcclxuXHJcbiAgICBpZiAoZGF0YS5ncm91cHMpIHtcclxuICAgICAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHMucHVzaChuZXcgR3JvdXAoZGF0YS5ncm91cHNbaV0sIHRoaXMuYnVmZmVyQ3R4LCB0aGlzLmluLCB0aGlzLm91dCwgZ3JhZGllbnRzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLnNoYXBlcykge1xyXG4gICAgICAgIHRoaXMuc2hhcGVzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkYXRhLnNoYXBlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB2YXIgc2hhcGUgPSBkYXRhLnNoYXBlc1tqXTtcclxuICAgICAgICAgICAgaWYgKHNoYXBlLnR5cGUgPT09ICdwYXRoJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlLmlzQW5pbWF0ZWQpIHRoaXMuc2hhcGVzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChzaGFwZSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzLnNoYXBlcy5wdXNoKG5ldyBQYXRoKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3JlY3QnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBSZWN0KHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2VsbGlwc2UnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBFbGxpcHNlKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3BvbHlzdGFyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgUG9seXN0YXIoc2hhcGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5tYXNrcykge1xyXG4gICAgICAgIHRoaXMubWFza3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRhdGEubWFza3MubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgdmFyIG1hc2sgPSBkYXRhLm1hc2tzW2tdO1xyXG4gICAgICAgICAgICBpZiAobWFzay5pc0FuaW1hdGVkKSB0aGlzLm1hc2tzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChtYXNrKSk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5tYXNrcy5wdXNoKG5ldyBQYXRoKG1hc2spKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbkdyb3VwLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgcGFyZW50RmlsbCwgcGFyZW50U3Ryb2tlLCBwYXJlbnRUcmltLCBpc0J1ZmZlcikge1xyXG5cclxuICAgIGlmICh0aGlzLnRyYW5zZm9ybS5vcGFjaXR5ICYmIHRoaXMudHJhbnNmb3JtLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgPT09IDApIHJldHVybjtcclxuXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG5cclxuICAgIC8vVE9ETyBjaGVjayBpZiBjb2xvci9zdHJva2UgaXMgY2hhbmdpbmcgb3ZlciB0aW1lXHJcbiAgICB2YXIgZmlsbCA9IHRoaXMuZmlsbCB8fCBwYXJlbnRGaWxsO1xyXG4gICAgdmFyIHN0cm9rZSA9IHRoaXMuc3Ryb2tlIHx8IHBhcmVudFN0cm9rZTtcclxuICAgIHZhciB0cmltVmFsdWVzID0gdGhpcy50cmltID8gdGhpcy50cmltLmdldFRyaW0odGltZSkgOiBwYXJlbnRUcmltO1xyXG5cclxuICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKGN0eCwgdGltZSwgdGhpcy50cmFuc2Zvcm0pO1xyXG4gICAgaWYgKHN0cm9rZSkgc3Ryb2tlLnNldFN0cm9rZShjdHgsIHRpbWUpO1xyXG5cclxuICAgIGlmICghaXNCdWZmZXIpIHtcclxuICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHRoaXMucGFyZW50LnNldFBhcmVudFRyYW5zZm9ybShjdHgsIHRpbWUpO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtLnRyYW5zZm9ybShjdHgsIHRpbWUpO1xyXG4gICAgfVxyXG4gICAgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5tZXJnZSkge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LnNhdmUoKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuYnVmZmVyQ3R4LmNhbnZhcy53aWR0aCwgdGhpcy5idWZmZXJDdHguY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICBpZiAoZmlsbCkgZmlsbC5zZXRDb2xvcih0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XHJcbiAgICAgICAgaWYgKHN0cm9rZSkgc3Ryb2tlLnNldFN0cm9rZSh0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMubWFza3MpIHtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMubWFza3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5tYXNrc1tpXS5kcmF3KGN0eCwgdGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN0eC5jbGlwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgaWYgKHRoaXMuc2hhcGVzKSB0aGlzLmRyYXdTaGFwZXMoY3R4LCB0aW1lLCBmaWxsLCBzdHJva2UsIHRyaW1WYWx1ZXMpO1xyXG5cclxuICAgIC8vVE9ETyBnZXQgb3JkZXJcclxuICAgIGlmIChmaWxsKSBjdHguZmlsbCgpO1xyXG4gICAgaWYgKCFpc0J1ZmZlciAmJiBzdHJva2UpIGN0eC5zdHJva2UoKTtcclxuXHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHRoaXMuZHJhd0dyb3VwcyhjdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcyk7XHJcblxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxuICAgIHRoaXMuYnVmZmVyQ3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbkdyb3VwLnByb3RvdHlwZS5kcmF3U2hhcGVzID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzKSB7XHJcbiAgICB2YXIgaTtcclxuICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLmRyYXcodGhpcy5idWZmZXJDdHgsIHRpbWUsIHRyaW1WYWx1ZXMpO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgaWYgKGZpbGwpIHRoaXMuYnVmZmVyQ3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgaWYgKHN0cm9rZSkgdGhpcy5idWZmZXJDdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuYnVmZmVyQ3R4LmNhbnZhcywgMCwgMCk7XHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KGN0eCwgdGltZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnNoYXBlc1t0aGlzLnNoYXBlcy5sZW5ndGggLSAxXS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgLy9jdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuXHJcbkdyb3VwLnByb3RvdHlwZS5kcmF3R3JvdXBzID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzKSB7XHJcbiAgICB2YXIgaTtcclxuICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aW1lID49IHRoaXMuZ3JvdXBzW2ldLmluICYmIHRpbWUgPD0gdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCBmaWxsLCBzdHJva2UsIHRyaW1WYWx1ZXMsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tZXJnZS5zZXRDb21wb3NpdGVPcGVyYXRpb24odGhpcy5idWZmZXJDdHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuYnVmZmVyQ3R4LmNhbnZhcywgMCwgMCk7XHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8PSB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcoY3R4LCB0aW1lLCBmaWxsLCBzdHJva2UsIHRyaW1WYWx1ZXMsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkdyb3VwLnByb3RvdHlwZS5zZXRQYXJlbnRUcmFuc2Zvcm0gPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5wYXJlbnQpIHRoaXMucGFyZW50LnNldFBhcmVudFRyYW5zZm9ybShjdHgsIHRpbWUpO1xyXG4gICAgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcbn07XHJcblxyXG5Hcm91cC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnNldEtleWZyYW1lcyh0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5tYXNrcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLm1hc2tzW2pdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2tdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZmlsbCkgdGhpcy5maWxsLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnN0cm9rZSkgdGhpcy5zdHJva2Uuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMudHJpbSkgdGhpcy50cmltLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkdyb3VwLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG5cclxuICAgIGlmICh0aGlzLnNoYXBlcykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLm1hc2tzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLm1hc2tzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFza3Nbal0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNba10ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zdHJva2UpIHRoaXMuc3Ryb2tlLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnRyaW0pIHRoaXMudHJpbS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyk7XHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyk7XHJcbnZhciBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpO1xyXG5cclxuZnVuY3Rpb24gSW1hZ2VMYXllcihkYXRhLCBwYXJlbnRJbiwgcGFyZW50T3V0LCBiYXNlUGF0aCkge1xyXG5cclxuICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcclxuXHJcbiAgICB0aGlzLmluZGV4ID0gZGF0YS5pbmRleDtcclxuICAgIHRoaXMuc291cmNlID0gYmFzZVBhdGggKyBkYXRhLnNvdXJjZTtcclxuICAgIHRoaXMuaW4gPSBkYXRhLmluID8gZGF0YS5pbiA6IHBhcmVudEluO1xyXG4gICAgdGhpcy5vdXQgPSBkYXRhLm91dCA/IGRhdGEub3V0IDogcGFyZW50T3V0O1xyXG5cclxuICAgIGlmIChkYXRhLnBhcmVudCkgdGhpcy5wYXJlbnQgPSBkYXRhLnBhcmVudDtcclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0oZGF0YS50cmFuc2Zvcm0pO1xyXG5cclxuICAgIGlmIChkYXRhLm1hc2tzKSB7XHJcbiAgICAgICAgdGhpcy5tYXNrcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGF0YS5tYXNrcy5sZW5ndGg7IGsrKykge1xyXG4gICAgICAgICAgICB2YXIgbWFzayA9IGRhdGEubWFza3Nba107XHJcbiAgICAgICAgICAgIGlmIChtYXNrLmlzQW5pbWF0ZWQpIHRoaXMubWFza3MucHVzaChuZXcgQW5pbWF0ZWRQYXRoKG1hc2spKTtcclxuICAgICAgICAgICAgZWxzZSB0aGlzLm1hc2tzLnB1c2gobmV3IFBhdGgobWFzaykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuSW1hZ2VMYXllci5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uIChjYikge1xyXG4gICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2U7XHJcbiAgICB0aGlzLmltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBjYigpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLmltZy5zcmMgPSB0aGlzLnNvdXJjZTtcclxufTtcclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgaWYgKCF0aGlzLmlzTG9hZGVkKSByZXR1cm47XHJcblxyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGlmICh0aGlzLnBhcmVudCkgdGhpcy5wYXJlbnQuc2V0UGFyZW50VHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0oY3R4LCB0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFza3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5tYXNrc1tpXS5kcmF3KGN0eCwgdGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN0eC5jbGlwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCk7XHJcblxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLnNldFBhcmVudFRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIGlmICh0aGlzLnBhcmVudCkgdGhpcy5wYXJlbnQuc2V0UGFyZW50VHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0oY3R4LCB0aW1lKTtcclxufTtcclxuXHJcbkltYWdlTGF5ZXIucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5tYXNrcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5tYXNrcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLm1hc2tzW2pdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5JbWFnZUxheWVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG5cclxuICAgIGlmICh0aGlzLm1hc2tzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLm1hc2tzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFza3Nbal0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMYXllcjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIE1lcmdlKGRhdGEpIHtcclxuICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZTtcclxufVxyXG5cclxuTWVyZ2UucHJvdG90eXBlLnNldENvbXBvc2l0ZU9wZXJhdGlvbiA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdXQnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWluJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3hvcic7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXJnZTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpO1xyXG5cclxuZnVuY3Rpb24gUGF0aChkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gZGF0YS5jbG9zZWQ7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGEuZnJhbWVzO1xyXG4gICAgdGhpcy52ZXJ0aWNlc0NvdW50ID0gdGhpcy5mcmFtZXNbMF0udi5sZW5ndGg7XHJcbn1cclxuXHJcblBhdGgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcbiAgICB2YXIgZnJhbWUgPSB0aGlzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHZlcnRpY2VzID0gZnJhbWUudjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIGlmICgodHJpbS5zdGFydCA9PT0gMCAmJiB0cmltLmVuZCA9PT0gMCkgfHxcclxuICAgICAgICAgICAgKHRyaW0uc3RhcnQgPT09IDEgJiYgdHJpbS5lbmQgPT09IDEpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0sIGZyYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDE7IGogPCB2ZXJ0aWNlcy5sZW5ndGg7IGorKykge1xyXG5cclxuICAgICAgICB2YXIgbmV4dFZlcnRleCA9IHZlcnRpY2VzW2pdLFxyXG4gICAgICAgICAgICBsYXN0VmVydGV4ID0gdmVydGljZXNbaiAtIDFdO1xyXG5cclxuICAgICAgICBpZiAodHJpbSkge1xyXG4gICAgICAgICAgICB2YXIgdHY7XHJcblxyXG4gICAgICAgICAgICBpZiAoaiA9PT0gMSAmJiB0cmltLnN0YXJ0SW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSAmJiBqID09PSB0cmltLmVuZEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uc3RhcnRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIHRyaW0uc3RhcnQsIDEsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCAwLCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA+IHRyaW0uc3RhcnRJbmRleCArIDEgJiYgaiA8IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChqID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRyaW0gJiYgdGhpcy5jbG9zZWQpIHtcclxuICAgICAgICBpZiAoIW5leHRWZXJ0ZXgpIGRlYnVnZ2VyO1xyXG4gICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKG5leHRWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMV0sIHZlcnRpY2VzWzBdWzJdLCB2ZXJ0aWNlc1swXVszXSwgdmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgIH1cclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltLCBmcmFtZSkge1xyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgdmFyIGFjdHVhbFRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogMCxcclxuICAgICAgICBlbmRJbmRleDogMCxcclxuICAgICAgICBzdGFydDogMCxcclxuICAgICAgICBlbmQ6IDBcclxuICAgIH07XHJcblxyXG4vLyBUT0RPIGNsZWFuIHVwXHJcbiAgICBpZiAodHJpbS5zdGFydCA9PT0gMCkge1xyXG4gICAgICAgIGlmICh0cmltLmVuZCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBmcmFtZS5sZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdG90YWxMZW4gPSB0aGlzLnN1bUFycmF5KGZyYW1lLmxlbiksXHJcbiAgICAgICAgdHJpbUF0TGVuO1xyXG5cclxuICAgIHRyaW1BdExlbiA9IHRvdGFsTGVuICogdHJpbS5zdGFydDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRyaW1BdExlbiA+IDAgJiYgdHJpbUF0TGVuIDwgZnJhbWUubGVuW2ldKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnQgPSB0cmltQXRMZW4gLyBmcmFtZS5sZW5baV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGZyYW1lLmxlbi5sZW5ndGg7XHJcbiAgICAgICAgYWN0dWFsVHJpbS5lbmQgPSAxO1xyXG4gICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0cmltQXRMZW4gPSB0b3RhbExlbiAqIHRyaW0uZW5kO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0cmltQXRMZW4gPiAwICYmIHRyaW1BdExlbiA8IGZyYW1lLmxlbltpXSkge1xyXG4gICAgICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IHRyaW1BdExlbiAvIGZyYW1lLmxlbltpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cmltQXRMZW4gLT0gZnJhbWUubGVuW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnRyaW0gPSBmdW5jdGlvbiAobGFzdFZlcnRleCwgbmV4dFZlcnRleCwgZnJvbSwgdG8sIGxlbikge1xyXG5cclxuICAgIGlmIChmcm9tID09PSAwICYmIHRvID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhcnQ6IGxhc3RWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZDogbmV4dFZlcnRleFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaXNTdHJhaWdodChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKSkge1xyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzFdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzRdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIGZyb20pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgZW5kVmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsyXSwgbmV4dFZlcnRleFsyXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbmV4dFZlcnRleFs1XSwgdG8pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYmV6aWVyID0gbmV3IEJlemllcihbbGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XV0pO1xyXG4gICAgICAgIHRoaXMuYmV6aWVyLmdldExlbmd0aChsZW4pO1xyXG4gICAgICAgIGZyb20gPSB0aGlzLmJlemllci5tYXAoZnJvbSk7XHJcbiAgICAgICAgdG8gPSB0aGlzLmJlemllci5tYXAodG8pO1xyXG4gICAgICAgIHRvID0gKHRvIC0gZnJvbSkgLyAoMSAtIGZyb20pO1xyXG5cclxuICAgICAgICB2YXIgZTEsIGYxLCBnMSwgaDEsIGoxLCBrMSxcclxuICAgICAgICAgICAgZTIsIGYyLCBnMiwgaDIsIGoyLCBrMixcclxuICAgICAgICAgICAgc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZFZlcnRleDtcclxuXHJcbiAgICAgICAgZTEgPSBbdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbMF0sIGZyb20pLCB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFsxXSwgZnJvbSldO1xyXG4gICAgICAgIGYxID0gW3RoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSwgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbM10sIGZyb20pXTtcclxuICAgICAgICBnMSA9IFt0aGlzLmxlcnAobmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFs0XSwgZnJvbSksIHRoaXMubGVycChuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzVdLCBmcm9tKV07XHJcbiAgICAgICAgaDEgPSBbdGhpcy5sZXJwKGUxWzBdLCBmMVswXSwgZnJvbSksIHRoaXMubGVycChlMVsxXSwgZjFbMV0sIGZyb20pXTtcclxuICAgICAgICBqMSA9IFt0aGlzLmxlcnAoZjFbMF0sIGcxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGYxWzFdLCBnMVsxXSwgZnJvbSldO1xyXG4gICAgICAgIGsxID0gW3RoaXMubGVycChoMVswXSwgajFbMF0sIGZyb20pLCB0aGlzLmxlcnAoaDFbMV0sIGoxWzFdLCBmcm9tKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2oxWzBdLCBqMVsxXSwgaDFbMF0sIGgxWzFdLCBrMVswXSwgazFbMV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCBnMVswXSwgZzFbMV0sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV1dO1xyXG5cclxuICAgICAgICBlMiA9IFt0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzBdLCB0byksIHRoaXMubGVycChzdGFydFZlcnRleFs1XSwgc3RhcnRWZXJ0ZXhbMV0sIHRvKV07XHJcbiAgICAgICAgZjIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzBdLCBlbmRWZXJ0ZXhbMl0sIHRvKSwgdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzFdLCBlbmRWZXJ0ZXhbM10sIHRvKV07XHJcbiAgICAgICAgZzIgPSBbdGhpcy5sZXJwKGVuZFZlcnRleFsyXSwgZW5kVmVydGV4WzRdLCB0byksIHRoaXMubGVycChlbmRWZXJ0ZXhbM10sIGVuZFZlcnRleFs1XSwgdG8pXTtcclxuXHJcbiAgICAgICAgaDIgPSBbdGhpcy5sZXJwKGUyWzBdLCBmMlswXSwgdG8pLCB0aGlzLmxlcnAoZTJbMV0sIGYyWzFdLCB0byldO1xyXG4gICAgICAgIGoyID0gW3RoaXMubGVycChmMlswXSwgZzJbMF0sIHRvKSwgdGhpcy5sZXJwKGYyWzFdLCBnMlsxXSwgdG8pXTtcclxuICAgICAgICBrMiA9IFt0aGlzLmxlcnAoaDJbMF0sIGoyWzBdLCB0byksIHRoaXMubGVycChoMlsxXSwgajJbMV0sIHRvKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2UyWzBdLCBlMlsxXSwgc3RhcnRWZXJ0ZXhbMl0sIHN0YXJ0VmVydGV4WzNdLCBzdGFydFZlcnRleFs0XSwgc3RhcnRWZXJ0ZXhbNV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtqMlswXSwgajJbMV0sIGgyWzBdLCBoMlsxXSwgazJbMF0sIGsyWzFdXTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydDogc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgZW5kOiBlbmRWZXJ0ZXhcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHZhciBzID0gMSAtIHQ7XHJcbiAgICByZXR1cm4gYSAqIHMgKyBiICogdDtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnN1bUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xyXG4gICAgZnVuY3Rpb24gYWRkKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gYSArIGI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoYWRkKTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmlzU3RyYWlnaHQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGN0cmwxWCwgY3RybDFZLCBjdHJsMlgsIGN0cmwyWSwgZW5kWCwgZW5kWSkge1xyXG4gICAgcmV0dXJuIHN0YXJ0WCA9PT0gY3RybDFYICYmIHN0YXJ0WSA9PT0gY3RybDFZICYmIGVuZFggPT09IGN0cmwyWCAmJiBlbmRZID09PSBjdHJsMlk7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9seXN0YXIoZGF0YSkge1xyXG4gICAgLy90aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7IC8vIFRPRE8gPz9cclxuXHJcbiAgICB0aGlzLnN0YXJUeXBlID0gZGF0YS5zdGFyVHlwZTtcclxuICAgIHRoaXMucG9pbnRzID0gZGF0YS5wb2ludHMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9pbnRzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvaW50cyk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzID0gZGF0YS5pbm5lclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cyk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gZGF0YS5vdXRlclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cyk7XHJcblxyXG4gICAgLy9vcHRpbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcyA9IGRhdGEuaW5uZXJSb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpO1xyXG4gICAgaWYgKGRhdGEub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MgPSBkYXRhLm91dGVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKTtcclxufVxyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IHRoaXMucG9pbnRzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIGlubmVyUmFkaXVzID0gdGhpcy5pbm5lclJhZGl1cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBvdXRlclJhZGl1cyA9IHRoaXMub3V0ZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcclxuICAgICAgICByb3RhdGlvbiA9IHRoaXMucm90YXRpb24gPyB0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBpbm5lclJvdW5kbmVzcyA9IHRoaXMuaW5uZXJSb3VuZG5lc3MgPyB0aGlzLmlubmVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBvdXRlclJvdW5kbmVzcyA9IHRoaXMub3V0ZXJSb3VuZG5lc3MgPyB0aGlzLm91dGVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMDtcclxuXHJcbiAgICByb3RhdGlvbiA9IHRoaXMuZGVnMnJhZChyb3RhdGlvbik7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBvdXRlclJhZGl1cywgcm90YXRpb24pO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSk7XHJcbiAgICBjdHgubW92ZVRvKHN0YXJ0WzBdLCBzdGFydFsxXSk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHM7IGkrKykge1xyXG5cclxuICAgICAgICB2YXIgcElubmVyLFxyXG4gICAgICAgICAgICBwT3V0ZXIsXHJcbiAgICAgICAgICAgIHBPdXRlcjFUYW5nZW50LFxyXG4gICAgICAgICAgICBwT3V0ZXIyVGFuZ2VudCxcclxuICAgICAgICAgICAgcElubmVyMVRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBJbm5lcjJUYW5nZW50LFxyXG4gICAgICAgICAgICBvdXRlck9mZnNldCxcclxuICAgICAgICAgICAgaW5uZXJPZmZzZXQsXHJcbiAgICAgICAgICAgIHJvdDtcclxuXHJcbiAgICAgICAgcm90ID0gTWF0aC5QSSAvIHBvaW50cyAqIDI7XHJcblxyXG4gICAgICAgIHBJbm5lciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBPdXRlciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIC8vRkl4TUVcclxuICAgICAgICBpZiAoIW91dGVyT2Zmc2V0KSBvdXRlck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBvdXRlclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xyXG4gICAgICAgIGlmICghaW5uZXJPZmZzZXQpIGlubmVyT2Zmc2V0ID0gKHN0YXJ0WzBdICsgcElubmVyWzBdKSAqIGlubmVyUm91bmRuZXNzIC8gMTAwICogLjU1MjI4NDg7XHJcblxyXG4gICAgICAgIHBPdXRlcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBvdXRlck9mZnNldCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogaSkgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcElubmVyMVRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIGlubmVyT2Zmc2V0ICogLTEsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwSW5uZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgaW5uZXJPZmZzZXQsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwT3V0ZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQgKiAtMSwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgIC8vc3RhclxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBJbm5lcjFUYW5nZW50WzBdLCBwSW5uZXIxVGFuZ2VudFsxXSwgcElubmVyWzBdLCBwSW5uZXJbMV0pO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vcG9seWdvblxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9kZWJ1Z1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXJbMF0sIHBJbm5lclsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyWzBdLCBwT3V0ZXJbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJyZWRcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiZ3JlZW5cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYnJvd25cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnJvdGF0ZVBvaW50ID0gZnVuY3Rpb24gKGN4LCBjeSwgeCwgeSwgcmFkaWFucykge1xyXG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxyXG4gICAgICAgIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpLFxyXG4gICAgICAgIG54ID0gKGNvcyAqICh4IC0gY3gpKSAtIChzaW4gKiAoeSAtIGN5KSkgKyBjeCxcclxuICAgICAgICBueSA9IChzaW4gKiAoeCAtIGN4KSkgKyAoY29zICogKHkgLSBjeSkpICsgY3k7XHJcbiAgICByZXR1cm4gW254LCBueV07XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMucG9pbnRzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMucG9pbnRzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlzdGFyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9zaXRpb24oZGF0YSkge1xyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eS5jYWxsKHRoaXMsIGRhdGEpO1xyXG59XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlKTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxuICAgIHRoaXMuc2V0TW90aW9uUGF0aCgpO1xyXG59O1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLm1vdGlvbnBhdGgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb3Rpb25wYXRoLmdldFZhbHVlcyh0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUuc2V0TW90aW9uUGF0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKSB7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoID0gbmV3IEJlemllcih0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKTtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGguZ2V0TGVuZ3RoKHRoaXMubGFzdEZyYW1lLmxlbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gUHJvcGVydHkoZGF0YSkge1xyXG4gICAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIG51bGw7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGE7XHJcbn1cclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmZyYW1lc1swXS52O1xyXG59O1xyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbn07XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUmVjdChkYXRhKSB7XHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcclxuXHJcbiAgICAvL29wdGlvbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3MgPSBkYXRhLnJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEucm91bmRuZXNzKTtcclxufVxyXG5cclxuUmVjdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdW5kbmVzcyA9IHRoaXMucm91bmRuZXNzID8gdGhpcy5yb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwO1xyXG5cclxuICAgIGlmIChzaXplWzBdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVswXSAvIDI7XHJcbiAgICBpZiAoc2l6ZVsxXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMV0gLyAyO1xyXG5cclxuICAgIHZhciB4ID0gcG9zaXRpb25bMF0gLSBzaXplWzBdIC8gMixcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0gLSBzaXplWzFdIC8gMjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0djtcclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG4gICAgICAgIC8vVE9ETyBhZGQgdHJpbVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdHgubW92ZVRvKHggKyByb3VuZG5lc3MsIHkpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSwgeCArIHNpemVbMF0sIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSArIHNpemVbMV0sIHgsIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4LCB5ICsgc2l6ZVsxXSwgeCwgeSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCwgeSwgeCArIHNpemVbMF0sIHksIHJvdW5kbmVzcyk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuUmVjdC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuc2l6ZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gU3Ryb2tlKGRhdGEpIHtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5qb2luID0gZGF0YS5qb2luO1xyXG4gICAgICAgIHRoaXMuY2FwID0gZGF0YS5jYXA7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEubWl0ZXJMaW1pdC5sZW5ndGggPiAxKSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY29sb3IubGVuZ3RoID4gMSkgdGhpcy5jb2xvciA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5jb2xvciA9IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEub3BhY2l0eS5sZW5ndGggPiAxKSB0aGlzLm9wYWNpdHkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5vcGFjaXR5ID0gbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLndpZHRoLmxlbmd0aCA+IDEpIHRoaXMud2lkdGggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLndpZHRoKTtcclxuICAgICAgICBlbHNlIHRoaXMud2lkdGggPSBuZXcgUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLmRhc2hlcykge1xyXG4gICAgICAgICAgICB0aGlzLmRhc2hlcyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEuZGFzaGVzLmRhc2gubGVuZ3RoID4gMSkgdGhpcy5kYXNoZXMuZGFzaCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZGFzaGVzLmRhc2gpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMuZGFzaGVzLmRhc2ggPSBuZXcgUHJvcGVydHkoZGF0YS5kYXNoZXMuZGFzaCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF0YS5kYXNoZXMuZ2FwLmxlbmd0aCA+IDEpIHRoaXMuZGFzaGVzLmdhcCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZGFzaGVzLmdhcCk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5kYXNoZXMuZ2FwID0gbmV3IFByb3BlcnR5KGRhdGEuZGFzaGVzLmdhcCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF0YS5kYXNoZXMub2Zmc2V0Lmxlbmd0aCA+IDEpIHRoaXMuZGFzaGVzLm9mZnNldCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZGFzaGVzLm9mZnNldCk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5kYXNoZXMub2Zmc2V0ID0gbmV3IFByb3BlcnR5KGRhdGEuZGFzaGVzLm9mZnNldCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5TdHJva2UucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuY29sb3IuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIGNvbG9yWzBdID0gTWF0aC5yb3VuZChjb2xvclswXSk7XHJcbiAgICBjb2xvclsxXSA9IE1hdGgucm91bmQoY29sb3JbMV0pO1xyXG4gICAgY29sb3JbMl0gPSBNYXRoLnJvdW5kKGNvbG9yWzJdKTtcclxuICAgIHZhciBzID0gY29sb3Iuam9pbignLCAnKTtcclxuXHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIHMgKyAnLCAnICsgb3BhY2l0eSArICcpJztcclxufTtcclxuXHJcblN0cm9rZS5wcm90b3R5cGUuc2V0U3Ryb2tlID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG4gICAgdmFyIHN0cm9rZUNvbG9yID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBzdHJva2VXaWR0aCA9IHRoaXMud2lkdGguZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgc3Ryb2tlSm9pbiA9IHRoaXMuam9pbjtcclxuICAgIGlmIChzdHJva2VKb2luID09PSAnbWl0ZXInKSB2YXIgbWl0ZXJMaW1pdCA9IHRoaXMubWl0ZXJMaW1pdC5nZXRWYWx1ZSh0aW1lKTtcclxuXHJcbiAgICBjdHgubGluZVdpZHRoID0gc3Ryb2tlV2lkdGg7XHJcbiAgICBjdHgubGluZUpvaW4gPSBzdHJva2VKb2luO1xyXG4gICAgaWYgKG1pdGVyTGltaXQpIGN0eC5taXRlckxpbWl0ID0gbWl0ZXJMaW1pdDtcclxuICAgIGN0eC5saW5lQ2FwID0gdGhpcy5jYXA7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2VDb2xvcjtcclxuXHJcbiAgICBpZiAodGhpcy5kYXNoZXMpIHtcclxuICAgICAgICBjdHguc2V0TGluZURhc2goW1xyXG4gICAgICAgICAgICB0aGlzLmRhc2hlcy5kYXNoLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgICAgICB0aGlzLmRhc2hlcy5nYXAuZ2V0VmFsdWUodGltZSlcclxuICAgICAgICBdKTtcclxuICAgICAgICBjdHgubGluZURhc2hPZmZzZXQgPSB0aGlzLmRhc2hlcy5vZmZzZXQuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLmNvbG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLndpZHRoLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5kYXNoZXMpIHtcclxuICAgICAgICB0aGlzLmRhc2hlcy5kYXNoLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB0aGlzLmRhc2hlcy5nYXAuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgICAgIHRoaXMuZGFzaGVzLm9mZnNldC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmNvbG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLndpZHRoLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5kYXNoZXMpIHtcclxuICAgICAgICB0aGlzLmRhc2hlcy5kYXNoLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB0aGlzLmRhc2hlcy5nYXAucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIHRoaXMuZGFzaGVzLm9mZnNldC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0cm9rZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5JyksXHJcbiAgICBQb3NpdGlvbiA9IHJlcXVpcmUoJy4vUG9zaXRpb24nKTtcclxuXHJcbmZ1bmN0aW9uIFRyYW5zZm9ybShkYXRhKSB7XHJcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcclxuXHJcbiAgICAvL3RoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvbikge1xyXG4gICAgICAgIGlmIChkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb3NpdGlvbihkYXRhLnBvc2l0aW9uKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YID0gZGF0YS5wb3NpdGlvblgubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25YKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWCk7XHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZID0gZGF0YS5wb3NpdGlvblkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25ZKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICBpZiAoZGF0YS5hbmNob3IpIHRoaXMuYW5jaG9yID0gZGF0YS5hbmNob3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuYW5jaG9yKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmFuY2hvcik7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVgpIHRoaXMuc2NhbGVYID0gZGF0YS5zY2FsZVgubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVYKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWCk7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVkpIHRoaXMuc2NhbGVZID0gZGF0YS5zY2FsZVkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVZKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWSk7XHJcbiAgICBpZiAoZGF0YS5za2V3KSB0aGlzLnNrZXcgPSBkYXRhLnNrZXcubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2tldykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3KTtcclxuICAgIGlmIChkYXRhLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzID0gZGF0YS5za2V3QXhpcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3QXhpcykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3QXhpcyk7XHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm90YXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucm90YXRpb24pO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIHZhciBwb3NpdGlvblgsIHBvc2l0aW9uWSxcclxuICAgICAgICBhbmNob3IgPSB0aGlzLmFuY2hvciA/IHRoaXMuYW5jaG9yLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbiA/IHRoaXMuZGVnMnJhZCh0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2tldyA9IHRoaXMuc2tldyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXcuZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3QXhpcyA9IHRoaXMuc2tld0F4aXMgPyB0aGlzLmRlZzJyYWQodGhpcy5za2V3QXhpcy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNjYWxlWCA9IHRoaXMuc2NhbGVYID8gdGhpcy5zY2FsZVguZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIHNjYWxlWSA9IHRoaXMuc2NhbGVZID8gdGhpcy5zY2FsZVkuZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkgPyB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgKiBjdHguZ2xvYmFsQWxwaGEgOiBjdHguZ2xvYmFsQWxwaGE7IC8vIEZJWE1FIHdyb25nIHRyYW5zcGFyZW5jeSBpZiBuZXN0ZWRcclxuXHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSwgY3R4KTtcclxuICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblswXTtcclxuICAgICAgICBwb3NpdGlvblkgPSBwb3NpdGlvblsxXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcG9zaXRpb25YID0gdGhpcy5wb3NpdGlvblggPyB0aGlzLnBvc2l0aW9uWC5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcbiAgICAgICAgcG9zaXRpb25ZID0gdGhpcy5wb3NpdGlvblkgPyB0aGlzLnBvc2l0aW9uWS5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coY3R4LCBwb3NpdGlvblgsIHBvc2l0aW9uWSwgYW5jaG9yLCByb3RhdGlvbiwgc2tldywgc2tld0F4aXMsIHNjYWxlWCwgc2NhbGVZLCBvcGFjaXR5KTtcclxuXHJcbiAgICAvL29yZGVyIHZlcnkgdmVyeSBpbXBvcnRhbnQgOilcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgMCwgMSwgcG9zaXRpb25YIC0gYW5jaG9yWzBdLCBwb3NpdGlvblkgLSBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIHJvdGF0aW9uLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICB0aGlzLnNldFNrZXcoY3R4LCBza2V3LCBza2V3QXhpcywgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRTY2FsZShjdHgsIHNjYWxlWCwgc2NhbGVZLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIChjdHgsIHJhZCwgeCwgeSkge1xyXG4gICAgdmFyIGMgPSBNYXRoLmNvcyhyYWQpO1xyXG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xyXG4gICAgdmFyIGR4ID0geCAtIGMgKiB4ICsgcyAqIHk7XHJcbiAgICB2YXIgZHkgPSB5IC0gcyAqIHggLSBjICogeTtcclxuICAgIGN0eC50cmFuc2Zvcm0oYywgcywgLXMsIGMsIGR4LCBkeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24gKGN0eCwgc3gsIHN5LCB4LCB5KSB7XHJcbiAgICBjdHgudHJhbnNmb3JtKHN4LCAwLCAwLCBzeSwgLXggKiBzeCArIHgsIC15ICogc3kgKyB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0U2tldyA9IGZ1bmN0aW9uIChjdHgsIHNrZXcsIGF4aXMsIHgsIHkpIHtcclxuICAgIHZhciB0ID0gTWF0aC50YW4oLXNrZXcpO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIC1heGlzLCB4LCB5KTtcclxuICAgIGN0eC50cmFuc2Zvcm0oMSwgMCwgdCwgMSwgLXkgKiB0LCAwKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCBheGlzLCB4LCB5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNrZXcpIHRoaXMuc2tldy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblgpIHRoaXMucG9zaXRpb25YLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVkpIHRoaXMuc2NhbGVZLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBUcmltKGRhdGEpIHtcclxuXHJcbiAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGU7XHJcblxyXG4gICAgaWYgKGRhdGEuc3RhcnQpIHRoaXMuc3RhcnQgPSBkYXRhLnN0YXJ0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnN0YXJ0KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnN0YXJ0KTtcclxuICAgIGlmIChkYXRhLmVuZCkgdGhpcy5lbmQgPSBkYXRhLmVuZC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5lbmQpIDogbmV3IFByb3BlcnR5KGRhdGEuZW5kKTtcclxuICAgIC8vaWYgKGRhdGEub2Zmc2V0KSB0aGlzLm9mZnNldCA9IGRhdGEub2Zmc2V0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9mZnNldCkgOiBuZXcgUHJvcGVydHkoZGF0YS5vZmZzZXQpO1xyXG5cclxufVxyXG5cclxuVHJpbS5wcm90b3R5cGUuZ2V0VHJpbSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnN0YXJ0ID8gdGhpcy5zdGFydC5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgZW5kID0gdGhpcy5lbmQgPyB0aGlzLmVuZC5nZXRWYWx1ZSh0aW1lKSA6IDE7XHJcblxyXG4gICAgdmFyIHRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnQ6IE1hdGgubWluKHN0YXJ0LCBlbmQpLFxyXG4gICAgICAgIGVuZDogTWF0aC5tYXgoc3RhcnQsIGVuZClcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDAgJiYgdHJpbS5lbmQgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRyaW07XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcblRyaW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydCkgdGhpcy5zdGFydC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5lbmQpIHRoaXMuZW5kLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIC8vaWYgKHRoaXMub2Zmc2V0KSB0aGlzLm9mZnNldC5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmltO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiJdfQ==
