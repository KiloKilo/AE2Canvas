(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AE2Canvas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AE2Canvas.js":[function(_dereq_,module,exports){
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
},{"./Group":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Group.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedPath.js":[function(_dereq_,module,exports){
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


























},{"./BezierEasing":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\BezierEasing.js","./Path":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Path.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js":[function(_dereq_,module,exports){
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
},{"./BezierEasing":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\BezierEasing.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Bezier.js":[function(_dereq_,module,exports){
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
},{}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\BezierEasing.js":[function(_dereq_,module,exports){
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
},{}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Ellipse.js":[function(_dereq_,module,exports){
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
},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Path":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Path.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Fill.js":[function(_dereq_,module,exports){
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
},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Group.js":[function(_dereq_,module,exports){
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


























},{"./AnimatedPath":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedPath.js","./Ellipse":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Ellipse.js","./Fill":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Fill.js","./Merge":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Merge.js","./Path":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Path.js","./Polystar":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Polystar.js","./Rect":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Rect.js","./Stroke":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Stroke.js","./Transform":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Transform.js","./Trim":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Trim.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Merge.js":[function(_dereq_,module,exports){
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


























},{}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Path.js":[function(_dereq_,module,exports){
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




























},{"./Bezier":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Bezier.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Polystar.js":[function(_dereq_,module,exports){
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
},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Position.js":[function(_dereq_,module,exports){
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


























},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Bezier":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Bezier.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js":[function(_dereq_,module,exports){
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
},{}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Rect.js":[function(_dereq_,module,exports){
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
},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Stroke.js":[function(_dereq_,module,exports){
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
},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Transform.js":[function(_dereq_,module,exports){
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
},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Position":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Position.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}],"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Trim.js":[function(_dereq_,module,exports){
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
























},{"./AnimatedProperty":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AnimatedProperty.js","./Property":"C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\Property.js"}]},{},["C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AE2Canvas.js"])("C:\\Users\\zgraggenl\\WebstormProjects\\ae2canvas\\src\\runtime\\AE2Canvas.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL01lcmdlLmpzIiwic3JjL3J1bnRpbWUvUGF0aC5qcyIsInNyYy9ydW50aW1lL1BvbHlzdGFyLmpzIiwic3JjL3J1bnRpbWUvUG9zaXRpb24uanMiLCJzcmMvcnVudGltZS9Qcm9wZXJ0eS5qcyIsInNyYy9ydW50aW1lL1JlY3QuanMiLCJzcmMvcnVudGltZS9TdHJva2UuanMiLCJzcmMvcnVudGltZS9UcmFuc2Zvcm0uanMiLCJzcmMvcnVudGltZS9UcmltLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgR3JvdXAgPSByZXF1aXJlKCcuL0dyb3VwJyk7XHJcblxyXG52YXIgX2FuaW1hdGlvbnMgPSBbXSxcclxuICAgIF9hbmltYXRpb25zTGVuZ3RoID0gMDtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGlvbihvcHRpb25zKSB7XHJcbiAgICB0aGlzLmRhdGEgPSBvcHRpb25zLmRhdGEgfHwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRocm93ICdubyBkYXRhJztcclxuICAgIH0oKTtcclxuXHJcbiAgICB0aGlzLnRoZW4gPSAwO1xyXG4gICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgIHRoaXMuZHVyYXRpb24gPSB0aGlzLmRhdGEuZHVyYXRpb247XHJcbiAgICB0aGlzLnRpbWVSYXRpbyA9IHRoaXMuZHVyYXRpb24gLyAxMDA7XHJcbiAgICB0aGlzLmJhc2VXaWR0aCA9IHRoaXMuZGF0YS53aWR0aDtcclxuICAgIHRoaXMuYmFzZUhlaWdodCA9IHRoaXMuZGF0YS5oZWlnaHQ7XHJcbiAgICB0aGlzLnJhdGlvID0gdGhpcy5kYXRhLndpZHRoIC8gdGhpcy5kYXRhLmhlaWdodDtcclxuXHJcbiAgICB0aGlzLm1hcmtlcnMgPSB0aGlzLmRhdGEubWFya2VycztcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5sb29wID0gb3B0aW9ucy5sb29wIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5oZCA9IG9wdGlvbnMuaGQgfHwgZmFsc2U7XHJcbiAgICB0aGlzLmZsdWlkID0gb3B0aW9ucy5mbHVpZCB8fCB0cnVlO1xyXG4gICAgdGhpcy5yZXZlcnNlZCA9IG9wdGlvbnMucmV2ZXJzZWQgfHwgZmFsc2U7XHJcbiAgICB0aGlzLm9uQ29tcGxldGUgPSBvcHRpb25zLm9uQ29tcGxldGUgfHwgZnVuY3Rpb24gKCkge1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmJhc2VXaWR0aDtcclxuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcclxuXHJcbiAgICB0aGlzLmJ1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5idWZmZXIud2lkdGggPSB0aGlzLmJhc2VXaWR0aDtcclxuICAgIHRoaXMuYnVmZmVyLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gdGhpcy5idWZmZXIuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5ncm91cHMucHVzaChuZXcgR3JvdXAodGhpcy5kYXRhLmdyb3Vwc1tpXSwgdGhpcy5idWZmZXJDdHgsIDAsIHRoaXMuZHVyYXRpb24pKTtcclxuICAgIH1cclxuICAgIHRoaXMuZ3JvdXBzTGVuZ3RoID0gdGhpcy5ncm91cHMubGVuZ3RoO1xyXG5cclxuICAgIHRoaXMucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICB0aGlzLnJlc2l6ZSgpO1xyXG5cclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG5cclxuICAgIF9hbmltYXRpb25zLnB1c2godGhpcyk7XHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IF9hbmltYXRpb25zLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0aW9uLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBwbGF5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGFydGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ290b0FuZFBsYXk6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLmdldE1hcmtlcihpZCk7XHJcbiAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gbWFya2VyLnRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ290b0FuZFN0b3A6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLmdldE1hcmtlcihpZCk7XHJcbiAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IG1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TWFya2VyOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGlkID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2lkXTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpZCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcnNbaV0uY29tbWVudCA9PT0gaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUud2FybignTWFya2VyIG5vdCBmb3VuZCcpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRTdGVwOiBmdW5jdGlvbiAoc3RlcCkge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY29tcFRpbWUgPSBzdGVwICogdGhpcy50aW1lUmF0aW87XHJcbiAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gdGhpcy5jb21wVGltZTtcclxuICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFN0ZXA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLmNvbXBUaW1lIC8gdGhpcy50aW1lUmF0aW8pO1xyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgdmFyIGRlbHRhID0gdGltZSAtIHRoaXMudGhlbjtcclxuICAgICAgICB0aGlzLnRoZW4gPSB0aW1lO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGFydGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnJldmVyc2VkID8gdGhpcy5jb21wVGltZSAtPSBkZWx0YSA6IHRoaXMuY29tcFRpbWUgKz0gZGVsdGE7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wVGltZSA+IHRoaXMuZHVyYXRpb24gfHwgdGhpcy5yZXZlcnNlZCAmJiB0aGlzLmNvbXBUaW1lIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvb3ApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhdyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5kcmF3RnJhbWUpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3KHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZHJhdzogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYXNlV2lkdGgsIHRoaXMuYmFzZUhlaWdodCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdyb3Vwc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aW1lID49IHRoaXMuZ3JvdXBzW2ldLmluICYmIHRpbWUgPCB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcodGhpcy5jdHgsIHRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy50aGVuID0gMDtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuZHVyYXRpb24gOiAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0ucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXRLZXlmcmFtZXM6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdyb3Vwc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLm9uQ29tcGxldGUgPSBudWxsO1xyXG4gICAgICAgIHZhciBpID0gX2FuaW1hdGlvbnMuaW5kZXhPZih0aGlzKTtcclxuICAgICAgICBpZiAoaSA+IC0xKSB7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgX2FuaW1hdGlvbnNMZW5ndGggPSBfYW5pbWF0aW9ucy5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmNhbnZhcy5wYXJlbnROb2RlKSB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuY2FudmFzKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVzaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZmx1aWQpIHtcclxuICAgICAgICAgICAgdmFyIGZhY3RvciA9IHRoaXMuaGQgPyAyIDogMTtcclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gdGhpcy5jYW52YXMuY2xpZW50V2lkdGggfHwgdGhpcy5iYXNlV2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2lkdGggKiBmYWN0b3I7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHdpZHRoIC8gdGhpcy5yYXRpbyAqIGZhY3RvcjtcclxuICAgICAgICAgICAgdGhpcy5zY2FsZSA9IHdpZHRoIC8gdGhpcy5iYXNlV2lkdGggKiBmYWN0b3I7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnRyYW5zZm9ybSh0aGlzLnNjYWxlLCAwLCAwLCB0aGlzLnNjYWxlLCAwLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0IHJldmVyc2VkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yZXZlcnNlZDtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0IHJldmVyc2VkKGJvb2wpIHtcclxuICAgICAgICB0aGlzLl9yZXZlcnNlZCA9IGJvb2w7XHJcbiAgICAgICAgaWYgKHRoaXMucGF1c2VkVGltZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5wYXVzZWRUaW1lO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuZHVyYXRpb24gOiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLScsIHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVzKHRoaXMuY29tcFRpbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgQW5pbWF0aW9uOiBBbmltYXRpb24sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL3NvbGUvdHdlZW4uanNcclxuICAgICAgICB0aW1lID0gdGltZSAhPT0gdW5kZWZpbmVkID8gdGltZSA6ICggdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnBlcmZvcm1hbmNlICE9PSB1bmRlZmluZWQgJiYgd2luZG93LnBlcmZvcm1hbmNlLm5vdyAhPT0gdW5kZWZpbmVkID8gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpIDogRGF0ZS5ub3coKSApO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9hbmltYXRpb25zTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgX2FuaW1hdGlvbnNbaV0udXBkYXRlKHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgQmV6aWVyRWFzaW5nID0gcmVxdWlyZSgnLi9CZXppZXJFYXNpbmcnKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkUGF0aChkYXRhKSB7XHJcbiAgICBQYXRoLmNhbGwodGhpcywgZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lQ291bnQgPSB0aGlzLmZyYW1lcy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuZmluaXNoZWQgJiYgdGltZSA+PSB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEZyYW1lO1xyXG4gICAgfSBlbHNlIGlmICghdGhpcy5zdGFydGVkICYmIHRpbWUgPD0gdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RGcmFtZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRpbWUgPiB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgKyAxID09PSB0aGlzLmZyYW1lQ291bnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRpbWUgPCB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgPCAyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlci0tO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlQXRUaW1lKHRpbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRpbWUgPCB0aGlzLmZyYW1lc1swXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRpbWUgPiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gdGhpcy5mcmFtZUNvdW50IC0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICAgIGlmICh0aW1lID49IHRoaXMuZnJhbWVzW2kgLSAxXS50ICYmIHRpbWUgPD0gdGhpcy5mcmFtZXNbaV0pIHtcclxuICAgICAgICAgICAgdGhpcy5wb2ludGVyID0gaTtcclxuICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1tpIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbaV07XHJcbiAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XHJcbiAgICByZXR1cm4gYSArIHQgKiAoYiAtIGEpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5zZXRFYXNpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5sYXN0RnJhbWUuZWFzZU91dCAmJiB0aGlzLm5leHRGcmFtZS5lYXNlSW4pIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG5ldyBCZXppZXJFYXNpbmcodGhpcy5sYXN0RnJhbWUuZWFzZU91dFswXSwgdGhpcy5sYXN0RnJhbWUuZWFzZU91dFsxXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzBdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMubGFzdEZyYW1lLnQgKTtcclxuICAgIHZhciBkdXJhdGlvbiA9IHRoaXMubmV4dEZyYW1lLnQgLSB0aGlzLmxhc3RGcmFtZS50O1xyXG4gICAgdmFyIGVsYXBzZWQgPSBkZWx0YSAvIGR1cmF0aW9uO1xyXG4gICAgaWYgKGVsYXBzZWQgPiAxKSBlbGFwc2VkID0gMTtcclxuICAgIGVsc2UgaWYgKGVsYXBzZWQgPCAwKSBlbGFwc2VkID0gMDtcclxuICAgIGVsc2UgaWYgKHRoaXMuZWFzaW5nKSBlbGFwc2VkID0gdGhpcy5lYXNpbmcoZWxhcHNlZCk7XHJcbiAgICB2YXIgYWN0dWFsVmVydGljZXMgPSBbXSxcclxuICAgICAgICBhY3R1YWxMZW5ndGggPSBbXTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGNwMXggPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVswXSwgdGhpcy5uZXh0RnJhbWUudltpXVswXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIGNwMXkgPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVsxXSwgdGhpcy5uZXh0RnJhbWUudltpXVsxXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIGNwMnggPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVsyXSwgdGhpcy5uZXh0RnJhbWUudltpXVsyXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIGNwMnkgPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVszXSwgdGhpcy5uZXh0RnJhbWUudltpXVszXSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIHggPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVs0XSwgdGhpcy5uZXh0RnJhbWUudltpXVs0XSwgZWxhcHNlZCksXHJcbiAgICAgICAgICAgIHkgPSB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVs1XSwgdGhpcy5uZXh0RnJhbWUudltpXVs1XSwgZWxhcHNlZCk7XHJcblxyXG4gICAgICAgIGFjdHVhbFZlcnRpY2VzLnB1c2goW2NwMXgsIGNwMXksIGNwMngsIGNwMnksIHgsIHldKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMudmVydGljZXNDb3VudCAtIDE7IGorKykge1xyXG4gICAgICAgIGFjdHVhbExlbmd0aC5wdXNoKHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS5sZW5bal0sIHRoaXMubmV4dEZyYW1lLmxlbltqXSwgZWxhcHNlZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdiAgOiBhY3R1YWxWZXJ0aWNlcyxcclxuICAgICAgICBsZW46IGFjdHVhbExlbmd0aFxyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnBvaW50ZXIgPSByZXZlcnNlZCA/IHRoaXMuZnJhbWVDb3VudCAtIDEgOiAxO1xyXG4gICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRlZFBhdGg7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBCZXppZXJFYXNpbmcgPSByZXF1aXJlKCcuL0JlemllckVhc2luZycpO1xyXG5cclxuZnVuY3Rpb24gQW5pbWF0ZWRQcm9wZXJ0eShkYXRhKSB7XHJcbiAgICBQcm9wZXJ0eS5jYWxsKHRoaXMsIGRhdGEpO1xyXG4gICAgdGhpcy5mcmFtZUNvdW50ID0gdGhpcy5mcmFtZXMubGVuZ3RoO1xyXG59XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUHJvcGVydHkucHJvdG90eXBlKTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xyXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIHZhciBhcnIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYXJyW2ldID0gYVtpXSArIHQgKiAoYltpXSAtIGFbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gYSArIHQgKiAoYiAtIGEpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuc2V0RWFzaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMubmV4dEZyYW1lLmVhc2VJbikge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbmV3IEJlemllckVhc2luZyh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzBdLCB0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzFdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMF0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblsxXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLmZpbmlzaGVkICYmIHRpbWUgPj0gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZS52O1xyXG4gICAgfSBlbHNlIGlmICghdGhpcy5zdGFydGVkICYmIHRpbWUgPD0gdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RGcmFtZS52O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGltZSA+IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciArIDEgPT09IHRoaXMuZnJhbWVDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXIrKztcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGltZSA8IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciA8IDIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyLS07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVBdFRpbWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZyh0aW1lLCB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAyXS50LCB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KTtcclxuXHJcbiAgICBpZiAodGltZSA8IHRoaXMuZnJhbWVzWzBdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGltZSA+IHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSB0aGlzLmZyYW1lQ291bnQgLSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuZnJhbWVDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5mcmFtZXNbaSAtIDFdLnQgJiYgdGltZSA8PSB0aGlzLmZyYW1lc1tpXS50KSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9pbnRlciA9IGk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbaSAtIDFdO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLm9uS2V5ZnJhbWVDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNldEVhc2luZygpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0RWxhcHNlZCA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAoIHRpbWUgLSB0aGlzLmxhc3RGcmFtZS50ICksXHJcbiAgICAgICAgZHVyYXRpb24gPSB0aGlzLm5leHRGcmFtZS50IC0gdGhpcy5sYXN0RnJhbWUudCxcclxuICAgICAgICBlbGFwc2VkID0gZGVsdGEgLyBkdXJhdGlvbjtcclxuXHJcbiAgICBpZiAoZWxhcHNlZCA+IDEpIGVsYXBzZWQgPSAxO1xyXG4gICAgZWxzZSBpZiAoZWxhcHNlZCA8IDApIGVsYXBzZWQgPSAwO1xyXG4gICAgZWxzZSBpZiAodGhpcy5lYXNpbmcpIGVsYXBzZWQgPSB0aGlzLmVhc2luZyhlbGFwc2VkKTtcclxuICAgIHJldHVybiBlbGFwc2VkO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgcmV0dXJuIHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52LCB0aGlzLm5leHRGcmFtZS52LCB0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5wb2ludGVyID0gcmV2ZXJzZWQgPyB0aGlzLmZyYW1lQ291bnQgLSAxIDogMTtcclxuICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0ZWRQcm9wZXJ0eTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBCZXppZXIocGF0aCkge1xyXG4gICAgdGhpcy5wYXRoID0gcGF0aDtcclxufVxyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbiAobGVuKSB7XHJcbiAgICB0aGlzLnN0ZXBzID0gTWF0aC5mbG9vcihsZW4gLyAxMCk7XHJcbiAgICB0aGlzLmFyY0xlbmd0aHMgPSBuZXcgQXJyYXkodGhpcy5zdGVwcyArIDEpO1xyXG4gICAgdGhpcy5hcmNMZW5ndGhzWzBdID0gMDtcclxuXHJcbiAgICB2YXIgb3ggPSB0aGlzLmN1YmljTigwLCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgIG95ID0gdGhpcy5jdWJpY04oMCwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKSxcclxuICAgICAgICBjbGVuID0gMCxcclxuICAgICAgICBpdGVyYXRvciA9IDEgLyB0aGlzLnN0ZXBzO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IHRoaXMuc3RlcHM7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcy5jdWJpY04oaSAqIGl0ZXJhdG9yLCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgICAgICB5ID0gdGhpcy5jdWJpY04oaSAqIGl0ZXJhdG9yLCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pO1xyXG5cclxuICAgICAgICB2YXIgZHggPSBveCAtIHgsXHJcbiAgICAgICAgICAgIGR5ID0gb3kgLSB5O1xyXG5cclxuICAgICAgICBjbGVuICs9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XHJcbiAgICAgICAgdGhpcy5hcmNMZW5ndGhzW2ldID0gY2xlbjtcclxuXHJcbiAgICAgICAgb3ggPSB4O1xyXG4gICAgICAgIG95ID0geTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxlbmd0aCA9IGNsZW47XHJcbn07XHJcblxyXG5CZXppZXIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uICh1KSB7XHJcbiAgICB2YXIgdGFyZ2V0TGVuZ3RoID0gdSAqIHRoaXMuYXJjTGVuZ3Roc1t0aGlzLnN0ZXBzXTtcclxuICAgIHZhciBsb3cgPSAwLFxyXG4gICAgICAgIGhpZ2ggPSB0aGlzLnN0ZXBzLFxyXG4gICAgICAgIGluZGV4ID0gMDtcclxuXHJcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xyXG4gICAgICAgIGluZGV4ID0gbG93ICsgKCgoaGlnaCAtIGxvdykgLyAyKSB8IDApO1xyXG4gICAgICAgIGlmICh0aGlzLmFyY0xlbmd0aHNbaW5kZXhdIDwgdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxvdyA9IGluZGV4ICsgMTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGlnaCA9IGluZGV4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmFyY0xlbmd0aHNbaW5kZXhdID4gdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgaW5kZXgtLTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbGVuZ3RoQmVmb3JlID0gdGhpcy5hcmNMZW5ndGhzW2luZGV4XTtcclxuICAgIGlmIChsZW5ndGhCZWZvcmUgPT09IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBpbmRleCAvIHRoaXMuc3RlcHM7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiAoaW5kZXggKyAodGFyZ2V0TGVuZ3RoIC0gbGVuZ3RoQmVmb3JlKSAvICh0aGlzLmFyY0xlbmd0aHNbaW5kZXggKyAxXSAtIGxlbmd0aEJlZm9yZSkpIC8gdGhpcy5zdGVwcztcclxuICAgIH1cclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUuZ2V0VmFsdWVzID0gZnVuY3Rpb24gKGVsYXBzZWQpIHtcclxuICAgIHZhciB0ID0gdGhpcy5tYXAoZWxhcHNlZCksXHJcbiAgICAgICAgeCA9IHRoaXMuY3ViaWNOKHQsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgeSA9IHRoaXMuY3ViaWNOKHQsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSk7XHJcblxyXG4gICAgcmV0dXJuIFt4LCB5XTtcclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUuY3ViaWNOID0gZnVuY3Rpb24gKHBjdCwgYSwgYiwgYywgZCkge1xyXG4gICAgdmFyIHQyID0gcGN0ICogcGN0O1xyXG4gICAgdmFyIHQzID0gdDIgKiBwY3Q7XHJcbiAgICByZXR1cm4gYSArICgtYSAqIDMgKyBwY3QgKiAoMyAqIGEgLSBhICogcGN0KSkgKiBwY3RcclxuICAgICAgICArICgzICogYiArIHBjdCAqICgtNiAqIGIgKyBiICogMyAqIHBjdCkpICogcGN0XHJcbiAgICAgICAgKyAoYyAqIDMgLSBjICogMyAqIHBjdCkgKiB0MlxyXG4gICAgICAgICsgZCAqIHQzO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCZXppZXI7IiwiLyoqXHJcbiAqIEJlemllckVhc2luZyAtIHVzZSBiZXppZXIgY3VydmUgZm9yIHRyYW5zaXRpb24gZWFzaW5nIGZ1bmN0aW9uXHJcbiAqIGlzIGJhc2VkIG9uIEZpcmVmb3gncyBuc1NNSUxLZXlTcGxpbmUuY3BwXHJcbiAqIFVzYWdlOlxyXG4gKiB2YXIgc3BsaW5lID0gQmV6aWVyRWFzaW5nKDAuMjUsIDAuMSwgMC4yNSwgMS4wKVxyXG4gKiBzcGxpbmUoeCkgPT4gcmV0dXJucyB0aGUgZWFzaW5nIHZhbHVlIHwgeCBtdXN0IGJlIGluIFswLCAxXSByYW5nZVxyXG4gKlxyXG4gKi9cclxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XHJcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cuZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHdpbmRvdy5kZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgd2luZG93LmRlZmluZShbXSwgZGVmaW5pdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdpbmRvdy5CZXppZXJFYXNpbmcgPSBkZWZpbml0aW9uKCk7XHJcbiAgICB9XHJcbn0oZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8vIFRoZXNlIHZhbHVlcyBhcmUgZXN0YWJsaXNoZWQgYnkgZW1waXJpY2lzbSB3aXRoIHRlc3RzICh0cmFkZW9mZjogcGVyZm9ybWFuY2UgVlMgcHJlY2lzaW9uKVxyXG4gICAgdmFyIE5FV1RPTl9JVEVSQVRJT05TID0gNDtcclxuICAgIHZhciBORVdUT05fTUlOX1NMT1BFID0gMC4wMDE7XHJcbiAgICB2YXIgU1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxO1xyXG4gICAgdmFyIFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TID0gMTA7XHJcblxyXG4gICAgdmFyIGtTcGxpbmVUYWJsZVNpemUgPSAxMTtcclxuICAgIHZhciBrU2FtcGxlU3RlcFNpemUgPSAxLjAgLyAoa1NwbGluZVRhYmxlU2l6ZSAtIDEuMCk7XHJcblxyXG4gICAgdmFyIGZsb2F0MzJBcnJheVN1cHBvcnRlZCA9IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09IFwiZnVuY3Rpb25cIjtcclxuXHJcbiAgICBmdW5jdGlvbiBCZXppZXJFYXNpbmcgKG1YMSwgbVkxLCBtWDIsIG1ZMikge1xyXG5cclxuICAgICAgICAvLyBWYWxpZGF0ZSBhcmd1bWVudHNcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gNCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgcmVxdWlyZXMgNCBhcmd1bWVudHMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8NDsgKytpKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGlzTmFOKGFyZ3VtZW50c1tpXSkgfHwgIWlzRmluaXRlKGFyZ3VtZW50c1tpXSkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyBhcmd1bWVudHMgc2hvdWxkIGJlIGludGVnZXJzLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobVgxIDwgMCB8fCBtWDEgPiAxIHx8IG1YMiA8IDAgfHwgbVgyID4gMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgeCB2YWx1ZXMgbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2UuXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG1TYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBBIChhQTEsIGFBMikgeyByZXR1cm4gMS4wIC0gMy4wICogYUEyICsgMy4wICogYUExOyB9XHJcbiAgICAgICAgZnVuY3Rpb24gQiAoYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEMgKGFBMSkgICAgICB7IHJldHVybiAzLjAgKiBhQTE7IH1cclxuXHJcbiAgICAgICAgLy8gUmV0dXJucyB4KHQpIGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIHkodCkgZ2l2ZW4gdCwgeTEsIGFuZCB5Mi5cclxuICAgICAgICBmdW5jdGlvbiBjYWxjQmV6aWVyIChhVCwgYUExLCBhQTIpIHtcclxuICAgICAgICAgICAgcmV0dXJuICgoQShhQTEsIGFBMikqYVQgKyBCKGFBMSwgYUEyKSkqYVQgKyBDKGFBMSkpKmFUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmV0dXJucyBkeC9kdCBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciBkeS9kdCBnaXZlbiB0LCB5MSwgYW5kIHkyLlxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFNsb3BlIChhVCwgYUExLCBhQTIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDMuMCAqIEEoYUExLCBhQTIpKmFUKmFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlIChhWCwgYUd1ZXNzVCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNsb3BlID09PSAwLjApIHJldHVybiBhR3Vlc3NUO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRYID0gY2FsY0JlemllcihhR3Vlc3NULCBtWDEsIG1YMikgLSBhWDtcclxuICAgICAgICAgICAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjYWxjU2FtcGxlVmFsdWVzICgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrU3BsaW5lVGFibGVTaXplOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIG1TYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlIChhWCwgYUEsIGFCKSB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50WCwgY3VycmVudFQsIGkgPSAwO1xyXG4gICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMi4wO1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50WCA+IDAuMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFCID0gY3VycmVudFQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IFNVQkRJVklTSU9OX1BSRUNJU0lPTiAmJiArK2kgPCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyk7XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50VDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFRGb3JYIChhWCkge1xyXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxTdGFydCA9IDAuMDtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTYW1wbGUgPSAxO1xyXG4gICAgICAgICAgICB2YXIgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT0gbGFzdFNhbXBsZSAmJiBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyArK2N1cnJlbnRTYW1wbGUpIHtcclxuICAgICAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC0tY3VycmVudFNhbXBsZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludGVycG9sYXRlIHRvIHByb3ZpZGUgYW4gaW5pdGlhbCBndWVzcyBmb3IgdFxyXG4gICAgICAgICAgICB2YXIgZGlzdCA9IChhWCAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZSsxXSAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pO1xyXG4gICAgICAgICAgICB2YXIgZ3Vlc3NGb3JUID0gaW50ZXJ2YWxTdGFydCArIGRpc3QgKiBrU2FtcGxlU3RlcFNpemU7XHJcblxyXG4gICAgICAgICAgICB2YXIgaW5pdGlhbFNsb3BlID0gZ2V0U2xvcGUoZ3Vlc3NGb3JULCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsU2xvcGUgPj0gTkVXVE9OX01JTl9TTE9QRSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBndWVzc0ZvclQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluaXRpYWxTbG9wZSA9PSAwLjApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBndWVzc0ZvclQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmluYXJ5U3ViZGl2aWRlKGFYLCBpbnRlcnZhbFN0YXJ0LCBpbnRlcnZhbFN0YXJ0ICsga1NhbXBsZVN0ZXBTaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1YMSAhPSBtWTEgfHwgbVgyICE9IG1ZMilcclxuICAgICAgICAgICAgY2FsY1NhbXBsZVZhbHVlcygpO1xyXG5cclxuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChhWCkge1xyXG4gICAgICAgICAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHJldHVybiBhWDsgLy8gbGluZWFyXHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2UgSmF2YVNjcmlwdCBudW1iZXIgYXJlIGltcHJlY2lzZSwgd2Ugc2hvdWxkIGd1YXJhbnRlZSB0aGUgZXh0cmVtZXMgYXJlIHJpZ2h0LlxyXG4gICAgICAgICAgICBpZiAoYVggPT09IDApIHJldHVybiAwO1xyXG4gICAgICAgICAgICBpZiAoYVggPT09IDEpIHJldHVybiAxO1xyXG4gICAgICAgICAgICByZXR1cm4gY2FsY0JlemllcihnZXRURm9yWChhWCksIG1ZMSwgbVkyKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBzdHIgPSBcIkJlemllckVhc2luZyhcIitbbVgxLCBtWTEsIG1YMiwgbVkyXStcIilcIjtcclxuICAgICAgICBmLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gc3RyOyB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDU1MgbWFwcGluZ1xyXG4gICAgQmV6aWVyRWFzaW5nLmNzcyA9IHtcclxuICAgICAgICBcImVhc2VcIjogICAgICAgIEJlemllckVhc2luZygwLjI1LCAwLjEsIDAuMjUsIDEuMCksXHJcbiAgICAgICAgXCJsaW5lYXJcIjogICAgICBCZXppZXJFYXNpbmcoMC4wMCwgMC4wLCAxLjAwLCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1pblwiOiAgICAgQmV6aWVyRWFzaW5nKDAuNDIsIDAuMCwgMS4wMCwgMS4wKSxcclxuICAgICAgICBcImVhc2Utb3V0XCI6ICAgIEJlemllckVhc2luZygwLjAwLCAwLjAsIDAuNTgsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLWluLW91dFwiOiBCZXppZXJFYXNpbmcoMC40MiwgMC4wLCAwLjU4LCAxLjApXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBCZXppZXJFYXNpbmc7XHJcbn0pKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBFbGxpcHNlKGRhdGEpIHtcclxuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcclxuICAgIC8vb3B0aW9uYWxcclxuICAgIGlmIChkYXRhLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uID0gZGF0YS5wb3NpdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbn1cclxuXHJcbkVsbGlwc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXRoLnByb3RvdHlwZSk7XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgdHJpbSkge1xyXG5cclxuICAgIHZhciBzaXplID0gdGhpcy5zaXplLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiA/IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSkgOiBbMCwgMF07XHJcblxyXG4gICAgdmFyIGksIGo7XHJcblxyXG4gICAgdmFyIHcgPSBzaXplWzBdIC8gMixcclxuICAgICAgICBoID0gc2l6ZVsxXSAvIDIsXHJcbiAgICAgICAgeCA9IHBvc2l0aW9uWzBdIC0gdyxcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0gLSBoLFxyXG4gICAgICAgIG93ID0gdyAqIC41NTIyODQ4LFxyXG4gICAgICAgIG9oID0gaCAqIC41NTIyODQ4O1xyXG5cclxuICAgIHZhciB2ZXJ0aWNlcyA9IFtcclxuICAgICAgICBbeCArIHcgKyBvdywgeSwgeCArIHcgLSBvdywgeSwgeCArIHcsIHldLFxyXG4gICAgICAgIFt4ICsgdyArIHcsIHkgKyBoICsgb2gsIHggKyB3ICsgdywgeSArIGggLSBvaCwgeCArIHcgKyB3LCB5ICsgaF0sXHJcbiAgICAgICAgW3ggKyB3IC0gb3csIHkgKyBoICsgaCwgeCArIHcgKyBvdywgeSArIGggKyBoLCB4ICsgdywgeSArIGggKyBoXSxcclxuICAgICAgICBbeCwgeSArIGggLSBvaCwgeCwgeSArIGggKyBvaCwgeCwgeSArIGhdXHJcbiAgICBdO1xyXG5cclxuICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgdmFyIHR2LFxyXG4gICAgICAgICAgICBsZW4gPSB3ICsgaDtcclxuXHJcbiAgICAgICAgdHJpbSA9IHRoaXMuZ2V0VHJpbVZhbHVlcyh0cmltKTtcclxuXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xyXG4gICAgICAgICAgICBqID0gaSArIDE7XHJcbiAgICAgICAgICAgIGlmIChqID4gMykgaiA9IDA7XHJcbiAgICAgICAgICAgIGlmIChpID4gdHJpbS5zdGFydEluZGV4ICYmIGkgPCB0cmltLmVuZEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2ZXJ0aWNlc1tpXVswXSwgdmVydGljZXNbaV1bMV0sIHZlcnRpY2VzW2pdWzJdLCB2ZXJ0aWNlc1tqXVszXSwgdmVydGljZXNbal1bNF0sIHZlcnRpY2VzW2pdWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSB0cmltLnN0YXJ0SW5kZXggJiYgaSA9PT0gdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCB0cmltLnN0YXJ0LCB0cmltLmVuZCwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSB0cmltLnN0YXJ0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgdHJpbS5zdGFydCwgMSwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSB0cmltLmVuZEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIDAsIHRyaW0uZW5kLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdHgubW92ZVRvKHZlcnRpY2VzWzBdWzRdLCB2ZXJ0aWNlc1swXVs1XSk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xyXG4gICAgICAgICAgICBqID0gaSArIDE7XHJcbiAgICAgICAgICAgIGlmIChqID4gMykgaiA9IDA7XHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZlcnRpY2VzW2ldWzBdLCB2ZXJ0aWNlc1tpXVsxXSwgdmVydGljZXNbal1bMl0sIHZlcnRpY2VzW2pdWzNdLCB2ZXJ0aWNlc1tqXVs0XSwgdmVydGljZXNbal1bNV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLmdldFRyaW1WYWx1ZXMgPSBmdW5jdGlvbiAodHJpbSkge1xyXG4gICAgdmFyIHN0YXJ0SW5kZXggPSBNYXRoLmZsb29yKHRyaW0uc3RhcnQgKiA0KSxcclxuICAgICAgICBlbmRJbmRleCA9IE1hdGguZmxvb3IodHJpbS5lbmQgKiA0KSxcclxuICAgICAgICBzdGFydCA9ICh0cmltLnN0YXJ0IC0gc3RhcnRJbmRleCAqIDAuMjUpICogNCxcclxuICAgICAgICBlbmQgPSAodHJpbS5lbmQgLSBlbmRJbmRleCAqIDAuMjUpICogNDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXJ0SW5kZXg6IHN0YXJ0SW5kZXgsXHJcbiAgICAgICAgZW5kSW5kZXggIDogZW5kSW5kZXgsXHJcbiAgICAgICAgc3RhcnQgICAgIDogc3RhcnQsXHJcbiAgICAgICAgZW5kICAgICAgIDogZW5kXHJcbiAgICB9O1xyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuc2l6ZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5zaXplLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRWxsaXBzZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBGaWxsKGRhdGEpIHtcclxuICAgIHRoaXMuY29sb3IgPSBkYXRhLmNvbG9yLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmNvbG9yKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuICAgIGlmIChkYXRhLm9wYWNpdHkpIHRoaXMub3BhY2l0eSA9IGRhdGEub3BhY2l0eS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vcGFjaXR5KSA6IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG59XHJcblxyXG5GaWxsLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgY29sb3IgPSB0aGlzLmNvbG9yLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkgPyB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgOiAxO1xyXG4gICAgcmV0dXJuICdyZ2JhKCcgKyBNYXRoLnJvdW5kKGNvbG9yWzBdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzFdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzJdKSArICcsICcgKyBvcGFjaXR5ICsgJyknO1xyXG59O1xyXG5cclxuRmlsbC5wcm90b3R5cGUuc2V0Q29sb3IgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcbiAgICB2YXIgY29sb3IgPSB0aGlzLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yO1xyXG59O1xyXG5cclxuRmlsbC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuY29sb3Iuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmNvbG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGw7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFN0cm9rZSA9IHJlcXVpcmUoJy4vU3Ryb2tlJyksXHJcbiAgICBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBSZWN0ID0gcmVxdWlyZSgnLi9SZWN0JyksXHJcbiAgICBFbGxpcHNlID0gcmVxdWlyZSgnLi9FbGxpcHNlJyksXHJcbiAgICBQb2x5c3RhciA9IHJlcXVpcmUoJy4vUG9seXN0YXInKSxcclxuICAgIEFuaW1hdGVkUGF0aCA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQYXRoJyksXHJcbiAgICBGaWxsID0gcmVxdWlyZSgnLi9GaWxsJyksXHJcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxyXG4gICAgTWVyZ2UgPSByZXF1aXJlKCcuL01lcmdlJyksXHJcbiAgICBUcmltID0gcmVxdWlyZSgnLi9UcmltJyk7XHJcblxyXG5mdW5jdGlvbiBHcm91cChkYXRhLCBidWZmZXJDdHgsIHBhcmVudEluLCBwYXJlbnRPdXQpIHtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmluID0gZGF0YS5pbiA/IGRhdGEuaW4gOiBwYXJlbnRJbjtcclxuICAgIHRoaXMub3V0ID0gZGF0YS5vdXQgPyBkYXRhLm91dCA6IHBhcmVudE91dDtcclxuXHJcbiAgICBpZiAoZGF0YS5maWxsKSB0aGlzLmZpbGwgPSBuZXcgRmlsbChkYXRhLmZpbGwpO1xyXG4gICAgaWYgKGRhdGEuc3Ryb2tlKSB0aGlzLnN0cm9rZSA9IG5ldyBTdHJva2UoZGF0YS5zdHJva2UpO1xyXG4gICAgaWYgKGRhdGEudHJpbSkgdGhpcy50cmltID0gbmV3IFRyaW0oZGF0YS50cmltKTtcclxuICAgIGlmIChkYXRhLm1lcmdlKSB0aGlzLm1lcmdlID0gbmV3IE1lcmdlKGRhdGEubWVyZ2UpO1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybShkYXRhLnRyYW5zZm9ybSk7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IGJ1ZmZlckN0eDtcclxuXHJcbiAgICBpZiAoZGF0YS5ncm91cHMpIHtcclxuICAgICAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHMucHVzaChuZXcgR3JvdXAoZGF0YS5ncm91cHNbaV0sIHRoaXMuYnVmZmVyQ3R4LCB0aGlzLmluLCB0aGlzLm91dCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL1xyXG4gICAgaWYgKGRhdGEuc2hhcGVzKSB7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRhdGEuc2hhcGVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IGRhdGEuc2hhcGVzW2pdO1xyXG4gICAgICAgICAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3BhdGgnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUuaXNBbmltYXRlZCkgdGhpcy5zaGFwZXMucHVzaChuZXcgQW5pbWF0ZWRQYXRoKHNoYXBlKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXMuc2hhcGVzLnB1c2gobmV3IFBhdGgoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IFJlY3Qoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAnZWxsaXBzZScpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IEVsbGlwc2Uoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAncG9seXN0YXInKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBQb2x5c3RhcihzaGFwZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5Hcm91cC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHBhcmVudEZpbGwsIHBhcmVudFN0cm9rZSwgcGFyZW50VHJpbSkge1xyXG5cclxuICAgIHZhciBpO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcblxyXG4gICAgLy9UT0RPIGNoZWNrIGlmIGNvbG9yL3N0cm9rZSBpcyBjaGFuZ2luZyBvdmVyIHRpbWVcclxuICAgIHZhciBmaWxsID0gdGhpcy5maWxsIHx8IHBhcmVudEZpbGw7XHJcbiAgICB2YXIgc3Ryb2tlID0gdGhpcy5zdHJva2UgfHwgcGFyZW50U3Ryb2tlO1xyXG4gICAgdmFyIHRyaW1WYWx1ZXMgPSB0aGlzLnRyaW0gPyB0aGlzLnRyaW0uZ2V0VHJpbSh0aW1lKSA6IHBhcmVudFRyaW07XHJcblxyXG4gICAgaWYgKGZpbGwpIGZpbGwuc2V0Q29sb3IoY3R4LCB0aW1lKTtcclxuICAgIGlmIChzdHJva2UpIHN0cm9rZS5zZXRTdHJva2UoY3R4LCB0aW1lKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0oY3R4LCB0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5tZXJnZSkge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LnNhdmUoKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5idWZmZXJDdHguY2FudmFzLndpZHRoLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLnRyYW5zZm9ybS50cmFuc2Zvcm0odGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG5cclxuICAgICAgICBpZiAoZmlsbCkgZmlsbC5zZXRDb2xvcih0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XHJcbiAgICAgICAgaWYgKHN0cm9rZSkgc3Ryb2tlLnNldFN0cm9rZSh0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgaWYgKHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubWVyZ2UpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0uZHJhdyh0aGlzLmJ1ZmZlckN0eCwgdGltZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaWxsKSB0aGlzLmJ1ZmZlckN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3Ryb2tlKSB0aGlzLmJ1ZmZlckN0eC5zdHJva2UoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tZXJnZS5zZXRDb21wb3NpdGVPcGVyYXRpb24odGhpcy5idWZmZXJDdHgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuYnVmZmVyQ3R4LmNhbnZhcywgMCwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KGN0eCwgdGltZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuc2hhcGVzW3RoaXMuc2hhcGVzLmxlbmd0aCAtIDFdLmNsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgLy9jdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9UT0RPIGdldCBvcmRlclxyXG4gICAgaWYgKGZpbGwpIGN0eC5maWxsKCk7XHJcbiAgICBpZiAoc3Ryb2tlKSBjdHguc3Ryb2tlKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubWVyZ2UpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcodGhpcy5idWZmZXJDdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXJnZS5zZXRDb21wb3NpdGVPcGVyYXRpb24odGhpcy5idWZmZXJDdHgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyhjdHgsIHRpbWUsIGZpbGwsIHN0cm9rZSwgdHJpbVZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuR3JvdXAucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5zZXRLZXlmcmFtZXModGltZSk7XHJcblxyXG4gICAgaWYgKHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1tqXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zdHJva2UpIHRoaXMuc3Ryb2tlLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnRyaW0pIHRoaXMudHJpbS5yZXNldCh0aW1lKTtcclxufTtcclxuXHJcbkdyb3VwLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQocmV2ZXJzZWQpO1xyXG5cclxuICAgIGlmICh0aGlzLnNoYXBlcykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNbal0ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmZpbGwpIHRoaXMuZmlsbC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zdHJva2UpIHRoaXMuc3Ryb2tlLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnRyaW0pIHRoaXMudHJpbS5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gTWVyZ2UoZGF0YSkge1xyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG59XHJcblxyXG5NZXJnZS5wcm90b3R5cGUuc2V0Q29tcG9zaXRlT3BlcmF0aW9uID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW91dCc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2UtaW4nO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDU6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAneG9yJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lcmdlO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEJlemllciA9IHJlcXVpcmUoJy4vQmV6aWVyJyk7XHJcblxyXG5mdW5jdGlvbiBQYXRoKGRhdGEpIHtcclxuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gZGF0YS5jbG9zZWQ7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGEuZnJhbWVzO1xyXG4gICAgdGhpcy52ZXJ0aWNlc0NvdW50ID0gdGhpcy5mcmFtZXNbMF0udi5sZW5ndGg7XHJcbn1cclxuXHJcblBhdGgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcbiAgICB2YXIgZnJhbWUgPSB0aGlzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHZlcnRpY2VzID0gZnJhbWUudjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHRyaW0gPSB0aGlzLmdldFRyaW1WYWx1ZXModHJpbSwgZnJhbWUpO1xyXG4gICAgICAgIGlmICh0cmltLnN0YXJ0ID09PSAwICYmIHRyaW0uZW5kID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDE7IGogPCB2ZXJ0aWNlcy5sZW5ndGg7IGorKykge1xyXG5cclxuICAgICAgICB2YXIgbmV4dFZlcnRleCA9IHZlcnRpY2VzW2pdLFxyXG4gICAgICAgICAgICBsYXN0VmVydGV4ID0gdmVydGljZXNbaiAtIDFdO1xyXG5cclxuICAgICAgICBpZiAodHJpbSkge1xyXG4gICAgICAgICAgICB2YXIgdHY7XHJcblxyXG4gICAgICAgICAgICBpZiAoaiA9PT0gMSAmJiB0cmltLnN0YXJ0SW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSAmJiBqID09PSB0cmltLmVuZEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uc3RhcnRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIHRyaW0uc3RhcnQsIDEsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCAwLCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA+IHRyaW0uc3RhcnRJbmRleCArIDEgJiYgaiA8IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChqID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRyaW0gJiYgdGhpcy5jbG9zZWQpIHtcclxuICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCB2ZXJ0aWNlc1swXVsyXSwgdmVydGljZXNbMF1bM10sIHZlcnRpY2VzWzBdWzRdLCB2ZXJ0aWNlc1swXVs1XSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmZyYW1lc1swXTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFRyaW1WYWx1ZXMgPSBmdW5jdGlvbiAodHJpbSwgZnJhbWUpIHtcclxuICAgIHZhciBpO1xyXG5cclxuICAgIHZhciBhY3R1YWxUcmltID0ge1xyXG4gICAgICAgIHN0YXJ0SW5kZXg6IDAsXHJcbiAgICAgICAgZW5kSW5kZXggIDogMCxcclxuICAgICAgICBzdGFydCAgICAgOiAwLFxyXG4gICAgICAgIGVuZCAgICAgICA6IDBcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDApIHtcclxuICAgICAgICBpZiAodHJpbS5lbmQgPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFjdHVhbFRyaW07XHJcbiAgICAgICAgfSBlbHNlIGlmICh0cmltLmVuZCA9PT0gMSkge1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZEluZGV4ID0gZnJhbWUubGVuLmxlbmd0aDtcclxuICAgICAgICAgICAgcmV0dXJuIGFjdHVhbFRyaW07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciB0b3RhbExlbiA9IHRoaXMuc3VtQXJyYXkoZnJhbWUubGVuKSxcclxuICAgICAgICB0cmltQXRMZW47XHJcblxyXG4gICAgdHJpbUF0TGVuID0gdG90YWxMZW4gKiB0cmltLnN0YXJ0O1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBmcmFtZS5sZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAodHJpbUF0TGVuID4gMCAmJiB0cmltQXRMZW4gPCBmcmFtZS5sZW5baV0pIHtcclxuICAgICAgICAgICAgYWN0dWFsVHJpbS5zdGFydEluZGV4ID0gaTtcclxuICAgICAgICAgICAgYWN0dWFsVHJpbS5zdGFydCA9IHRyaW1BdExlbiAvIGZyYW1lLmxlbltpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdHJpbUF0TGVuIC09IGZyYW1lLmxlbltpXTtcclxuICAgIH1cclxuXHJcbiAgICB0cmltQXRMZW4gPSB0b3RhbExlbiAqIHRyaW0uZW5kO1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBmcmFtZS5sZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAodHJpbUF0TGVuID4gMCAmJiB0cmltQXRMZW4gPCBmcmFtZS5sZW5baV0pIHtcclxuICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kID0gdHJpbUF0TGVuIC8gZnJhbWUubGVuW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmltQXRMZW4gLT0gZnJhbWUubGVuW2ldO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUudHJpbSA9IGZ1bmN0aW9uIChsYXN0VmVydGV4LCBuZXh0VmVydGV4LCBmcm9tLCB0bywgbGVuKSB7XHJcblxyXG4gICAgaWYgKGZyb20gPT09IDAgJiYgdG8gPT09IDEpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGFydDogbGFzdFZlcnRleCxcclxuICAgICAgICAgICAgZW5kICA6IG5leHRWZXJ0ZXhcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmlzU3RyYWlnaHQobGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XSkpIHtcclxuICAgICAgICBzdGFydFZlcnRleCA9IFtcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMF0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzJdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbM10sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzVdLCBuZXh0VmVydGV4WzVdLCBmcm9tKVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGVuZFZlcnRleCA9IFtcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMF0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMV0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbM10sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNF0sIHRvKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIHRvKVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmJlemllciA9IG5ldyBCZXppZXIoW2xhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0sIGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV1dKTtcclxuICAgICAgICB0aGlzLmJlemllci5nZXRMZW5ndGgobGVuKTtcclxuICAgICAgICBmcm9tID0gdGhpcy5iZXppZXIubWFwKGZyb20pO1xyXG4gICAgICAgIHRvID0gdGhpcy5iZXppZXIubWFwKHRvKTtcclxuXHJcbiAgICAgICAgdmFyIGUxLCBmMSwgZzEsIGgxLCBqMSwgazEsXHJcbiAgICAgICAgICAgIGUyLCBmMiwgZzIsIGgyLCBqMiwgazIsXHJcbiAgICAgICAgICAgIHN0YXJ0VmVydGV4LFxyXG4gICAgICAgICAgICBlbmRWZXJ0ZXg7XHJcblxyXG4gICAgICAgIGUxID0gW3RoaXMubGVycChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzBdLCBmcm9tKSwgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIGxhc3RWZXJ0ZXhbMV0sIGZyb20pXTtcclxuICAgICAgICBmMSA9IFt0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFsyXSwgZnJvbSksIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzNdLCBmcm9tKV07XHJcbiAgICAgICAgZzEgPSBbdGhpcy5sZXJwKG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbNF0sIGZyb20pLCB0aGlzLmxlcnAobmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs1XSwgZnJvbSldO1xyXG4gICAgICAgIGgxID0gW3RoaXMubGVycChlMVswXSwgZjFbMF0sIGZyb20pLCB0aGlzLmxlcnAoZTFbMV0sIGYxWzFdLCBmcm9tKV07XHJcbiAgICAgICAgajEgPSBbdGhpcy5sZXJwKGYxWzBdLCBnMVswXSwgZnJvbSksIHRoaXMubGVycChmMVsxXSwgZzFbMV0sIGZyb20pXTtcclxuICAgICAgICBrMSA9IFt0aGlzLmxlcnAoaDFbMF0sIGoxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGgxWzFdLCBqMVsxXSwgZnJvbSldO1xyXG5cclxuICAgICAgICBzdGFydFZlcnRleCA9IFtqMVswXSwgajFbMV0sIGgxWzBdLCBoMVsxXSwgazFbMF0sIGsxWzFdXTtcclxuICAgICAgICBlbmRWZXJ0ZXggPSBbbmV4dFZlcnRleFswXSwgbmV4dFZlcnRleFsxXSwgZzFbMF0sIGcxWzFdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdXTtcclxuXHJcbiAgICAgICAgZTIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzRdLCBzdGFydFZlcnRleFswXSwgdG8pLCB0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNV0sIHN0YXJ0VmVydGV4WzFdLCB0byldO1xyXG4gICAgICAgIGYyID0gW3RoaXMubGVycChzdGFydFZlcnRleFswXSwgZW5kVmVydGV4WzJdLCB0byksIHRoaXMubGVycChzdGFydFZlcnRleFsxXSwgZW5kVmVydGV4WzNdLCB0byldO1xyXG4gICAgICAgIGcyID0gW3RoaXMubGVycChlbmRWZXJ0ZXhbMl0sIGVuZFZlcnRleFs0XSwgdG8pLCB0aGlzLmxlcnAoZW5kVmVydGV4WzNdLCBlbmRWZXJ0ZXhbNV0sIHRvKV07XHJcbiAgICAgICAgaDIgPSBbdGhpcy5sZXJwKGUyWzBdLCBmMlswXSwgdG8pLCB0aGlzLmxlcnAoZTJbMV0sIGYyWzFdLCB0byldO1xyXG4gICAgICAgIGoyID0gW3RoaXMubGVycChmMlswXSwgZzJbMF0sIHRvKSwgdGhpcy5sZXJwKGYyWzFdLCBnMlsxXSwgdG8pXTtcclxuICAgICAgICBrMiA9IFt0aGlzLmxlcnAoaDJbMF0sIGoyWzBdLCB0byksIHRoaXMubGVycChoMlsxXSwgajJbMV0sIHRvKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2UyWzBdLCBlMlsxXSwgc3RhcnRWZXJ0ZXhbMl0sIHN0YXJ0VmVydGV4WzNdLCBzdGFydFZlcnRleFs0XSwgc3RhcnRWZXJ0ZXhbNV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtqMlswXSwgajJbMV0sIGgyWzBdLCBoMlsxXSwgazJbMF0sIGsyWzFdXTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydDogc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgZW5kICA6IGVuZFZlcnRleFxyXG4gICAgfTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xyXG4gICAgdmFyIHMgPSAxIC0gdDtcclxuICAgIHJldHVybiBhICogcyArIGIgKiB0O1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuc3VtQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XHJcbiAgICBmdW5jdGlvbiBhZGQoYSwgYikge1xyXG4gICAgICAgIHJldHVybiBhICsgYjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXJyLnJlZHVjZShhZGQpO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuaXNTdHJhaWdodCA9IGZ1bmN0aW9uIChzdGFydFgsIHN0YXJ0WSwgY3RybDFYLCBjdHJsMVksIGN0cmwyWCwgY3RybDJZLCBlbmRYLCBlbmRZKSB7XHJcbiAgICByZXR1cm4gc3RhcnRYID09PSBjdHJsMVggJiYgc3RhcnRZID09PSBjdHJsMVkgJiYgZW5kWCA9PT0gY3RybDJYICYmIGVuZFkgPT09IGN0cmwyWTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQYXRoO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBQb2x5c3RhcihkYXRhKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7IC8vIFRPRE8gPz9cclxuXHJcbiAgICB0aGlzLnN0YXJUeXBlID0gZGF0YS5zdGFyVHlwZTtcclxuICAgIHRoaXMucG9pbnRzID0gZGF0YS5wb2ludHMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9pbnRzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvaW50cyk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzID0gZGF0YS5pbm5lclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJhZGl1cyk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gZGF0YS5vdXRlclJhZGl1cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJhZGl1cyk7XHJcblxyXG4gICAgLy9vcHRpbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcyA9IGRhdGEuaW5uZXJSb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSb3VuZG5lc3MpO1xyXG4gICAgaWYgKGRhdGEub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MgPSBkYXRhLm91dGVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUm91bmRuZXNzKTtcclxufVxyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IHRoaXMucG9pbnRzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIGlubmVyUmFkaXVzID0gdGhpcy5pbm5lclJhZGl1cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBvdXRlclJhZGl1cyA9IHRoaXMub3V0ZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcclxuICAgICAgICByb3RhdGlvbiA9IHRoaXMucm90YXRpb24gPyB0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBpbm5lclJvdW5kbmVzcyA9IHRoaXMuaW5uZXJSb3VuZG5lc3MgPyB0aGlzLmlubmVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBvdXRlclJvdW5kbmVzcyA9IHRoaXMub3V0ZXJSb3VuZG5lc3MgPyB0aGlzLm91dGVyUm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMDtcclxuXHJcbiAgICByb3RhdGlvbiA9IHRoaXMuZGVnMnJhZChyb3RhdGlvbik7XHJcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBvdXRlclJhZGl1cywgcm90YXRpb24pO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSk7XHJcbiAgICBjdHgubW92ZVRvKHN0YXJ0WzBdLCBzdGFydFsxXSk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHM7IGkrKykge1xyXG5cclxuICAgICAgICB2YXIgcElubmVyLFxyXG4gICAgICAgICAgICBwT3V0ZXIsXHJcbiAgICAgICAgICAgIHBPdXRlcjFUYW5nZW50LFxyXG4gICAgICAgICAgICBwT3V0ZXIyVGFuZ2VudCxcclxuICAgICAgICAgICAgcElubmVyMVRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBJbm5lcjJUYW5nZW50LFxyXG4gICAgICAgICAgICBvdXRlck9mZnNldCxcclxuICAgICAgICAgICAgaW5uZXJPZmZzZXQsXHJcbiAgICAgICAgICAgIHJvdDtcclxuXHJcbiAgICAgICAgcm90ID0gTWF0aC5QSSAvIHBvaW50cyAqIDI7XHJcblxyXG4gICAgICAgIHBJbm5lciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBPdXRlciA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIC8vRkl4TUVcclxuICAgICAgICBpZiAoIW91dGVyT2Zmc2V0KSBvdXRlck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBvdXRlclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xyXG4gICAgICAgIGlmICghaW5uZXJPZmZzZXQpIGlubmVyT2Zmc2V0ID0gKHN0YXJ0WzBdICsgcElubmVyWzBdKSAqIGlubmVyUm91bmRuZXNzIC8gMTAwICogLjU1MjI4NDg7XHJcblxyXG4gICAgICAgIHBPdXRlcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBvdXRlck9mZnNldCwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogaSkgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcElubmVyMVRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIGlubmVyT2Zmc2V0ICogLTEsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwSW5uZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgaW5uZXJPZmZzZXQsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwT3V0ZXIyVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQgKiAtMSwgMCAtIG91dGVyUmFkaXVzLCAocm90ICogKGkgKyAxKSkgKyByb3RhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgIC8vc3RhclxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBJbm5lcjFUYW5nZW50WzBdLCBwSW5uZXIxVGFuZ2VudFsxXSwgcElubmVyWzBdLCBwSW5uZXJbMV0pO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vcG9seWdvblxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgcE91dGVyWzBdLCBwT3V0ZXJbMV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9kZWJ1Z1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXJbMF0sIHBJbm5lclsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyWzBdLCBwT3V0ZXJbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJyZWRcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiZ3JlZW5cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwSW5uZXIyVGFuZ2VudFswXSwgcElubmVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiYnJvd25cIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIDUsIDUpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnJvdGF0ZVBvaW50ID0gZnVuY3Rpb24gKGN4LCBjeSwgeCwgeSwgcmFkaWFucykge1xyXG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxyXG4gICAgICAgIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpLFxyXG4gICAgICAgIG54ID0gKGNvcyAqICh4IC0gY3gpKSAtIChzaW4gKiAoeSAtIGN5KSkgKyBjeCxcclxuICAgICAgICBueSA9IChzaW4gKiAoeCAtIGN4KSkgKyAoY29zICogKHkgLSBjeSkpICsgY3k7XHJcbiAgICByZXR1cm4gW254LCBueV07XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMucG9pbnRzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMucG9pbnRzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5pbm5lclJvdW5kbmVzcykgdGhpcy5pbm5lclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlzdGFyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9zaXRpb24oZGF0YSkge1xyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eS5jYWxsKHRoaXMsIGRhdGEpO1xyXG59XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlKTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxuICAgIHRoaXMuc2V0TW90aW9uUGF0aCgpO1xyXG59O1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLm1vdGlvbnBhdGgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb3Rpb25wYXRoLmdldFZhbHVlcyh0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUuc2V0TW90aW9uUGF0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKSB7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoID0gbmV3IEJlemllcih0aGlzLmxhc3RGcmFtZS5tb3Rpb25wYXRoKTtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGguZ2V0TGVuZ3RoKHRoaXMubGFzdEZyYW1lLmxlbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gUHJvcGVydHkoZGF0YSkge1xyXG4gICAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIG51bGw7XHJcbiAgICB0aGlzLmZyYW1lcyA9IGRhdGE7XHJcbn1cclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmZyYW1lc1swXS52O1xyXG59O1xyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbn07XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUmVjdChkYXRhKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5zaXplID0gZGF0YS5zaXplLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNpemUpIDogbmV3IFByb3BlcnR5KGRhdGEuc2l6ZSk7XHJcblxyXG4gICAgLy9vcHRpb25hbHNcclxuICAgIGlmIChkYXRhLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uID0gZGF0YS5wb3NpdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICBpZiAoZGF0YS5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzID0gZGF0YS5yb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnJvdW5kbmVzcyk7XHJcbn1cclxuXHJcblJlY3QucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcblxyXG4gICAgdmFyIHNpemUgPSB0aGlzLnNpemUuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXSxcclxuICAgICAgICByb3VuZG5lc3MgPSB0aGlzLnJvdW5kbmVzcyA/IHRoaXMucm91bmRuZXNzLmdldFZhbHVlKHRpbWUpIDogMDtcclxuXHJcbiAgICBpZiAoc2l6ZVswXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMF0gLyAyO1xyXG4gICAgaWYgKHNpemVbMV0gPCAyICogcm91bmRuZXNzKSByb3VuZG5lc3MgPSBzaXplWzFdIC8gMjtcclxuXHJcbiAgICB2YXIgeCA9IHBvc2l0aW9uWzBdIC0gc2l6ZVswXSAvIDIsXHJcbiAgICAgICAgeSA9IHBvc2l0aW9uWzFdIC0gc2l6ZVsxXSAvIDI7XHJcblxyXG4gICAgaWYgKHRyaW0pIHtcclxuICAgICAgICB2YXIgdHY7XHJcbiAgICAgICAgdHJpbSA9IHRoaXMuZ2V0VHJpbVZhbHVlcyh0cmltKTtcclxuICAgICAgICAvL1RPRE8gYWRkIHRyaW1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyh4ICsgcm91bmRuZXNzLCB5KTtcclxuICAgICAgICBjdHguYXJjVG8oeCArIHNpemVbMF0sIHksIHggKyBzaXplWzBdLCB5ICsgc2l6ZVsxXSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCArIHNpemVbMF0sIHkgKyBzaXplWzFdLCB4LCB5ICsgc2l6ZVsxXSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCwgeSArIHNpemVbMV0sIHgsIHksIHJvdW5kbmVzcyk7XHJcbiAgICAgICAgY3R4LmFyY1RvKHgsIHksIHggKyBzaXplWzBdLCB5LCByb3VuZG5lc3MpO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnNpemUuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5SZWN0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5zaXplLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3MucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWN0OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFN0cm9rZShkYXRhKSB7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIHRoaXMuam9pbiA9IGRhdGEuam9pbjtcclxuICAgICAgICB0aGlzLmNhcCA9IGRhdGEuY2FwO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5taXRlckxpbWl0KSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQubGVuZ3RoID4gMSkgdGhpcy5taXRlckxpbWl0ID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5taXRlckxpbWl0KTtcclxuICAgICAgICAgICAgZWxzZSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgUHJvcGVydHkoZGF0YS5taXRlckxpbWl0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkYXRhLmNvbG9yLmxlbmd0aCA+IDEpIHRoaXMuY29sb3IgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuICAgICAgICBlbHNlIHRoaXMuY29sb3IgPSBuZXcgUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSkgdGhpcy5vcGFjaXR5ID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxuICAgICAgICBlbHNlIHRoaXMub3BhY2l0eSA9IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS53aWR0aC5sZW5ndGggPiAxKSB0aGlzLndpZHRoID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcbiAgICAgICAgZWxzZSB0aGlzLndpZHRoID0gbmV3IFByb3BlcnR5KGRhdGEud2lkdGgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5TdHJva2UucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuY29sb3IuZ2V0VmFsdWUodGltZSk7XHJcbi8vICAgIGNvbnNvbGUubG9nKGNvbG9yKTtcclxuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5vcGFjaXR5LmdldFZhbHVlKHRpbWUpO1xyXG4gICAgcmV0dXJuICdyZ2JhKCcgKyBNYXRoLnJvdW5kKGNvbG9yWzBdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzFdKSArICcsICcgKyBNYXRoLnJvdW5kKGNvbG9yWzJdKSArICcsICcgKyBvcGFjaXR5ICsgJyknO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5zZXRTdHJva2UgPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcbiAgICB2YXIgc3Ryb2tlQ29sb3IgPSB0aGlzLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHN0cm9rZVdpZHRoID0gdGhpcy53aWR0aC5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBzdHJva2VKb2luID0gdGhpcy5qb2luO1xyXG4gICAgaWYgKHN0cm9rZUpvaW4gPT09ICdtaXRlcicpIHZhciBtaXRlckxpbWl0ID0gdGhpcy5taXRlckxpbWl0LmdldFZhbHVlKHRpbWUpO1xyXG5cclxuICAgIGN0eC5saW5lV2lkdGggPSBzdHJva2VXaWR0aDtcclxuICAgIGN0eC5saW5lSm9pbiA9IHN0cm9rZUpvaW47XHJcbiAgICBpZiAobWl0ZXJMaW1pdCkgY3R4Lm1pdGVyTGltaXQgPSBtaXRlckxpbWl0O1xyXG4gICAgY3R4LmxpbmVDYXAgPSB0aGlzLmNhcDtcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZUNvbG9yO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5jb2xvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy53aWR0aC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5taXRlckxpbWl0KSB0aGlzLm1pdGVyTGltaXQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5jb2xvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy53aWR0aC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5taXRlckxpbWl0KSB0aGlzLm1pdGVyTGltaXQucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdHJva2U7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpLFxyXG4gICAgUG9zaXRpb24gPSByZXF1aXJlKCcuL1Bvc2l0aW9uJyk7XHJcblxyXG5mdW5jdGlvbiBUcmFuc2Zvcm0oZGF0YSkge1xyXG4gICAgaWYgKCFkYXRhKSByZXR1cm47XHJcblxyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG5cclxuICAgIGlmIChkYXRhLnBvc2l0aW9uWCAmJiBkYXRhLnBvc2l0aW9uWSkge1xyXG4gICAgICAgIGlmIChkYXRhLnBvc2l0aW9uWC5sZW5ndGggPiAxICYmIGRhdGEucG9zaXRpb25ZLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25ZID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvblkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25YID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb25YKTtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvblkpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoZGF0YS5wb3NpdGlvbikge1xyXG4gICAgICAgIGlmIChkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb3NpdGlvbihkYXRhLnBvc2l0aW9uKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5hbmNob3IpIHRoaXMuYW5jaG9yID0gZGF0YS5hbmNob3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuYW5jaG9yKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmFuY2hvcik7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVgpIHRoaXMuc2NhbGVYID0gZGF0YS5zY2FsZVgubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVYKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWCk7XHJcbiAgICBpZiAoZGF0YS5zY2FsZVkpIHRoaXMuc2NhbGVZID0gZGF0YS5zY2FsZVkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVZKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWSk7XHJcbiAgICBpZiAoZGF0YS5za2V3KSB0aGlzLnNrZXcgPSBkYXRhLnNrZXcubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2tldykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3KTtcclxuICAgIGlmIChkYXRhLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzID0gZGF0YS5za2V3QXhpcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3QXhpcykgOiBuZXcgUHJvcGVydHkoZGF0YS5za2V3QXhpcyk7XHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm90YXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucm90YXRpb24pO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIHZhciBwb3NpdGlvblgsIHBvc2l0aW9uWSxcclxuICAgICAgICBhbmNob3IgPSB0aGlzLmFuY2hvciA/IHRoaXMuYW5jaG9yLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbiA/IHRoaXMuZGVnMnJhZCh0aGlzLnJvdGF0aW9uLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2tldyA9IHRoaXMuc2tldyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXcuZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3QXhpcyA9IHRoaXMuc2tld0F4aXMgPyB0aGlzLmRlZzJyYWQodGhpcy5za2V3QXhpcy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNjYWxlWCA9IHRoaXMuc2NhbGVYID8gdGhpcy5zY2FsZVguZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIHNjYWxlWSA9IHRoaXMuc2NhbGVZID8gdGhpcy5zY2FsZVkuZ2V0VmFsdWUodGltZSkgOiAxLFxyXG4gICAgICAgIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkgPyB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSkgKiBjdHguZ2xvYmFsQWxwaGEgOiBjdHguZ2xvYmFsQWxwaGE7IC8vIEZJWE1FIHdyb25nIHRyYW5zcGFyZW5jeSBpZiBuZXN0ZWRcclxuXHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblggJiYgdGhpcy5wb3NpdGlvblkpIHtcclxuICAgICAgICBwb3NpdGlvblggPSB0aGlzLnBvc2l0aW9uWC5nZXRWYWx1ZSh0aW1lKTtcclxuICAgICAgICBwb3NpdGlvblkgPSB0aGlzLnBvc2l0aW9uWS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5wb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSwgY3R4KTtcclxuICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblswXTtcclxuICAgICAgICBwb3NpdGlvblkgPSBwb3NpdGlvblsxXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcG9zaXRpb25YID0gMDtcclxuICAgICAgICBwb3NpdGlvblkgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vb3JkZXIgdmVyeSB2ZXJ5IGltcG9ydGFudCA6KVxyXG4gICAgY3R4LnRyYW5zZm9ybSgxLCAwLCAwLCAxLCBwb3NpdGlvblggLSBhbmNob3JbMF0sIHBvc2l0aW9uWSAtIGFuY2hvclsxXSk7XHJcbiAgICB0aGlzLnNldFJvdGF0aW9uKGN0eCwgcm90YXRpb24sIGFuY2hvclswXSwgYW5jaG9yWzFdKTtcclxuICAgIHRoaXMuc2V0U2tldyhjdHgsIHNrZXcsIHNrZXdBeGlzLCBhbmNob3JbMF0sIGFuY2hvclsxXSk7XHJcbiAgICB0aGlzLnNldFNjYWxlKGN0eCwgc2NhbGVYLCBzY2FsZVksIGFuY2hvclswXSwgYW5jaG9yWzFdKTtcclxuICAgIGN0eC5nbG9iYWxBbHBoYSA9IG9wYWNpdHk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24gKGN0eCwgcmFkLCB4LCB5KSB7XHJcbiAgICB2YXIgYyA9IE1hdGguY29zKHJhZCk7XHJcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCk7XHJcbiAgICB2YXIgZHggPSB4IC0gYyAqIHggKyBzICogeTtcclxuICAgIHZhciBkeSA9IHkgLSBzICogeCAtIGMgKiB5O1xyXG4gICAgY3R4LnRyYW5zZm9ybShjLCBzLCAtcywgYywgZHgsIGR5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0U2NhbGUgPSBmdW5jdGlvbiAoY3R4LCBzeCwgc3ksIHgsIHkpIHtcclxuICAgIGN0eC50cmFuc2Zvcm0oc3gsIDAsIDAsIHN5LCAteCAqIHN4ICsgeCwgLXkgKiBzeSArIHkpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTa2V3ID0gZnVuY3Rpb24gKGN0eCwgc2tldywgYXhpcywgeCwgeSkge1xyXG4gICAgdmFyIHQgPSBNYXRoLnRhbigtc2tldyk7XHJcbiAgICB0aGlzLnNldFJvdGF0aW9uKGN0eCwgLWF4aXMsIHgsIHkpO1xyXG4gICAgY3R4LnRyYW5zZm9ybSgxLCAwLCB0LCAxLCAteSAqIHQsIDApO1xyXG4gICAgdGhpcy5zZXRSb3RhdGlvbihjdHgsIGF4aXMsIHgsIHkpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5kZWcycmFkID0gZnVuY3Rpb24gKGRlZykge1xyXG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLmFuY2hvcikgdGhpcy5hbmNob3Iuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucm90YXRpb24pIHRoaXMucm90YXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2tldykgdGhpcy5za2V3LnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWCkgdGhpcy5wb3NpdGlvblguc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25ZKSB0aGlzLnBvc2l0aW9uWS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVgpIHRoaXMuc2NhbGVYLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWSkgdGhpcy5zY2FsZVkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIGlmICh0aGlzLmFuY2hvcikgdGhpcy5hbmNob3IucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm90YXRpb24pIHRoaXMucm90YXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2tldykgdGhpcy5za2V3LnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNrZXdBeGlzKSB0aGlzLnNrZXdBeGlzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWCkgdGhpcy5wb3NpdGlvblgucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25ZKSB0aGlzLnBvc2l0aW9uWS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5zY2FsZVgpIHRoaXMuc2NhbGVYLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWSkgdGhpcy5zY2FsZVkucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFRyaW0oZGF0YSkge1xyXG5cclxuICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZTtcclxuXHJcbiAgICBpZiAoZGF0YS5zdGFydCkgdGhpcy5zdGFydCA9IGRhdGEuc3RhcnQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc3RhcnQpIDogbmV3IFByb3BlcnR5KGRhdGEuc3RhcnQpO1xyXG4gICAgaWYgKGRhdGEuZW5kKSB0aGlzLmVuZCA9IGRhdGEuZW5kLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmVuZCkgOiBuZXcgUHJvcGVydHkoZGF0YS5lbmQpO1xyXG4gICAgLy9pZiAoZGF0YS5vZmZzZXQpIHRoaXMub2Zmc2V0ID0gZGF0YS5vZmZzZXQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub2Zmc2V0KSA6IG5ldyBQcm9wZXJ0eShkYXRhLm9mZnNldCk7XHJcblxyXG59XHJcblxyXG5UcmltLnByb3RvdHlwZS5nZXRUcmltID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBzdGFydCA9IHRoaXMuc3RhcnQgPyB0aGlzLnN0YXJ0LmdldFZhbHVlKHRpbWUpIDogMCxcclxuICAgICAgICBlbmQgPSB0aGlzLmVuZCA/IHRoaXMuZW5kLmdldFZhbHVlKHRpbWUpIDogMTtcclxuXHJcbiAgICB2YXIgdHJpbSA9IHtcclxuICAgICAgICBzdGFydDogTWF0aC5taW4oc3RhcnQsIGVuZCksXHJcbiAgICAgICAgZW5kICA6IE1hdGgubWF4KHN0YXJ0LCBlbmQpXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0cmltLnN0YXJ0ID09PSAwICYmIHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0cmltO1xyXG4gICAgfVxyXG59O1xyXG5cclxuVHJpbS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLnN0YXJ0KSB0aGlzLnN0YXJ0LnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLmVuZCkgdGhpcy5lbmQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgLy9pZiAodGhpcy5vZmZzZXQpIHRoaXMub2Zmc2V0LnJlc2V0KCk7XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJpbTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iXX0=
