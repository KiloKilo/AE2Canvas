(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AE2Canvas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/home/WebstormProjects/ae2canvas/src/runtime/AE2Canvas.js":[function(_dereq_,module,exports){
'use strict';

var Group = _dereq_('./Group');

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
            this.compTime = this.reversed ? this.compTime - delta : this.compTime + delta;

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
},{"./Group":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Group.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedPath.js":[function(_dereq_,module,exports){
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


























},{"./BezierEasing":"/Users/home/WebstormProjects/ae2canvas/src/runtime/BezierEasing.js","./Path":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Path.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js":[function(_dereq_,module,exports){
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
},{"./BezierEasing":"/Users/home/WebstormProjects/ae2canvas/src/runtime/BezierEasing.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Bezier.js":[function(_dereq_,module,exports){
'use strict';

function Bezier(path) {
    this.path = path;
}

Bezier.prototype.getLength = function (len) {
    this.steps = Math.floor(len / 10);
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
},{}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/BezierEasing.js":[function(_dereq_,module,exports){
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
},{}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Ellipse.js":[function(_dereq_,module,exports){
'use strict';

var Path = _dereq_('./Path'),
    Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Ellipse(data) {
    this.name = data.name;
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
},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Path":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Path.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Fill.js":[function(_dereq_,module,exports){
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
},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Group.js":[function(_dereq_,module,exports){
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

    this.name = data.name;
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

    //
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

Group.prototype.draw = function (ctx, time, parentFill, parentStroke, parentTrim) {

    var i;

    ctx.save();

    //TODO check if color/stroke is changing over time
    var fill = this.fill || parentFill;
    var stroke = this.stroke || parentStroke;
    var trimValues = this.trim ? this.trim.getTrim(time) : parentTrim;

    if (fill) fill.setColor(ctx, time);
    if (stroke) stroke.setStroke(ctx, time);

    this.transform.transform(ctx, time);

    if (this.merge) {
        this.bufferCtx.save();
        this.bufferCtx.clearRect(0, 0, this.bufferCtx.canvas.width, this.bufferCtx.canvas.height);
        this.transform.transform(this.bufferCtx, time);

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
            ctx.drawImage(this.bufferCtx.canvas, 0, 0);
            this.bufferCtx.restore();

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
    if (stroke) ctx.stroke();

    if (this.groups) {
        if (this.merge) {

            for (i = 0; i < this.groups.length; i++) {
                if (time >= this.groups[i].in && time < this.groups[i].out) {
                    this.groups[i].draw(this.bufferCtx, time, fill, stroke, trimValues);
                    this.merge.setCompositeOperation(this.bufferCtx);
                }
            }
            ctx.restore();
            ctx.drawImage(this.bufferCtx.canvas, 0, 0);
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
    if (this.trim) this.trim.reset(time);
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


























},{"./AnimatedPath":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedPath.js","./Ellipse":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Ellipse.js","./Fill":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Fill.js","./Merge":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Merge.js","./Path":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Path.js","./Polystar":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Polystar.js","./Rect":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Rect.js","./Stroke":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Stroke.js","./Transform":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Transform.js","./Trim":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Trim.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Merge.js":[function(_dereq_,module,exports){
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


























},{}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Path.js":[function(_dereq_,module,exports){
'use strict';

var Bezier = _dereq_('./Bezier');

function Path(data) {
    this.name = data.name;
    this.closed = data.closed;
    this.frames = data.frames;
    this.verticesCount = this.frames[0].v.length;
}

Path.prototype.draw = function (ctx, time, trim) {
    var frame = this.getValue(time),
        vertices = frame.v;

    if (trim) {
        trim = this.getTrimValues(trim, frame);
        if (trim.start === 0 && trim.end === 0) {
            return;
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
        endIndex  : 0,
        start     : 0,
        end       : 0
    };

    if (trim.start === 0) {
        if (trim.end === 0) {
            return actualTrim;
        } else if (trim.end === 1) {
            actualTrim.endIndex = frame.len.length;
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

    trimAtLen = totalLen * trim.end;

    for (i = 0; i < frame.len.length; i++) {
        if (trimAtLen > 0 && trimAtLen < frame.len[i]) {
            actualTrim.endIndex = i;
            actualTrim.end = trimAtLen / frame.len[i];
        }
        trimAtLen -= frame.len[i];
    }

    return actualTrim;
};

Path.prototype.trim = function (lastVertex, nextVertex, from, to, len) {

    if (from === 0 && to === 1) {
        return {
            start: lastVertex,
            end  : nextVertex
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
        end  : endVertex
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




























},{"./Bezier":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Bezier.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Polystar.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Polystar(data) {
    this.name = data.name;
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
},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Position.js":[function(_dereq_,module,exports){
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


























},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Bezier":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Bezier.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js":[function(_dereq_,module,exports){
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
},{}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Rect.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Rect(data) {
    this.name = data.name;
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
},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Stroke.js":[function(_dereq_,module,exports){
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
//    console.log(color);
    var opacity = this.opacity.getValue(time);
    return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
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
},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Transform.js":[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty'),
    Position = _dereq_('./Position');

function Transform(data) {
    if (!data) return;

    this.name = data.name;

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
},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Position":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Position.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}],"/Users/home/WebstormProjects/ae2canvas/src/runtime/Trim.js":[function(_dereq_,module,exports){
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
        end  : Math.max(start, end)
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
























},{"./AnimatedProperty":"/Users/home/WebstormProjects/ae2canvas/src/runtime/AnimatedProperty.js","./Property":"/Users/home/WebstormProjects/ae2canvas/src/runtime/Property.js"}]},{},["/Users/home/WebstormProjects/ae2canvas/src/runtime/AE2Canvas.js"])("/Users/home/WebstormProjects/ae2canvas/src/runtime/AE2Canvas.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL01lcmdlLmpzIiwic3JjL3J1bnRpbWUvUGF0aC5qcyIsInNyYy9ydW50aW1lL1BvbHlzdGFyLmpzIiwic3JjL3J1bnRpbWUvUG9zaXRpb24uanMiLCJzcmMvcnVudGltZS9Qcm9wZXJ0eS5qcyIsInNyYy9ydW50aW1lL1JlY3QuanMiLCJzcmMvcnVudGltZS9TdHJva2UuanMiLCJzcmMvcnVudGltZS9UcmFuc2Zvcm0uanMiLCJzcmMvcnVudGltZS9UcmltLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdyb3VwID0gcmVxdWlyZSgnLi9Hcm91cCcpO1xuXG52YXIgX2FuaW1hdGlvbnMgPSBbXSxcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IDA7XG5cbmZ1bmN0aW9uIEFuaW1hdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5kYXRhID0gb3B0aW9ucy5kYXRhIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgJ25vIGRhdGEnO1xuICAgIH0oKTtcblxuICAgIHRoaXMudGhlbiA9IDA7XG4gICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcbiAgICB0aGlzLmR1cmF0aW9uID0gdGhpcy5kYXRhLmR1cmF0aW9uO1xuICAgIHRoaXMudGltZVJhdGlvID0gdGhpcy5kdXJhdGlvbiAvIDEwMDtcbiAgICB0aGlzLmJhc2VXaWR0aCA9IHRoaXMuZGF0YS53aWR0aDtcbiAgICB0aGlzLmJhc2VIZWlnaHQgPSB0aGlzLmRhdGEuaGVpZ2h0O1xuICAgIHRoaXMucmF0aW8gPSB0aGlzLmRhdGEud2lkdGggLyB0aGlzLmRhdGEuaGVpZ2h0O1xuXG4gICAgdGhpcy5tYXJrZXJzID0gdGhpcy5kYXRhLm1hcmtlcnM7XG5cbiAgICB0aGlzLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMubG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZTtcbiAgICB0aGlzLmhkID0gb3B0aW9ucy5oZCB8fCBmYWxzZTtcbiAgICB0aGlzLmZsdWlkID0gb3B0aW9ucy5mbHVpZCB8fCB0cnVlO1xuICAgIHRoaXMucmV2ZXJzZWQgPSBvcHRpb25zLnJldmVyc2VkIHx8IGZhbHNlO1xuICAgIHRoaXMub25Db21wbGV0ZSA9IG9wdGlvbnMub25Db21wbGV0ZSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5iYXNlV2lkdGg7XG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5iYXNlSGVpZ2h0O1xuXG4gICAgdGhpcy5idWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0aGlzLmJ1ZmZlci53aWR0aCA9IHRoaXMuYmFzZVdpZHRoO1xuICAgIHRoaXMuYnVmZmVyLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IHRoaXMuYnVmZmVyLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB0aGlzLmdyb3VwcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmdyb3Vwcy5wdXNoKG5ldyBHcm91cCh0aGlzLmRhdGEuZ3JvdXBzW2ldLCB0aGlzLmJ1ZmZlckN0eCwgMCwgdGhpcy5kdXJhdGlvbikpO1xuICAgIH1cbiAgICB0aGlzLmdyb3Vwc0xlbmd0aCA9IHRoaXMuZ3JvdXBzLmxlbmd0aDtcblxuICAgIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XG4gICAgdGhpcy5yZXNpemUoKTtcblxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcblxuICAgIF9hbmltYXRpb25zLnB1c2godGhpcyk7XG4gICAgX2FuaW1hdGlvbnNMZW5ndGggPSBfYW5pbWF0aW9ucy5sZW5ndGg7XG59XG5cbkFuaW1hdGlvbi5wcm90b3R5cGUgPSB7XG5cbiAgICBwbGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XG4gICAgfSxcblxuICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnb3RvQW5kUGxheTogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLmdldE1hcmtlcihpZCk7XG4gICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ290b0FuZFN0b3A6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xuICAgICAgICBpZiAobWFya2VyKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldE1hcmtlcjogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaWQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2lkXTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcnNbaV0uY29tbWVudCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS53YXJuKCdNYXJrZXIgbm90IGZvdW5kJyk7XG4gICAgfSxcblxuICAgIHNldFN0ZXA6IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbXBUaW1lID0gc3RlcCAqIHRoaXMudGltZVJhdGlvO1xuICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSB0aGlzLmNvbXBUaW1lO1xuICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcbiAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBnZXRTdGVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMuY29tcFRpbWUgLyB0aGlzLnRpbWVSYXRpbyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKHRpbWUpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gdGltZSAtIHRoaXMudGhlbjtcbiAgICAgICAgdGhpcy50aGVuID0gdGltZTtcblxuICAgICAgICBpZiAodGhpcy5zdGFydGVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuY29tcFRpbWUgLSBkZWx0YSA6IHRoaXMuY29tcFRpbWUgKyBkZWx0YTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcFRpbWUgPiB0aGlzLmR1cmF0aW9uIHx8IHRoaXMucmV2ZXJzZWQgJiYgdGhpcy5jb21wVGltZSA8IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9vcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhdyh0aGlzLmNvbXBUaW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRyYXdGcmFtZSkge1xuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZHJhdyh0aGlzLmNvbXBUaW1lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkcmF3OiBmdW5jdGlvbiAodGltZSkge1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYXNlV2lkdGgsIHRoaXMuYmFzZUhlaWdodCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncm91cHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcodGhpcy5jdHgsIHRpbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XG4gICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnJldmVyc2VkID8gdGhpcy5kdXJhdGlvbiA6IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldEtleWZyYW1lczogZnVuY3Rpb24gKHRpbWUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdyb3Vwc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbnVsbDtcbiAgICAgICAgdmFyIGkgPSBfYW5pbWF0aW9ucy5pbmRleE9mKHRoaXMpO1xuICAgICAgICBpZiAoaSA+IC0xKSB7XG4gICAgICAgICAgICBfYW5pbWF0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IF9hbmltYXRpb25zLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jYW52YXMucGFyZW50Tm9kZSkgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyk7XG4gICAgfSxcblxuICAgIHJlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5mbHVpZCkge1xuICAgICAgICAgICAgdmFyIGZhY3RvciA9IHRoaXMuaGQgPyAyIDogMTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IHRoaXMuY2FudmFzLmNsaWVudFdpZHRoIHx8IHRoaXMuYmFzZVdpZHRoO1xuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aCAqIGZhY3RvcjtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHdpZHRoIC8gdGhpcy5yYXRpbyAqIGZhY3RvcjtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgPSB3aWR0aCAvIHRoaXMuYmFzZVdpZHRoICogZmFjdG9yO1xuICAgICAgICAgICAgdGhpcy5jdHgudHJhbnNmb3JtKHRoaXMuc2NhbGUsIDAsIDAsIHRoaXMuc2NhbGUsIDAsIDApO1xuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldCByZXZlcnNlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2VkO1xuICAgIH0sXG5cbiAgICBzZXQgcmV2ZXJzZWQoYm9vbCkge1xuICAgICAgICB0aGlzLl9yZXZlcnNlZCA9IGJvb2w7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnBhdXNlZFRpbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIEFuaW1hdGlvbjogQW5pbWF0aW9uLFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xuICAgICAgICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9zb2xlL3R3ZWVuLmpzXG4gICAgICAgIHRpbWUgPSB0aW1lICE9PSB1bmRlZmluZWQgPyB0aW1lIDogKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGVyZm9ybWFuY2UgIT09IHVuZGVmaW5lZCAmJiB3aW5kb3cucGVyZm9ybWFuY2Uubm93ICE9PSB1bmRlZmluZWQgPyB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgOiBEYXRlLm5vdygpICk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfYW5pbWF0aW9uc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBfYW5pbWF0aW9uc1tpXS51cGRhdGUodGltZSk7XG4gICAgICAgIH1cbiAgICB9XG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcbiAgICBCZXppZXJFYXNpbmcgPSByZXF1aXJlKCcuL0JlemllckVhc2luZycpO1xuXG5mdW5jdGlvbiBBbmltYXRlZFBhdGgoZGF0YSkge1xuICAgIFBhdGguY2FsbCh0aGlzLCBkYXRhKTtcbiAgICB0aGlzLmZyYW1lQ291bnQgPSB0aGlzLmZyYW1lcy5sZW5ndGg7XG59XG5cbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcblxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgaWYgKHRoaXMuZmluaXNoZWQgJiYgdGltZSA+PSB0aGlzLm5leHRGcmFtZS50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQgJiYgdGltZSA8PSB0aGlzLmxhc3RGcmFtZS50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RGcmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciArIDEgPT09IHRoaXMuZnJhbWVDb3VudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXIrKztcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgdGhpcy5sYXN0RnJhbWUudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciA8IDIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyLS07XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVBdFRpbWUodGltZSk7XG4gICAgfVxufTtcblxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xuICAgICAgICB0aGlzLnBvaW50ZXIgPSAxO1xuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRpbWUgPiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KSB7XG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuZnJhbWVDb3VudDsgaSsrKSB7XG4gICAgICAgIGlmICh0aW1lID49IHRoaXMuZnJhbWVzW2kgLSAxXS50ICYmIHRpbWUgPD0gdGhpcy5mcmFtZXNbaV0pIHtcbiAgICAgICAgICAgIHRoaXMucG9pbnRlciA9IGk7XG4gICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW2kgLSAxXTtcbiAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbaV07XG4gICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldEVhc2luZygpO1xufTtcblxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcbiAgICByZXR1cm4gYSArIHQgKiAoYiAtIGEpO1xufTtcblxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5zZXRFYXNpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMubGFzdEZyYW1lLmVhc2VPdXQgJiYgdGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XG4gICAgICAgIHRoaXMuZWFzaW5nID0gbmV3IEJlemllckVhc2luZyh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzBdLCB0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzFdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMF0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblsxXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xuICAgIH1cbn07XG5cbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMubGFzdEZyYW1lLnQgKTtcbiAgICB2YXIgZHVyYXRpb24gPSB0aGlzLm5leHRGcmFtZS50IC0gdGhpcy5sYXN0RnJhbWUudDtcbiAgICB2YXIgZWxhcHNlZCA9IGRlbHRhIC8gZHVyYXRpb247XG4gICAgaWYgKGVsYXBzZWQgPiAxKSBlbGFwc2VkID0gMTtcbiAgICBlbHNlIGlmIChlbGFwc2VkIDwgMCkgZWxhcHNlZCA9IDA7XG4gICAgZWxzZSBpZiAodGhpcy5lYXNpbmcpIGVsYXBzZWQgPSB0aGlzLmVhc2luZyhlbGFwc2VkKTtcbiAgICB2YXIgYWN0dWFsVmVydGljZXMgPSBbXSxcbiAgICAgICAgYWN0dWFsTGVuZ3RoID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXNDb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBjcDF4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMF0sIGVsYXBzZWQpLFxuICAgICAgICAgICAgY3AxeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzFdLCB0aGlzLm5leHRGcmFtZS52W2ldWzFdLCBlbGFwc2VkKSxcbiAgICAgICAgICAgIGNwMnggPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVsyXSwgdGhpcy5uZXh0RnJhbWUudltpXVsyXSwgZWxhcHNlZCksXG4gICAgICAgICAgICBjcDJ5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bM10sIHRoaXMubmV4dEZyYW1lLnZbaV1bM10sIGVsYXBzZWQpLFxuICAgICAgICAgICAgeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzRdLCB0aGlzLm5leHRGcmFtZS52W2ldWzRdLCBlbGFwc2VkKSxcbiAgICAgICAgICAgIHkgPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVs1XSwgdGhpcy5uZXh0RnJhbWUudltpXVs1XSwgZWxhcHNlZCk7XG5cbiAgICAgICAgYWN0dWFsVmVydGljZXMucHVzaChbY3AxeCwgY3AxeSwgY3AyeCwgY3AyeSwgeCwgeV0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy52ZXJ0aWNlc0NvdW50IC0gMTsgaisrKSB7XG4gICAgICAgIGFjdHVhbExlbmd0aC5wdXNoKHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS5sZW5bal0sIHRoaXMubmV4dEZyYW1lLmxlbltqXSwgZWxhcHNlZCkpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHYgIDogYWN0dWFsVmVydGljZXMsXG4gICAgICAgIGxlbjogYWN0dWFsTGVuZ3RoXG4gICAgfVxufTtcblxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xuICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLnBvaW50ZXIgPSByZXZlcnNlZCA/IHRoaXMuZnJhbWVDb3VudCAtIDEgOiAxO1xuICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xuICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRlZFBhdGg7XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4vQmV6aWVyRWFzaW5nJyk7XG5cbmZ1bmN0aW9uIEFuaW1hdGVkUHJvcGVydHkoZGF0YSkge1xuICAgIFByb3BlcnR5LmNhbGwodGhpcywgZGF0YSk7XG4gICAgdGhpcy5mcmFtZUNvdW50ID0gdGhpcy5mcmFtZXMubGVuZ3RoO1xufVxuXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUHJvcGVydHkucHJvdG90eXBlKTtcblxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XG4gICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB2YXIgYXJyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJyW2ldID0gYVtpXSArIHQgKiAoYltpXSAtIGFbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcbiAgICB9XG59O1xuXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5zZXRFYXNpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMubmV4dEZyYW1lLmVhc2VJbikge1xuICAgICAgICB0aGlzLmVhc2luZyA9IG5ldyBCZXppZXJFYXNpbmcodGhpcy5sYXN0RnJhbWUuZWFzZU91dFswXSwgdGhpcy5sYXN0RnJhbWUuZWFzZU91dFsxXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzBdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZWFzaW5nID0gbnVsbDtcbiAgICB9XG59O1xuXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgaWYgKHRoaXMuZmluaXNoZWQgJiYgdGltZSA+PSB0aGlzLm5leHRGcmFtZS50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZS52O1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCAmJiB0aW1lIDw9IHRoaXMubGFzdEZyYW1lLnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEZyYW1lLnY7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xuICAgICAgICBpZiAodGltZSA+IHRoaXMubmV4dEZyYW1lLnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgKyAxID09PSB0aGlzLmZyYW1lQ291bnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyKys7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGltZSA8IHRoaXMubGFzdEZyYW1lLnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgPCAyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlci0tO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlQXRUaW1lKHRpbWUpO1xuICAgIH1cbn07XG5cbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgLy9jb25zb2xlLmxvZyh0aW1lLCB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAyXS50LCB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KTtcblxuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xuICAgICAgICB0aGlzLnBvaW50ZXIgPSAxO1xuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRpbWUgPiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KSB7XG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuZnJhbWVDb3VudDsgaSsrKSB7XG4gICAgICAgIGlmICh0aW1lID49IHRoaXMuZnJhbWVzW2kgLSAxXS50ICYmIHRpbWUgPD0gdGhpcy5mcmFtZXNbaV0udCkge1xuICAgICAgICAgICAgdGhpcy5wb2ludGVyID0gaTtcbiAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbaSAtIDFdO1xuICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1tpXTtcbiAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldEVhc2luZygpO1xufTtcblxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0RWxhcHNlZCA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5sYXN0RnJhbWUudCApLFxuICAgICAgICBkdXJhdGlvbiA9IHRoaXMubmV4dEZyYW1lLnQgLSB0aGlzLmxhc3RGcmFtZS50LFxuICAgICAgICBlbGFwc2VkID0gZGVsdGEgLyBkdXJhdGlvbjtcblxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XG4gICAgZWxzZSBpZiAoZWxhcHNlZCA8IDApIGVsYXBzZWQgPSAwO1xuICAgIGVsc2UgaWYgKHRoaXMuZWFzaW5nKSBlbGFwc2VkID0gdGhpcy5lYXNpbmcoZWxhcHNlZCk7XG4gICAgcmV0dXJuIGVsYXBzZWQ7XG59O1xuXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52LCB0aGlzLm5leHRGcmFtZS52LCB0aGlzLmdldEVsYXBzZWQodGltZSkpO1xufTtcblxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgdGhpcy5wb2ludGVyID0gcmV2ZXJzZWQgPyB0aGlzLmZyYW1lQ291bnQgLSAxIDogMTtcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XG4gICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcbiAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0ZWRQcm9wZXJ0eTsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIEJlemllcihwYXRoKSB7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbn1cblxuQmV6aWVyLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbiAobGVuKSB7XG4gICAgdGhpcy5zdGVwcyA9IE1hdGguZmxvb3IobGVuIC8gMTApO1xuICAgIHRoaXMuYXJjTGVuZ3RocyA9IG5ldyBBcnJheSh0aGlzLnN0ZXBzICsgMSk7XG4gICAgdGhpcy5hcmNMZW5ndGhzWzBdID0gMDtcblxuICAgIHZhciBveCA9IHRoaXMuY3ViaWNOKDAsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXG4gICAgICAgIG95ID0gdGhpcy5jdWJpY04oMCwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKSxcbiAgICAgICAgY2xlbiA9IDAsXG4gICAgICAgIGl0ZXJhdG9yID0gMSAvIHRoaXMuc3RlcHM7XG5cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSB0aGlzLnN0ZXBzOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLmN1YmljTihpICogaXRlcmF0b3IsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXG4gICAgICAgICAgICB5ID0gdGhpcy5jdWJpY04oaSAqIGl0ZXJhdG9yLCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pO1xuXG4gICAgICAgIHZhciBkeCA9IG94IC0geCxcbiAgICAgICAgICAgIGR5ID0gb3kgLSB5O1xuXG4gICAgICAgIGNsZW4gKz0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICAgICAgdGhpcy5hcmNMZW5ndGhzW2ldID0gY2xlbjtcblxuICAgICAgICBveCA9IHg7XG4gICAgICAgIG95ID0geTtcbiAgICB9XG5cbiAgICB0aGlzLmxlbmd0aCA9IGNsZW47XG59O1xuXG5CZXppZXIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uICh1KSB7XG4gICAgdmFyIHRhcmdldExlbmd0aCA9IHUgKiB0aGlzLmFyY0xlbmd0aHNbdGhpcy5zdGVwc107XG4gICAgdmFyIGxvdyA9IDAsXG4gICAgICAgIGhpZ2ggPSB0aGlzLnN0ZXBzLFxuICAgICAgICBpbmRleCA9IDA7XG5cbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgICBpbmRleCA9IGxvdyArICgoKGhpZ2ggLSBsb3cpIC8gMikgfCAwKTtcbiAgICAgICAgaWYgKHRoaXMuYXJjTGVuZ3Roc1tpbmRleF0gPCB0YXJnZXRMZW5ndGgpIHtcbiAgICAgICAgICAgIGxvdyA9IGluZGV4ICsgMTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaGlnaCA9IGluZGV4O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmFyY0xlbmd0aHNbaW5kZXhdID4gdGFyZ2V0TGVuZ3RoKSB7XG4gICAgICAgIGluZGV4LS07XG4gICAgfVxuXG4gICAgdmFyIGxlbmd0aEJlZm9yZSA9IHRoaXMuYXJjTGVuZ3Roc1tpbmRleF07XG4gICAgaWYgKGxlbmd0aEJlZm9yZSA9PT0gdGFyZ2V0TGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBpbmRleCAvIHRoaXMuc3RlcHM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChpbmRleCArICh0YXJnZXRMZW5ndGggLSBsZW5ndGhCZWZvcmUpIC8gKHRoaXMuYXJjTGVuZ3Roc1tpbmRleCArIDFdIC0gbGVuZ3RoQmVmb3JlKSkgLyB0aGlzLnN0ZXBzO1xuICAgIH1cbn07XG5cbkJlemllci5wcm90b3R5cGUuZ2V0VmFsdWVzID0gZnVuY3Rpb24gKGVsYXBzZWQpIHtcbiAgICB2YXIgdCA9IHRoaXMubWFwKGVsYXBzZWQpLFxuICAgICAgICB4ID0gdGhpcy5jdWJpY04odCwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcbiAgICAgICAgeSA9IHRoaXMuY3ViaWNOKHQsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSk7XG5cbiAgICByZXR1cm4gW3gsIHldO1xufTtcblxuQmV6aWVyLnByb3RvdHlwZS5jdWJpY04gPSBmdW5jdGlvbiAocGN0LCBhLCBiLCBjLCBkKSB7XG4gICAgdmFyIHQyID0gcGN0ICogcGN0O1xuICAgIHZhciB0MyA9IHQyICogcGN0O1xuICAgIHJldHVybiBhICsgKC1hICogMyArIHBjdCAqICgzICogYSAtIGEgKiBwY3QpKSAqIHBjdFxuICAgICAgICArICgzICogYiArIHBjdCAqICgtNiAqIGIgKyBiICogMyAqIHBjdCkpICogcGN0XG4gICAgICAgICsgKGMgKiAzIC0gYyAqIDMgKiBwY3QpICogdDJcbiAgICAgICAgKyBkICogdDM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJlemllcjsiLCIvKipcbiAqIEJlemllckVhc2luZyAtIHVzZSBiZXppZXIgY3VydmUgZm9yIHRyYW5zaXRpb24gZWFzaW5nIGZ1bmN0aW9uXG4gKiBpcyBiYXNlZCBvbiBGaXJlZm94J3MgbnNTTUlMS2V5U3BsaW5lLmNwcFxuICogVXNhZ2U6XG4gKiB2YXIgc3BsaW5lID0gQmV6aWVyRWFzaW5nKDAuMjUsIDAuMSwgMC4yNSwgMS4wKVxuICogc3BsaW5lKHgpID0+IHJldHVybnMgdGhlIGVhc2luZyB2YWx1ZSB8IHggbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2VcbiAqXG4gKi9cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdy5kZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgd2luZG93LmRlZmluZS5hbWQpIHtcbiAgICAgICAgd2luZG93LmRlZmluZShbXSwgZGVmaW5pdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LkJlemllckVhc2luZyA9IGRlZmluaXRpb24oKTtcbiAgICB9XG59KGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFRoZXNlIHZhbHVlcyBhcmUgZXN0YWJsaXNoZWQgYnkgZW1waXJpY2lzbSB3aXRoIHRlc3RzICh0cmFkZW9mZjogcGVyZm9ybWFuY2UgVlMgcHJlY2lzaW9uKVxuICAgIHZhciBORVdUT05fSVRFUkFUSU9OUyA9IDQ7XG4gICAgdmFyIE5FV1RPTl9NSU5fU0xPUEUgPSAwLjAwMTtcbiAgICB2YXIgU1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxO1xuICAgIHZhciBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwO1xuXG4gICAgdmFyIGtTcGxpbmVUYWJsZVNpemUgPSAxMTtcbiAgICB2YXIga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApO1xuXG4gICAgdmFyIGZsb2F0MzJBcnJheVN1cHBvcnRlZCA9IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09IFwiZnVuY3Rpb25cIjtcblxuICAgIGZ1bmN0aW9uIEJlemllckVhc2luZyAobVgxLCBtWTEsIG1YMiwgbVkyKSB7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgYXJndW1lbnRzXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICE9PSA0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgcmVxdWlyZXMgNCBhcmd1bWVudHMuXCIpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTw0OyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGlzTmFOKGFyZ3VtZW50c1tpXSkgfHwgIWlzRmluaXRlKGFyZ3VtZW50c1tpXSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgYXJndW1lbnRzIHNob3VsZCBiZSBpbnRlZ2Vycy5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1YMSA8IDAgfHwgbVgxID4gMSB8fCBtWDIgPCAwIHx8IG1YMiA+IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyB4IHZhbHVlcyBtdXN0IGJlIGluIFswLCAxXSByYW5nZS5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbVNhbXBsZVZhbHVlcyA9IGZsb2F0MzJBcnJheVN1cHBvcnRlZCA/IG5ldyBGbG9hdDMyQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSkgOiBuZXcgQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSk7XG5cbiAgICAgICAgZnVuY3Rpb24gQSAoYUExLCBhQTIpIHsgcmV0dXJuIDEuMCAtIDMuMCAqIGFBMiArIDMuMCAqIGFBMTsgfVxuICAgICAgICBmdW5jdGlvbiBCIChhQTEsIGFBMikgeyByZXR1cm4gMy4wICogYUEyIC0gNi4wICogYUExOyB9XG4gICAgICAgIGZ1bmN0aW9uIEMgKGFBMSkgICAgICB7IHJldHVybiAzLjAgKiBhQTE7IH1cblxuICAgICAgICAvLyBSZXR1cm5zIHgodCkgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgeSh0KSBnaXZlbiB0LCB5MSwgYW5kIHkyLlxuICAgICAgICBmdW5jdGlvbiBjYWxjQmV6aWVyIChhVCwgYUExLCBhQTIpIHtcbiAgICAgICAgICAgIHJldHVybiAoKEEoYUExLCBhQTIpKmFUICsgQihhQTEsIGFBMikpKmFUICsgQyhhQTEpKSphVDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybnMgZHgvZHQgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgZHkvZHQgZ2l2ZW4gdCwgeTEsIGFuZCB5Mi5cbiAgICAgICAgZnVuY3Rpb24gZ2V0U2xvcGUgKGFULCBhQTEsIGFBMikge1xuICAgICAgICAgICAgcmV0dXJuIDMuMCAqIEEoYUExLCBhQTIpKmFUKmFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlIChhWCwgYUd1ZXNzVCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBORVdUT05fSVRFUkFUSU9OUzsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRTbG9wZSA9IGdldFNsb3BlKGFHdWVzc1QsIG1YMSwgbVgyKTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNsb3BlID09PSAwLjApIHJldHVybiBhR3Vlc3NUO1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICAgICAgICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhR3Vlc3NUO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2FsY1NhbXBsZVZhbHVlcyAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7ICsraSkge1xuICAgICAgICAgICAgICAgIG1TYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZSAoYVgsIGFBLCBhQikge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDIuMDtcbiAgICAgICAgICAgICAgICBjdXJyZW50WCA9IGNhbGNCZXppZXIoY3VycmVudFQsIG1YMSwgbVgyKSAtIGFYO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50WCA+IDAuMCkge1xuICAgICAgICAgICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gU1VCRElWSVNJT05fUFJFQ0lTSU9OICYmICsraSA8IFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TKTtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50VDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldFRGb3JYIChhWCkge1xuICAgICAgICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwLjA7XG4gICAgICAgICAgICB2YXIgY3VycmVudFNhbXBsZSA9IDE7XG4gICAgICAgICAgICB2YXIgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xuXG4gICAgICAgICAgICBmb3IgKDsgY3VycmVudFNhbXBsZSAhPSBsYXN0U2FtcGxlICYmIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0gPD0gYVg7ICsrY3VycmVudFNhbXBsZSkge1xuICAgICAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLS1jdXJyZW50U2FtcGxlO1xuXG4gICAgICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0byBwcm92aWRlIGFuIGluaXRpYWwgZ3Vlc3MgZm9yIHRcbiAgICAgICAgICAgIHZhciBkaXN0ID0gKGFYIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAobVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlKzFdIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSk7XG4gICAgICAgICAgICB2YXIgZ3Vlc3NGb3JUID0gaW50ZXJ2YWxTdGFydCArIGRpc3QgKiBrU2FtcGxlU3RlcFNpemU7XG5cbiAgICAgICAgICAgIHZhciBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcbiAgICAgICAgICAgIGlmIChpbml0aWFsU2xvcGUgPj0gTkVXVE9OX01JTl9TTE9QRSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JUKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09IDAuMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBndWVzc0ZvclQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1YMSAhPSBtWTEgfHwgbVgyICE9IG1ZMilcbiAgICAgICAgICAgIGNhbGNTYW1wbGVWYWx1ZXMoKTtcblxuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChhWCkge1xuICAgICAgICAgICAgaWYgKG1YMSA9PT0gbVkxICYmIG1YMiA9PT0gbVkyKSByZXR1cm4gYVg7IC8vIGxpbmVhclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBKYXZhU2NyaXB0IG51bWJlciBhcmUgaW1wcmVjaXNlLCB3ZSBzaG91bGQgZ3VhcmFudGVlIHRoZSBleHRyZW1lcyBhcmUgcmlnaHQuXG4gICAgICAgICAgICBpZiAoYVggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgaWYgKGFYID09PSAxKSByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKGFYKSwgbVkxLCBtWTIpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgc3RyID0gXCJCZXppZXJFYXNpbmcoXCIrW21YMSwgbVkxLCBtWDIsIG1ZMl0rXCIpXCI7XG4gICAgICAgIGYudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzdHI7IH07XG5cbiAgICAgICAgcmV0dXJuIGY7XG4gICAgfVxuXG4gICAgLy8gQ1NTIG1hcHBpbmdcbiAgICBCZXppZXJFYXNpbmcuY3NzID0ge1xuICAgICAgICBcImVhc2VcIjogICAgICAgIEJlemllckVhc2luZygwLjI1LCAwLjEsIDAuMjUsIDEuMCksXG4gICAgICAgIFwibGluZWFyXCI6ICAgICAgQmV6aWVyRWFzaW5nKDAuMDAsIDAuMCwgMS4wMCwgMS4wKSxcbiAgICAgICAgXCJlYXNlLWluXCI6ICAgICBCZXppZXJFYXNpbmcoMC40MiwgMC4wLCAxLjAwLCAxLjApLFxuICAgICAgICBcImVhc2Utb3V0XCI6ICAgIEJlemllckVhc2luZygwLjAwLCAwLjAsIDAuNTgsIDEuMCksXG4gICAgICAgIFwiZWFzZS1pbi1vdXRcIjogQmV6aWVyRWFzaW5nKDAuNDIsIDAuMCwgMC41OCwgMS4wKVxuICAgIH07XG5cbiAgICByZXR1cm4gQmV6aWVyRWFzaW5nO1xufSkpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcbiAgICBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XG5cbmZ1bmN0aW9uIEVsbGlwc2UoZGF0YSkge1xuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG5cbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcbiAgICAvL29wdGlvbmFsXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcbn1cblxuRWxsaXBzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcblxuRWxsaXBzZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcblxuICAgIHZhciBzaXplID0gdGhpcy5zaXplLmdldFZhbHVlKHRpbWUpO1xuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdO1xuXG4gICAgdmFyIGksIGo7XG5cbiAgICB2YXIgdyA9IHNpemVbMF0gLyAyLFxuICAgICAgICBoID0gc2l6ZVsxXSAvIDIsXG4gICAgICAgIHggPSBwb3NpdGlvblswXSAtIHcsXG4gICAgICAgIHkgPSBwb3NpdGlvblsxXSAtIGgsXG4gICAgICAgIG93ID0gdyAqIC41NTIyODQ4LFxuICAgICAgICBvaCA9IGggKiAuNTUyMjg0ODtcblxuICAgIHZhciB2ZXJ0aWNlcyA9IFtcbiAgICAgICAgW3ggKyB3ICsgb3csIHksIHggKyB3IC0gb3csIHksIHggKyB3LCB5XSxcbiAgICAgICAgW3ggKyB3ICsgdywgeSArIGggKyBvaCwgeCArIHcgKyB3LCB5ICsgaCAtIG9oLCB4ICsgdyArIHcsIHkgKyBoXSxcbiAgICAgICAgW3ggKyB3IC0gb3csIHkgKyBoICsgaCwgeCArIHcgKyBvdywgeSArIGggKyBoLCB4ICsgdywgeSArIGggKyBoXSxcbiAgICAgICAgW3gsIHkgKyBoIC0gb2gsIHgsIHkgKyBoICsgb2gsIHgsIHkgKyBoXVxuICAgIF07XG5cbiAgICBpZiAodHJpbSkge1xuICAgICAgICB2YXIgdHYsXG4gICAgICAgICAgICBsZW4gPSB3ICsgaDtcblxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGogPSBpICsgMTtcbiAgICAgICAgICAgIGlmIChqID4gMykgaiA9IDA7XG4gICAgICAgICAgICBpZiAoaSA+IHRyaW0uc3RhcnRJbmRleCAmJiBpIDwgdHJpbS5lbmRJbmRleCkge1xuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZlcnRpY2VzW2ldWzBdLCB2ZXJ0aWNlc1tpXVsxXSwgdmVydGljZXNbal1bMl0sIHZlcnRpY2VzW2pdWzNdLCB2ZXJ0aWNlc1tqXVs0XSwgdmVydGljZXNbal1bNV0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSB0cmltLnN0YXJ0SW5kZXggJiYgaSA9PT0gdHJpbS5lbmRJbmRleCkge1xuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGxlbik7XG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5zdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCB0cmltLnN0YXJ0LCAxLCBsZW4pO1xuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uZW5kSW5kZXgpIHtcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIDAsIHRyaW0uZW5kLCBsZW4pO1xuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGN0eC5tb3ZlVG8odmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgICAgICAgaWYgKGogPiAzKSBqID0gMDtcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZlcnRpY2VzW2ldWzBdLCB2ZXJ0aWNlc1tpXVsxXSwgdmVydGljZXNbal1bMl0sIHZlcnRpY2VzW2pdWzNdLCB2ZXJ0aWNlc1tqXVs0XSwgdmVydGljZXNbal1bNV0pO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRWxsaXBzZS5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltKSB7XG4gICAgdmFyIHN0YXJ0SW5kZXggPSBNYXRoLmZsb29yKHRyaW0uc3RhcnQgKiA0KSxcbiAgICAgICAgZW5kSW5kZXggPSBNYXRoLmZsb29yKHRyaW0uZW5kICogNCksXG4gICAgICAgIHN0YXJ0ID0gKHRyaW0uc3RhcnQgLSBzdGFydEluZGV4ICogMC4yNSkgKiA0LFxuICAgICAgICBlbmQgPSAodHJpbS5lbmQgLSBlbmRJbmRleCAqIDAuMjUpICogNDtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0SW5kZXg6IHN0YXJ0SW5kZXgsXG4gICAgICAgIGVuZEluZGV4ICA6IGVuZEluZGV4LFxuICAgICAgICBzdGFydCAgICAgOiBzdGFydCxcbiAgICAgICAgZW5kICAgICAgIDogZW5kXG4gICAgfTtcbn07XG5cbkVsbGlwc2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgdGhpcy5zaXplLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XG59O1xuXG5FbGxpcHNlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xuICAgIHRoaXMuc2l6ZS5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbGxpcHNlOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcblxuZnVuY3Rpb24gRmlsbChkYXRhKSB7XG4gICAgdGhpcy5jb2xvciA9IGRhdGEuY29sb3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpIDogbmV3IFByb3BlcnR5KGRhdGEuY29sb3IpO1xuICAgIGlmIChkYXRhLm9wYWNpdHkpIHRoaXMub3BhY2l0eSA9IGRhdGEub3BhY2l0eS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vcGFjaXR5KSA6IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xufVxuXG5GaWxsLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSA6IDE7XG4gICAgcmV0dXJuICdyZ2JhKCcgKyBNYXRoLnJvdW5kKGNvbG9yWzBdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzFdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzJdKSArICcsICcgKyBvcGFjaXR5ICsgJyknO1xufTtcblxuRmlsbC5wcm90b3R5cGUuc2V0Q29sb3IgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XG4gICAgdmFyIGNvbG9yID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XG59O1xuXG5GaWxsLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIHRoaXMuY29sb3Iuc2V0S2V5ZnJhbWVzKHRpbWUpO1xuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XG59O1xuXG5GaWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xuICAgIHRoaXMuY29sb3IucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGw7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgU3Ryb2tlID0gcmVxdWlyZSgnLi9TdHJva2UnKSxcbiAgICBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpLFxuICAgIEVsbGlwc2UgPSByZXF1aXJlKCcuL0VsbGlwc2UnKSxcbiAgICBQb2x5c3RhciA9IHJlcXVpcmUoJy4vUG9seXN0YXInKSxcbiAgICBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpLFxuICAgIEZpbGwgPSByZXF1aXJlKCcuL0ZpbGwnKSxcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIE1lcmdlID0gcmVxdWlyZSgnLi9NZXJnZScpLFxuICAgIFRyaW0gPSByZXF1aXJlKCcuL1RyaW0nKTtcblxuZnVuY3Rpb24gR3JvdXAoZGF0YSwgYnVmZmVyQ3R4LCBwYXJlbnRJbiwgcGFyZW50T3V0KSB7XG5cbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XG4gICAgdGhpcy5pbiA9IGRhdGEuaW4gPyBkYXRhLmluIDogcGFyZW50SW47XG4gICAgdGhpcy5vdXQgPSBkYXRhLm91dCA/IGRhdGEub3V0IDogcGFyZW50T3V0O1xuXG4gICAgaWYgKGRhdGEuZmlsbCkgdGhpcy5maWxsID0gbmV3IEZpbGwoZGF0YS5maWxsKTtcbiAgICBpZiAoZGF0YS5zdHJva2UpIHRoaXMuc3Ryb2tlID0gbmV3IFN0cm9rZShkYXRhLnN0cm9rZSk7XG4gICAgaWYgKGRhdGEudHJpbSkgdGhpcy50cmltID0gbmV3IFRyaW0oZGF0YS50cmltKTtcbiAgICBpZiAoZGF0YS5tZXJnZSkgdGhpcy5tZXJnZSA9IG5ldyBNZXJnZShkYXRhLm1lcmdlKTtcblxuICAgIHRoaXMudHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybShkYXRhLnRyYW5zZm9ybSk7XG4gICAgdGhpcy5idWZmZXJDdHggPSBidWZmZXJDdHg7XG5cbiAgICBpZiAoZGF0YS5ncm91cHMpIHtcbiAgICAgICAgdGhpcy5ncm91cHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5ncm91cHMucHVzaChuZXcgR3JvdXAoZGF0YS5ncm91cHNbaV0sIHRoaXMuYnVmZmVyQ3R4LCB0aGlzLmluLCB0aGlzLm91dCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICBpZiAoZGF0YS5zaGFwZXMpIHtcbiAgICAgICAgdGhpcy5zaGFwZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkYXRhLnNoYXBlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHNoYXBlID0gZGF0YS5zaGFwZXNbal07XG4gICAgICAgICAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3BhdGgnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlLmlzQW5pbWF0ZWQpIHRoaXMuc2hhcGVzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChzaGFwZSkpO1xuICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5zaGFwZXMucHVzaChuZXcgUGF0aChzaGFwZSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBSZWN0KHNoYXBlKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdlbGxpcHNlJykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IEVsbGlwc2Uoc2hhcGUpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3BvbHlzdGFyJykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IFBvbHlzdGFyKHNoYXBlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkdyb3VwLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgcGFyZW50RmlsbCwgcGFyZW50U3Ryb2tlLCBwYXJlbnRUcmltKSB7XG5cbiAgICB2YXIgaTtcblxuICAgIGN0eC5zYXZlKCk7XG5cbiAgICAvL1RPRE8gY2hlY2sgaWYgY29sb3Ivc3Ryb2tlIGlzIGNoYW5naW5nIG92ZXIgdGltZVxuICAgIHZhciBmaWxsID0gdGhpcy5maWxsIHx8IHBhcmVudEZpbGw7XG4gICAgdmFyIHN0cm9rZSA9IHRoaXMuc3Ryb2tlIHx8IHBhcmVudFN0cm9rZTtcbiAgICB2YXIgdHJpbVZhbHVlcyA9IHRoaXMudHJpbSA/IHRoaXMudHJpbS5nZXRUcmltKHRpbWUpIDogcGFyZW50VHJpbTtcblxuICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKGN0eCwgdGltZSk7XG4gICAgaWYgKHN0cm9rZSkgc3Ryb2tlLnNldFN0cm9rZShjdHgsIHRpbWUpO1xuXG4gICAgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XG5cbiAgICBpZiAodGhpcy5tZXJnZSkge1xuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5zYXZlKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMud2lkdGgsIHRoaXMuYnVmZmVyQ3R4LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0odGhpcy5idWZmZXJDdHgsIHRpbWUpO1xuXG4gICAgICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcbiAgICAgICAgaWYgKHN0cm9rZSkgc3Ryb2tlLnNldFN0cm9rZSh0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XG4gICAgfVxuXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGlmICh0aGlzLnNoYXBlcykge1xuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCB0cmltVmFsdWVzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlsbCkgdGhpcy5idWZmZXJDdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgIGlmIChzdHJva2UpIHRoaXMuYnVmZmVyQ3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubWVyZ2Uuc2V0Q29tcG9zaXRlT3BlcmF0aW9uKHRoaXMuYnVmZmVyQ3R4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LnJlc3RvcmUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0uZHJhdyhjdHgsIHRpbWUsIHRyaW1WYWx1ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc2hhcGVzW3RoaXMuc2hhcGVzLmxlbmd0aCAtIDFdLmNsb3NlZCkge1xuICAgICAgICAgICAgICAgIC8vY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9UT0RPIGdldCBvcmRlclxuICAgIGlmIChmaWxsKSBjdHguZmlsbCgpO1xuICAgIGlmIChzdHJva2UpIGN0eC5zdHJva2UoKTtcblxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcodGhpcy5idWZmZXJDdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVyZ2Uuc2V0Q29tcG9zaXRlT3BlcmF0aW9uKHRoaXMuYnVmZmVyQ3R4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmJ1ZmZlckN0eC5jYW52YXMsIDAsIDApO1xuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KGN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY3R4LnJlc3RvcmUoKTtcbn07XG5cbkdyb3VwLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIHRoaXMudHJhbnNmb3JtLnNldEtleWZyYW1lcyh0aW1lKTtcblxuICAgIGlmICh0aGlzLnNoYXBlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2pdLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMuc3Ryb2tlKSB0aGlzLnN0cm9rZS5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMudHJpbSkgdGhpcy50cmltLnJlc2V0KHRpbWUpO1xufTtcblxuR3JvdXAucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xuXG4gICAgaWYgKHRoaXMuc2hhcGVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnJlc2V0KHJldmVyc2VkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5ncm91cHMpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdGhpcy5ncm91cHNbal0ucmVzZXQocmV2ZXJzZWQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMuc3Ryb2tlKSB0aGlzLnN0cm9rZS5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMudHJpbSkgdGhpcy50cmltLnJlc2V0KHJldmVyc2VkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3JvdXA7XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gTWVyZ2UoZGF0YSkge1xuICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZTtcbn1cblxuTWVyZ2UucHJvdG90eXBlLnNldENvbXBvc2l0ZU9wZXJhdGlvbiA9IGZ1bmN0aW9uIChjdHgpIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdXQnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWluJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3hvcic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVyZ2U7XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEJlemllciA9IHJlcXVpcmUoJy4vQmV6aWVyJyk7XG5cbmZ1bmN0aW9uIFBhdGgoZGF0YSkge1xuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICB0aGlzLmNsb3NlZCA9IGRhdGEuY2xvc2VkO1xuICAgIHRoaXMuZnJhbWVzID0gZGF0YS5mcmFtZXM7XG4gICAgdGhpcy52ZXJ0aWNlc0NvdW50ID0gdGhpcy5mcmFtZXNbMF0udi5sZW5ndGg7XG59XG5cblBhdGgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XG4gICAgdmFyIGZyYW1lID0gdGhpcy5nZXRWYWx1ZSh0aW1lKSxcbiAgICAgICAgdmVydGljZXMgPSBmcmFtZS52O1xuXG4gICAgaWYgKHRyaW0pIHtcbiAgICAgICAgdHJpbSA9IHRoaXMuZ2V0VHJpbVZhbHVlcyh0cmltLCBmcmFtZSk7XG4gICAgICAgIGlmICh0cmltLnN0YXJ0ID09PSAwICYmIHRyaW0uZW5kID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBqID0gMTsgaiA8IHZlcnRpY2VzLmxlbmd0aDsgaisrKSB7XG5cbiAgICAgICAgdmFyIG5leHRWZXJ0ZXggPSB2ZXJ0aWNlc1tqXSxcbiAgICAgICAgICAgIGxhc3RWZXJ0ZXggPSB2ZXJ0aWNlc1tqIC0gMV07XG5cbiAgICAgICAgaWYgKHRyaW0pIHtcbiAgICAgICAgICAgIHZhciB0djtcblxuICAgICAgICAgICAgaWYgKGogPT09IDEgJiYgdHJpbS5zdGFydEluZGV4ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGogPT09IHRyaW0uc3RhcnRJbmRleCArIDEgJiYgaiA9PT0gdHJpbS5lbmRJbmRleCArIDEpIHtcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCB0cmltLnN0YXJ0LCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSkge1xuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIHRyaW0uc3RhcnQsIDEsIGZyYW1lLmxlbltqIC0gMV0pO1xuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgMCwgdHJpbS5lbmQsIGZyYW1lLmxlbltqIC0gMV0pO1xuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA+IHRyaW0uc3RhcnRJbmRleCArIDEgJiYgaiA8IHRyaW0uZW5kSW5kZXggKyAxKSB7XG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8obGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaiA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdHJpbSAmJiB0aGlzLmNsb3NlZCkge1xuICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCB2ZXJ0aWNlc1swXVsyXSwgdmVydGljZXNbMF1bM10sIHZlcnRpY2VzWzBdWzRdLCB2ZXJ0aWNlc1swXVs1XSk7XG4gICAgfVxufTtcblxuUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdO1xufTtcblxuUGF0aC5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltLCBmcmFtZSkge1xuICAgIHZhciBpO1xuXG4gICAgdmFyIGFjdHVhbFRyaW0gPSB7XG4gICAgICAgIHN0YXJ0SW5kZXg6IDAsXG4gICAgICAgIGVuZEluZGV4ICA6IDAsXG4gICAgICAgIHN0YXJ0ICAgICA6IDAsXG4gICAgICAgIGVuZCAgICAgICA6IDBcbiAgICB9O1xuXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDApIHtcbiAgICAgICAgaWYgKHRyaW0uZW5kID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcbiAgICAgICAgfSBlbHNlIGlmICh0cmltLmVuZCA9PT0gMSkge1xuICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGZyYW1lLmxlbi5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0b3RhbExlbiA9IHRoaXMuc3VtQXJyYXkoZnJhbWUubGVuKSxcbiAgICAgICAgdHJpbUF0TGVuO1xuXG4gICAgdHJpbUF0TGVuID0gdG90YWxMZW4gKiB0cmltLnN0YXJ0O1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGZyYW1lLmxlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHJpbUF0TGVuID4gMCAmJiB0cmltQXRMZW4gPCBmcmFtZS5sZW5baV0pIHtcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnRJbmRleCA9IGk7XG4gICAgICAgICAgICBhY3R1YWxUcmltLnN0YXJ0ID0gdHJpbUF0TGVuIC8gZnJhbWUubGVuW2ldO1xuICAgICAgICB9XG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XG4gICAgfVxuXG4gICAgdHJpbUF0TGVuID0gdG90YWxMZW4gKiB0cmltLmVuZDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBmcmFtZS5sZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRyaW1BdExlbiA+IDAgJiYgdHJpbUF0TGVuIDwgZnJhbWUubGVuW2ldKSB7XG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZEluZGV4ID0gaTtcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kID0gdHJpbUF0TGVuIC8gZnJhbWUubGVuW2ldO1xuICAgICAgICB9XG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjdHVhbFRyaW07XG59O1xuXG5QYXRoLnByb3RvdHlwZS50cmltID0gZnVuY3Rpb24gKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIGZyb20sIHRvLCBsZW4pIHtcblxuICAgIGlmIChmcm9tID09PSAwICYmIHRvID09PSAxKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydDogbGFzdFZlcnRleCxcbiAgICAgICAgICAgIGVuZCAgOiBuZXh0VmVydGV4XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNTdHJhaWdodChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKSkge1xuICAgICAgICBzdGFydFZlcnRleCA9IFtcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzBdLCBmcm9tKSxcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzFdLCBmcm9tKSxcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzJdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSxcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzNdLCBuZXh0VmVydGV4WzNdLCBmcm9tKSxcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzRdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSxcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzVdLCBuZXh0VmVydGV4WzVdLCBmcm9tKVxuICAgICAgICBdO1xuXG4gICAgICAgIGVuZFZlcnRleCA9IFtcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzBdLCB0byksXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgdG8pLFxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIHRvKSxcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzNdLCBuZXh0VmVydGV4WzNdLCB0byksXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgdG8pLFxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIHRvKVxuICAgICAgICBdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5iZXppZXIgPSBuZXcgQmV6aWVyKFtsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdXSk7XG4gICAgICAgIHRoaXMuYmV6aWVyLmdldExlbmd0aChsZW4pO1xuICAgICAgICBmcm9tID0gdGhpcy5iZXppZXIubWFwKGZyb20pO1xuICAgICAgICB0byA9IHRoaXMuYmV6aWVyLm1hcCh0byk7XG5cbiAgICAgICAgdmFyIGUxLCBmMSwgZzEsIGgxLCBqMSwgazEsXG4gICAgICAgICAgICBlMiwgZjIsIGcyLCBoMiwgajIsIGsyLFxuICAgICAgICAgICAgc3RhcnRWZXJ0ZXgsXG4gICAgICAgICAgICBlbmRWZXJ0ZXg7XG5cbiAgICAgICAgZTEgPSBbdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbMF0sIGZyb20pLCB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFsxXSwgZnJvbSldO1xuICAgICAgICBmMSA9IFt0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFsyXSwgZnJvbSksIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzNdLCBmcm9tKV07XG4gICAgICAgIGcxID0gW3RoaXMubGVycChuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSwgdGhpcy5sZXJwKG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNV0sIGZyb20pXTtcbiAgICAgICAgaDEgPSBbdGhpcy5sZXJwKGUxWzBdLCBmMVswXSwgZnJvbSksIHRoaXMubGVycChlMVsxXSwgZjFbMV0sIGZyb20pXTtcbiAgICAgICAgajEgPSBbdGhpcy5sZXJwKGYxWzBdLCBnMVswXSwgZnJvbSksIHRoaXMubGVycChmMVsxXSwgZzFbMV0sIGZyb20pXTtcbiAgICAgICAgazEgPSBbdGhpcy5sZXJwKGgxWzBdLCBqMVswXSwgZnJvbSksIHRoaXMubGVycChoMVsxXSwgajFbMV0sIGZyb20pXTtcblxuICAgICAgICBzdGFydFZlcnRleCA9IFtqMVswXSwgajFbMV0sIGgxWzBdLCBoMVsxXSwgazFbMF0sIGsxWzFdXTtcbiAgICAgICAgZW5kVmVydGV4ID0gW25leHRWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMV0sIGcxWzBdLCBnMVsxXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XV07XG5cbiAgICAgICAgZTIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzRdLCBzdGFydFZlcnRleFswXSwgdG8pLCB0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNV0sIHN0YXJ0VmVydGV4WzFdLCB0byldO1xuICAgICAgICBmMiA9IFt0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbMF0sIGVuZFZlcnRleFsyXSwgdG8pLCB0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbMV0sIGVuZFZlcnRleFszXSwgdG8pXTtcbiAgICAgICAgZzIgPSBbdGhpcy5sZXJwKGVuZFZlcnRleFsyXSwgZW5kVmVydGV4WzRdLCB0byksIHRoaXMubGVycChlbmRWZXJ0ZXhbM10sIGVuZFZlcnRleFs1XSwgdG8pXTtcbiAgICAgICAgaDIgPSBbdGhpcy5sZXJwKGUyWzBdLCBmMlswXSwgdG8pLCB0aGlzLmxlcnAoZTJbMV0sIGYyWzFdLCB0byldO1xuICAgICAgICBqMiA9IFt0aGlzLmxlcnAoZjJbMF0sIGcyWzBdLCB0byksIHRoaXMubGVycChmMlsxXSwgZzJbMV0sIHRvKV07XG4gICAgICAgIGsyID0gW3RoaXMubGVycChoMlswXSwgajJbMF0sIHRvKSwgdGhpcy5sZXJwKGgyWzFdLCBqMlsxXSwgdG8pXTtcblxuICAgICAgICBzdGFydFZlcnRleCA9IFtlMlswXSwgZTJbMV0sIHN0YXJ0VmVydGV4WzJdLCBzdGFydFZlcnRleFszXSwgc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzVdXTtcbiAgICAgICAgZW5kVmVydGV4ID0gW2oyWzBdLCBqMlsxXSwgaDJbMF0sIGgyWzFdLCBrMlswXSwgazJbMV1dO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IHN0YXJ0VmVydGV4LFxuICAgICAgICBlbmQgIDogZW5kVmVydGV4XG4gICAgfTtcbn07XG5cblBhdGgucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xuICAgIHZhciBzID0gMSAtIHQ7XG4gICAgcmV0dXJuIGEgKiBzICsgYiAqIHQ7XG59O1xuXG5QYXRoLnByb3RvdHlwZS5zdW1BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICBmdW5jdGlvbiBhZGQoYSwgYikge1xuICAgICAgICByZXR1cm4gYSArIGI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoYWRkKTtcbn07XG5cblBhdGgucHJvdG90eXBlLmlzU3RyYWlnaHQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGN0cmwxWCwgY3RybDFZLCBjdHJsMlgsIGN0cmwyWSwgZW5kWCwgZW5kWSkge1xuICAgIHJldHVybiBzdGFydFggPT09IGN0cmwxWCAmJiBzdGFydFkgPT09IGN0cmwxWSAmJiBlbmRYID09PSBjdHJsMlggJiYgZW5kWSA9PT0gY3RybDJZO1xufTtcblxuUGF0aC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcbn07XG5cblBhdGgucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGg7XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XG5cbmZ1bmN0aW9uIFBvbHlzdGFyKGRhdGEpIHtcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlOyAvLyBUT0RPID8/XG5cbiAgICB0aGlzLnN0YXJUeXBlID0gZGF0YS5zdGFyVHlwZTtcbiAgICB0aGlzLnBvaW50cyA9IGRhdGEucG9pbnRzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvaW50cykgOiBuZXcgUHJvcGVydHkoZGF0YS5wb2ludHMpO1xuICAgIHRoaXMuaW5uZXJSYWRpdXMgPSBkYXRhLmlubmVyUmFkaXVzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmlubmVyUmFkaXVzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmlubmVyUmFkaXVzKTtcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gZGF0YS5vdXRlclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cyk7XG5cbiAgICAvL29wdGluYWxzXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm90YXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucm90YXRpb24pO1xuICAgIGlmIChkYXRhLmlubmVyUm91bmRuZXNzKSB0aGlzLmlubmVyUm91bmRuZXNzID0gZGF0YS5pbm5lclJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJvdW5kbmVzcykgOiBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJvdW5kbmVzcyk7XG4gICAgaWYgKGRhdGEub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MgPSBkYXRhLm91dGVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKTtcbn1cblxuUG9seXN0YXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XG5cbiAgICB2YXIgcG9pbnRzID0gdGhpcy5wb2ludHMuZ2V0VmFsdWUodGltZSksXG4gICAgICAgIGlubmVyUmFkaXVzID0gdGhpcy5pbm5lclJhZGl1cy5nZXRWYWx1ZSh0aW1lKSxcbiAgICAgICAgb3V0ZXJSYWRpdXMgPSB0aGlzLm91dGVyUmFkaXVzLmdldFZhbHVlKHRpbWUpLFxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxuICAgICAgICByb3RhdGlvbiA9IHRoaXMucm90YXRpb24gPyB0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpIDogMCxcbiAgICAgICAgaW5uZXJSb3VuZG5lc3MgPSB0aGlzLmlubmVyUm91bmRuZXNzID8gdGhpcy5pbm5lclJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSA6IDAsXG4gICAgICAgIG91dGVyUm91bmRuZXNzID0gdGhpcy5vdXRlclJvdW5kbmVzcyA/IHRoaXMub3V0ZXJSb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwO1xuXG4gICAgcm90YXRpb24gPSB0aGlzLmRlZzJyYWQocm90YXRpb24pO1xuICAgIHZhciBzdGFydCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCByb3RhdGlvbik7XG5cbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgudHJhbnNsYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSk7XG4gICAgY3R4Lm1vdmVUbyhzdGFydFswXSwgc3RhcnRbMV0pO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHM7IGkrKykge1xuXG4gICAgICAgIHZhciBwSW5uZXIsXG4gICAgICAgICAgICBwT3V0ZXIsXG4gICAgICAgICAgICBwT3V0ZXIxVGFuZ2VudCxcbiAgICAgICAgICAgIHBPdXRlcjJUYW5nZW50LFxuICAgICAgICAgICAgcElubmVyMVRhbmdlbnQsXG4gICAgICAgICAgICBwSW5uZXIyVGFuZ2VudCxcbiAgICAgICAgICAgIG91dGVyT2Zmc2V0LFxuICAgICAgICAgICAgaW5uZXJPZmZzZXQsXG4gICAgICAgICAgICByb3Q7XG5cbiAgICAgICAgcm90ID0gTWF0aC5QSSAvIHBvaW50cyAqIDI7XG5cbiAgICAgICAgcElubmVyID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCAwLCAwIC0gaW5uZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpIC0gcm90IC8gMikgKyByb3RhdGlvbik7XG4gICAgICAgIHBPdXRlciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XG5cbiAgICAgICAgLy9GSXhNRVxuICAgICAgICBpZiAoIW91dGVyT2Zmc2V0KSBvdXRlck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBvdXRlclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xuICAgICAgICBpZiAoIWlubmVyT2Zmc2V0KSBpbm5lck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBpbm5lclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xuXG4gICAgICAgIHBPdXRlcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBvdXRlck9mZnNldCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogaSkgKyByb3RhdGlvbik7XG4gICAgICAgIHBJbm5lcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBpbm5lck9mZnNldCAqIC0xLCAwIC0gaW5uZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpIC0gcm90IC8gMikgKyByb3RhdGlvbik7XG4gICAgICAgIHBJbm5lcjJUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBpbm5lck9mZnNldCwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xuICAgICAgICBwT3V0ZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQgKiAtMSwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhclR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgIC8vc3RhclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocE91dGVyMVRhbmdlbnRbMF0sIHBPdXRlcjFUYW5nZW50WzFdLCBwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIHBJbm5lclswXSwgcElubmVyWzFdKTtcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHBJbm5lcjJUYW5nZW50WzBdLCBwSW5uZXIyVGFuZ2VudFsxXSwgcE91dGVyMlRhbmdlbnRbMF0sIHBPdXRlcjJUYW5nZW50WzFdLCBwT3V0ZXJbMF0sIHBPdXRlclsxXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL3BvbHlnb25cbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgcE91dGVyMlRhbmdlbnRbMF0sIHBPdXRlcjJUYW5nZW50WzFdLCBwT3V0ZXJbMF0sIHBPdXRlclsxXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2RlYnVnXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocElubmVyWzBdLCBwSW5uZXJbMV0sIDUsIDUpO1xuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXJbMF0sIHBPdXRlclsxXSwgNSwgNSk7XG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIDUsIDUpO1xuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcInJlZFwiO1xuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIDUsIDUpO1xuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImdyZWVuXCI7XG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBJbm5lcjJUYW5nZW50WzBdLCBwSW5uZXIyVGFuZ2VudFsxXSwgNSwgNSk7XG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYnJvd25cIjtcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyMlRhbmdlbnRbMF0sIHBPdXRlcjJUYW5nZW50WzFdLCA1LCA1KTtcblxuICAgIH1cblxuICAgIGN0eC5yZXN0b3JlKCk7XG59O1xuXG5Qb2x5c3Rhci5wcm90b3R5cGUucm90YXRlUG9pbnQgPSBmdW5jdGlvbiAoY3gsIGN5LCB4LCB5LCByYWRpYW5zKSB7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxuICAgICAgICBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKSxcbiAgICAgICAgbnggPSAoY29zICogKHggLSBjeCkpIC0gKHNpbiAqICh5IC0gY3kpKSArIGN4LFxuICAgICAgICBueSA9IChzaW4gKiAoeCAtIGN4KSkgKyAoY29zICogKHkgLSBjeSkpICsgY3k7XG4gICAgcmV0dXJuIFtueCwgbnldO1xufTtcblxuUG9seXN0YXIucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcbn07XG5cblBvbHlzdGFyLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIHRoaXMucG9pbnRzLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICB0aGlzLmlubmVyUmFkaXVzLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICB0aGlzLm91dGVyUmFkaXVzLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMucm90YXRpb24pIHRoaXMucm90YXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xuICAgIGlmICh0aGlzLmlubmVyUm91bmRuZXNzKSB0aGlzLmlubmVyUm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XG59O1xuXG5Qb2x5c3Rhci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcbiAgICB0aGlzLnBvaW50cy5yZXNldChyZXZlcnNlZCk7XG4gICAgdGhpcy5pbm5lclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XG4gICAgdGhpcy5vdXRlclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnJlc2V0KHJldmVyc2VkKTtcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MucmVzZXQocmV2ZXJzZWQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb2x5c3RhcjsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpLFxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcblxuZnVuY3Rpb24gUG9zaXRpb24oZGF0YSkge1xuICAgIEFuaW1hdGVkUHJvcGVydHkuY2FsbCh0aGlzLCBkYXRhKTtcbn1cblxuUG9zaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZSk7XG5cblBvc2l0aW9uLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0RWFzaW5nKCk7XG4gICAgdGhpcy5zZXRNb3Rpb25QYXRoKCk7XG59O1xuXG5Qb3NpdGlvbi5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIGlmICh0aGlzLm1vdGlvbnBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW90aW9ucGF0aC5nZXRWYWx1ZXModGhpcy5nZXRFbGFwc2VkKHRpbWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XG4gICAgfVxufTtcblxuUG9zaXRpb24ucHJvdG90eXBlLnNldE1vdGlvblBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMubGFzdEZyYW1lLm1vdGlvbnBhdGgpIHtcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoID0gbmV3IEJlemllcih0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKTtcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoLmdldExlbmd0aCh0aGlzLmxhc3RGcmFtZS5sZW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG51bGw7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb3NpdGlvbjtcblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBQcm9wZXJ0eShkYXRhKSB7XG4gICAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIG51bGw7XG4gICAgdGhpcy5mcmFtZXMgPSBkYXRhO1xufVxuXG5Qcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdLnY7XG59O1xuXG5Qcm9wZXJ0eS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcbn07XG5cblByb3BlcnR5LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9wZXJ0eTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XG5cbmZ1bmN0aW9uIFJlY3QoZGF0YSkge1xuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG5cbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcblxuICAgIC8vb3B0aW9uYWxzXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcbiAgICBpZiAoZGF0YS5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzID0gZGF0YS5yb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnJvdW5kbmVzcyk7XG59XG5cblJlY3QucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XG5cbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKSxcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcbiAgICAgICAgcm91bmRuZXNzID0gdGhpcy5yb3VuZG5lc3MgPyB0aGlzLnJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSA6IDA7XG5cbiAgICBpZiAoc2l6ZVswXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMF0gLyAyO1xuICAgIGlmIChzaXplWzFdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVsxXSAvIDI7XG5cbiAgICB2YXIgeCA9IHBvc2l0aW9uWzBdIC0gc2l6ZVswXSAvIDIsXG4gICAgICAgIHkgPSBwb3NpdGlvblsxXSAtIHNpemVbMV0gLyAyO1xuXG4gICAgaWYgKHRyaW0pIHtcbiAgICAgICAgdmFyIHR2O1xuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xuICAgICAgICAvL1RPRE8gYWRkIHRyaW1cbiAgICB9IGVsc2Uge1xuICAgICAgICBjdHgubW92ZVRvKHggKyByb3VuZG5lc3MsIHkpO1xuICAgICAgICBjdHguYXJjVG8oeCArIHNpemVbMF0sIHksIHggKyBzaXplWzBdLCB5ICsgc2l6ZVsxXSwgcm91bmRuZXNzKTtcbiAgICAgICAgY3R4LmFyY1RvKHggKyBzaXplWzBdLCB5ICsgc2l6ZVsxXSwgeCwgeSArIHNpemVbMV0sIHJvdW5kbmVzcyk7XG4gICAgICAgIGN0eC5hcmNUbyh4LCB5ICsgc2l6ZVsxXSwgeCwgeSwgcm91bmRuZXNzKTtcbiAgICAgICAgY3R4LmFyY1RvKHgsIHksIHggKyBzaXplWzBdLCB5LCByb3VuZG5lc3MpO1xuICAgIH1cblxufTtcblxuUmVjdC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcbiAgICB0aGlzLnNpemUuc2V0S2V5ZnJhbWVzKHRpbWUpO1xuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICBpZiAodGhpcy5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcbn07XG5cblJlY3QucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XG4gICAgdGhpcy5zaXplLnJlc2V0KHJldmVyc2VkKTtcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xuXG5mdW5jdGlvbiBTdHJva2UoZGF0YSkge1xuICAgIGlmIChkYXRhKSB7XG4gICAgICAgIHRoaXMuam9pbiA9IGRhdGEuam9pbjtcbiAgICAgICAgdGhpcy5jYXAgPSBkYXRhLmNhcDtcblxuICAgICAgICBpZiAoZGF0YS5taXRlckxpbWl0KSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5taXRlckxpbWl0Lmxlbmd0aCA+IDEpIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEubWl0ZXJMaW1pdCk7XG4gICAgICAgICAgICBlbHNlIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuY29sb3IubGVuZ3RoID4gMSkgdGhpcy5jb2xvciA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpO1xuICAgICAgICBlbHNlIHRoaXMuY29sb3IgPSBuZXcgUHJvcGVydHkoZGF0YS5jb2xvcik7XG5cbiAgICAgICAgaWYgKGRhdGEub3BhY2l0eS5sZW5ndGggPiAxKSB0aGlzLm9wYWNpdHkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xuICAgICAgICBlbHNlIHRoaXMub3BhY2l0eSA9IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xuXG4gICAgICAgIGlmIChkYXRhLndpZHRoLmxlbmd0aCA+IDEpIHRoaXMud2lkdGggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLndpZHRoKTtcbiAgICAgICAgZWxzZSB0aGlzLndpZHRoID0gbmV3IFByb3BlcnR5KGRhdGEud2lkdGgpO1xuICAgIH1cbn1cblxuU3Ryb2tlLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcbi8vICAgIGNvbnNvbGUubG9nKGNvbG9yKTtcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKTtcbiAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoY29sb3JbMF0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMV0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMl0pICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XG59O1xuXG5TdHJva2UucHJvdG90eXBlLnNldFN0cm9rZSA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcbiAgICB2YXIgc3Ryb2tlQ29sb3IgPSB0aGlzLmdldFZhbHVlKHRpbWUpO1xuICAgIHZhciBzdHJva2VXaWR0aCA9IHRoaXMud2lkdGguZ2V0VmFsdWUodGltZSk7XG4gICAgdmFyIHN0cm9rZUpvaW4gPSB0aGlzLmpvaW47XG4gICAgaWYgKHN0cm9rZUpvaW4gPT09ICdtaXRlcicpIHZhciBtaXRlckxpbWl0ID0gdGhpcy5taXRlckxpbWl0LmdldFZhbHVlKHRpbWUpO1xuXG4gICAgY3R4LmxpbmVXaWR0aCA9IHN0cm9rZVdpZHRoO1xuICAgIGN0eC5saW5lSm9pbiA9IHN0cm9rZUpvaW47XG4gICAgaWYgKG1pdGVyTGltaXQpIGN0eC5taXRlckxpbWl0ID0gbWl0ZXJMaW1pdDtcbiAgICBjdHgubGluZUNhcCA9IHRoaXMuY2FwO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZUNvbG9yO1xufTtcblxuU3Ryb2tlLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIHRoaXMuY29sb3Iuc2V0S2V5ZnJhbWVzKHRpbWUpO1xuICAgIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgdGhpcy53aWR0aC5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMubWl0ZXJMaW1pdCkgdGhpcy5taXRlckxpbWl0LnNldEtleWZyYW1lcyh0aW1lKTtcbn07XG5cblN0cm9rZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcbiAgICB0aGlzLmNvbG9yLnJlc2V0KHJldmVyc2VkKTtcbiAgICB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xuICAgIHRoaXMud2lkdGgucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5yZXNldChyZXZlcnNlZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cm9rZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5JyksXG4gICAgUG9zaXRpb24gPSByZXF1aXJlKCcuL1Bvc2l0aW9uJyk7XG5cbmZ1bmN0aW9uIFRyYW5zZm9ybShkYXRhKSB7XG4gICAgaWYgKCFkYXRhKSByZXR1cm47XG5cbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XG5cbiAgICBpZiAoZGF0YS5wb3NpdGlvblggJiYgZGF0YS5wb3NpdGlvblkpIHtcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb25YLmxlbmd0aCA+IDEgJiYgZGF0YS5wb3NpdGlvblkubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWCk7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25ZKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25YID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb25YKTtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25ZID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb25ZKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZGF0YS5wb3NpdGlvbikge1xuICAgICAgICBpZiAoZGF0YS5wb3NpdGlvbi5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvc2l0aW9uKGRhdGEucG9zaXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkYXRhLmFuY2hvcikgdGhpcy5hbmNob3IgPSBkYXRhLmFuY2hvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5hbmNob3IpIDogbmV3IFByb3BlcnR5KGRhdGEuYW5jaG9yKTtcbiAgICBpZiAoZGF0YS5zY2FsZVgpIHRoaXMuc2NhbGVYID0gZGF0YS5zY2FsZVgubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVYKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWCk7XG4gICAgaWYgKGRhdGEuc2NhbGVZKSB0aGlzLnNjYWxlWSA9IGRhdGEuc2NhbGVZLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNjYWxlWSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zY2FsZVkpO1xuICAgIGlmIChkYXRhLnNrZXcpIHRoaXMuc2tldyA9IGRhdGEuc2tldy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXcpO1xuICAgIGlmIChkYXRhLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzID0gZGF0YS5za2V3QXhpcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3QXhpcykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3QXhpcyk7XG4gICAgaWYgKGRhdGEucm90YXRpb24pIHRoaXMucm90YXRpb24gPSBkYXRhLnJvdGF0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnJvdGF0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnJvdGF0aW9uKTtcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XG5cbiAgICB2YXIgcG9zaXRpb25YLCBwb3NpdGlvblksXG4gICAgICAgIGFuY2hvciA9IHRoaXMuYW5jaG9yID8gdGhpcy5hbmNob3IuZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbiA/IHRoaXMuZGVnMnJhZCh0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpKSA6IDAsXG4gICAgICAgIHNrZXcgPSB0aGlzLnNrZXcgPyB0aGlzLmRlZzJyYWQodGhpcy5za2V3LmdldFZhbHVlKHRpbWUpKSA6IDAsXG4gICAgICAgIHNrZXdBeGlzID0gdGhpcy5za2V3QXhpcyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXdBeGlzLmdldFZhbHVlKHRpbWUpKSA6IDAsXG4gICAgICAgIHNjYWxlWCA9IHRoaXMuc2NhbGVYID8gdGhpcy5zY2FsZVguZ2V0VmFsdWUodGltZSkgOiAxLFxuICAgICAgICBzY2FsZVkgPSB0aGlzLnNjYWxlWSA/IHRoaXMuc2NhbGVZLmdldFZhbHVlKHRpbWUpIDogMSxcbiAgICAgICAgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSAqIGN0eC5nbG9iYWxBbHBoYSA6IGN0eC5nbG9iYWxBbHBoYTsgLy8gRklYTUUgd3JvbmcgdHJhbnNwYXJlbmN5IGlmIG5lc3RlZFxuXG4gICAgaWYgKHRoaXMucG9zaXRpb25YICYmIHRoaXMucG9zaXRpb25ZKSB7XG4gICAgICAgIHBvc2l0aW9uWCA9IHRoaXMucG9zaXRpb25YLmdldFZhbHVlKHRpbWUpO1xuICAgICAgICBwb3NpdGlvblkgPSB0aGlzLnBvc2l0aW9uWS5nZXRWYWx1ZSh0aW1lKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucG9zaXRpb24pIHtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lLCBjdHgpO1xuICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblswXTtcbiAgICAgICAgcG9zaXRpb25ZID0gcG9zaXRpb25bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcG9zaXRpb25YID0gMDtcbiAgICAgICAgcG9zaXRpb25ZID0gMDtcbiAgICB9XG5cbiAgICAvL29yZGVyIHZlcnkgdmVyeSBpbXBvcnRhbnQgOilcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIDAsIDEsIHBvc2l0aW9uWCAtIGFuY2hvclswXSwgcG9zaXRpb25ZIC0gYW5jaG9yWzFdKTtcbiAgICB0aGlzLnNldFJvdGF0aW9uKGN0eCwgcm90YXRpb24sIGFuY2hvclswXSwgYW5jaG9yWzFdKTtcbiAgICB0aGlzLnNldFNrZXcoY3R4LCBza2V3LCBza2V3QXhpcywgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xuICAgIHRoaXMuc2V0U2NhbGUoY3R4LCBzY2FsZVgsIHNjYWxlWSwgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xuICAgIGN0eC5nbG9iYWxBbHBoYSA9IG9wYWNpdHk7XG59O1xuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24gKGN0eCwgcmFkLCB4LCB5KSB7XG4gICAgdmFyIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcbiAgICB2YXIgZHggPSB4IC0gYyAqIHggKyBzICogeTtcbiAgICB2YXIgZHkgPSB5IC0gcyAqIHggLSBjICogeTtcbiAgICBjdHgudHJhbnNmb3JtKGMsIHMsIC1zLCBjLCBkeCwgZHkpO1xufTtcblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIChjdHgsIHN4LCBzeSwgeCwgeSkge1xuICAgIGN0eC50cmFuc2Zvcm0oc3gsIDAsIDAsIHN5LCAteCAqIHN4ICsgeCwgLXkgKiBzeSArIHkpO1xufTtcblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTa2V3ID0gZnVuY3Rpb24gKGN0eCwgc2tldywgYXhpcywgeCwgeSkge1xuICAgIHZhciB0ID0gTWF0aC50YW4oLXNrZXcpO1xuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCAtYXhpcywgeCwgeSk7XG4gICAgY3R4LnRyYW5zZm9ybSgxLCAwLCB0LCAxLCAteSAqIHQsIDApO1xuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCBheGlzLCB4LCB5KTtcbn07XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xufTtcblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIGlmICh0aGlzLmFuY2hvcikgdGhpcy5hbmNob3Iuc2V0S2V5ZnJhbWVzKHRpbWUpO1xuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICBpZiAodGhpcy5za2V3KSB0aGlzLnNrZXcuc2V0S2V5ZnJhbWVzKHRpbWUpO1xuICAgIGlmICh0aGlzLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMucG9zaXRpb25ZKSB0aGlzLnBvc2l0aW9uWS5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5zZXRLZXlmcmFtZXModGltZSk7XG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnNldEtleWZyYW1lcyh0aW1lKTtcbn07XG5cblRyYW5zZm9ybS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcbiAgICBpZiAodGhpcy5hbmNob3IpIHRoaXMuYW5jaG9yLnJlc2V0KHJldmVyc2VkKTtcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMuc2tldykgdGhpcy5za2V3LnJlc2V0KHJldmVyc2VkKTtcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5yZXNldChyZXZlcnNlZCk7XG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLnBvc2l0aW9uWCkgdGhpcy5wb3NpdGlvblgucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLnBvc2l0aW9uWSkgdGhpcy5wb3NpdGlvblkucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLnNjYWxlWCkgdGhpcy5zY2FsZVgucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLnNjYWxlWSkgdGhpcy5zY2FsZVkucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XG5cbmZ1bmN0aW9uIFRyaW0oZGF0YSkge1xuXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xuXG4gICAgaWYgKGRhdGEuc3RhcnQpIHRoaXMuc3RhcnQgPSBkYXRhLnN0YXJ0Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnN0YXJ0KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnN0YXJ0KTtcbiAgICBpZiAoZGF0YS5lbmQpIHRoaXMuZW5kID0gZGF0YS5lbmQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZW5kKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmVuZCk7XG4gICAgLy9pZiAoZGF0YS5vZmZzZXQpIHRoaXMub2Zmc2V0ID0gZGF0YS5vZmZzZXQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub2Zmc2V0KSA6IG5ldyBQcm9wZXJ0eShkYXRhLm9mZnNldCk7XG5cbn1cblxuVHJpbS5wcm90b3R5cGUuZ2V0VHJpbSA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5zdGFydCA/IHRoaXMuc3RhcnQuZ2V0VmFsdWUodGltZSkgOiAwLFxuICAgICAgICBlbmQgPSB0aGlzLmVuZCA/IHRoaXMuZW5kLmdldFZhbHVlKHRpbWUpIDogMTtcblxuICAgIHZhciB0cmltID0ge1xuICAgICAgICBzdGFydDogTWF0aC5taW4oc3RhcnQsIGVuZCksXG4gICAgICAgIGVuZCAgOiBNYXRoLm1heChzdGFydCwgZW5kKVxuICAgIH07XG5cbiAgICBpZiAodHJpbS5zdGFydCA9PT0gMCAmJiB0cmltLmVuZCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJpbTtcbiAgICB9XG59O1xuXG5UcmltLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xuICAgIGlmICh0aGlzLnN0YXJ0KSB0aGlzLnN0YXJ0LnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICBpZiAodGhpcy5lbmQpIHRoaXMuZW5kLnNldEtleWZyYW1lcyh0aW1lKTtcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcbn07XG5cblRyaW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQucmVzZXQocmV2ZXJzZWQpO1xuICAgIGlmICh0aGlzLmVuZCkgdGhpcy5lbmQucmVzZXQocmV2ZXJzZWQpO1xuICAgIC8vaWYgKHRoaXMub2Zmc2V0KSB0aGlzLm9mZnNldC5yZXNldCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmltO1xuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cbiJdfQ==
