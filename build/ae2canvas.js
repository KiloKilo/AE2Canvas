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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvcnVudGltZS9BRTJDYW52YXMuanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJzcmMvcnVudGltZS9BbmltYXRlZFByb3BlcnR5LmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyLmpzIiwic3JjL3J1bnRpbWUvQmV6aWVyRWFzaW5nLmpzIiwic3JjL3J1bnRpbWUvRWxsaXBzZS5qcyIsInNyYy9ydW50aW1lL0ZpbGwuanMiLCJzcmMvcnVudGltZS9Hcm91cC5qcyIsInNyYy9ydW50aW1lL01lcmdlLmpzIiwic3JjL3J1bnRpbWUvUGF0aC5qcyIsInNyYy9ydW50aW1lL1BvbHlzdGFyLmpzIiwic3JjL3J1bnRpbWUvUG9zaXRpb24uanMiLCJzcmMvcnVudGltZS9Qcm9wZXJ0eS5qcyIsInNyYy9ydW50aW1lL1JlY3QuanMiLCJzcmMvcnVudGltZS9TdHJva2UuanMiLCJzcmMvcnVudGltZS9UcmFuc2Zvcm0uanMiLCJzcmMvcnVudGltZS9UcmltLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEdyb3VwID0gcmVxdWlyZSgnLi9Hcm91cCcpO1xyXG5cclxudmFyIF9hbmltYXRpb25zID0gW10sXHJcbiAgICBfYW5pbWF0aW9uc0xlbmd0aCA9IDA7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRpb24ob3B0aW9ucykge1xyXG4gICAgdGhpcy5kYXRhID0gb3B0aW9ucy5kYXRhIHx8IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aHJvdyAnbm8gZGF0YSc7XHJcbiAgICB9KCk7XHJcblxyXG4gICAgdGhpcy50aGVuID0gMDtcclxuICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICB0aGlzLmR1cmF0aW9uID0gdGhpcy5kYXRhLmR1cmF0aW9uO1xyXG4gICAgdGhpcy50aW1lUmF0aW8gPSB0aGlzLmR1cmF0aW9uIC8gMTAwO1xyXG4gICAgdGhpcy5iYXNlV2lkdGggPSB0aGlzLmRhdGEud2lkdGg7XHJcbiAgICB0aGlzLmJhc2VIZWlnaHQgPSB0aGlzLmRhdGEuaGVpZ2h0O1xyXG4gICAgdGhpcy5yYXRpbyA9IHRoaXMuZGF0YS53aWR0aCAvIHRoaXMuZGF0YS5oZWlnaHQ7XHJcblxyXG4gICAgdGhpcy5tYXJrZXJzID0gdGhpcy5kYXRhLm1hcmtlcnM7XHJcblxyXG4gICAgdGhpcy5jYW52YXMgPSBvcHRpb25zLmNhbnZhcyB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMubG9vcCA9IG9wdGlvbnMubG9vcCB8fCBmYWxzZTtcclxuICAgIHRoaXMuaGQgPSBvcHRpb25zLmhkIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5mbHVpZCA9IG9wdGlvbnMuZmx1aWQgfHwgdHJ1ZTtcclxuICAgIHRoaXMucmV2ZXJzZWQgPSBvcHRpb25zLnJldmVyc2VkIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5vbkNvbXBsZXRlID0gb3B0aW9ucy5vbkNvbXBsZXRlIHx8IGZ1bmN0aW9uICgpIHtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5iYXNlV2lkdGg7XHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmJhc2VIZWlnaHQ7XHJcblxyXG4gICAgdGhpcy5idWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMuYnVmZmVyLndpZHRoID0gdGhpcy5iYXNlV2lkdGg7XHJcbiAgICB0aGlzLmJ1ZmZlci5oZWlnaHQgPSB0aGlzLmJhc2VIZWlnaHQ7XHJcbiAgICB0aGlzLmJ1ZmZlckN0eCA9IHRoaXMuYnVmZmVyLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgdGhpcy5ncm91cHMgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzLnB1c2gobmV3IEdyb3VwKHRoaXMuZGF0YS5ncm91cHNbaV0sIHRoaXMuYnVmZmVyQ3R4LCAwLCB0aGlzLmR1cmF0aW9uKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmdyb3Vwc0xlbmd0aCA9IHRoaXMuZ3JvdXBzLmxlbmd0aDtcclxuXHJcbiAgICB0aGlzLnJlc2V0KHRoaXMucmV2ZXJzZWQpO1xyXG4gICAgdGhpcy5yZXNpemUoKTtcclxuXHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuXHJcbiAgICBfYW5pbWF0aW9ucy5wdXNoKHRoaXMpO1xyXG4gICAgX2FuaW1hdGlvbnNMZW5ndGggPSBfYW5pbWF0aW9ucy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGlvbi5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgcGxheTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2VkVGltZSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZXNldCh0aGlzLnJldmVyc2VkKTtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSB0aGlzLmNvbXBUaW1lO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdvdG9BbmRQbGF5OiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xyXG4gICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wVGltZSA9IG1hcmtlci50aW1lO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdvdG9BbmRTdG9wOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5nZXRNYXJrZXIoaWQpO1xyXG4gICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSBtYXJrZXIudGltZTtcclxuICAgICAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZyYW1lID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE1hcmtlcjogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpZF07XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXJrZXJzW2ldLmNvbW1lbnQgPT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya2Vyc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oJ01hcmtlciBub3QgZm91bmQnKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0U3RlcDogZnVuY3Rpb24gKHN0ZXApIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gc3RlcCAqIHRoaXMudGltZVJhdGlvO1xyXG4gICAgICAgIHRoaXMucGF1c2VkVGltZSA9IHRoaXMuY29tcFRpbWU7XHJcbiAgICAgICAgdGhpcy5zZXRLZXlmcmFtZXModGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRTdGVwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy5jb21wVGltZSAvIHRoaXMudGltZVJhdGlvKTtcclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHZhciBkZWx0YSA9IHRpbWUgLSB0aGlzLnRoZW47XHJcbiAgICAgICAgdGhpcy50aGVuID0gdGltZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuY29tcFRpbWUgLSBkZWx0YSA6IHRoaXMuY29tcFRpbWUgKyBkZWx0YTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBUaW1lID4gdGhpcy5kdXJhdGlvbiB8fCB0aGlzLnJldmVyc2VkICYmIHRoaXMuY29tcFRpbWUgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25Db21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9vcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3KHRoaXMuY29tcFRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRyYXdGcmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdGcmFtZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXcodGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBkcmF3OiBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhc2VXaWR0aCwgdGhpcy5iYXNlSGVpZ2h0KTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZ3JvdXBzTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyh0aGlzLmN0eCwgdGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gMDtcclxuICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuZHVyYXRpb24gOiAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0ucmVzZXQodGhpcy5yZXZlcnNlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXRLZXlmcmFtZXM6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdyb3Vwc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLm9uQ29tcGxldGUgPSBudWxsO1xyXG4gICAgICAgIHZhciBpID0gX2FuaW1hdGlvbnMuaW5kZXhPZih0aGlzKTtcclxuICAgICAgICBpZiAoaSA+IC0xKSB7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgX2FuaW1hdGlvbnNMZW5ndGggPSBfYW5pbWF0aW9ucy5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmNhbnZhcy5wYXJlbnROb2RlKSB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuY2FudmFzKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVzaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZmx1aWQpIHtcclxuICAgICAgICAgICAgdmFyIGZhY3RvciA9IHRoaXMuaGQgPyAyIDogMTtcclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gdGhpcy5jYW52YXMuY2xpZW50V2lkdGggfHwgdGhpcy5iYXNlV2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2lkdGggKiBmYWN0b3I7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHdpZHRoIC8gdGhpcy5yYXRpbyAqIGZhY3RvcjtcclxuICAgICAgICAgICAgdGhpcy5zY2FsZSA9IHdpZHRoIC8gdGhpcy5iYXNlV2lkdGggKiBmYWN0b3I7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnRyYW5zZm9ybSh0aGlzLnNjYWxlLCAwLCAwLCB0aGlzLnNjYWxlLCAwLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0IHJldmVyc2VkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yZXZlcnNlZDtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0IHJldmVyc2VkKGJvb2wpIHtcclxuICAgICAgICB0aGlzLl9yZXZlcnNlZCA9IGJvb2w7XHJcbiAgICAgICAgaWYgKHRoaXMucGF1c2VkVGltZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5wYXVzZWRUaW1lO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBUaW1lID0gdGhpcy5yZXZlcnNlZCA/IHRoaXMuZHVyYXRpb24gOiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldEtleWZyYW1lcyh0aGlzLmNvbXBUaW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgIEFuaW1hdGlvbjogQW5pbWF0aW9uLFxyXG5cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgICAgICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9zb2xlL3R3ZWVuLmpzXHJcbiAgICAgICAgdGltZSA9IHRpbWUgIT09IHVuZGVmaW5lZCA/IHRpbWUgOiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wZXJmb3JtYW5jZSAhPT0gdW5kZWZpbmVkICYmIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgIT09IHVuZGVmaW5lZCA/IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKSA6IERhdGUubm93KCkgKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfYW5pbWF0aW9uc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIF9hbmltYXRpb25zW2ldLnVwZGF0ZSh0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4vQmV6aWVyRWFzaW5nJyk7XHJcblxyXG5mdW5jdGlvbiBBbmltYXRlZFBhdGgoZGF0YSkge1xyXG4gICAgUGF0aC5jYWxsKHRoaXMsIGRhdGEpO1xyXG4gICAgdGhpcy5mcmFtZUNvdW50ID0gdGhpcy5mcmFtZXMubGVuZ3RoO1xyXG59XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXRoLnByb3RvdHlwZSk7XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aGlzLmZpbmlzaGVkICYmIHRpbWUgPj0gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZTtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCAmJiB0aW1lIDw9IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXN0RnJhbWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyICsgMSA9PT0gdGhpcy5mcmFtZUNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lIDwgdGhpcy5sYXN0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyIDwgMikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXItLTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZUF0VGltZSh0aW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIGlmICh0aW1lIDwgdGhpcy5mcmFtZXNbMF0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aW1lID4gdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCkge1xyXG4gICAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMuZnJhbWVDb3VudCAtIDE7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5mcmFtZUNvdW50OyBpKyspIHtcclxuICAgICAgICBpZiAodGltZSA+PSB0aGlzLmZyYW1lc1tpIC0gMV0udCAmJiB0aW1lIDw9IHRoaXMuZnJhbWVzW2ldKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9pbnRlciA9IGk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbaSAtIDFdO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xyXG4gICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuc2V0RWFzaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMubGFzdEZyYW1lLmVhc2VPdXQgJiYgdGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBuZXcgQmV6aWVyRWFzaW5nKHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMF0sIHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMV0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblswXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzFdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAoIHRpbWUgLSB0aGlzLmxhc3RGcmFtZS50ICk7XHJcbiAgICB2YXIgZHVyYXRpb24gPSB0aGlzLm5leHRGcmFtZS50IC0gdGhpcy5sYXN0RnJhbWUudDtcclxuICAgIHZhciBlbGFwc2VkID0gZGVsdGEgLyBkdXJhdGlvbjtcclxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XHJcbiAgICBlbHNlIGlmIChlbGFwc2VkIDwgMCkgZWxhcHNlZCA9IDA7XHJcbiAgICBlbHNlIGlmICh0aGlzLmVhc2luZykgZWxhcHNlZCA9IHRoaXMuZWFzaW5nKGVsYXBzZWQpO1xyXG4gICAgdmFyIGFjdHVhbFZlcnRpY2VzID0gW10sXHJcbiAgICAgICAgYWN0dWFsTGVuZ3RoID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzQ291bnQ7IGkrKykge1xyXG4gICAgICAgIHZhciBjcDF4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMF0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDF5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMV0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMV0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDJ4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMl0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMl0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICBjcDJ5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bM10sIHRoaXMubmV4dEZyYW1lLnZbaV1bM10sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICB4ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bNF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bNF0sIGVsYXBzZWQpLFxyXG4gICAgICAgICAgICB5ID0gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bNV0sIHRoaXMubmV4dEZyYW1lLnZbaV1bNV0sIGVsYXBzZWQpO1xyXG5cclxuICAgICAgICBhY3R1YWxWZXJ0aWNlcy5wdXNoKFtjcDF4LCBjcDF5LCBjcDJ4LCBjcDJ5LCB4LCB5XSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnZlcnRpY2VzQ291bnQgLSAxOyBqKyspIHtcclxuICAgICAgICBhY3R1YWxMZW5ndGgucHVzaCh0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUubGVuW2pdLCB0aGlzLm5leHRGcmFtZS5sZW5bal0sIGVsYXBzZWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHYgIDogYWN0dWFsVmVydGljZXMsXHJcbiAgICAgICAgbGVuOiBhY3R1YWxMZW5ndGhcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5wb2ludGVyID0gcmV2ZXJzZWQgPyB0aGlzLmZyYW1lQ291bnQgLSAxIDogMTtcclxuICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyIC0gMV07XHJcbiAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0ZWRQYXRoO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQmV6aWVyRWFzaW5nID0gcmVxdWlyZSgnLi9CZXppZXJFYXNpbmcnKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkUHJvcGVydHkoZGF0YSkge1xyXG4gICAgUHJvcGVydHkuY2FsbCh0aGlzLCBkYXRhKTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFByb3BlcnR5LnByb3RvdHlwZSk7XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICB2YXIgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFycltpXSA9IGFbaV0gKyB0ICogKGJbaV0gLSBhW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEVhc2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLm5leHRGcmFtZS5lYXNlSW4pIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG5ldyBCZXppZXJFYXNpbmcodGhpcy5sYXN0RnJhbWUuZWFzZU91dFswXSwgdGhpcy5sYXN0RnJhbWUuZWFzZU91dFsxXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzBdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCAmJiB0aW1lID49IHRoaXMubmV4dEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0RnJhbWUudjtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhcnRlZCAmJiB0aW1lIDw9IHRoaXMubGFzdEZyYW1lLnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXN0RnJhbWUudjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRpbWUgPiB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgKyAxID09PSB0aGlzLmZyYW1lQ291bnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludGVyKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRpbWUgPCB0aGlzLmxhc3RGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgPCAyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlci0tO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlmcmFtZUNoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlQXRUaW1lKHRpbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUuc2V0S2V5ZnJhbWVzID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIC8vY29uc29sZS5sb2codGltZSwgdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMl0udCwgdGhpcy5mcmFtZXNbdGhpcy5mcmFtZUNvdW50IC0gMV0udCk7XHJcblxyXG4gICAgaWYgKHRpbWUgPCB0aGlzLmZyYW1lc1swXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRpbWUgPiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lQ291bnQgLSAxXS50KSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVyID0gdGhpcy5mcmFtZUNvdW50IC0gMTtcclxuICAgICAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXIgLSAxXTtcclxuICAgICAgICB0aGlzLm9uS2V5ZnJhbWVDaGFuZ2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmZyYW1lQ291bnQ7IGkrKykge1xyXG4gICAgICAgIGlmICh0aW1lID49IHRoaXMuZnJhbWVzW2kgLSAxXS50ICYmIHRpbWUgPD0gdGhpcy5mcmFtZXNbaV0udCkge1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXIgPSBpO1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW2kgLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5vbktleWZyYW1lQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXRFYXNpbmcoKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldEVsYXBzZWQgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5sYXN0RnJhbWUudCApLFxyXG4gICAgICAgIGR1cmF0aW9uID0gdGhpcy5uZXh0RnJhbWUudCAtIHRoaXMubGFzdEZyYW1lLnQsXHJcbiAgICAgICAgZWxhcHNlZCA9IGRlbHRhIC8gZHVyYXRpb247XHJcblxyXG4gICAgaWYgKGVsYXBzZWQgPiAxKSBlbGFwc2VkID0gMTtcclxuICAgIGVsc2UgaWYgKGVsYXBzZWQgPCAwKSBlbGFwc2VkID0gMDtcclxuICAgIGVsc2UgaWYgKHRoaXMuZWFzaW5nKSBlbGFwc2VkID0gdGhpcy5lYXNpbmcoZWxhcHNlZCk7XHJcbiAgICByZXR1cm4gZWxhcHNlZDtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHJldHVybiB0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudiwgdGhpcy5uZXh0RnJhbWUudiwgdGhpcy5nZXRFbGFwc2VkKHRpbWUpKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMucG9pbnRlciA9IHJldmVyc2VkID8gdGhpcy5mcmFtZUNvdW50IC0gMSA6IDE7XHJcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlciAtIDFdO1xyXG4gICAgdGhpcy5vbktleWZyYW1lQ2hhbmdlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGVkUHJvcGVydHk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gQmV6aWVyKHBhdGgpIHtcclxuICAgIHRoaXMucGF0aCA9IHBhdGg7XHJcbn1cclxuXHJcbkJlemllci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbikge1xyXG4gICAgdGhpcy5zdGVwcyA9IE1hdGguZmxvb3IobGVuIC8gMTApO1xyXG4gICAgdGhpcy5hcmNMZW5ndGhzID0gbmV3IEFycmF5KHRoaXMuc3RlcHMgKyAxKTtcclxuICAgIHRoaXMuYXJjTGVuZ3Roc1swXSA9IDA7XHJcblxyXG4gICAgdmFyIG94ID0gdGhpcy5jdWJpY04oMCwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcclxuICAgICAgICBveSA9IHRoaXMuY3ViaWNOKDAsIHRoaXMucGF0aFsxXSwgdGhpcy5wYXRoWzNdLCB0aGlzLnBhdGhbNV0sIHRoaXMucGF0aFs3XSksXHJcbiAgICAgICAgY2xlbiA9IDAsXHJcbiAgICAgICAgaXRlcmF0b3IgPSAxIC8gdGhpcy5zdGVwcztcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSB0aGlzLnN0ZXBzOyBpICs9IDEpIHtcclxuICAgICAgICB2YXIgeCA9IHRoaXMuY3ViaWNOKGkgKiBpdGVyYXRvciwgdGhpcy5wYXRoWzBdLCB0aGlzLnBhdGhbMl0sIHRoaXMucGF0aFs0XSwgdGhpcy5wYXRoWzZdKSxcclxuICAgICAgICAgICAgeSA9IHRoaXMuY3ViaWNOKGkgKiBpdGVyYXRvciwgdGhpcy5wYXRoWzFdLCB0aGlzLnBhdGhbM10sIHRoaXMucGF0aFs1XSwgdGhpcy5wYXRoWzddKTtcclxuXHJcbiAgICAgICAgdmFyIGR4ID0gb3ggLSB4LFxyXG4gICAgICAgICAgICBkeSA9IG95IC0geTtcclxuXHJcbiAgICAgICAgY2xlbiArPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xyXG4gICAgICAgIHRoaXMuYXJjTGVuZ3Roc1tpXSA9IGNsZW47XHJcblxyXG4gICAgICAgIG94ID0geDtcclxuICAgICAgICBveSA9IHk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5sZW5ndGggPSBjbGVuO1xyXG59O1xyXG5cclxuQmV6aWVyLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAodSkge1xyXG4gICAgdmFyIHRhcmdldExlbmd0aCA9IHUgKiB0aGlzLmFyY0xlbmd0aHNbdGhpcy5zdGVwc107XHJcbiAgICB2YXIgbG93ID0gMCxcclxuICAgICAgICBoaWdoID0gdGhpcy5zdGVwcyxcclxuICAgICAgICBpbmRleCA9IDA7XHJcblxyXG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcclxuICAgICAgICBpbmRleCA9IGxvdyArICgoKGhpZ2ggLSBsb3cpIC8gMikgfCAwKTtcclxuICAgICAgICBpZiAodGhpcy5hcmNMZW5ndGhzW2luZGV4XSA8IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgICAgICBsb3cgPSBpbmRleCArIDE7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGhpZ2ggPSBpbmRleDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5hcmNMZW5ndGhzW2luZGV4XSA+IHRhcmdldExlbmd0aCkge1xyXG4gICAgICAgIGluZGV4LS07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxlbmd0aEJlZm9yZSA9IHRoaXMuYXJjTGVuZ3Roc1tpbmRleF07XHJcbiAgICBpZiAobGVuZ3RoQmVmb3JlID09PSB0YXJnZXRMZW5ndGgpIHtcclxuICAgICAgICByZXR1cm4gaW5kZXggLyB0aGlzLnN0ZXBzO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gKGluZGV4ICsgKHRhcmdldExlbmd0aCAtIGxlbmd0aEJlZm9yZSkgLyAodGhpcy5hcmNMZW5ndGhzW2luZGV4ICsgMV0gLSBsZW5ndGhCZWZvcmUpKSAvIHRoaXMuc3RlcHM7XHJcbiAgICB9XHJcbn07XHJcblxyXG5CZXppZXIucHJvdG90eXBlLmdldFZhbHVlcyA9IGZ1bmN0aW9uIChlbGFwc2VkKSB7XHJcbiAgICB2YXIgdCA9IHRoaXMubWFwKGVsYXBzZWQpLFxyXG4gICAgICAgIHggPSB0aGlzLmN1YmljTih0LCB0aGlzLnBhdGhbMF0sIHRoaXMucGF0aFsyXSwgdGhpcy5wYXRoWzRdLCB0aGlzLnBhdGhbNl0pLFxyXG4gICAgICAgIHkgPSB0aGlzLmN1YmljTih0LCB0aGlzLnBhdGhbMV0sIHRoaXMucGF0aFszXSwgdGhpcy5wYXRoWzVdLCB0aGlzLnBhdGhbN10pO1xyXG5cclxuICAgIHJldHVybiBbeCwgeV07XHJcbn07XHJcblxyXG5CZXppZXIucHJvdG90eXBlLmN1YmljTiA9IGZ1bmN0aW9uIChwY3QsIGEsIGIsIGMsIGQpIHtcclxuICAgIHZhciB0MiA9IHBjdCAqIHBjdDtcclxuICAgIHZhciB0MyA9IHQyICogcGN0O1xyXG4gICAgcmV0dXJuIGEgKyAoLWEgKiAzICsgcGN0ICogKDMgKiBhIC0gYSAqIHBjdCkpICogcGN0XHJcbiAgICAgICAgKyAoMyAqIGIgKyBwY3QgKiAoLTYgKiBiICsgYiAqIDMgKiBwY3QpKSAqIHBjdFxyXG4gICAgICAgICsgKGMgKiAzIC0gYyAqIDMgKiBwY3QpICogdDJcclxuICAgICAgICArIGQgKiB0MztcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmV6aWVyOyIsIi8qKlxyXG4gKiBCZXppZXJFYXNpbmcgLSB1c2UgYmV6aWVyIGN1cnZlIGZvciB0cmFuc2l0aW9uIGVhc2luZyBmdW5jdGlvblxyXG4gKiBpcyBiYXNlZCBvbiBGaXJlZm94J3MgbnNTTUlMS2V5U3BsaW5lLmNwcFxyXG4gKiBVc2FnZTpcclxuICogdmFyIHNwbGluZSA9IEJlemllckVhc2luZygwLjI1LCAwLjEsIDAuMjUsIDEuMClcclxuICogc3BsaW5lKHgpID0+IHJldHVybnMgdGhlIGVhc2luZyB2YWx1ZSB8IHggbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2VcclxuICpcclxuICovXHJcbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xyXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93LmRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB3aW5kb3cuZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIHdpbmRvdy5kZWZpbmUoW10sIGRlZmluaXRpb24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB3aW5kb3cuQmV6aWVyRWFzaW5nID0gZGVmaW5pdGlvbigpO1xyXG4gICAgfVxyXG59KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBUaGVzZSB2YWx1ZXMgYXJlIGVzdGFibGlzaGVkIGJ5IGVtcGlyaWNpc20gd2l0aCB0ZXN0cyAodHJhZGVvZmY6IHBlcmZvcm1hbmNlIFZTIHByZWNpc2lvbilcclxuICAgIHZhciBORVdUT05fSVRFUkFUSU9OUyA9IDQ7XHJcbiAgICB2YXIgTkVXVE9OX01JTl9TTE9QRSA9IDAuMDAxO1xyXG4gICAgdmFyIFNVQkRJVklTSU9OX1BSRUNJU0lPTiA9IDAuMDAwMDAwMTtcclxuICAgIHZhciBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwO1xyXG5cclxuICAgIHZhciBrU3BsaW5lVGFibGVTaXplID0gMTE7XHJcbiAgICB2YXIga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApO1xyXG5cclxuICAgIHZhciBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPSB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSBcImZ1bmN0aW9uXCI7XHJcblxyXG4gICAgZnVuY3Rpb24gQmV6aWVyRWFzaW5nIChtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcclxuXHJcbiAgICAgICAgLy8gVmFsaWRhdGUgYXJndW1lbnRzXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIHJlcXVpcmVzIDQgYXJndW1lbnRzLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPDQ7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSAhPT0gXCJudW1iZXJcIiB8fCBpc05hTihhcmd1bWVudHNbaV0pIHx8ICFpc0Zpbml0ZShhcmd1bWVudHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgYXJndW1lbnRzIHNob3VsZCBiZSBpbnRlZ2Vycy5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1YMSA8IDAgfHwgbVgxID4gMSB8fCBtWDIgPCAwIHx8IG1YMiA+IDEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIHggdmFsdWVzIG11c3QgYmUgaW4gWzAsIDFdIHJhbmdlLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBtU2FtcGxlVmFsdWVzID0gZmxvYXQzMkFycmF5U3VwcG9ydGVkID8gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKSA6IG5ldyBBcnJheShrU3BsaW5lVGFibGVTaXplKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gQSAoYUExLCBhQTIpIHsgcmV0dXJuIDEuMCAtIDMuMCAqIGFBMiArIDMuMCAqIGFBMTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEIgKGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBhQTIgLSA2LjAgKiBhQTE7IH1cclxuICAgICAgICBmdW5jdGlvbiBDIChhQTEpICAgICAgeyByZXR1cm4gMy4wICogYUExOyB9XHJcblxyXG4gICAgICAgIC8vIFJldHVybnMgeCh0KSBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciB5KHQpIGdpdmVuIHQsIHkxLCBhbmQgeTIuXHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY0JlemllciAoYVQsIGFBMSwgYUEyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoKEEoYUExLCBhQTIpKmFUICsgQihhQTEsIGFBMikpKmFUICsgQyhhQTEpKSphVDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJldHVybnMgZHgvZHQgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgZHkvZHQgZ2l2ZW4gdCwgeTEsIGFuZCB5Mi5cclxuICAgICAgICBmdW5jdGlvbiBnZXRTbG9wZSAoYVQsIGFBMSwgYUEyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAzLjAgKiBBKGFBMSwgYUEyKSphVCphVCArIDIuMCAqIEIoYUExLCBhQTIpICogYVQgKyBDKGFBMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBuZXd0b25SYXBoc29uSXRlcmF0ZSAoYVgsIGFHdWVzc1QpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBORVdUT05fSVRFUkFUSU9OUzsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSByZXR1cm4gYUd1ZXNzVDtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XHJcbiAgICAgICAgICAgICAgICBhR3Vlc3NUIC09IGN1cnJlbnRYIC8gY3VycmVudFNsb3BlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhR3Vlc3NUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY1NhbXBsZVZhbHVlcyAoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBtU2FtcGxlVmFsdWVzW2ldID0gY2FsY0JlemllcihpICoga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZSAoYVgsIGFBLCBhQikge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFgsIGN1cnJlbnRULCBpID0gMDtcclxuICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDIuMDtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFggPiAwLjApIHtcclxuICAgICAgICAgICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhQSA9IGN1cnJlbnRUO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IHdoaWxlIChNYXRoLmFicyhjdXJyZW50WCkgPiBTVUJESVZJU0lPTl9QUkVDSVNJT04gJiYgKytpIDwgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMpO1xyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRURm9yWCAoYVgpIHtcclxuICAgICAgICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwLjA7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50U2FtcGxlID0gMTtcclxuICAgICAgICAgICAgdmFyIGxhc3RTYW1wbGUgPSBrU3BsaW5lVGFibGVTaXplIC0gMTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9IGxhc3RTYW1wbGUgJiYgbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgKytjdXJyZW50U2FtcGxlKSB7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnZhbFN0YXJ0ICs9IGtTYW1wbGVTdGVwU2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAtLWN1cnJlbnRTYW1wbGU7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0byBwcm92aWRlIGFuIGluaXRpYWwgZ3Vlc3MgZm9yIHRcclxuICAgICAgICAgICAgdmFyIGRpc3QgPSAoYVggLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSAvIChtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUrMV0gLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKTtcclxuICAgICAgICAgICAgdmFyIGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplO1xyXG5cclxuICAgICAgICAgICAgdmFyIGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbFNsb3BlID49IE5FV1RPTl9NSU5fU0xPUEUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JUKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT0gMC4wKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ3Vlc3NGb3JUO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtWDEgIT0gbVkxIHx8IG1YMiAhPSBtWTIpXHJcbiAgICAgICAgICAgIGNhbGNTYW1wbGVWYWx1ZXMoKTtcclxuXHJcbiAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoYVgpIHtcclxuICAgICAgICAgICAgaWYgKG1YMSA9PT0gbVkxICYmIG1YMiA9PT0gbVkyKSByZXR1cm4gYVg7IC8vIGxpbmVhclxyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIEphdmFTY3JpcHQgbnVtYmVyIGFyZSBpbXByZWNpc2UsIHdlIHNob3VsZCBndWFyYW50ZWUgdGhlIGV4dHJlbWVzIGFyZSByaWdodC5cclxuICAgICAgICAgICAgaWYgKGFYID09PSAwKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgaWYgKGFYID09PSAxKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbGNCZXppZXIoZ2V0VEZvclgoYVgpLCBtWTEsIG1ZMik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc3RyID0gXCJCZXppZXJFYXNpbmcoXCIrW21YMSwgbVkxLCBtWDIsIG1ZMl0rXCIpXCI7XHJcbiAgICAgICAgZi50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0cjsgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGY7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ1NTIG1hcHBpbmdcclxuICAgIEJlemllckVhc2luZy5jc3MgPSB7XHJcbiAgICAgICAgXCJlYXNlXCI6ICAgICAgICBCZXppZXJFYXNpbmcoMC4yNSwgMC4xLCAwLjI1LCAxLjApLFxyXG4gICAgICAgIFwibGluZWFyXCI6ICAgICAgQmV6aWVyRWFzaW5nKDAuMDAsIDAuMCwgMS4wMCwgMS4wKSxcclxuICAgICAgICBcImVhc2UtaW5cIjogICAgIEJlemllckVhc2luZygwLjQyLCAwLjAsIDEuMDAsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLW91dFwiOiAgICBCZXppZXJFYXNpbmcoMC4wMCwgMC4wLCAwLjU4LCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1pbi1vdXRcIjogQmV6aWVyRWFzaW5nKDAuNDIsIDAuMCwgMC41OCwgMS4wKVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQmV6aWVyRWFzaW5nO1xyXG59KSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gRWxsaXBzZShkYXRhKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5zaXplID0gZGF0YS5zaXplLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNpemUpIDogbmV3IFByb3BlcnR5KGRhdGEuc2l6ZSk7XHJcbiAgICAvL29wdGlvbmFsXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbiA9IGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG59XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUsIHRyaW0pIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gPyB0aGlzLnBvc2l0aW9uLmdldFZhbHVlKHRpbWUpIDogWzAsIDBdO1xyXG5cclxuICAgIHZhciBpLCBqO1xyXG5cclxuICAgIHZhciB3ID0gc2l6ZVswXSAvIDIsXHJcbiAgICAgICAgaCA9IHNpemVbMV0gLyAyLFxyXG4gICAgICAgIHggPSBwb3NpdGlvblswXSAtIHcsXHJcbiAgICAgICAgeSA9IHBvc2l0aW9uWzFdIC0gaCxcclxuICAgICAgICBvdyA9IHcgKiAuNTUyMjg0OCxcclxuICAgICAgICBvaCA9IGggKiAuNTUyMjg0ODtcclxuXHJcbiAgICB2YXIgdmVydGljZXMgPSBbXHJcbiAgICAgICAgW3ggKyB3ICsgb3csIHksIHggKyB3IC0gb3csIHksIHggKyB3LCB5XSxcclxuICAgICAgICBbeCArIHcgKyB3LCB5ICsgaCArIG9oLCB4ICsgdyArIHcsIHkgKyBoIC0gb2gsIHggKyB3ICsgdywgeSArIGhdLFxyXG4gICAgICAgIFt4ICsgdyAtIG93LCB5ICsgaCArIGgsIHggKyB3ICsgb3csIHkgKyBoICsgaCwgeCArIHcsIHkgKyBoICsgaF0sXHJcbiAgICAgICAgW3gsIHkgKyBoIC0gb2gsIHgsIHkgKyBoICsgb2gsIHgsIHkgKyBoXVxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAodHJpbSkge1xyXG4gICAgICAgIHZhciB0dixcclxuICAgICAgICAgICAgbGVuID0gdyArIGg7XHJcblxyXG4gICAgICAgIHRyaW0gPSB0aGlzLmdldFRyaW1WYWx1ZXModHJpbSk7XHJcblxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICBpZiAoaiA+IDMpIGogPSAwO1xyXG4gICAgICAgICAgICBpZiAoaSA+IHRyaW0uc3RhcnRJbmRleCAmJiBpIDwgdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odmVydGljZXNbaV1bMF0sIHZlcnRpY2VzW2ldWzFdLCB2ZXJ0aWNlc1tqXVsyXSwgdmVydGljZXNbal1bM10sIHZlcnRpY2VzW2pdWzRdLCB2ZXJ0aWNlc1tqXVs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5zdGFydEluZGV4ICYmIGkgPT09IHRyaW0uZW5kSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKHZlcnRpY2VzW2ldLCB2ZXJ0aWNlc1tqXSwgdHJpbS5zdGFydCwgdHJpbS5lbmQsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5zdGFydEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbSh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbal0sIHRyaW0uc3RhcnQsIDEsIGxlbik7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHR2LnN0YXJ0WzRdLCB0di5zdGFydFs1XSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh0di5zdGFydFswXSwgdHYuc3RhcnRbMV0sIHR2LmVuZFsyXSwgdHYuZW5kWzNdLCB0di5lbmRbNF0sIHR2LmVuZFs1XSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gdHJpbS5lbmRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0odmVydGljZXNbaV0sIHZlcnRpY2VzW2pdLCAwLCB0cmltLmVuZCwgbGVuKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyh2ZXJ0aWNlc1swXVs0XSwgdmVydGljZXNbMF1bNV0pO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICBpZiAoaiA+IDMpIGogPSAwO1xyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2ZXJ0aWNlc1tpXVswXSwgdmVydGljZXNbaV1bMV0sIHZlcnRpY2VzW2pdWzJdLCB2ZXJ0aWNlc1tqXVszXSwgdmVydGljZXNbal1bNF0sIHZlcnRpY2VzW2pdWzVdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5nZXRUcmltVmFsdWVzID0gZnVuY3Rpb24gKHRyaW0pIHtcclxuICAgIHZhciBzdGFydEluZGV4ID0gTWF0aC5mbG9vcih0cmltLnN0YXJ0ICogNCksXHJcbiAgICAgICAgZW5kSW5kZXggPSBNYXRoLmZsb29yKHRyaW0uZW5kICogNCksXHJcbiAgICAgICAgc3RhcnQgPSAodHJpbS5zdGFydCAtIHN0YXJ0SW5kZXggKiAwLjI1KSAqIDQsXHJcbiAgICAgICAgZW5kID0gKHRyaW0uZW5kIC0gZW5kSW5kZXggKiAwLjI1KSAqIDQ7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGFydEluZGV4OiBzdGFydEluZGV4LFxyXG4gICAgICAgIGVuZEluZGV4ICA6IGVuZEluZGV4LFxyXG4gICAgICAgIHN0YXJ0ICAgICA6IHN0YXJ0LFxyXG4gICAgICAgIGVuZCAgICAgICA6IGVuZFxyXG4gICAgfTtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnNpemUuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuRWxsaXBzZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuc2l6ZS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVsbGlwc2U7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gRmlsbChkYXRhKSB7XHJcbiAgICB0aGlzLmNvbG9yID0gZGF0YS5jb2xvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5jb2xvcikgOiBuZXcgUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuRmlsbC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5vcGFjaXR5ID8gdGhpcy5vcGFjaXR5LmdldFZhbHVlKHRpbWUpIDogMTtcclxuICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChjb2xvclswXSkgKyAnLCAnICsgTWF0aC5yb3VuZChjb2xvclsxXSkgKyAnLCAnICsgTWF0aC5yb3VuZChjb2xvclsyXSkgKyAnLCAnICsgb3BhY2l0eSArICcpJztcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnNldENvbG9yID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcjtcclxufTtcclxuXHJcbkZpbGwucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLmNvbG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm9wYWNpdHkpIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgdGhpcy5jb2xvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGaWxsOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTdHJva2UgPSByZXF1aXJlKCcuL1N0cm9rZScpLFxyXG4gICAgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpLFxyXG4gICAgRWxsaXBzZSA9IHJlcXVpcmUoJy4vRWxsaXBzZScpLFxyXG4gICAgUG9seXN0YXIgPSByZXF1aXJlKCcuL1BvbHlzdGFyJyksXHJcbiAgICBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpLFxyXG4gICAgRmlsbCA9IHJlcXVpcmUoJy4vRmlsbCcpLFxyXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcclxuICAgIE1lcmdlID0gcmVxdWlyZSgnLi9NZXJnZScpLFxyXG4gICAgVHJpbSA9IHJlcXVpcmUoJy4vVHJpbScpO1xyXG5cclxuZnVuY3Rpb24gR3JvdXAoZGF0YSwgYnVmZmVyQ3R4LCBwYXJlbnRJbiwgcGFyZW50T3V0KSB7XHJcblxyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5pbiA9IGRhdGEuaW4gPyBkYXRhLmluIDogcGFyZW50SW47XHJcbiAgICB0aGlzLm91dCA9IGRhdGEub3V0ID8gZGF0YS5vdXQgOiBwYXJlbnRPdXQ7XHJcblxyXG4gICAgaWYgKGRhdGEuZmlsbCkgdGhpcy5maWxsID0gbmV3IEZpbGwoZGF0YS5maWxsKTtcclxuICAgIGlmIChkYXRhLnN0cm9rZSkgdGhpcy5zdHJva2UgPSBuZXcgU3Ryb2tlKGRhdGEuc3Ryb2tlKTtcclxuICAgIGlmIChkYXRhLnRyaW0pIHRoaXMudHJpbSA9IG5ldyBUcmltKGRhdGEudHJpbSk7XHJcbiAgICBpZiAoZGF0YS5tZXJnZSkgdGhpcy5tZXJnZSA9IG5ldyBNZXJnZShkYXRhLm1lcmdlKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0oZGF0YS50cmFuc2Zvcm0pO1xyXG4gICAgdGhpcy5idWZmZXJDdHggPSBidWZmZXJDdHg7XHJcblxyXG4gICAgaWYgKGRhdGEuZ3JvdXBzKSB7XHJcbiAgICAgICAgdGhpcy5ncm91cHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzLnB1c2gobmV3IEdyb3VwKGRhdGEuZ3JvdXBzW2ldLCB0aGlzLmJ1ZmZlckN0eCwgdGhpcy5pbiwgdGhpcy5vdXQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9cclxuICAgIGlmIChkYXRhLnNoYXBlcykge1xyXG4gICAgICAgIHRoaXMuc2hhcGVzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkYXRhLnNoYXBlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB2YXIgc2hhcGUgPSBkYXRhLnNoYXBlc1tqXTtcclxuICAgICAgICAgICAgaWYgKHNoYXBlLnR5cGUgPT09ICdwYXRoJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlLmlzQW5pbWF0ZWQpIHRoaXMuc2hhcGVzLnB1c2gobmV3IEFuaW1hdGVkUGF0aChzaGFwZSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzLnNoYXBlcy5wdXNoKG5ldyBQYXRoKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3JlY3QnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBSZWN0KHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2VsbGlwc2UnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBFbGxpcHNlKHNoYXBlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3BvbHlzdGFyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXMucHVzaChuZXcgUG9seXN0YXIoc2hhcGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuR3JvdXAucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCBwYXJlbnRGaWxsLCBwYXJlbnRTdHJva2UsIHBhcmVudFRyaW0pIHtcclxuXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG5cclxuICAgIC8vVE9ETyBjaGVjayBpZiBjb2xvci9zdHJva2UgaXMgY2hhbmdpbmcgb3ZlciB0aW1lXHJcbiAgICB2YXIgZmlsbCA9IHRoaXMuZmlsbCB8fCBwYXJlbnRGaWxsO1xyXG4gICAgdmFyIHN0cm9rZSA9IHRoaXMuc3Ryb2tlIHx8IHBhcmVudFN0cm9rZTtcclxuICAgIHZhciB0cmltVmFsdWVzID0gdGhpcy50cmltID8gdGhpcy50cmltLmdldFRyaW0odGltZSkgOiBwYXJlbnRUcmltO1xyXG5cclxuICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKGN0eCwgdGltZSk7XHJcbiAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKGN0eCwgdGltZSk7XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKGN0eCwgdGltZSk7XHJcblxyXG4gICAgaWYgKHRoaXMubWVyZ2UpIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlckN0eC5zYXZlKCk7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuYnVmZmVyQ3R4LmNhbnZhcy53aWR0aCwgdGhpcy5idWZmZXJDdHguY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgdGhpcy50cmFuc2Zvcm0udHJhbnNmb3JtKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuXHJcbiAgICAgICAgaWYgKGZpbGwpIGZpbGwuc2V0Q29sb3IodGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG4gICAgICAgIGlmIChzdHJva2UpIHN0cm9rZS5zZXRTdHJva2UodGhpcy5idWZmZXJDdHgsIHRpbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgIGlmICh0aGlzLnNoYXBlcykge1xyXG4gICAgICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLmRyYXcodGhpcy5idWZmZXJDdHgsIHRpbWUsIHRyaW1WYWx1ZXMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlsbCkgdGhpcy5idWZmZXJDdHguZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0cm9rZSkgdGhpcy5idWZmZXJDdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubWVyZ2Uuc2V0Q29tcG9zaXRlT3BlcmF0aW9uKHRoaXMuYnVmZmVyQ3R4KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmJ1ZmZlckN0eC5jYW52YXMsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0uZHJhdyhjdHgsIHRpbWUsIHRyaW1WYWx1ZXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNoYXBlc1t0aGlzLnNoYXBlcy5sZW5ndGggLSAxXS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vVE9ETyBnZXQgb3JkZXJcclxuICAgIGlmIChmaWxsKSBjdHguZmlsbCgpO1xyXG4gICAgaWYgKHN0cm9rZSkgY3R4LnN0cm9rZSgpO1xyXG5cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lID49IHRoaXMuZ3JvdXBzW2ldLmluICYmIHRpbWUgPCB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lLCBmaWxsLCBzdHJva2UsIHRyaW1WYWx1ZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVyZ2Uuc2V0Q29tcG9zaXRlT3BlcmF0aW9uKHRoaXMuYnVmZmVyQ3R4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuYnVmZmVyQ3R4LmNhbnZhcywgMCwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LnJlc3RvcmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPj0gdGhpcy5ncm91cHNbaV0uaW4gJiYgdGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2ldLmRyYXcoY3R4LCB0aW1lLCBmaWxsLCBzdHJva2UsIHRyaW1WYWx1ZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcbkdyb3VwLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG5cclxuICAgIGlmICh0aGlzLnNoYXBlcykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZXNbaV0uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmdyb3Vwcykge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNbal0uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5maWxsKSB0aGlzLmZpbGwuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc3Ryb2tlKSB0aGlzLnN0cm9rZS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy50cmltKSB0aGlzLnRyaW0ucmVzZXQodGltZSk7XHJcbn07XHJcblxyXG5Hcm91cC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMudHJhbnNmb3JtLnJlc2V0KHJldmVyc2VkKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5ncm91cHMpIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzW2pdLnJlc2V0KHJldmVyc2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5maWxsKSB0aGlzLmZpbGwucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc3Ryb2tlKSB0aGlzLnN0cm9rZS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy50cmltKSB0aGlzLnRyaW0ucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHcm91cDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIE1lcmdlKGRhdGEpIHtcclxuICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZTtcclxufVxyXG5cclxuTWVyZ2UucHJvdG90eXBlLnNldENvbXBvc2l0ZU9wZXJhdGlvbiA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdXQnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWluJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3hvcic7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXJnZTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCZXppZXIgPSByZXF1aXJlKCcuL0JlemllcicpO1xyXG5cclxuZnVuY3Rpb24gUGF0aChkYXRhKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IGRhdGEuY2xvc2VkO1xyXG4gICAgdGhpcy5mcmFtZXMgPSBkYXRhLmZyYW1lcztcclxuICAgIHRoaXMudmVydGljZXNDb3VudCA9IHRoaXMuZnJhbWVzWzBdLnYubGVuZ3RoO1xyXG59XHJcblxyXG5QYXRoLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgdHJpbSkge1xyXG4gICAgdmFyIGZyYW1lID0gdGhpcy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICB2ZXJ0aWNlcyA9IGZyYW1lLnY7XHJcblxyXG4gICAgaWYgKHRyaW0pIHtcclxuICAgICAgICB0cmltID0gdGhpcy5nZXRUcmltVmFsdWVzKHRyaW0sIGZyYW1lKTtcclxuICAgICAgICBpZiAodHJpbS5zdGFydCA9PT0gMCAmJiB0cmltLmVuZCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGogPSAxOyBqIDwgdmVydGljZXMubGVuZ3RoOyBqKyspIHtcclxuXHJcbiAgICAgICAgdmFyIG5leHRWZXJ0ZXggPSB2ZXJ0aWNlc1tqXSxcclxuICAgICAgICAgICAgbGFzdFZlcnRleCA9IHZlcnRpY2VzW2ogLSAxXTtcclxuXHJcbiAgICAgICAgaWYgKHRyaW0pIHtcclxuICAgICAgICAgICAgdmFyIHR2O1xyXG5cclxuICAgICAgICAgICAgaWYgKGogPT09IDEgJiYgdHJpbS5zdGFydEluZGV4ICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGogPT09IHRyaW0uc3RhcnRJbmRleCArIDEgJiYgaiA9PT0gdHJpbS5lbmRJbmRleCArIDEpIHtcclxuICAgICAgICAgICAgICAgIHR2ID0gdGhpcy50cmltKGxhc3RWZXJ0ZXgsIG5leHRWZXJ0ZXgsIHRyaW0uc3RhcnQsIHRyaW0uZW5kLCBmcmFtZS5sZW5baiAtIDFdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChqID09PSB0cmltLnN0YXJ0SW5kZXggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICB0diA9IHRoaXMudHJpbShsYXN0VmVydGV4LCBuZXh0VmVydGV4LCB0cmltLnN0YXJ0LCAxLCBmcmFtZS5sZW5baiAtIDFdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odHYuc3RhcnRbNF0sIHR2LnN0YXJ0WzVdKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHR2LnN0YXJ0WzBdLCB0di5zdGFydFsxXSwgdHYuZW5kWzJdLCB0di5lbmRbM10sIHR2LmVuZFs0XSwgdHYuZW5kWzVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChqID09PSB0cmltLmVuZEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgdHYgPSB0aGlzLnRyaW0obGFzdFZlcnRleCwgbmV4dFZlcnRleCwgMCwgdHJpbS5lbmQsIGZyYW1lLmxlbltqIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odHYuc3RhcnRbMF0sIHR2LnN0YXJ0WzFdLCB0di5lbmRbMl0sIHR2LmVuZFszXSwgdHYuZW5kWzRdLCB0di5lbmRbNV0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogPiB0cmltLnN0YXJ0SW5kZXggKyAxICYmIGogPCB0cmltLmVuZEluZGV4ICsgMSkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8obGFzdFZlcnRleFswXSwgbGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFsyXSwgbmV4dFZlcnRleFszXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoaiA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0cmltICYmIHRoaXMuY2xvc2VkKSB7XHJcbiAgICAgICAgY3R4LmJlemllckN1cnZlVG8obmV4dFZlcnRleFswXSwgbmV4dFZlcnRleFsxXSwgdmVydGljZXNbMF1bMl0sIHZlcnRpY2VzWzBdWzNdLCB2ZXJ0aWNlc1swXVs0XSwgdmVydGljZXNbMF1bNV0pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcmFtZXNbMF07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5nZXRUcmltVmFsdWVzID0gZnVuY3Rpb24gKHRyaW0sIGZyYW1lKSB7XHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICB2YXIgYWN0dWFsVHJpbSA9IHtcclxuICAgICAgICBzdGFydEluZGV4OiAwLFxyXG4gICAgICAgIGVuZEluZGV4ICA6IDAsXHJcbiAgICAgICAgc3RhcnQgICAgIDogMCxcclxuICAgICAgICBlbmQgICAgICAgOiAwXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0cmltLnN0YXJ0ID09PSAwKSB7XHJcbiAgICAgICAgaWYgKHRyaW0uZW5kID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHJpbS5lbmQgPT09IDEpIHtcclxuICAgICAgICAgICAgYWN0dWFsVHJpbS5lbmRJbmRleCA9IGZyYW1lLmxlbi5sZW5ndGg7XHJcbiAgICAgICAgICAgIHJldHVybiBhY3R1YWxUcmltO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdG90YWxMZW4gPSB0aGlzLnN1bUFycmF5KGZyYW1lLmxlbiksXHJcbiAgICAgICAgdHJpbUF0TGVuO1xyXG5cclxuICAgIHRyaW1BdExlbiA9IHRvdGFsTGVuICogdHJpbS5zdGFydDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRyaW1BdExlbiA+IDAgJiYgdHJpbUF0TGVuIDwgZnJhbWUubGVuW2ldKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uc3RhcnQgPSB0cmltQXRMZW4gLyBmcmFtZS5sZW5baV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW1BdExlbiAtPSBmcmFtZS5sZW5baV07XHJcbiAgICB9XHJcblxyXG4gICAgdHJpbUF0TGVuID0gdG90YWxMZW4gKiB0cmltLmVuZDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgZnJhbWUubGVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRyaW1BdExlbiA+IDAgJiYgdHJpbUF0TGVuIDwgZnJhbWUubGVuW2ldKSB7XHJcbiAgICAgICAgICAgIGFjdHVhbFRyaW0uZW5kSW5kZXggPSBpO1xyXG4gICAgICAgICAgICBhY3R1YWxUcmltLmVuZCA9IHRyaW1BdExlbiAvIGZyYW1lLmxlbltpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdHJpbUF0TGVuIC09IGZyYW1lLmxlbltpXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWN0dWFsVHJpbTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnRyaW0gPSBmdW5jdGlvbiAobGFzdFZlcnRleCwgbmV4dFZlcnRleCwgZnJvbSwgdG8sIGxlbikge1xyXG5cclxuICAgIGlmIChmcm9tID09PSAwICYmIHRvID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhcnQ6IGxhc3RWZXJ0ZXgsXHJcbiAgICAgICAgICAgIGVuZCAgOiBuZXh0VmVydGV4XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5pc1N0cmFpZ2h0KGxhc3RWZXJ0ZXhbNF0sIGxhc3RWZXJ0ZXhbNV0sIGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pKSB7XHJcbiAgICAgICAgc3RhcnRWZXJ0ZXggPSBbXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzBdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMV0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFsyXSwgbmV4dFZlcnRleFsyXSwgZnJvbSksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzNdLCBuZXh0VmVydGV4WzNdLCBmcm9tKSxcclxuICAgICAgICAgICAgdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNF0sIGZyb20pLFxyXG4gICAgICAgICAgICB0aGlzLmxlcnAobGFzdFZlcnRleFs1XSwgbmV4dFZlcnRleFs1XSwgZnJvbSlcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBlbmRWZXJ0ZXggPSBbXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzBdLCBuZXh0VmVydGV4WzBdLCB0byksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzFdLCB0byksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzJdLCBuZXh0VmVydGV4WzJdLCB0byksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzNdLCBuZXh0VmVydGV4WzNdLCB0byksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzRdLCBuZXh0VmVydGV4WzRdLCB0byksXHJcbiAgICAgICAgICAgIHRoaXMubGVycChsYXN0VmVydGV4WzVdLCBuZXh0VmVydGV4WzVdLCB0bylcclxuICAgICAgICBdO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5iZXppZXIgPSBuZXcgQmV6aWVyKFtsYXN0VmVydGV4WzRdLCBsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCBuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzNdLCBuZXh0VmVydGV4WzRdLCBuZXh0VmVydGV4WzVdXSk7XHJcbiAgICAgICAgdGhpcy5iZXppZXIuZ2V0TGVuZ3RoKGxlbik7XHJcbiAgICAgICAgZnJvbSA9IHRoaXMuYmV6aWVyLm1hcChmcm9tKTtcclxuICAgICAgICB0byA9IHRoaXMuYmV6aWVyLm1hcCh0byk7XHJcblxyXG4gICAgICAgIHZhciBlMSwgZjEsIGcxLCBoMSwgajEsIGsxLFxyXG4gICAgICAgICAgICBlMiwgZjIsIGcyLCBoMiwgajIsIGsyLFxyXG4gICAgICAgICAgICBzdGFydFZlcnRleCxcclxuICAgICAgICAgICAgZW5kVmVydGV4O1xyXG5cclxuICAgICAgICBlMSA9IFt0aGlzLmxlcnAobGFzdFZlcnRleFs0XSwgbGFzdFZlcnRleFswXSwgZnJvbSksIHRoaXMubGVycChsYXN0VmVydGV4WzVdLCBsYXN0VmVydGV4WzFdLCBmcm9tKV07XHJcbiAgICAgICAgZjEgPSBbdGhpcy5sZXJwKGxhc3RWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMl0sIGZyb20pLCB0aGlzLmxlcnAobGFzdFZlcnRleFsxXSwgbmV4dFZlcnRleFszXSwgZnJvbSldO1xyXG4gICAgICAgIGcxID0gW3RoaXMubGVycChuZXh0VmVydGV4WzJdLCBuZXh0VmVydGV4WzRdLCBmcm9tKSwgdGhpcy5sZXJwKG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNV0sIGZyb20pXTtcclxuICAgICAgICBoMSA9IFt0aGlzLmxlcnAoZTFbMF0sIGYxWzBdLCBmcm9tKSwgdGhpcy5sZXJwKGUxWzFdLCBmMVsxXSwgZnJvbSldO1xyXG4gICAgICAgIGoxID0gW3RoaXMubGVycChmMVswXSwgZzFbMF0sIGZyb20pLCB0aGlzLmxlcnAoZjFbMV0sIGcxWzFdLCBmcm9tKV07XHJcbiAgICAgICAgazEgPSBbdGhpcy5sZXJwKGgxWzBdLCBqMVswXSwgZnJvbSksIHRoaXMubGVycChoMVsxXSwgajFbMV0sIGZyb20pXTtcclxuXHJcbiAgICAgICAgc3RhcnRWZXJ0ZXggPSBbajFbMF0sIGoxWzFdLCBoMVswXSwgaDFbMV0sIGsxWzBdLCBrMVsxXV07XHJcbiAgICAgICAgZW5kVmVydGV4ID0gW25leHRWZXJ0ZXhbMF0sIG5leHRWZXJ0ZXhbMV0sIGcxWzBdLCBnMVsxXSwgbmV4dFZlcnRleFs0XSwgbmV4dFZlcnRleFs1XV07XHJcblxyXG4gICAgICAgIGUyID0gW3RoaXMubGVycChzdGFydFZlcnRleFs0XSwgc3RhcnRWZXJ0ZXhbMF0sIHRvKSwgdGhpcy5sZXJwKHN0YXJ0VmVydGV4WzVdLCBzdGFydFZlcnRleFsxXSwgdG8pXTtcclxuICAgICAgICBmMiA9IFt0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbMF0sIGVuZFZlcnRleFsyXSwgdG8pLCB0aGlzLmxlcnAoc3RhcnRWZXJ0ZXhbMV0sIGVuZFZlcnRleFszXSwgdG8pXTtcclxuICAgICAgICBnMiA9IFt0aGlzLmxlcnAoZW5kVmVydGV4WzJdLCBlbmRWZXJ0ZXhbNF0sIHRvKSwgdGhpcy5sZXJwKGVuZFZlcnRleFszXSwgZW5kVmVydGV4WzVdLCB0byldO1xyXG4gICAgICAgIGgyID0gW3RoaXMubGVycChlMlswXSwgZjJbMF0sIHRvKSwgdGhpcy5sZXJwKGUyWzFdLCBmMlsxXSwgdG8pXTtcclxuICAgICAgICBqMiA9IFt0aGlzLmxlcnAoZjJbMF0sIGcyWzBdLCB0byksIHRoaXMubGVycChmMlsxXSwgZzJbMV0sIHRvKV07XHJcbiAgICAgICAgazIgPSBbdGhpcy5sZXJwKGgyWzBdLCBqMlswXSwgdG8pLCB0aGlzLmxlcnAoaDJbMV0sIGoyWzFdLCB0byldO1xyXG5cclxuICAgICAgICBzdGFydFZlcnRleCA9IFtlMlswXSwgZTJbMV0sIHN0YXJ0VmVydGV4WzJdLCBzdGFydFZlcnRleFszXSwgc3RhcnRWZXJ0ZXhbNF0sIHN0YXJ0VmVydGV4WzVdXTtcclxuICAgICAgICBlbmRWZXJ0ZXggPSBbajJbMF0sIGoyWzFdLCBoMlswXSwgaDJbMV0sIGsyWzBdLCBrMlsxXV07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhcnQ6IHN0YXJ0VmVydGV4LFxyXG4gICAgICAgIGVuZCAgOiBlbmRWZXJ0ZXhcclxuICAgIH07XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIHZhciBzID0gMSAtIHQ7XHJcbiAgICByZXR1cm4gYSAqIHMgKyBiICogdDtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLnN1bUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xyXG4gICAgZnVuY3Rpb24gYWRkKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gYSArIGI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoYWRkKTtcclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmlzU3RyYWlnaHQgPSBmdW5jdGlvbiAoc3RhcnRYLCBzdGFydFksIGN0cmwxWCwgY3RybDFZLCBjdHJsMlgsIGN0cmwyWSwgZW5kWCwgZW5kWSkge1xyXG4gICAgcmV0dXJuIHN0YXJ0WCA9PT0gY3RybDFYICYmIHN0YXJ0WSA9PT0gY3RybDFZICYmIGVuZFggPT09IGN0cmwyWCAmJiBlbmRZID09PSBjdHJsMlk7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG59O1xyXG5cclxuUGF0aC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9seXN0YXIoZGF0YSkge1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlOyAvLyBUT0RPID8/XHJcblxyXG4gICAgdGhpcy5zdGFyVHlwZSA9IGRhdGEuc3RhclR5cGU7XHJcbiAgICB0aGlzLnBvaW50cyA9IGRhdGEucG9pbnRzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvaW50cykgOiBuZXcgUHJvcGVydHkoZGF0YS5wb2ludHMpO1xyXG4gICAgdGhpcy5pbm5lclJhZGl1cyA9IGRhdGEuaW5uZXJSYWRpdXMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSYWRpdXMpIDogbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSYWRpdXMpO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cyA9IGRhdGEub3V0ZXJSYWRpdXMubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3V0ZXJSYWRpdXMpIDogbmV3IFByb3BlcnR5KGRhdGEub3V0ZXJSYWRpdXMpO1xyXG5cclxuICAgIC8vb3B0aW5hbHNcclxuICAgIGlmIChkYXRhLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uID0gZGF0YS5wb3NpdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbiA9IGRhdGEucm90YXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm90YXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucm90YXRpb24pO1xyXG4gICAgaWYgKGRhdGEuaW5uZXJSb3VuZG5lc3MpIHRoaXMuaW5uZXJSb3VuZG5lc3MgPSBkYXRhLmlubmVyUm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLmlubmVyUm91bmRuZXNzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmlubmVyUm91bmRuZXNzKTtcclxuICAgIGlmIChkYXRhLm91dGVyUm91bmRuZXNzKSB0aGlzLm91dGVyUm91bmRuZXNzID0gZGF0YS5vdXRlclJvdW5kbmVzcy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vdXRlclJvdW5kbmVzcykgOiBuZXcgUHJvcGVydHkoZGF0YS5vdXRlclJvdW5kbmVzcyk7XHJcbn1cclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIHZhciBwb2ludHMgPSB0aGlzLnBvaW50cy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBpbm5lclJhZGl1cyA9IHRoaXMuaW5uZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgb3V0ZXJSYWRpdXMgPSB0aGlzLm91dGVyUmFkaXVzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiA/IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLnJvdGF0aW9uID8gdGhpcy5yb3RhdGlvbi5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgaW5uZXJSb3VuZG5lc3MgPSB0aGlzLmlubmVyUm91bmRuZXNzID8gdGhpcy5pbm5lclJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgb3V0ZXJSb3VuZG5lc3MgPSB0aGlzLm91dGVyUm91bmRuZXNzID8gdGhpcy5vdXRlclJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcblxyXG4gICAgcm90YXRpb24gPSB0aGlzLmRlZzJyYWQocm90YXRpb24pO1xyXG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCAwLCAwIC0gb3V0ZXJSYWRpdXMsIHJvdGF0aW9uKTtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0pO1xyXG4gICAgY3R4Lm1vdmVUbyhzdGFydFswXSwgc3RhcnRbMV0pO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzOyBpKyspIHtcclxuXHJcbiAgICAgICAgdmFyIHBJbm5lcixcclxuICAgICAgICAgICAgcE91dGVyLFxyXG4gICAgICAgICAgICBwT3V0ZXIxVGFuZ2VudCxcclxuICAgICAgICAgICAgcE91dGVyMlRhbmdlbnQsXHJcbiAgICAgICAgICAgIHBJbm5lcjFUYW5nZW50LFxyXG4gICAgICAgICAgICBwSW5uZXIyVGFuZ2VudCxcclxuICAgICAgICAgICAgb3V0ZXJPZmZzZXQsXHJcbiAgICAgICAgICAgIGlubmVyT2Zmc2V0LFxyXG4gICAgICAgICAgICByb3Q7XHJcblxyXG4gICAgICAgIHJvdCA9IE1hdGguUEkgLyBwb2ludHMgKiAyO1xyXG5cclxuICAgICAgICBwSW5uZXIgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBpbm5lclJhZGl1cywgKHJvdCAqIChpICsgMSkgLSByb3QgLyAyKSArIHJvdGF0aW9uKTtcclxuICAgICAgICBwT3V0ZXIgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIDAsIDAgLSBvdXRlclJhZGl1cywgKHJvdCAqIChpICsgMSkpICsgcm90YXRpb24pO1xyXG5cclxuICAgICAgICAvL0ZJeE1FXHJcbiAgICAgICAgaWYgKCFvdXRlck9mZnNldCkgb3V0ZXJPZmZzZXQgPSAoc3RhcnRbMF0gKyBwSW5uZXJbMF0pICogb3V0ZXJSb3VuZG5lc3MgLyAxMDAgKiAuNTUyMjg0ODtcclxuICAgICAgICBpZiAoIWlubmVyT2Zmc2V0KSBpbm5lck9mZnNldCA9IChzdGFydFswXSArIHBJbm5lclswXSkgKiBpbm5lclJvdW5kbmVzcyAvIDEwMCAqIC41NTIyODQ4O1xyXG5cclxuICAgICAgICBwT3V0ZXIxVGFuZ2VudCA9IHRoaXMucm90YXRlUG9pbnQoMCwgMCwgb3V0ZXJPZmZzZXQsIDAgLSBvdXRlclJhZGl1cywgKHJvdCAqIGkpICsgcm90YXRpb24pO1xyXG4gICAgICAgIHBJbm5lcjFUYW5nZW50ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBpbm5lck9mZnNldCAqIC0xLCAwIC0gaW5uZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpIC0gcm90IC8gMikgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcElubmVyMlRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIGlubmVyT2Zmc2V0LCAwIC0gaW5uZXJSYWRpdXMsIChyb3QgKiAoaSArIDEpIC0gcm90IC8gMikgKyByb3RhdGlvbik7XHJcbiAgICAgICAgcE91dGVyMlRhbmdlbnQgPSB0aGlzLnJvdGF0ZVBvaW50KDAsIDAsIG91dGVyT2Zmc2V0ICogLTEsIDAgLSBvdXRlclJhZGl1cywgKHJvdCAqIChpICsgMSkpICsgcm90YXRpb24pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGFyVHlwZSA9PT0gMSkge1xyXG4gICAgICAgICAgICAvL3N0YXJcclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocE91dGVyMVRhbmdlbnRbMF0sIHBPdXRlcjFUYW5nZW50WzFdLCBwSW5uZXIxVGFuZ2VudFswXSwgcElubmVyMVRhbmdlbnRbMV0sIHBJbm5lclswXSwgcElubmVyWzFdKTtcclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocElubmVyMlRhbmdlbnRbMF0sIHBJbm5lcjJUYW5nZW50WzFdLCBwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIHBPdXRlclswXSwgcE91dGVyWzFdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvL3BvbHlnb25cclxuICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8ocE91dGVyMVRhbmdlbnRbMF0sIHBPdXRlcjFUYW5nZW50WzFdLCBwT3V0ZXIyVGFuZ2VudFswXSwgcE91dGVyMlRhbmdlbnRbMV0sIHBPdXRlclswXSwgcE91dGVyWzFdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vZGVidWdcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocElubmVyWzBdLCBwSW5uZXJbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxSZWN0KHBPdXRlclswXSwgcE91dGVyWzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImJsdWVcIjtcclxuICAgICAgICAvL2N0eC5maWxsUmVjdChwT3V0ZXIxVGFuZ2VudFswXSwgcE91dGVyMVRhbmdlbnRbMV0sIDUsIDUpO1xyXG4gICAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwicmVkXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocElubmVyMVRhbmdlbnRbMF0sIHBJbm5lcjFUYW5nZW50WzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImdyZWVuXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocElubmVyMlRhbmdlbnRbMF0sIHBJbm5lcjJUYW5nZW50WzFdLCA1LCA1KTtcclxuICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcImJyb3duXCI7XHJcbiAgICAgICAgLy9jdHguZmlsbFJlY3QocE91dGVyMlRhbmdlbnRbMF0sIHBPdXRlcjJUYW5nZW50WzFdLCA1LCA1KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufTtcclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5yb3RhdGVQb2ludCA9IGZ1bmN0aW9uIChjeCwgY3ksIHgsIHksIHJhZGlhbnMpIHtcclxuICAgIHZhciBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKSxcclxuICAgICAgICBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKSxcclxuICAgICAgICBueCA9IChjb3MgKiAoeCAtIGN4KSkgLSAoc2luICogKHkgLSBjeSkpICsgY3gsXHJcbiAgICAgICAgbnkgPSAoc2luICogKHggLSBjeCkpICsgKGNvcyAqICh5IC0gY3kpKSArIGN5O1xyXG4gICAgcmV0dXJuIFtueCwgbnldO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XHJcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLnBvaW50cy5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMub3V0ZXJSYWRpdXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucm90YXRpb24pIHRoaXMucm90YXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuaW5uZXJSb3VuZG5lc3MpIHRoaXMuaW5uZXJSb3VuZG5lc3Muc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3Muc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuUG9seXN0YXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLnBvaW50cy5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMub3V0ZXJSYWRpdXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucm90YXRpb24pIHRoaXMucm90YXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuaW5uZXJSb3VuZG5lc3MpIHRoaXMuaW5uZXJSb3VuZG5lc3MucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMub3V0ZXJSb3VuZG5lc3MpIHRoaXMub3V0ZXJSb3VuZG5lc3MucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb2x5c3RhcjsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQmV6aWVyID0gcmVxdWlyZSgnLi9CZXppZXInKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFBvc2l0aW9uKGRhdGEpIHtcclxuICAgIEFuaW1hdGVkUHJvcGVydHkuY2FsbCh0aGlzLCBkYXRhKTtcclxufVxyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZSk7XHJcblxyXG5Qb3NpdGlvbi5wcm90b3R5cGUub25LZXlmcmFtZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbiAgICB0aGlzLnNldE1vdGlvblBhdGgoKTtcclxufTtcclxuXHJcblBvc2l0aW9uLnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5tb3Rpb25wYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW90aW9ucGF0aC5nZXRWYWx1ZXModGhpcy5nZXRFbGFwc2VkKHRpbWUpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52LCB0aGlzLm5leHRGcmFtZS52LCB0aGlzLmdldEVsYXBzZWQodGltZSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUG9zaXRpb24ucHJvdG90eXBlLnNldE1vdGlvblBhdGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5sYXN0RnJhbWUubW90aW9ucGF0aCkge1xyXG4gICAgICAgIHRoaXMubW90aW9ucGF0aCA9IG5ldyBCZXppZXIodGhpcy5sYXN0RnJhbWUubW90aW9ucGF0aCk7XHJcbiAgICAgICAgdGhpcy5tb3Rpb25wYXRoLmdldExlbmd0aCh0aGlzLmxhc3RGcmFtZS5sZW4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vdGlvbnBhdGggPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb3NpdGlvbjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIFByb3BlcnR5KGRhdGEpIHtcclxuICAgIGlmICghKGRhdGEgaW5zdGFuY2VvZiBBcnJheSkpIHJldHVybiBudWxsO1xyXG4gICAgdGhpcy5mcmFtZXMgPSBkYXRhO1xyXG59XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcmFtZXNbMF0udjtcclxufTtcclxuXHJcblByb3BlcnR5LnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG59O1xyXG5cclxuUHJvcGVydHkucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3BlcnR5OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFJlY3QoZGF0YSkge1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuc2l6ZSA9IGRhdGEuc2l6ZS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zaXplKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNpemUpO1xyXG5cclxuICAgIC8vb3B0aW9uYWxzXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbiA9IGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb24pIDogbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgaWYgKGRhdGEucm91bmRuZXNzKSB0aGlzLnJvdW5kbmVzcyA9IGRhdGEucm91bmRuZXNzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnJvdW5kbmVzcykgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3VuZG5lc3MpO1xyXG59XHJcblxyXG5SZWN0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSwgdHJpbSkge1xyXG5cclxuICAgIHZhciBzaXplID0gdGhpcy5zaXplLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiA/IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXHJcbiAgICAgICAgcm91bmRuZXNzID0gdGhpcy5yb3VuZG5lc3MgPyB0aGlzLnJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSA6IDA7XHJcblxyXG4gICAgaWYgKHNpemVbMF0gPCAyICogcm91bmRuZXNzKSByb3VuZG5lc3MgPSBzaXplWzBdIC8gMjtcclxuICAgIGlmIChzaXplWzFdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVsxXSAvIDI7XHJcblxyXG4gICAgdmFyIHggPSBwb3NpdGlvblswXSAtIHNpemVbMF0gLyAyLFxyXG4gICAgICAgIHkgPSBwb3NpdGlvblsxXSAtIHNpemVbMV0gLyAyO1xyXG5cclxuICAgIGlmICh0cmltKSB7XHJcbiAgICAgICAgdmFyIHR2O1xyXG4gICAgICAgIHRyaW0gPSB0aGlzLmdldFRyaW1WYWx1ZXModHJpbSk7XHJcbiAgICAgICAgLy9UT0RPIGFkZCB0cmltXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN0eC5tb3ZlVG8oeCArIHJvdW5kbmVzcywgeSk7XHJcbiAgICAgICAgY3R4LmFyY1RvKHggKyBzaXplWzBdLCB5LCB4ICsgc2l6ZVswXSwgeSArIHNpemVbMV0sIHJvdW5kbmVzcyk7XHJcbiAgICAgICAgY3R4LmFyY1RvKHggKyBzaXplWzBdLCB5ICsgc2l6ZVsxXSwgeCwgeSArIHNpemVbMV0sIHJvdW5kbmVzcyk7XHJcbiAgICAgICAgY3R4LmFyY1RvKHgsIHkgKyBzaXplWzFdLCB4LCB5LCByb3VuZG5lc3MpO1xyXG4gICAgICAgIGN0eC5hcmNUbyh4LCB5LCB4ICsgc2l6ZVswXSwgeSwgcm91bmRuZXNzKTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5SZWN0LnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdGhpcy5zaXplLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKSB0aGlzLnBvc2l0aW9uLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnJvdW5kbmVzcykgdGhpcy5yb3VuZG5lc3Muc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuUmVjdC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAocmV2ZXJzZWQpIHtcclxuICAgIHRoaXMuc2l6ZS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbikgdGhpcy5wb3NpdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3VuZG5lc3MpIHRoaXMucm91bmRuZXNzLnJlc2V0KHJldmVyc2VkKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVjdDsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5Jyk7XHJcblxyXG5mdW5jdGlvbiBTdHJva2UoZGF0YSkge1xyXG4gICAgaWYgKGRhdGEpIHtcclxuICAgICAgICB0aGlzLmpvaW4gPSBkYXRhLmpvaW47XHJcbiAgICAgICAgdGhpcy5jYXAgPSBkYXRhLmNhcDtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEubWl0ZXJMaW1pdCkge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5taXRlckxpbWl0Lmxlbmd0aCA+IDEpIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEubWl0ZXJMaW1pdCk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5taXRlckxpbWl0ID0gbmV3IFByb3BlcnR5KGRhdGEubWl0ZXJMaW1pdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF0YS5jb2xvci5sZW5ndGggPiAxKSB0aGlzLmNvbG9yID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcbiAgICAgICAgZWxzZSB0aGlzLmNvbG9yID0gbmV3IFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEpIHRoaXMub3BhY2l0eSA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbiAgICAgICAgZWxzZSB0aGlzLm9wYWNpdHkgPSBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEud2lkdGgubGVuZ3RoID4gMSkgdGhpcy53aWR0aCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEud2lkdGgpO1xyXG4gICAgICAgIGVsc2UgdGhpcy53aWR0aCA9IG5ldyBQcm9wZXJ0eShkYXRhLndpZHRoKTtcclxuICAgIH1cclxufVxyXG5cclxuU3Ryb2tlLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgY29sb3IgPSB0aGlzLmNvbG9yLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSk7XHJcbiAgICBjb2xvclswXSA9IE1hdGgucm91bmQoY29sb3JbMF0pO1xyXG4gICAgY29sb3JbMV0gPSBNYXRoLnJvdW5kKGNvbG9yWzFdKTtcclxuICAgIGNvbG9yWzJdID0gTWF0aC5yb3VuZChjb2xvclsyXSk7XHJcbiAgICB2YXIgcyA9IGNvbG9yLmpvaW4oJywgJyk7XHJcblxyXG4gICAgcmV0dXJuICdyZ2JhKCcgKyBzICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnNldFN0cm9rZSA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIHZhciBzdHJva2VDb2xvciA9IHRoaXMuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgc3Ryb2tlV2lkdGggPSB0aGlzLndpZHRoLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHN0cm9rZUpvaW4gPSB0aGlzLmpvaW47XHJcbiAgICBpZiAoc3Ryb2tlSm9pbiA9PT0gJ21pdGVyJykgdmFyIG1pdGVyTGltaXQgPSB0aGlzLm1pdGVyTGltaXQuZ2V0VmFsdWUodGltZSk7XHJcblxyXG4gICAgY3R4LmxpbmVXaWR0aCA9IHN0cm9rZVdpZHRoO1xyXG4gICAgY3R4LmxpbmVKb2luID0gc3Ryb2tlSm9pbjtcclxuICAgIGlmIChtaXRlckxpbWl0KSBjdHgubWl0ZXJMaW1pdCA9IG1pdGVyTGltaXQ7XHJcbiAgICBjdHgubGluZUNhcCA9IHRoaXMuY2FwO1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3I7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnNldEtleWZyYW1lcyA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB0aGlzLmNvbG9yLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIHRoaXMub3BhY2l0eS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICB0aGlzLndpZHRoLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5zZXRLZXlmcmFtZXModGltZSk7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICB0aGlzLmNvbG9yLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIHRoaXMub3BhY2l0eS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICB0aGlzLndpZHRoLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLm1pdGVyTGltaXQpIHRoaXMubWl0ZXJMaW1pdC5yZXNldChyZXZlcnNlZCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0cm9rZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJvcGVydHkgPSByZXF1aXJlKCcuL1Byb3BlcnR5JyksXHJcbiAgICBBbmltYXRlZFByb3BlcnR5ID0gcmVxdWlyZSgnLi9BbmltYXRlZFByb3BlcnR5JyksXHJcbiAgICBQb3NpdGlvbiA9IHJlcXVpcmUoJy4vUG9zaXRpb24nKTtcclxuXHJcbmZ1bmN0aW9uIFRyYW5zZm9ybShkYXRhKSB7XHJcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcblxyXG4gICAgaWYgKGRhdGEucG9zaXRpb25YICYmIGRhdGEucG9zaXRpb25ZKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb25YLmxlbmd0aCA+IDEgJiYgZGF0YS5wb3NpdGlvblkubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb25YKTtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvblgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChkYXRhLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvc2l0aW9uKGRhdGEucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLmFuY2hvcikgdGhpcy5hbmNob3IgPSBkYXRhLmFuY2hvci5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5hbmNob3IpIDogbmV3IFByb3BlcnR5KGRhdGEuYW5jaG9yKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWCkgdGhpcy5zY2FsZVggPSBkYXRhLnNjYWxlWC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVgpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVYKTtcclxuICAgIGlmIChkYXRhLnNjYWxlWSkgdGhpcy5zY2FsZVkgPSBkYXRhLnNjYWxlWS5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zY2FsZVkpIDogbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVZKTtcclxuICAgIGlmIChkYXRhLnNrZXcpIHRoaXMuc2tldyA9IGRhdGEuc2tldy5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3KSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXcpO1xyXG4gICAgaWYgKGRhdGEuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMgPSBkYXRhLnNrZXdBeGlzLmxlbmd0aCA+IDEgPyBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKSA6IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKTtcclxuICAgIGlmIChkYXRhLnJvdGF0aW9uKSB0aGlzLnJvdGF0aW9uID0gZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbikgOiBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5KSB0aGlzLm9wYWNpdHkgPSBkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSkgOiBuZXcgUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxufVxyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcblxyXG4gICAgdmFyIHBvc2l0aW9uWCwgcG9zaXRpb25ZLFxyXG4gICAgICAgIGFuY2hvciA9IHRoaXMuYW5jaG9yID8gdGhpcy5hbmNob3IuZ2V0VmFsdWUodGltZSkgOiBbMCwgMF0sXHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLnJvdGF0aW9uID8gdGhpcy5kZWcycmFkKHRoaXMucm90YXRpb24uZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3ID0gdGhpcy5za2V3ID8gdGhpcy5kZWcycmFkKHRoaXMuc2tldy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNrZXdBeGlzID0gdGhpcy5za2V3QXhpcyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXdBeGlzLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgc2NhbGVYID0gdGhpcy5zY2FsZVggPyB0aGlzLnNjYWxlWC5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgc2NhbGVZID0gdGhpcy5zY2FsZVkgPyB0aGlzLnNjYWxlWS5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSAqIGN0eC5nbG9iYWxBbHBoYSA6IGN0eC5nbG9iYWxBbHBoYTsgLy8gRklYTUUgd3JvbmcgdHJhbnNwYXJlbmN5IGlmIG5lc3RlZFxyXG5cclxuICAgIGlmICh0aGlzLnBvc2l0aW9uWCAmJiB0aGlzLnBvc2l0aW9uWSkge1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHRoaXMucG9zaXRpb25YLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHRoaXMucG9zaXRpb25ZLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lLCBjdHgpO1xyXG4gICAgICAgIHBvc2l0aW9uWCA9IHBvc2l0aW9uWzBdO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IHBvc2l0aW9uWzFdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwb3NpdGlvblggPSAwO1xyXG4gICAgICAgIHBvc2l0aW9uWSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy9vcmRlciB2ZXJ5IHZlcnkgaW1wb3J0YW50IDopXHJcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIDAsIDEsIHBvc2l0aW9uWCAtIGFuY2hvclswXSwgcG9zaXRpb25ZIC0gYW5jaG9yWzFdKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCByb3RhdGlvbiwgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgdGhpcy5zZXRTa2V3KGN0eCwgc2tldywgc2tld0F4aXMsIGFuY2hvclswXSwgYW5jaG9yWzFdKTtcclxuICAgIHRoaXMuc2V0U2NhbGUoY3R4LCBzY2FsZVgsIHNjYWxlWSwgYW5jaG9yWzBdLCBhbmNob3JbMV0pO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0Um90YXRpb24gPSBmdW5jdGlvbiAoY3R4LCByYWQsIHgsIHkpIHtcclxuICAgIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcclxuICAgIHZhciBkeCA9IHggLSBjICogeCArIHMgKiB5O1xyXG4gICAgdmFyIGR5ID0geSAtIHMgKiB4IC0gYyAqIHk7XHJcbiAgICBjdHgudHJhbnNmb3JtKGMsIHMsIC1zLCBjLCBkeCwgZHkpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIChjdHgsIHN4LCBzeSwgeCwgeSkge1xyXG4gICAgY3R4LnRyYW5zZm9ybShzeCwgMCwgMCwgc3ksIC14ICogc3ggKyB4LCAteSAqIHN5ICsgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNrZXcgPSBmdW5jdGlvbiAoY3R4LCBza2V3LCBheGlzLCB4LCB5KSB7XHJcbiAgICB2YXIgdCA9IE1hdGgudGFuKC1za2V3KTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCAtYXhpcywgeCwgeSk7XHJcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIHQsIDEsIC15ICogdCwgMCk7XHJcbiAgICB0aGlzLnNldFJvdGF0aW9uKGN0eCwgYXhpcywgeCwgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XHJcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuYW5jaG9yKSB0aGlzLmFuY2hvci5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5za2V3KSB0aGlzLnNrZXcuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24uc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZLnNldEtleWZyYW1lcyh0aW1lKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWCkgdGhpcy5zY2FsZVguc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChyZXZlcnNlZCkge1xyXG4gICAgaWYgKHRoaXMuYW5jaG9yKSB0aGlzLmFuY2hvci5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5za2V3KSB0aGlzLnNrZXcucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2tld0F4aXMpIHRoaXMuc2tld0F4aXMucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb24pIHRoaXMucG9zaXRpb24ucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvblkpIHRoaXMucG9zaXRpb25ZLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIGlmICh0aGlzLnNjYWxlWCkgdGhpcy5zY2FsZVgucmVzZXQocmV2ZXJzZWQpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5vcGFjaXR5KSB0aGlzLm9wYWNpdHkucmVzZXQocmV2ZXJzZWQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gVHJpbShkYXRhKSB7XHJcblxyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG5cclxuICAgIGlmIChkYXRhLnN0YXJ0KSB0aGlzLnN0YXJ0ID0gZGF0YS5zdGFydC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zdGFydCkgOiBuZXcgUHJvcGVydHkoZGF0YS5zdGFydCk7XHJcbiAgICBpZiAoZGF0YS5lbmQpIHRoaXMuZW5kID0gZGF0YS5lbmQubGVuZ3RoID4gMSA/IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuZW5kKSA6IG5ldyBQcm9wZXJ0eShkYXRhLmVuZCk7XHJcbiAgICAvL2lmIChkYXRhLm9mZnNldCkgdGhpcy5vZmZzZXQgPSBkYXRhLm9mZnNldC5sZW5ndGggPiAxID8gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vZmZzZXQpIDogbmV3IFByb3BlcnR5KGRhdGEub2Zmc2V0KTtcclxuXHJcbn1cclxuXHJcblRyaW0ucHJvdG90eXBlLmdldFRyaW0gPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5zdGFydCA/IHRoaXMuc3RhcnQuZ2V0VmFsdWUodGltZSkgOiAwLFxyXG4gICAgICAgIGVuZCA9IHRoaXMuZW5kID8gdGhpcy5lbmQuZ2V0VmFsdWUodGltZSkgOiAxO1xyXG5cclxuICAgIHZhciB0cmltID0ge1xyXG4gICAgICAgIHN0YXJ0OiBNYXRoLm1pbihzdGFydCwgZW5kKSxcclxuICAgICAgICBlbmQgIDogTWF0aC5tYXgoc3RhcnQsIGVuZClcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRyaW0uc3RhcnQgPT09IDAgJiYgdHJpbS5lbmQgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRyaW07XHJcbiAgICB9XHJcbn07XHJcblxyXG5UcmltLnByb3RvdHlwZS5zZXRLZXlmcmFtZXMgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnQpIHRoaXMuc3RhcnQuc2V0S2V5ZnJhbWVzKHRpbWUpO1xyXG4gICAgaWYgKHRoaXMuZW5kKSB0aGlzLmVuZC5zZXRLZXlmcmFtZXModGltZSk7XHJcbiAgICAvL2lmICh0aGlzLm9mZnNldCkgdGhpcy5vZmZzZXQucmVzZXQoKTtcclxufTtcclxuXHJcblRyaW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKHJldmVyc2VkKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydCkgdGhpcy5zdGFydC5yZXNldChyZXZlcnNlZCk7XHJcbiAgICBpZiAodGhpcy5lbmQpIHRoaXMuZW5kLnJlc2V0KHJldmVyc2VkKTtcclxuICAgIC8vaWYgKHRoaXMub2Zmc2V0KSB0aGlzLm9mZnNldC5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmltO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiJdfQ==
