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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL01lcmdlLmpzIiwic3JjL3J1bnRpbWUvUGF0aC5qcyIsInNyYy9ydW50aW1lL1BvbHlzdGFyLmpzIiwic3JjL3J1bnRpbWUvUG9zaXRpb24uanMiLCJzcmMvcnVudGltZS9Qcm9wZXJ0eS5qcyIsInNyYy9ydW50aW1lL1JlY3QuanMiLCJzcmMvcnVudGltZS9TdHJva2UuanMiLCJzcmMvcnVudGltZS9UcmFuc2Zvcm0uanMiLCJzcmMvcnVudGltZS9UcmltLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEdyb3VwID0gcmVxdWlyZSgnLi9Hcm91cCcpO1xyXG5cclxudmFyIF9hbmltYXRpb25zID0gW10sXHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IDA7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRpb24ob3B0aW9ucykge1xyXG4gICAgdGhpcy5kYXRhID0gb3B0aW9ucy5kYXRhIHx8IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aHJvdyAnbm8gZGF0YSc7XHJcbiAgICB9KCk7XHJcblxyXG4gICAgdGhpcy50aGVuID0gMDtcclxuICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICB0aGlzLmR1cmF0aW9uID0gdGhpcy5kYXRhLmR1cmF0aW9uO1xyXG4gICAgdGhpcy50aW1lUmF0aW8gPSB0aGlzLmR1cmF0aW9uIC8gMTAwO1xyXG4gICAgdGhpcy5iYXNlV2lkdGggPSB0aGlzLmRhdGEud2lkdGg7XHJcbiAgICB0aGlzLmJhc2VIZWlnaHQgPSB0aGlzLmRhdGEuaGVpZ2h0O1xyXG4gICAgdGhpcy5yYXRpbyA9IHRoaXMuZGF0YS53aWR0aCAvIHRoaXMuZGF0YS5oZWlnaHQ7XHJcblxyXG4gICAgdGhpcy5tYXJrZXJzID0gdGhpcy5kYXRhLm1hcmtlcnM7XHJcblxyXG4gICAgdGhpcy5jYW52YXMgPSBvcHRpb25zLmNhbnZhcyB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMubG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZTtcclxuICAgIHRoaXMuaGQgPSBvcHRpb25zLmhkIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5mbHVpZCA9IG9wdGlvbnMuZmx1aWQgfHwgdHJ1ZTtcclxuICAgIHRoaXMucmV2ZXJzZWQgPSBvcHRpb25zLnJldmVyc2VkIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5vbkNvbXBsZXRlID0gb3B0aW9ucy5vbkNvbXBsZXRlIHx8IGZ1bmN0aW9uICgpIHtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5iYXNlV2lkdGg7XHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmJhc2VIZWlnaHQ7XHJcblxyXG4gICAgdGhpcy5idWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMuYnVmZmVyLndpZHRoID0gdGhpcy5iYXNlV2lkdGg7XHJcbiAgICB0aGlzLmJ1ZmZlci5oZWlnaHQgPSB0aGlzLmJhc2VIZWlnaHQ7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IHRoaXMuYnVmZmVyLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgdGhpcy5ncm91cHMgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzLnB1c2gobmV3IEdyb3VwKHRoaXMuZGF0YS5ncm91cHNbaV0sIHRoaXMuYnVmZmVyQ3R4LCAwLCB0aGlzLmR1cmF0aW9uKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmdyb3Vwc0xlbmd0aCA9IHRoaXMuZ3JvdXBzLmxlbmd0aDtcclxuXHJcbiAgICB0aGlzLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5yZXNpemUoKTtcclxuXHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuXHJcbiAgICBfYW5pbWF0aW9ucy5wdXNoKHRoaXMpO1xyXG4gICAgX2FuaW1hdGlvbnNMZW5ndGggPSBfYW5pbWF0aW9ucy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGlvbi5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgcGxheTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSB0aGlzLmNvbXBUaW1lO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdvdG9BbmRQbGF5OiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xyXG4gICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IG1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdvdG9BbmRTdG9wOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xyXG4gICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcclxuICAgICAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE1hcmtlcjogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpZF07XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXJrZXJzW2ldLmNvbW1lbnQgPT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oJ01hcmtlciBub3QgZm91bmQnKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0U3RlcDogZnVuY3Rpb24gKHN0ZXApIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gc3RlcCAqIHRoaXMudGltZVJhdGlvO1xyXG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRTdGVwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy5jb21wVGltZSAvIHRoaXMudGltZVJhdGlvKTtcclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHZhciBkZWx0YSA9IHRpbWUgLSB0aGlzLnRoZW47XHJcbiAgICAgICAgdGhpcy50aGVuID0gdGltZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuY29tcFRpbWUgLT0gZGVsdGEgOiB0aGlzLmNvbXBUaW1lICs9IGRlbHRhO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcFRpbWUgPiB0aGlzLmR1cmF0aW9uIHx8IHRoaXMucmV2ZXJzZWQgJiYgdGhpcy5jb21wVGltZSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZHJhd0ZyYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhdyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRyYXc6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuYmFzZVdpZHRoLCB0aGlzLmJhc2VIZWlnaHQpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncm91cHNMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KHRoaXMuY3R4LCB0aW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMudGhlbiA9IDA7XHJcbiAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2V0S2V5ZnJhbWVzOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncm91cHNMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbnVsbDtcclxuICAgICAgICB2YXIgaSA9IF9hbmltYXRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgaWYgKGkgPiAtMSkge1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9ucy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zTGVuZ3RoID0gX2FuaW1hdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jYW52YXMucGFyZW50Tm9kZSkgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2l6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmZsdWlkKSB7XHJcbiAgICAgICAgICAgIHZhciBmYWN0b3IgPSB0aGlzLmhkID8gMiA6IDE7XHJcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IHRoaXMuY2FudmFzLmNsaWVudFdpZHRoIHx8IHRoaXMuYmFzZVdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICogZmFjdG9yO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aWR0aCAvIHRoaXMucmF0aW8gKiBmYWN0b3I7XHJcbiAgICAgICAgICAgIHRoaXMuc2NhbGUgPSB3aWR0aCAvIHRoaXMuYmFzZVdpZHRoICogZmFjdG9yO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC50cmFuc2Zvcm0odGhpcy5zY2FsZSwgMCwgMCwgdGhpcy5zY2FsZSwgMCwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldCByZXZlcnNlZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcmV2ZXJzZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldCByZXZlcnNlZChib29sKSB7XHJcbiAgICAgICAgdGhpcy5fcmV2ZXJzZWQgPSBib29sO1xyXG4gICAgICAgIGlmICh0aGlzLnBhdXNlZFRpbWUpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucGF1c2VkVGltZTtcclxuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IHRoaXMucmV2ZXJzZWQgPyB0aGlzLmR1cmF0aW9uIDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICBBbmltYXRpb246IEFuaW1hdGlvbixcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgLy9odHRwczovL2dpdGh1Yi5jb20vc29sZS90d2Vlbi5qc1xyXG4gICAgICAgIHRpbWUgPSB0aW1lICE9PSB1bmRlZmluZWQgPyB0aW1lIDogKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGVyZm9ybWFuY2UgIT09IHVuZGVmaW5lZCAmJiB3aW5kb3cucGVyZm9ybWFuY2Uubm93ICE9PSB1bmRlZmluZWQgPyB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgOiBEYXRlLm5vdygpICk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX2FuaW1hdGlvbnNMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBfYW5pbWF0aW9uc1tpXS51cGRhdGUodGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBCZXppZXJFYXNpbmcgPSByZXF1aXJlKCcuL0JlemllckVhc2luZycpO1xyXG5cclxuZnVuY3Rpb24gQW5pbWF0ZWRQYXRoKGRhdGEpIHtcclxuICAgIFBhdGguY2FsbCh0aGlzLCBkYXRhKTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCAmJiB0aW1lID49IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0RnJhbWU7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQgJiYgdGltZSA8PSB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEZyYW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGltZSA+IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciArIDEgPT09IHRoaXMuZnJhbWVDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXIrKztcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGltZSA8IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRlciA8IDIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyLS07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVBdFRpbWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGltZSA8IHRoaXMuZnJhbWVzWzBdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGltZSA+IHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXIgPSB0aGlzLmZyYW1lQ291bnQgLSAxO1xyXG4gICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuZnJhbWVDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5mcmFtZXNbaSAtIDFdLnQgJiYgdGltZSA8PSB0aGlzLmZyYW1lc1tpXSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXIgPSBpO1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW2kgLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLm9uS2V5ZnJhbWVDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNldEVhc2luZygpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHJldHVybiBhICsgdCAqIChiIC0gYSk7XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnNldEVhc2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0ICYmIHRoaXMubmV4dEZyYW1lLmVhc2VJbikge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbmV3IEJlemllckVhc2luZyh0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzBdLCB0aGlzLmxhc3RGcmFtZS5lYXNlT3V0WzFdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMF0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblsxXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZWFzaW5nID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5sYXN0RnJhbWUudCApO1xyXG4gICAgdmFyIGR1cmF0aW9uID0gdGhpcy5uZXh0RnJhbWUudCAtIHRoaXMubGFzdEZyYW1lLnQ7XHJcbiAgICB2YXIgZWxhcHNlZCA9IGRlbHRhIC8gZHVyYXRpb247XHJcbiAgICBpZiAoZWxhcHNlZCA+IDEpIGVsYXBzZWQgPSAxO1xyXG4gICAgZWxzZSBpZiAoZWxhcHNlZCA8IDApIGVsYXBzZWQgPSAwO1xyXG4gICAgZWxzZSBpZiAodGhpcy5lYXNpbmcpIGVsYXBzZWQgPSB0aGlzLmVhc2luZyhlbGFwc2VkKTtcclxuICAgIHZhciBhY3R1YWxWZXJ0aWNlcyA9IFtdLFxyXG4gICAgICAgIGFjdHVhbExlbmd0aCA9IFtdO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlc0NvdW50OyBpKyspIHtcclxuICAgICAgICB2YXIgY3AxeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzBdLCB0aGlzLm5leHRGcmFtZS52W2ldWzBdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AxeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzFdLCB0aGlzLm5leHRGcmFtZS52W2ldWzFdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzJdLCB0aGlzLm5leHRGcmFtZS52W2ldWzJdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzNdLCB0aGlzLm5leHRGcmFtZS52W2ldWzNdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzRdLCB0aGlzLm5leHRGcmFtZS52W2ldWzRdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzVdLCB0aGlzLm5leHRGcmFtZS52W2ldWzVdLCBlbGFwc2VkKTtcclxuXHJcbiAgICAgICAgYWN0dWFsVmVydGljZXMucHVzaChbY3AxeCwgY3AxeSwgY3AyeCwgY3AyeSwgeCwgeV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy52ZXJ0aWNlc0NvdW50IC0gMTsgaisrKSB7XHJcbiAgICAgICAgYWN0dWFsTGVuZ3RoLnB1c2godGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLmxlbltqXSwgdGhpcy5uZXh0RnJhbWUubGVuW2pdLCBlbGFwc2VkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ICA6IGFjdHVhbFZlcnRpY2VzLFxyXG4gICAgICAgIGxlbjogYWN0dWFsTGVuZ3RoXHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMucG9pbnRlciA9IHJldmVyc2VkID8gdGhpcy5mcmFtZUNvdW50IC0gMSA6IDE7XHJcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGVkUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4vQmV6aWVyRWFzaW5nJyk7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRlZFByb3BlcnR5KGRhdGEpIHtcclxuICAgIFByb3BlcnR5LmNhbGwodGhpcywgZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lQ291bnQgPSB0aGlzLmZyYW1lcy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQcm9wZXJ0eS5wcm90b3R5cGUpO1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XHJcbiAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgdmFyIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBhcnJbaV0gPSBhW2ldICsgdCAqIChiW2ldIC0gYVtpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBhICsgdCAqIChiIC0gYSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5zZXRFYXNpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBuZXcgQmV6aWVyRWFzaW5nKHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMF0sIHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMV0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblswXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzFdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuZmluaXNoZWQgJiYgdGltZSA+PSB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEZyYW1lLnY7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQgJiYgdGltZSA8PSB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEZyYW1lLnY7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyICsgMSA9PT0gdGhpcy5mcmFtZUNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyIDwgMikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXItLTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZUF0VGltZSh0aW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKHRpbWUsIHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDJdLnQsIHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVDb3VudCAtIDFdLnQpO1xyXG5cclxuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aW1lID4gdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5mcmFtZUNvdW50OyBpKyspIHtcclxuICAgICAgICBpZiAodGltZSA+PSB0aGlzLmZyYW1lc1tpIC0gMV0udCAmJiB0aW1lIDw9IHRoaXMuZnJhbWVzW2ldLnQpIHtcclxuICAgICAgICAgICAgdGhpcy5wb2ludGVyID0gaTtcclxuICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1tpIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbaV07XHJcbiAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRFbGFwc2VkID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMubGFzdEZyYW1lLnQgKSxcclxuICAgICAgICBkdXJhdGlvbiA9IHRoaXMubmV4dEZyYW1lLnQgLSB0aGlzLmxhc3RGcmFtZS50LFxyXG4gICAgICAgIGVsYXBzZWQgPSBkZWx0YSAvIGR1cmF0aW9uO1xyXG5cclxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XHJcbiAgICBlbHNlIGlmIChlbGFwc2VkIDwgMCkgZWxhcHNlZCA9IDA7XHJcbiAgICBlbHNlIGlmICh0aGlzLmVhc2luZykgZWxhcHNlZCA9IHRoaXMuZWFzaW5nKGVsYXBzZWQpO1xyXG4gICAgcmV0dXJuIGVsYXBzZWQ7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnBvaW50ZXIgPSByZXZlcnNlZCA/IHRoaXMuZnJhbWVDb3VudCAtIDEgOiAxO1xyXG4gICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRlZFByb3BlcnR5OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIEJlemllcihwYXRoKSB7XHJcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xyXG59XHJcblxyXG5CZXppZXIucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uIChsZW4pIHtcclxuICAgIHRoaXMuc3RlcHMgPSBNYXRoLmZsb29yKGxlbiAvIDEwKTtcclxuICAgIHRoaXMuYXJjTGVuZ3RocyA9IG5ldyBBcnJheSh0aGlzLnN0ZXBzICsgMSk7XHJcbiAgICB0aGlzLmFyY0xlbmd0aHNbMF0gPSAwO1xyXG5cclxuICAgIHZhciBveCA9IHRoaXMuY3ViaWNOKDAsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgb3kgPSB0aGlzLmN1YmljTigwLCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pLFxyXG4gICAgICAgIGNsZW4gPSAwLFxyXG4gICAgICAgIGl0ZXJhdG9yID0gMSAvIHRoaXMuc3RlcHM7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gdGhpcy5zdGVwczsgaSArPSAxKSB7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLmN1YmljTihpICogaXRlcmF0b3IsIHRoaXMucGF0aFswXSwgdGhpcy5wYXRoWzJdLCB0aGlzLnBhdGhbNF0sIHRoaXMucGF0aFs2XSksXHJcbiAgICAgICAgICAgIHkgPSB0aGlzLmN1YmljTihpICogaXRlcmF0b3IsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSk7XHJcblxyXG4gICAgICAgIHZhciBkeCA9IG94IC0geCxcclxuICAgICAgICAgICAgZHkgPSBveSAtIHk7XHJcblxyXG4gICAgICAgIGNsZW4gKz0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcclxuICAgICAgICB0aGlzLmFyY0xlbmd0aHNbaV0gPSBjbGVuO1xyXG5cclxuICAgICAgICBveCA9IHg7XHJcbiAgICAgICAgb3kgPSB5O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubGVuZ3RoID0gY2xlbjtcclxufTtcclxuXHJcbkJlemllci5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKHUpIHtcclxuICAgIHZhciB0YXJnZXRMZW5ndGggPSB1ICogdGhpcy5hcmNMZW5ndGhzW3RoaXMuc3RlcHNdO1xyXG4gICAgdmFyIGxvdyA9IDAsXHJcbiAgICAgICAgaGlnaCA9IHRoaXMuc3RlcHMsXHJcbiAgICAgICAgaW5kZXggPSAwO1xyXG5cclxuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XHJcbiAgICAgICAgaW5kZXggPSBsb3cgKyAoKChoaWdoIC0gbG93KSAvIDIpIHwgMCk7XHJcbiAgICAgICAgaWYgKHRoaXMuYXJjTGVuZ3Roc1tpbmRleF0gPCB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICAgICAgbG93ID0gaW5kZXggKyAxO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoaWdoID0gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuYXJjTGVuZ3Roc1tpbmRleF0gPiB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICBpbmRleC0tO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsZW5ndGhCZWZvcmUgPSB0aGlzLmFyY0xlbmd0aHNbaW5kZXhdO1xyXG4gICAgaWYgKGxlbmd0aEJlZm9yZSA9PT0gdGFyZ2V0TGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4IC8gdGhpcy5zdGVwcztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIChpbmRleCArICh0YXJnZXRMZW5ndGggLSBsZW5ndGhCZWZvcmUpIC8gKHRoaXMuYXJjTGVuZ3Roc1tpbmRleCArIDFdIC0gbGVuZ3RoQmVmb3JlKSkgLyB0aGlzLnN0ZXBzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5nZXRWYWx1ZXMgPSBmdW5jdGlvbiAoZWxhcHNlZCkge1xyXG4gICAgdmFyIHQgPSB0aGlzLm1hcChlbGFwc2VkKSxcclxuICAgICAgICB4ID0gdGhpcy5jdWJpY04odCwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcclxuICAgICAgICB5ID0gdGhpcy5jdWJpY04odCwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKTtcclxuXHJcbiAgICByZXR1cm4gW3gsIHldO1xyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5jdWJpY04gPSBmdW5jdGlvbiAocGN0LCBhLCBiLCBjLCBkKSB7XHJcbiAgICB2YXIgdDIgPSBwY3QgKiBwY3Q7XHJcbiAgICB2YXIgdDMgPSB0MiAqIHBjdDtcclxuICAgIHJldHVybiBhICsgKC1hICogMyArIHBjdCAqICgzICogYSAtIGEgKiBwY3QpKSAqIHBjdFxyXG4gICAgICAgICsgKDMgKiBiICsgcGN0ICogKC02ICogYiArIGIgKiAzICogcGN0KSkgKiBwY3RcclxuICAgICAgICArIChjICogMyAtIGMgKiAzICogcGN0KSAqIHQyXHJcbiAgICAgICAgKyBkICogdDM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJlemllcjsiLCIvKipcclxuICogQmV6aWVyRWFzaW5nIC0gdXNlIGJlemllciBjdXJ2ZSBmb3IgdHJhbnNpdGlvbiBlYXNpbmcgZnVuY3Rpb25cclxuICogaXMgYmFzZWQgb24gRmlyZWZveCdzIG5zU01JTEtleVNwbGluZS5jcHBcclxuICogVXNhZ2U6XHJcbiAqIHZhciBzcGxpbmUgPSBCZXppZXJFYXNpbmcoMC4yNSwgMC4xLCAwLjI1LCAxLjApXHJcbiAqIHNwbGluZSh4KSA9PiByZXR1cm5zIHRoZSBlYXNpbmcgdmFsdWUgfCB4IG11c3QgYmUgaW4gWzAsIDFdIHJhbmdlXHJcbiAqXHJcbiAqL1xyXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcclxuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdy5kZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgd2luZG93LmRlZmluZS5hbWQpIHtcclxuICAgICAgICB3aW5kb3cuZGVmaW5lKFtdLCBkZWZpbml0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgd2luZG93LkJlemllckVhc2luZyA9IGRlZmluaXRpb24oKTtcclxuICAgIH1cclxufShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gVGhlc2UgdmFsdWVzIGFyZSBlc3RhYmxpc2hlZCBieSBlbXBpcmljaXNtIHdpdGggdGVzdHMgKHRyYWRlb2ZmOiBwZXJmb3JtYW5jZSBWUyBwcmVjaXNpb24pXHJcbiAgICB2YXIgTkVXVE9OX0lURVJBVElPTlMgPSA0O1xyXG4gICAgdmFyIE5FV1RPTl9NSU5fU0xPUEUgPSAwLjAwMTtcclxuICAgIHZhciBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDE7XHJcbiAgICB2YXIgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMgPSAxMDtcclxuXHJcbiAgICB2YXIga1NwbGluZVRhYmxlU2l6ZSA9IDExO1xyXG4gICAgdmFyIGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKTtcclxuXHJcbiAgICB2YXIgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gXCJmdW5jdGlvblwiO1xyXG5cclxuICAgIGZ1bmN0aW9uIEJlemllckVhc2luZyAobVgxLCBtWTEsIG1YMiwgbVkyKSB7XHJcblxyXG4gICAgICAgIC8vIFZhbGlkYXRlIGFyZ3VtZW50c1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICE9PSA0KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyByZXF1aXJlcyA0IGFyZ3VtZW50cy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTw0OyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gIT09IFwibnVtYmVyXCIgfHwgaXNOYU4oYXJndW1lbnRzW2ldKSB8fCAhaXNGaW5pdGUoYXJndW1lbnRzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIGFyZ3VtZW50cyBzaG91bGQgYmUgaW50ZWdlcnMuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtWDEgPCAwIHx8IG1YMSA+IDEgfHwgbVgyIDwgMCB8fCBtWDIgPiAxKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJlemllckVhc2luZyB4IHZhbHVlcyBtdXN0IGJlIGluIFswLCAxXSByYW5nZS5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbVNhbXBsZVZhbHVlcyA9IGZsb2F0MzJBcnJheVN1cHBvcnRlZCA/IG5ldyBGbG9hdDMyQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSkgOiBuZXcgQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIEEgKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTE7IH1cclxuICAgICAgICBmdW5jdGlvbiBCIChhQTEsIGFBMikgeyByZXR1cm4gMy4wICogYUEyIC0gNi4wICogYUExOyB9XHJcbiAgICAgICAgZnVuY3Rpb24gQyAoYUExKSAgICAgIHsgcmV0dXJuIDMuMCAqIGFBMTsgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm5zIHgodCkgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgeSh0KSBnaXZlbiB0LCB5MSwgYW5kIHkyLlxyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNCZXppZXIgKGFULCBhQTEsIGFBMikge1xyXG4gICAgICAgICAgICByZXR1cm4gKChBKGFBMSwgYUEyKSphVCArIEIoYUExLCBhQTIpKSphVCArIEMoYUExKSkqYVQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZXR1cm5zIGR4L2R0IGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIGR5L2R0IGdpdmVuIHQsIHkxLCBhbmQgeTIuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0U2xvcGUgKGFULCBhQTEsIGFBMikge1xyXG4gICAgICAgICAgICByZXR1cm4gMy4wICogQShhQTEsIGFBMikqYVQqYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUgKGFYLCBhR3Vlc3NUKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTkVXVE9OX0lURVJBVElPTlM7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRTbG9wZSA9IGdldFNsb3BlKGFHdWVzc1QsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2xvcGUgPT09IDAuMCkgcmV0dXJuIGFHdWVzc1Q7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xyXG4gICAgICAgICAgICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYUd1ZXNzVDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNTYW1wbGVWYWx1ZXMgKCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgbVNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBiaW5hcnlTdWJkaXZpZGUgKGFYLCBhQSwgYUIpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XHJcbiAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50WCA9IGNhbGNCZXppZXIoY3VycmVudFQsIG1YMSwgbVgyKSAtIGFYO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRYID4gMC4wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYUIgPSBjdXJyZW50VDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYUEgPSBjdXJyZW50VDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gU1VCRElWSVNJT05fUFJFQ0lTSU9OICYmICsraSA8IFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TKTtcclxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0VEZvclggKGFYKSB7XHJcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbFN0YXJ0ID0gMC4wO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFNhbXBsZSA9IDE7XHJcbiAgICAgICAgICAgIHZhciBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgY3VycmVudFNhbXBsZSAhPSBsYXN0U2FtcGxlICYmIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0gPD0gYVg7ICsrY3VycmVudFNhbXBsZSkge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLS1jdXJyZW50U2FtcGxlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW50ZXJwb2xhdGUgdG8gcHJvdmlkZSBhbiBpbml0aWFsIGd1ZXNzIGZvciB0XHJcbiAgICAgICAgICAgIHZhciBkaXN0ID0gKGFYIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAobVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlKzFdIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSk7XHJcbiAgICAgICAgICAgIHZhciBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcclxuICAgICAgICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSBORVdUT05fTUlOX1NMT1BFKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGd1ZXNzRm9yVCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09IDAuMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobVgxICE9IG1ZMSB8fCBtWDIgIT0gbVkyKVxyXG4gICAgICAgICAgICBjYWxjU2FtcGxlVmFsdWVzKCk7XHJcblxyXG4gICAgICAgIHZhciBmID0gZnVuY3Rpb24gKGFYKSB7XHJcbiAgICAgICAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgcmV0dXJuIGFYOyAvLyBsaW5lYXJcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBKYXZhU2NyaXB0IG51bWJlciBhcmUgaW1wcmVjaXNlLCB3ZSBzaG91bGQgZ3VhcmFudGVlIHRoZSBleHRyZW1lcyBhcmUgcmlnaHQuXHJcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMCkgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMSkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKGFYKSwgbVkxLCBtWTIpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHN0ciA9IFwiQmV6aWVyRWFzaW5nKFwiK1ttWDEsIG1ZMSwgbVgyLCBtWTJdK1wiKVwiO1xyXG4gICAgICAgIGYudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzdHI7IH07XHJcblxyXG4gICAgICAgIHJldHVybiBmO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENTUyBtYXBwaW5nXHJcbiAgICBCZXppZXJFYXNpbmcuY3NzID0ge1xyXG4gICAgICAgIFwiZWFzZVwiOiAgICAgICAgQmV6aWVyRWFzaW5nKDAuMjUsIDAuMSwgMC4yNSwgMS4wKSxcclxuICAgICAgICBcImxpbmVhclwiOiAgICAgIEJlemllckVhc2luZygwLjAwLCAwLjAsIDEuMDAsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLWluXCI6ICAgICBCZXppZXJFYXNpbmcoMC40MiwgMC4wLCAxLjAwLCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1vdXRcIjogICAgQmV6aWVyRWFzaW5nKDAuMDAsIDAuMCwgMC41OCwgMS4wKSxcclxuICAgICAgICBcImVhc2UtaW4tb3V0XCI6IEJlemllckVhc2luZygwLjQyLCAwLjAsIDAuNTgsIDEuMClcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEJlemllckVhc2luZztcclxufSkpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyksXHJcbiAgICBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEVsbGlwc2UoZGF0YSkge1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuc2l6ZSA9IGRhdGEuc2l6ZS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zaXplKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNpemUpO1xyXG4gICAgLy9vcHRpb25hbFxyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxufVxyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCB0cmltKSB7XHJcblxyXG4gICAgdmFyIHNpemUgPSB0aGlzLnNpemUuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uID8gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IFswLCAwXTtcclxuXHJcbiAgICB2YXIgaSwgajtcclxuXHJcbiAgICB2YXIgdyA9IHNpemVbMF0gLyAyLFxyXG4gICAgICAgIGggPSBzaXplWzFdIC8gMixcclxuICAgICAgICB4ID0gcG9zaXRpb25bMF0gLSB3LFxyXG4gICAgICAgIHkgPSBwb3NpdGlvblsxXSAtIGgsXHJcbiAgICAgICAgb3cgPSB3ICogLjU1MjI4NDgsXHJcbiAgICAgICAgb2ggPSBoICogLjU1MjI4NDg7XHJcblxyXG4gICAgdmFyIHZlcnRpY2VzID0gW1xyXG4gICAgICAgIFt4ICsgdyArIG93LCB5LCB4ICsgdyAtIG93LCB5LCB4ICsgdywgeV0sXHJcbiAgICAgICAgW3ggKyB3ICsgdywgeSArIGggKyBvaCwgeCArIHcgKyB3LCB5ICsgaCAtIG9oLCB4ICsgdyArIHcsIHkgKyBoXSxcclxuICAgICAgICBbeCArIHcgLSBvdywgeSArIGggKyBoLCB4ICsgdyArIG93LCB5ICsgaCArIGgsIHggKyB3LCB5ICsgaCArIGhdLFxyXG4gICAgICAgIFt4LCB5ICsgaCAtIG9oLCB4LCB5ICsgaCArIG9oLCB4LCB5ICsgaF1cclxuICAgIF07XHJcblxyXG4gICAgaWYgKHRyaW0pIHtcclxuICAgICAgICB2YXIgdHYsXHJcbiAgICAgICAgICAgIGxlbiA9IHcgKyBoO1xyXG5cclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGogPSBpICsgMTtcclxuICAgICAgICAgICAgaWYgKGogPiAzKSBqID0gMDtcclxuICAgICAgICAgICAgaWYgKGkgPiB0cmltLnN0YXJ0SW5kZXggJiYgaSA8IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZlcnRpY2VzW2ldWzBdLCB2ZXJ0aWNlc1tpXVsxXSwgdmVydGljZXNbal1bMl0sIHZlcnRpY2VzW2pdWzNdLCB2ZXJ0aWNlc1tqXVs0XSwgdmVydGljZXNbal1bNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uc3RhcnRJbmRleCAmJiBpID09PSB0cmltLmVuZEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIHRyaW0uc3RhcnQsIHRyaW0uZW5kLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uc3RhcnRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCB0cmltLnN0YXJ0LCAxLCBsZW4pO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh0di5zdGFydFs0XSwgdHYuc3RhcnRbNV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgMCwgdHJpbS5lbmQsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGogPSBpICsgMTtcclxuICAgICAgICAgICAgaWYgKGogPiAzKSBqID0gMDtcclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odmVydGljZXNbaV1bMF0sIHZlcnRpY2VzW2ldWzFdLCB2ZXJ0aWNlc1tqXVsyXSwgdmVydGljZXNbal1bM10sIHZlcnRpY2VzW2pdWzRdLCB2ZXJ0aWNlc1tqXVs1XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltKSB7XHJcbiAgICB2YXIgc3RhcnRJbmRleCA9IE1hdGguZmxvb3IodHJpbS5zdGFydCAqIDQpLFxyXG4gICAgICAgIGVuZEluZGV4ID0gTWF0aC5mbG9vcih0cmltLmVuZCAqIDQpLFxyXG4gICAgICAgIHN0YXJ0ID0gKHRyaW0uc3RhcnQgLSBzdGFydEluZGV4ICogMC4yNSkgKiA0LFxyXG4gICAgICAgIGVuZCA9ICh0cmltLmVuZCAtIGVuZEluZGV4ICogMC4yNSkgKiA0O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogc3RhcnRJbmRleCxcclxuICAgICAgICBlbmRJbmRleCAgOiBlbmRJbmRleCxcclxuICAgICAgICBzdGFydCAgICAgOiBzdGFydCxcclxuICAgICAgICBlbmQgICAgICAgOiBlbmRcclxuICAgIH07XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5zaXplLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbGxpcHNlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEZpbGwoZGF0YSkge1xyXG4gICAgdGhpcy5jb2xvciA9IGRhdGEuY29sb3IubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpIDogbmV3IFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkgdGhpcy5vcGFjaXR5ID0gZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpIDogbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbn1cclxuXHJcbkZpbGwucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuY29sb3IuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSA6IDE7XHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoY29sb3JbMF0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMV0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMl0pICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5zZXRDb2xvciA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuZ2V0VmFsdWUodGltZSk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5jb2xvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuRmlsbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuY29sb3IucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsbDsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU3Ryb2tlID0gcmVxdWlyZSgnLi9TdHJva2UnKSxcclxuICAgIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKSxcclxuICAgIEVsbGlwc2UgPSByZXF1aXJlKCcuL0VsbGlwc2UnKSxcclxuICAgIFBvbHlzdGFyID0gcmVxdWlyZSgnLi9Qb2x5c3RhcicpLFxyXG4gICAgQW5pbWF0ZWRQYXRoID0gcmVxdWlyZSgnLi9BbmltYXRlZFBhdGgnKSxcclxuICAgIEZpbGwgPSByZXF1aXJlKCcuL0ZpbGwnKSxcclxuICAgIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXHJcbiAgICBNZXJnZSA9IHJlcXVpcmUoJy4vTWVyZ2UnKSxcclxuICAgIFRyaW0gPSByZXF1aXJlKCcuL1RyaW0nKTtcclxuXHJcbmZ1bmN0aW9uIEdyb3VwKGRhdGEsIGJ1ZmZlckN0eCwgcGFyZW50SW4sIHBhcmVudE91dCkge1xyXG5cclxuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuaW4gPSBkYXRhLmluID8gZGF0YS5pbiA6IHBhcmVudEluO1xyXG4gICAgdGhpcy5vdXQgPSBkYXRhLm91dCA/IGRhdGEub3V0IDogcGFyZW50T3V0O1xyXG5cclxuICAgIGlmIChkYXRhLmZpbGwpIHRoaXMuZmlsbCA9IG5ldyBGaWxsKGRhdGEuZmlsbCk7XHJcbiAgICBpZiAoZGF0YS5zdHJva2UpIHRoaXMuc3Ryb2tlID0gbmV3IFN0cm9rZShkYXRhLnN0cm9rZSk7XHJcbiAgICBpZiAoZGF0YS50cmltKSB0aGlzLnRyaW0gPSBuZXcgVHJpbShkYXRhLnRyaW0pO1xyXG4gICAgaWYgKGRhdGEubWVyZ2UpIHRoaXMubWVyZ2UgPSBuZXcgTWVyZ2UoZGF0YS5tZXJnZSk7XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKGRhdGEudHJhbnNmb3JtKTtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gYnVmZmVyQ3R4O1xyXG5cclxuICAgIGlmIChkYXRhLmdyb3Vwcykge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwcy5wdXNoKG5ldyBHcm91cChkYXRhLmdyb3Vwc1tpXSwgdGhpcy5idWZmZXJDdHgsIHRoaXMuaW4sIHRoaXMub3V0KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vXHJcbiAgICBpZiAoZGF0YS5zaGFwZXMpIHtcclxuICAgICAgICB0aGlzLnNoYXBlcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGF0YS5zaGFwZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdmFyIHNoYXBlID0gZGF0YS5zaGFwZXNbal07XHJcbiAgICAgICAgICAgIGlmIChzaGFwZS50eXBlID09PSAncGF0aCcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzaGFwZS5pc0FuaW1hdGVkKSB0aGlzLnNoYXBlcy5wdXNoKG5ldyBBbmltYXRlZFBhdGgoc2hhcGUpKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5zaGFwZXMucHVzaChuZXcgUGF0aChzaGFwZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdyZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgUmVjdChzaGFwZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdlbGxpcHNlJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgRWxsaXBzZShzaGFwZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdwb2x5c3RhcicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IFBvbHlzdGFyKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbkdyb3VwLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgcGFyZW50RmlsbCwgcGFyZW50U3Ryb2tlLCBwYXJlbnRUcmltKSB7XHJcblxyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgY3R4LnNhdmUoKTtcclxuXHJcbiAgICAvL1RPRE8gY2hlY2sgaWYgY29sb3Ivc3Ryb2tlIGlzIGNoYW5naW5nIG92ZXIgdGltZVxyXG4gICAgdmFyIGZpbGwgPSB0aGlzLmZpbGwgfHwgcGFyZW50RmlsbDtcclxuICAgIHZhciBzdHJva2UgPSB0aGlzLnN0cm9rZSB8fCBwYXJlbnRTdHJva2U7XHJcbiAgICB2YXIgdHJpbVZhbHVlcyA9IHRoaXMudHJpbSA/IHRoaXMudHJpbS5nZXRUcmltKHRpbWUpIDogcGFyZW50VHJpbTtcclxuXHJcbiAgICBpZiAoZmlsbCkgZmlsbC5zZXRDb2xvcihjdHgsIHRpbWUpO1xyXG4gICAgaWYgKHN0cm9rZSkgc3Ryb2tlLnNldFN0cm9rZShjdHgsIHRpbWUpO1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtLnRyYW5zZm9ybShjdHgsIHRpbWUpO1xyXG5cclxuICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMud2lkdGgsIHRoaXMuYnVmZmVyQ3R4LmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtLnRyYW5zZm9ybSh0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XHJcblxyXG4gICAgICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgICAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGwpIHRoaXMuYnVmZmVyQ3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJva2UpIHRoaXMuYnVmZmVyQ3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLmRyYXcoY3R4LCB0aW1lLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zaGFwZXNbdGhpcy5zaGFwZXMubGVuZ3RoIC0gMV0uY2xvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICAvL2N0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL1RPRE8gZ2V0IG9yZGVyXHJcbiAgICBpZiAoZmlsbCkgY3R4LmZpbGwoKTtcclxuICAgIGlmIChzdHJva2UpIGN0eC5zdHJva2UoKTtcclxuXHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyh0aGlzLmJ1ZmZlckN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmJ1ZmZlckN0eC5jYW52YXMsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lID49IHRoaXMuZ3JvdXBzW2ldLmluICYmIHRpbWUgPCB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KGN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlLCB0cmltVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5Hcm91cC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnNldEtleWZyYW1lcyh0aW1lKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2pdLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZmlsbCkgdGhpcy5maWxsLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnN0cm9rZSkgdGhpcy5zdHJva2Uuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMudHJpbSkgdGhpcy50cmltLnJlc2V0KHRpbWUpO1xyXG59O1xyXG5cclxuR3JvdXAucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybS5yZXNldChyZXZlcnNlZCk7XHJcblxyXG4gICAgaWYgKHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1tqXS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuZmlsbCkgdGhpcy5maWxsLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnN0cm9rZSkgdGhpcy5zdHJva2UucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMudHJpbSkgdGhpcy50cmltLnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR3JvdXA7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBNZXJnZShkYXRhKSB7XHJcbiAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGU7XHJcbn1cclxuXHJcbk1lcmdlLnByb3RvdHlwZS5zZXRDb21wb3NpdGVPcGVyYXRpb24gPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3V0JztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA0OlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1pbic7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNTpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICd4b3InO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVyZ2U7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQmV6aWVyID0gcmVxdWlyZSgnLi9CZXppZXInKTtcclxuXHJcbmZ1bmN0aW9uIFBhdGgoZGF0YSkge1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSBkYXRhLmNsb3NlZDtcclxuICAgIHRoaXMuZnJhbWVzID0gZGF0YS5mcmFtZXM7XHJcbiAgICB0aGlzLnZlcnRpY2VzQ291bnQgPSB0aGlzLmZyYW1lc1swXS52Lmxlbmd0aDtcclxufVxyXG5cclxuUGF0aC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuICAgIHZhciBmcmFtZSA9IHRoaXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgdmVydGljZXMgPSBmcmFtZS52O1xyXG5cclxuICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgdHJpbSA9IHRoaXMuZ2V0VHJpbVZhbHVlcyh0cmltLCBmcmFtZSk7XHJcbiAgICAgICAgaWYgKHRyaW0uc3RhcnQgPT09IDAgJiYgdHJpbS5lbmQgPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBqID0gMTsgaiA8IHZlcnRpY2VzLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXh0VmVydGV4ID0gdmVydGljZXNbal0sXHJcbiAgICAgICAgICAgIGxhc3RWZXJ0ZXggPSB2ZXJ0aWNlc1tqIC0gMV07XHJcblxyXG4gICAgICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgICAgIHZhciB0djtcclxuXHJcbiAgICAgICAgICAgIGlmIChqID09PSAxICYmIHRyaW0uc3RhcnRJbmRleCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChqID09PSB0cmltLnN0YXJ0SW5kZXggKyAxICYmIGogPT09IHRyaW0uZW5kSW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCB0cmltLnN0YXJ0LCB0cmltLmVuZCwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA9PT0gdHJpbS5zdGFydEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgdHJpbS5zdGFydCwgMSwgZnJhbWUubGVuW2ogLSAxXSk7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiA9PT0gdHJpbS5lbmRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIDAsIHRyaW0uZW5kLCBmcmFtZS5sZW5baiAtIDFdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChqID4gdHJpbS5zdGFydEluZGV4ICsgMSAmJiBqIDwgdHJpbS5lbmRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGogPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8obGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8obGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghdHJpbSAmJiB0aGlzLmNsb3NlZCkge1xyXG4gICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKG5leHRWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMV0sIHZlcnRpY2VzWzBdWzJdLCB2ZXJ0aWNlc1swXVszXSwgdmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuICAgIH1cclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuZ2V0VHJpbVZhbHVlcyA9IGZ1bmN0aW9uICh0cmltLCBmcmFtZSkge1xyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgdmFyIGFjdHVhbFRyaW0gPSB7XHJcbiAgICAgICAgc3RhcnRJbmRleDogMCxcclxuICAgICAgICBlbmRJbmRleCAgOiAwLFxyXG4gICAgICAgIHN0YXJ0ICAgICA6IDAsXHJcbiAgICAgICAgZW5kICAgICAgIDogMFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodHJpbS5zdGFydCA9PT0gMCkge1xyXG4gICAgICAgIGlmICh0cmltLmVuZCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRyaW0uZW5kID09PSAxKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBmcmFtZS5sZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHRvdGFsTGVuID0gdGhpcy5zdW1BcnJheShmcmFtZS5sZW4pLFxyXG4gICAgICAgIHRyaW1BdExlbjtcclxuXHJcbiAgICB0cmltQXRMZW4gPSB0b3RhbExlbiAqIHRyaW0uc3RhcnQ7XHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGZyYW1lLmxlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICh0cmltQXRMZW4gPiAwICYmIHRyaW1BdExlbiA8IGZyYW1lLmxlbltpXSkge1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLnN0YXJ0SW5kZXggPSBpO1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLnN0YXJ0ID0gdHJpbUF0TGVuIC8gZnJhbWUubGVuW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmltQXRMZW4gLT0gZnJhbWUubGVuW2ldO1xyXG4gICAgfVxyXG5cclxuICAgIHRyaW1BdExlbiA9IHRvdGFsTGVuICogdHJpbS5lbmQ7XHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGZyYW1lLmxlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICh0cmltQXRMZW4gPiAwICYmIHRyaW1BdExlbiA8IGZyYW1lLmxlbltpXSkge1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZEluZGV4ID0gaTtcclxuICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmQgPSB0cmltQXRMZW4gLyBmcmFtZS5sZW5baV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFjdHVhbFRyaW07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS50cmltID0gZnVuY3Rpb24gKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIGZyb20sIHRvLCBsZW4pIHtcclxuXHJcbiAgICBpZiAoZnJvbSA9PT0gMCAmJiB0byA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBsYXN0VmVydGV4LFxyXG4gICAgICAgICAgICBlbmQgIDogbmV4dFZlcnRleFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaXNTdHJhaWdodChsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKSkge1xyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzFdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbMl0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzRdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNV0sIG5leHRWZXJ0ZXhbNV0sIGZyb20pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgZW5kVmVydGV4ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFswXSwgbmV4dFZlcnRleFswXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsxXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsyXSwgbmV4dFZlcnRleFsyXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFszXSwgbmV4dFZlcnRleFszXSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbmV4dFZlcnRleFs0XSwgdG8pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbmV4dFZlcnRleFs1XSwgdG8pXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYmV6aWVyID0gbmV3IEJlemllcihbbGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XV0pO1xyXG4gICAgICAgIHRoaXMuYmV6aWVyLmdldExlbmd0aChsZW4pO1xyXG4gICAgICAgIGZyb20gPSB0aGlzLmJlemllci5tYXAoZnJvbSk7XHJcbiAgICAgICAgdG8gPSB0aGlzLmJlemllci5tYXAodG8pO1xyXG5cclxuICAgICAgICB2YXIgZTEsIGYxLCBnMSwgaDEsIGoxLCBrMSxcclxuICAgICAgICAgICAgZTIsIGYyLCBnMiwgaDIsIGoyLCBrMixcclxuICAgICAgICAgICAgc3RhcnRWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZFZlcnRleDtcclxuXHJcbiAgICAgICAgZTEgPSBbdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbMF0sIGZyb20pLCB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbGFzdFZlcnRleFsxXSwgZnJvbSldO1xyXG4gICAgICAgIGYxID0gW3RoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzJdLCBmcm9tKSwgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbM10sIGZyb20pXTtcclxuICAgICAgICBnMSA9IFt0aGlzLmxlcnAobmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFs0XSwgZnJvbSksIHRoaXMubGVycChuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzVdLCBmcm9tKV07XHJcbiAgICAgICAgaDEgPSBbdGhpcy5sZXJwKGUxWzBdLCBmMVswXSwgZnJvbSksIHRoaXMubGVycChlMVsxXSwgZjFbMV0sIGZyb20pXTtcclxuICAgICAgICBqMSA9IFt0aGlzLmxlcnAoZjFbMF0sIGcxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGYxWzFdLCBnMVsxXSwgZnJvbSldO1xyXG4gICAgICAgIGsxID0gW3RoaXMubGVycChoMVswXSwgajFbMF0sIGZyb20pLCB0aGlzLmxlcnAoaDFbMV0sIGoxWzFdLCBmcm9tKV07XHJcblxyXG4gICAgICAgIHN0YXJ0VmVydGV4ID0gW2oxWzBdLCBqMVsxXSwgaDFbMF0sIGgxWzFdLCBrMVswXSwgazFbMV1dO1xyXG4gICAgICAgIGVuZFZlcnRleCA9IFtuZXh0VmVydGV4WzBdLCBuZXh0VmVydGV4WzFdLCBnMVswXSwgZzFbMV0sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV1dO1xyXG5cclxuICAgICAgICBlMiA9IFt0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzBdLCB0byksIHRoaXMubGVycChzdGFydFZlcnRleFs1XSwgc3RhcnRWZXJ0ZXhbMV0sIHRvKV07XHJcbiAgICAgICAgZjIgPSBbdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzBdLCBlbmRWZXJ0ZXhbMl0sIHRvKSwgdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzFdLCBlbmRWZXJ0ZXhbM10sIHRvKV07XHJcbiAgICAgICAgZzIgPSBbdGhpcy5sZXJwKGVuZFZlcnRleFsyXSwgZW5kVmVydGV4WzRdLCB0byksIHRoaXMubGVycChlbmRWZXJ0ZXhbM10sIGVuZFZlcnRleFs1XSwgdG8pXTtcclxuICAgICAgICBoMiA9IFt0aGlzLmxlcnAoZTJbMF0sIGYyWzBdLCB0byksIHRoaXMubGVycChlMlsxXSwgZjJbMV0sIHRvKV07XHJcbiAgICAgICAgajIgPSBbdGhpcy5sZXJwKGYyWzBdLCBnMlswXSwgdG8pLCB0aGlzLmxlcnAoZjJbMV0sIGcyWzFdLCB0byldO1xyXG4gICAgICAgIGsyID0gW3RoaXMubGVycChoMlswXSwgajJbMF0sIHRvKSwgdGhpcy5sZXJwKGgyWzFdLCBqMlsxXSwgdG8pXTtcclxuXHJcbiAgICAgICAgc3RhcnRWZXJ0ZXggPSBbZTJbMF0sIGUyWzFdLCBzdGFydFZlcnRleFsyXSwgc3RhcnRWZXJ0ZXhbM10sIHN0YXJ0VmVydGV4WzRdLCBzdGFydFZlcnRleFs1XV07XHJcbiAgICAgICAgZW5kVmVydGV4ID0gW2oyWzBdLCBqMlsxXSwgaDJbMF0sIGgyWzFdLCBrMlswXSwgazJbMV1dO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXJ0OiBzdGFydFZlcnRleCxcclxuICAgICAgICBlbmQgIDogZW5kVmVydGV4XHJcbiAgICB9O1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUubGVycCA9IGZ1bmN0aW9uIChhLCBiLCB0KSB7XHJcbiAgICB2YXIgcyA9IDEgLSB0O1xyXG4gICAgcmV0dXJuIGEgKiBzICsgYiAqIHQ7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5zdW1BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcclxuICAgIGZ1bmN0aW9uIGFkZChhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIGEgKyBiO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhcnIucmVkdWNlKGFkZCk7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5pc1N0cmFpZ2h0ID0gZnVuY3Rpb24gKHN0YXJ0WCwgc3RhcnRZLCBjdHJsMVgsIGN0cmwxWSwgY3RybDJYLCBjdHJsMlksIGVuZFgsIGVuZFkpIHtcclxuICAgIHJldHVybiBzdGFydFggPT09IGN0cmwxWCAmJiBzdGFydFkgPT09IGN0cmwxWSAmJiBlbmRYID09PSBjdHJsMlggJiYgZW5kWSA9PT0gY3RybDJZO1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGg7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFBvbHlzdGFyKGRhdGEpIHtcclxuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTsgLy8gVE9ETyA/P1xyXG5cclxuICAgIHRoaXMuc3RhclR5cGUgPSBkYXRhLnN0YXJUeXBlO1xyXG4gICAgdGhpcy5wb2ludHMgPSBkYXRhLnBvaW50cy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb2ludHMpIDogbmV3IFByb3BlcnR5KGRhdGEucG9pbnRzKTtcclxuICAgIHRoaXMuaW5uZXJSYWRpdXMgPSBkYXRhLmlubmVyUmFkaXVzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmlubmVyUmFkaXVzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmlubmVyUmFkaXVzKTtcclxuICAgIHRoaXMub3V0ZXJSYWRpdXMgPSBkYXRhLm91dGVyUmFkaXVzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUmFkaXVzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUmFkaXVzKTtcclxuXHJcbiAgICAvL29wdGluYWxzXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbiA9IGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgaWYgKGRhdGEucm90YXRpb24pIHRoaXMucm90YXRpb24gPSBkYXRhLnJvdGF0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnJvdGF0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnJvdGF0aW9uKTtcclxuICAgIGlmIChkYXRhLmlubmVyUm91bmRuZXNzKSB0aGlzLmlubmVyUm91bmRuZXNzID0gZGF0YS5pbm5lclJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJvdW5kbmVzcykgOiBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJvdW5kbmVzcyk7XHJcbiAgICBpZiAoZGF0YS5vdXRlclJvdW5kbmVzcykgdGhpcy5vdXRlclJvdW5kbmVzcyA9IGRhdGEub3V0ZXJSb3VuZG5lc3MubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3V0ZXJSb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEub3V0ZXJSb3VuZG5lc3MpO1xyXG59XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuXHJcbiAgICB2YXIgcG9pbnRzID0gdGhpcy5wb2ludHMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgaW5uZXJSYWRpdXMgPSB0aGlzLmlubmVyUmFkaXVzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIG91dGVyUmFkaXVzID0gdGhpcy5vdXRlclJhZGl1cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbiA/IHRoaXMucm90YXRpb24uZ2V0VmFsdWUodGltZSkgOiAwLFxyXG4gICAgICAgIGlubmVyUm91bmRuZXNzID0gdGhpcy5pbm5lclJvdW5kbmVzcyA/IHRoaXMuaW5uZXJSb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwLFxyXG4gICAgICAgIG91dGVyUm91bmRuZXNzID0gdGhpcy5vdXRlclJvdW5kbmVzcyA/IHRoaXMub3V0ZXJSb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwO1xyXG5cclxuICAgIHJvdGF0aW9uID0gdGhpcy5kZWcycmFkKHJvdGF0aW9uKTtcclxuICAgIHZhciBzdGFydCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgMCwgMCAtIG91dGVyUmFkaXVzLCByb3RhdGlvbik7XHJcblxyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgIGN0eC50cmFuc2xhdGUocG9zaXRpb25bMF0sIHBvc2l0aW9uWzFdKTtcclxuICAgIGN0eC5tb3ZlVG8oc3RhcnRbMF0sIHN0YXJ0WzFdKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50czsgaSsrKSB7XHJcblxyXG4gICAgICAgIHZhciBwSW5uZXIsXHJcbiAgICAgICAgICAgIHBPdXRlcixcclxuICAgICAgICAgICAgcE91dGVyMVRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBPdXRlcjJUYW5nZW50LFxyXG4gICAgICAgICAgICBwSW5uZXIxVGFuZ2VudCxcclxuICAgICAgICAgICAgcElubmVyMlRhbmdlbnQsXHJcbiAgICAgICAgICAgIG91dGVyT2Zmc2V0LFxyXG4gICAgICAgICAgICBpbm5lck9mZnNldCxcclxuICAgICAgICAgICAgcm90O1xyXG5cclxuICAgICAgICByb3QgPSBNYXRoLlBJIC8gcG9pbnRzICogMjtcclxuXHJcbiAgICAgICAgcElubmVyID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCAwLCAwIC0gaW5uZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpIC0gcm90IC8gMikgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcE91dGVyID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCAwLCAwIC0gb3V0ZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpKSArIHJvdGF0aW9uKTtcclxuXHJcbiAgICAgICAgLy9GSXhNRVxyXG4gICAgICAgIGlmICghb3V0ZXJPZmZzZXQpIG91dGVyT2Zmc2V0ID0gKHN0YXJ0WzBdICsgcElubmVyWzBdKSAqIG91dGVyUm91bmRuZXNzIC8gMTAwICogLjU1MjI4NDg7XHJcbiAgICAgICAgaWYgKCFpbm5lck9mZnNldCkgaW5uZXJPZmZzZXQgPSAoc3RhcnRbMF0gKyBwSW5uZXJbMF0pICogaW5uZXJSb3VuZG5lc3MgLyAxMDAgKiAuNTUyMjg0ODtcclxuXHJcbiAgICAgICAgcE91dGVyMVRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIG91dGVyT2Zmc2V0LCAwIC0gb3V0ZXJSYWRpdXMsIChyb3QgKiBpKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwSW5uZXIxVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgaW5uZXJPZmZzZXQgKiAtMSwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBJbm5lcjJUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBpbm5lck9mZnNldCwgMCAtIGlubmVyUmFkaXVzLCAocm90ICogKGkgKyAxKSAtIHJvdCAvIDIpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBPdXRlcjJUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBvdXRlck9mZnNldCAqIC0xLCAwIC0gb3V0ZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpKSArIHJvdGF0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhclR5cGUgPT09IDEpIHtcclxuICAgICAgICAgICAgLy9zdGFyXHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgcElubmVyMVRhbmdlbnRbMF0sIHBJbm5lcjFUYW5nZW50WzFdLCBwSW5uZXJbMF0sIHBJbm5lclsxXSk7XHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHBJbm5lcjJUYW5nZW50WzBdLCBwSW5uZXIyVGFuZ2VudFsxXSwgcE91dGVyMlRhbmdlbnRbMF0sIHBPdXRlcjJUYW5nZW50WzFdLCBwT3V0ZXJbMF0sIHBPdXRlclsxXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9wb2x5Z29uXHJcbiAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHBPdXRlcjFUYW5nZW50WzBdLCBwT3V0ZXIxVGFuZ2VudFsxXSwgcE91dGVyMlRhbmdlbnRbMF0sIHBPdXRlcjJUYW5nZW50WzFdLCBwT3V0ZXJbMF0sIHBPdXRlclsxXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2RlYnVnXHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBJbm5lclswXSwgcElubmVyWzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXJbMF0sIHBPdXRlclsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJibHVlXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyMVRhbmdlbnRbMF0sIHBPdXRlcjFUYW5nZW50WzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcInJlZFwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBJbm5lcjFUYW5nZW50WzBdLCBwSW5uZXIxVGFuZ2VudFsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJncmVlblwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBJbm5lcjJUYW5nZW50WzBdLCBwSW5uZXIyVGFuZ2VudFsxXSwgNSwgNSk7XHJcbiAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gXCJicm93blwiO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlcjJUYW5nZW50WzBdLCBwT3V0ZXIyVGFuZ2VudFsxXSwgNSwgNSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUucm90YXRlUG9pbnQgPSBmdW5jdGlvbiAoY3gsIGN5LCB4LCB5LCByYWRpYW5zKSB7XHJcbiAgICB2YXIgY29zID0gTWF0aC5jb3MocmFkaWFucyksXHJcbiAgICAgICAgc2luID0gTWF0aC5zaW4ocmFkaWFucyksXHJcbiAgICAgICAgbnggPSAoY29zICogKHggLSBjeCkpIC0gKHNpbiAqICh5IC0gY3kpKSArIGN4LFxyXG4gICAgICAgIG55ID0gKHNpbiAqICh4IC0gY3gpKSArIChjb3MgKiAoeSAtIGN5KSkgKyBjeTtcclxuICAgIHJldHVybiBbbngsIG55XTtcclxufTtcclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5kZWcycmFkID0gZnVuY3Rpb24gKGRlZykge1xyXG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcclxufTtcclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5wb2ludHMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgdGhpcy5pbm5lclJhZGl1cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLmlubmVyUm91bmRuZXNzKSB0aGlzLmlubmVyUm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm91dGVyUm91bmRuZXNzKSB0aGlzLm91dGVyUm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5wb2ludHMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5pbm5lclJhZGl1cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLmlubmVyUm91bmRuZXNzKSB0aGlzLmlubmVyUm91bmRuZXNzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm91dGVyUm91bmRuZXNzKSB0aGlzLm91dGVyUm91bmRuZXNzLnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9seXN0YXI7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEJlemllciA9IHJlcXVpcmUoJy4vQmV6aWVyJyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBQb3NpdGlvbihkYXRhKSB7XHJcbiAgICBBbmltYXRlZFByb3BlcnR5LmNhbGwodGhpcywgZGF0YSk7XHJcbn1cclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUpO1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLm9uS2V5ZnJhbWVDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnNldEVhc2luZygpO1xyXG4gICAgdGhpcy5zZXRNb3Rpb25QYXRoKCk7XHJcbn07XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUuZ2V0VmFsdWVBdFRpbWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMubW90aW9ucGF0aCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vdGlvbnBhdGguZ2V0VmFsdWVzKHRoaXMuZ2V0RWxhcHNlZCh0aW1lKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudiwgdGhpcy5uZXh0RnJhbWUudiwgdGhpcy5nZXRFbGFwc2VkKHRpbWUpKTtcclxuICAgIH1cclxufTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5zZXRNb3Rpb25QYXRoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMubGFzdEZyYW1lLm1vdGlvbnBhdGgpIHtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGggPSBuZXcgQmV6aWVyKHRoaXMubGFzdEZyYW1lLm1vdGlvbnBhdGgpO1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aC5nZXRMZW5ndGgodGhpcy5sYXN0RnJhbWUubGVuKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9zaXRpb247XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBQcm9wZXJ0eShkYXRhKSB7XHJcbiAgICBpZiAoIShkYXRhIGluc3RhbmNlb2YgQXJyYXkpKSByZXR1cm4gbnVsbDtcclxuICAgIHRoaXMuZnJhbWVzID0gZGF0YTtcclxufVxyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdLnY7XHJcbn07XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxufTtcclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9wZXJ0eTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBSZWN0KGRhdGEpIHtcclxuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBkYXRhLnNpemUubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2l6ZSkgOiBuZXcgUHJvcGVydHkoZGF0YS5zaXplKTtcclxuXHJcbiAgICAvL29wdGlvbmFsc1xyXG4gICAgaWYgKGRhdGEucG9zaXRpb24pIHRoaXMucG9zaXRpb24gPSBkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGlmIChkYXRhLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3MgPSBkYXRhLnJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3VuZG5lc3MpIDogbmV3IFByb3BlcnR5KGRhdGEucm91bmRuZXNzKTtcclxufVxyXG5cclxuUmVjdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdLFxyXG4gICAgICAgIHJvdW5kbmVzcyA9IHRoaXMucm91bmRuZXNzID8gdGhpcy5yb3VuZG5lc3MuZ2V0VmFsdWUodGltZSkgOiAwO1xyXG5cclxuICAgIGlmIChzaXplWzBdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVswXSAvIDI7XHJcbiAgICBpZiAoc2l6ZVsxXSA8IDIgKiByb3VuZG5lc3MpIHJvdW5kbmVzcyA9IHNpemVbMV0gLyAyO1xyXG5cclxuICAgIHZhciB4ID0gcG9zaXRpb25bMF0gLSBzaXplWzBdIC8gMixcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0gLSBzaXplWzFdIC8gMjtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0djtcclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0pO1xyXG4gICAgICAgIC8vVE9ETyBhZGQgdHJpbVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdHgubW92ZVRvKHggKyByb3VuZG5lc3MsIHkpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSwgeCArIHNpemVbMF0sIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSArIHNpemVbMV0sIHgsIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4LCB5ICsgc2l6ZVsxXSwgeCwgeSwgcm91bmRuZXNzKTtcclxuICAgICAgICBjdHguYXJjVG8oeCwgeSwgeCArIHNpemVbMF0sIHksIHJvdW5kbmVzcyk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuUmVjdC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHRoaXMuc2l6ZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzLnNldEtleWZyYW1lcyh0aW1lKTtcclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnNpemUucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcy5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gU3Ryb2tlKGRhdGEpIHtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5qb2luID0gZGF0YS5qb2luO1xyXG4gICAgICAgIHRoaXMuY2FwID0gZGF0YS5jYXA7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEubWl0ZXJMaW1pdC5sZW5ndGggPiAxKSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY29sb3IubGVuZ3RoID4gMSkgdGhpcy5jb2xvciA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5jb2xvciA9IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEub3BhY2l0eS5sZW5ndGggPiAxKSB0aGlzLm9wYWNpdHkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5vcGFjaXR5ID0gbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLndpZHRoLmxlbmd0aCA+IDEpIHRoaXMud2lkdGggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLndpZHRoKTtcclxuICAgICAgICBlbHNlIHRoaXMud2lkdGggPSBuZXcgUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblN0cm9rZS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcclxuLy8gICAgY29uc29sZS5sb2coY29sb3IpO1xyXG4gICAgdmFyIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSk7XHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoY29sb3JbMF0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMV0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMl0pICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnNldFN0cm9rZSA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIHZhciBzdHJva2VDb2xvciA9IHRoaXMuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgc3Ryb2tlV2lkdGggPSB0aGlzLndpZHRoLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHN0cm9rZUpvaW4gPSB0aGlzLmpvaW47XHJcbiAgICBpZiAoc3Ryb2tlSm9pbiA9PT0gJ21pdGVyJykgdmFyIG1pdGVyTGltaXQgPSB0aGlzLm1pdGVyTGltaXQuZ2V0VmFsdWUodGltZSk7XHJcblxyXG4gICAgY3R4LmxpbmVXaWR0aCA9IHN0cm9rZVdpZHRoO1xyXG4gICAgY3R4LmxpbmVKb2luID0gc3Ryb2tlSm9pbjtcclxuICAgIGlmIChtaXRlckxpbWl0KSBjdHgubWl0ZXJMaW1pdCA9IG1pdGVyTGltaXQ7XHJcbiAgICBjdHgubGluZUNhcCA9IHRoaXMuY2FwO1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3I7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLmNvbG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLndpZHRoLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmNvbG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLndpZHRoLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0cm9rZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5JyksXHJcbiAgICBQb3NpdGlvbiA9IHJlcXVpcmUoJy4vUG9zaXRpb24nKTtcclxuXHJcbmZ1bmN0aW9uIFRyYW5zZm9ybShkYXRhKSB7XHJcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcblxyXG4gICAgaWYgKGRhdGEucG9zaXRpb25YICYmIGRhdGEucG9zaXRpb25ZKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb25YLmxlbmd0aCA+IDEgJiYgZGF0YS5wb3NpdGlvblkubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25YKTtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvblgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChkYXRhLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvc2l0aW9uKGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLmFuY2hvcikgdGhpcy5hbmNob3IgPSBkYXRhLmFuY2hvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5hbmNob3IpIDogbmV3IFByb3BlcnR5KGRhdGEuYW5jaG9yKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWCkgdGhpcy5zY2FsZVggPSBkYXRhLnNjYWxlWC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVgpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVYKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWSkgdGhpcy5zY2FsZVkgPSBkYXRhLnNjYWxlWS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVkpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVZKTtcclxuICAgIGlmIChkYXRhLnNrZXcpIHRoaXMuc2tldyA9IGRhdGEuc2tldy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXcpO1xyXG4gICAgaWYgKGRhdGEuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMgPSBkYXRhLnNrZXdBeGlzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvc2l0aW9uWCwgcG9zaXRpb25ZLFxyXG4gICAgICAgIGFuY2hvciA9IHRoaXMuYW5jaG9yID8gdGhpcy5hbmNob3IuZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLnJvdGF0aW9uID8gdGhpcy5kZWcycmFkKHRoaXMucm90YXRpb24uZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3ID0gdGhpcy5za2V3ID8gdGhpcy5kZWcycmFkKHRoaXMuc2tldy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNrZXdBeGlzID0gdGhpcy5za2V3QXhpcyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXdBeGlzLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2NhbGVYID0gdGhpcy5zY2FsZVggPyB0aGlzLnNjYWxlWC5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgc2NhbGVZID0gdGhpcy5zY2FsZVkgPyB0aGlzLnNjYWxlWS5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSAqIGN0eC5nbG9iYWxBbHBoYSA6IGN0eC5nbG9iYWxBbHBoYTsgLy8gRklYTUUgd3JvbmcgdHJhbnNwYXJlbmN5IGlmIG5lc3RlZFxyXG5cclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWCAmJiB0aGlzLnBvc2l0aW9uWSkge1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHRoaXMucG9zaXRpb25YLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHRoaXMucG9zaXRpb25ZLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lLCBjdHgpO1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHBvc2l0aW9uWzBdO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHBvc2l0aW9uWzFdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwb3NpdGlvblggPSAwO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy9vcmRlciB2ZXJ5IHZlcnkgaW1wb3J0YW50IDopXHJcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIDAsIDEsIHBvc2l0aW9uWCAtIGFuY2hvclswXSwgcG9zaXRpb25ZIC0gYW5jaG9yWzFdKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCByb3RhdGlvbiwgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRTa2V3KGN0eCwgc2tldywgc2tld0F4aXMsIGFuY2hvclswXSwgYW5jaG9yWzFdKTtcclxuICAgIHRoaXMuc2V0U2NhbGUoY3R4LCBzY2FsZVgsIHNjYWxlWSwgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0Um90YXRpb24gPSBmdW5jdGlvbiAoY3R4LCByYWQsIHgsIHkpIHtcclxuICAgIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcclxuICAgIHZhciBkeCA9IHggLSBjICogeCArIHMgKiB5O1xyXG4gICAgdmFyIGR5ID0geSAtIHMgKiB4IC0gYyAqIHk7XHJcbiAgICBjdHgudHJhbnNmb3JtKGMsIHMsIC1zLCBjLCBkeCwgZHkpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIChjdHgsIHN4LCBzeSwgeCwgeSkge1xyXG4gICAgY3R4LnRyYW5zZm9ybShzeCwgMCwgMCwgc3ksIC14ICogc3ggKyB4LCAteSAqIHN5ICsgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNrZXcgPSBmdW5jdGlvbiAoY3R4LCBza2V3LCBheGlzLCB4LCB5KSB7XHJcbiAgICB2YXIgdCA9IE1hdGgudGFuKC1za2V3KTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCAtYXhpcywgeCwgeSk7XHJcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIHQsIDEsIC15ICogdCwgMCk7XHJcbiAgICB0aGlzLnNldFJvdGF0aW9uKGN0eCwgYXhpcywgeCwgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XHJcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuYW5jaG9yKSB0aGlzLmFuY2hvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5za2V3KSB0aGlzLnNrZXcuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWCkgdGhpcy5zY2FsZVguc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgaWYgKHRoaXMuYW5jaG9yKSB0aGlzLmFuY2hvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5za2V3KSB0aGlzLnNrZXcucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWCkgdGhpcy5zY2FsZVgucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gVHJpbShkYXRhKSB7XHJcblxyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG5cclxuICAgIGlmIChkYXRhLnN0YXJ0KSB0aGlzLnN0YXJ0ID0gZGF0YS5zdGFydC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zdGFydCkgOiBuZXcgUHJvcGVydHkoZGF0YS5zdGFydCk7XHJcbiAgICBpZiAoZGF0YS5lbmQpIHRoaXMuZW5kID0gZGF0YS5lbmQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZW5kKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmVuZCk7XHJcbiAgICAvL2lmIChkYXRhLm9mZnNldCkgdGhpcy5vZmZzZXQgPSBkYXRhLm9mZnNldC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vZmZzZXQpIDogbmV3IFByb3BlcnR5KGRhdGEub2Zmc2V0KTtcclxuXHJcbn1cclxuXHJcblRyaW0ucHJvdG90eXBlLmdldFRyaW0gPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5zdGFydCA/IHRoaXMuc3RhcnQuZ2V0VmFsdWUodGltZSkgOiAwLFxyXG4gICAgICAgIGVuZCA9IHRoaXMuZW5kID8gdGhpcy5lbmQuZ2V0VmFsdWUodGltZSkgOiAxO1xyXG5cclxuICAgIHZhciB0cmltID0ge1xyXG4gICAgICAgIHN0YXJ0OiBNYXRoLm1pbihzdGFydCwgZW5kKSxcclxuICAgICAgICBlbmQgIDogTWF0aC5tYXgoc3RhcnQsIGVuZClcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDAgJiYgdHJpbS5lbmQgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRyaW07XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcblRyaW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydCkgdGhpcy5zdGFydC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5lbmQpIHRoaXMuZW5kLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIC8vaWYgKHRoaXMub2Zmc2V0KSB0aGlzLm9mZnNldC5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmltO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiJdfQ==
