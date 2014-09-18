!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ae2canvas=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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
},{}],2:[function(_dereq_,module,exports){
'use strict';

var Path = _dereq_('./Path'),
    BezierEasing = _dereq_('../lib/BezierEasing');

function AnimatedPath(data) {

    if (!data) return null;

    Path.call(this, data);
    this.frameCount = this.frames.length;
}

AnimatedPath.prototype = Object.create(Path.prototype);

AnimatedPath.prototype.getValue = function (time) {
    if ((time <= this.nextFrame.t && !this.started) || this.finished) {
        return this.nextFrame.v;
    } else {
        this.started = true;
        if (time > this.nextFrame.t) {
            if (this.pointer + 1 === this.frameCount) {
                this.finished = true;
            } else {
                this.lastFrame = this.nextFrame;
                this.pointer++;
                this.nextFrame = this.frames[this.pointer];
                this.setEasing();
            }
        }
        return this.getValueAtTime(time);
    }
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
    else if (this.easing) elapsed = this.easing(elapsed);
    var actualVertices = [];

    for (var i = 0; i < this.verticesCount; i++) {
//        var cp1x = Math.round(this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed)),
//            cp1y = Math.round(this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed)),
//            cp2x = Math.round(this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed)),
//            cp2y = Math.round(this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed)),
//            x = Math.round(this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed)),
//            y = Math.round(this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed));

        var cp1x = this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed),
            cp1y = this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed),
            cp2x = this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed),
            cp2y = this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed),
            x = this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed),
            y = this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed);

        actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y]);
    }
    return actualVertices;
};

AnimatedPath.prototype.reset = function () {
    this.finished = false;
    this.started = false;
    this.pointer = 0;
    this.nextFrame = this.frames[this.pointer];
    this.lastFrame = this.nextFrame;
    this.easing = null;
};

module.exports = AnimatedPath;


























},{"../lib/BezierEasing":1,"./Path":8}],3:[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    BezierEasing = _dereq_('../lib/BezierEasing');
    BezierEasing = _dereq_('../lib/BezierEasing');

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
    if (this.finished || (time <= this.nextFrame.t && !this.started)) {
        return this.nextFrame.v;
    } else {
        this.started = true;
        if (time > this.nextFrame.t) {
            if (this.pointer + 1 === this.frameCount) {
                this.finished = true;
            } else {
                this.lastFrame = this.nextFrame;
                this.pointer++;
                this.nextFrame = this.frames[this.pointer];
                this.setEasing();
            }
        }
        return this.getValueAtTime(time);
    }
};

AnimatedProperty.prototype.getValueAtTime = function (time) {
    var delta = ( time - this.lastFrame.t );
    var duration = this.nextFrame.t - this.lastFrame.t;
    var elapsed = delta / duration;
    if (elapsed > 1) elapsed = 1;
    else if (this.easing) elapsed = this.easing(elapsed);
    return this.lerp(this.lastFrame.v, this.nextFrame.v, elapsed);
};

AnimatedProperty.prototype.reset = function () {
    this.finished = false;
    this.started = false;
    this.pointer = 0;
    this.nextFrame = this.frames[this.pointer];
    this.lastFrame = this.nextFrame;
    this.easing = null;
};

module.exports = AnimatedProperty;
},{"../lib/BezierEasing":1,"./Property":10}],4:[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Ellipse(data) {
    this.name = data.name;
    this.closed = true;

    if (data.size.length > 1) this.size = new AnimatedProperty(data.size);
    else this.size = new Property(data.size);

    if (data.position.length > 1) this.position = new AnimatedProperty(data.position);
    else this.position = new Property(data.position);
}

Ellipse.prototype.draw = function (ctx, time) {

    var size = this.size.getValue(time);
    var position = this.position.getValue(time);

    var x = position[0] - size[0] / 2,
        y = position[1] - size[1] / 2,
        w = size[0],
        h = size[1];

    var ox = (w / 2) * .5522848,
        oy = (h / 2) * .5522848,
        xe = x + w,
        ye = y + h,
        xm = x + w / 2,
        ym = y + h / 2;

    ctx.moveTo(x, ym);
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
};

Ellipse.prototype.reset = function () {
    this.size.reset();
    this.position.reset();
};

module.exports = Ellipse;
},{"./AnimatedProperty":3,"./Property":10}],5:[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Fill(data) {
    if (data.color.length > 1) this.color = new AnimatedProperty(data.color);
    else this.color = new Property(data.color);
    if (data.opacity.length > 1) this.opacity = new AnimatedProperty(data.opacity);
    else this.opacity = new Property(data.opacity);
}

Fill.prototype.getValue = function (time) {
    var color = this.color.getValue(time);
    var opacity = this.opacity.getValue(time);
    return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
};

Fill.prototype.setColor = function (ctx, time) {
    var color = this.getValue(time);
    ctx.fillStyle = color;
};

Fill.prototype.reset = function () {
    this.color.reset();
    this.opacity.reset();
};

module.exports = Fill;
},{"./AnimatedProperty":3,"./Property":10}],6:[function(_dereq_,module,exports){
'use strict';

var Stroke = _dereq_('./Stroke'),
    Path = _dereq_('./Path'),
    Rect = _dereq_('./Rect'),
    Ellipse = _dereq_('./Ellipse'),
    Polystar = _dereq_('./Polystar'),
    AnimatedPath = _dereq_('./AnimatedPath'),
    Fill = _dereq_('./Fill'),
    Transform = _dereq_('./Transform'),
    Merge = _dereq_('./Merge');

function Group(data, bufferCtx) {

    if (!data) return;

    this.name = data.name;
    this.index = data.index;

    this.bufferCtx = bufferCtx;

    if (data.in) this.in = data.in;
    else this.in = 0;

    if (data.out) this.out = data.out;
    else this.out = 500000; // FIXME get comp total duration

    if (data.fill) this.fill = new Fill(data.fill);
    if (data.stroke) this.stroke = new Stroke(data.stroke);
    if (data.merge) this.merge = new Merge(data.merge);

    this.transform = new Transform(data.transform);

    if (data.groups) {
        this.groups = [];
        for (var i = 0; i < data.groups.length; i++) {
            this.groups.push(new Group(data.groups[i], this.bufferCtx));
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

Group.prototype.draw = function (ctx, time, parentFill, parentStroke) {

    var i;

    ctx.save();

    //TODO check if color/stroke is changing over time
    var fill = this.fill || parentFill;
    var stroke = this.stroke || parentStroke;

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
                this.shapes[i].draw(this.bufferCtx, time);
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
                this.shapes[i].draw(ctx, time);
            }
            if (this.shapes[this.shapes.length - 1].closed) {
                ctx.closePath();
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
                    this.groups[i].draw(this.bufferCtx, time, fill, stroke);
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
                    this.groups[i].draw(ctx, time, fill, stroke);
                }
            }
        }
    }

    ctx.restore();
};

Group.prototype.reset = function () {
    this.transform.reset();

    if (this.shapes) {
        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i].reset();
        }
    }
    if (this.groups) {
        for (var j = 0; j < this.groups.length; j++) {
            this.groups[j].reset();
        }
    }
    if (this.fill) {
        this.fill.reset();
    }
    if (this.stroke) {
        this.stroke.reset();
    }
};

module.exports = Group;


























},{"./AnimatedPath":2,"./Ellipse":4,"./Fill":5,"./Merge":7,"./Path":8,"./Polystar":9,"./Rect":11,"./Stroke":13,"./Transform":14}],7:[function(_dereq_,module,exports){
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


























},{}],8:[function(_dereq_,module,exports){
'use strict';

function Path(data) {
    this.name = data.name;
    this.closed = data.closed;
    this.frames = data.frames;
    this.verticesCount = this.frames[0].v.length;
}

Path.prototype.draw = function (ctx, time) {
    var vertices = this.getValue(time);
    ctx.moveTo(vertices[0][4], vertices[0][5]);

    for (var j = 1; j < vertices.length; j++) {

        var nextVertex = vertices[j];
        var lastVertex = vertices[j - 1];

        ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);

//            ctx.save();
//            ctx.fillStyle = 'rgba(0,0,255,0.5)';
//            ctx.fillRect(lastVertex[0], lastVertex[1], 5, 5);
//            ctx.restore();
//
//            ctx.save();
//            ctx.fillStyle = 'rgba(0,255,0,0.5)';
//            ctx.fillRect(nextVertex[2], nextVertex[3], 5, 5);
//            ctx.restore();

    }
    if (this.closed) {
        ctx.bezierCurveTo(nextVertex[0], nextVertex[1], vertices[0][2], vertices[0][3], vertices[0][4], vertices[0][5]);
//            ctx.closePath();

//            ctx.save();
//            ctx.fillStyle = 'rgba(255,0,0,0.5)';
//            ctx.fillRect(nextVertex[0], nextVertex[1], 5, 5);
//            ctx.fillRect(vertices[0][2], vertices[0][3], 5, 5);
//            ctx.restore();
    }
};

Path.prototype.getValue = function () {
    return this.frames[0].v;
};

Path.prototype.reset = function () {
};

module.exports = Path;




























},{}],9:[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Polystar(data) {
    this.name = data.name;
    this.closed = true;

    this.starType = data.starType;

    if (data.points.length > 1) this.points = new AnimatedProperty(data.points);
    else this.points = new Property(data.points);

    if (data.position.length > 1) this.position = new AnimatedProperty(data.position);
    else this.position = new Property(data.position);

    if (data.rotation.length > 1) this.rotation = new AnimatedProperty(data.rotation);
    else this.rotation = new Property(data.rotation);

    if (data.innerRadius.length > 1) this.innerRadius = new AnimatedProperty(data.innerRadius);
    else this.innerRadius = new Property(data.innerRadius);

    if (data.outerRadius.length > 1) this.outerRadius = new AnimatedProperty(data.outerRadius);
    else this.outerRadius = new Property(data.outerRadius);

    if (data.innerRoundness.length > 1) this.innerRoundness = new AnimatedProperty(data.innerRoundness);
    else this.innerRoundness = new Property(data.innerRoundness);

    if (data.outerRoundness.length > 1) this.outerRoundness = new AnimatedProperty(data.outerRoundness);
    else this.outerRoundness = new Property(data.outerRoundness);

//    console.log(this.position);
}

Polystar.prototype.draw = function (ctx, time) {

//    console.log(this.position);

    var points = this.points.getValue(time),
        position = this.position.getValue(time),
        innerRadius = this.innerRadius.getValue(time),
        outerRadius = this.outerRadius.getValue(time),
        innerRoundness = this.innerRoundness.getValue(time),
        outerRoundness = this.outerRoundness.getValue(time);

    var x = position[0],
        y = position[1],
        bezierOffset = outerRadius / 2;

    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0, 0 - outerRadius);

    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0 - outerRadius, 5, 5);
    ctx.restore();

    for (var i = 0; i < points; i++) {
        ctx.rotate(Math.PI / points);

        var b1x = this.rotatePoint(0, 0, bezierOffset, 0 - outerRadius, -1 * Math.PI / points)[0],
            b1y = this.rotatePoint(0, 0, bezierOffset, 0 - outerRadius, -1 * Math.PI / points)[1],
            b2x = 0,
            b2y = 0 - innerRadius;

        ctx.bezierCurveTo(b1x, b1y, b2x, b2y, 0, 0 - innerRadius);

        ctx.save();
        ctx.fillStyle = "blue";
        ctx.fillRect(b1x, b1y, 5, 5);
        ctx.fillRect(b2x, b2y, 5, 5);
        ctx.restore();

//            break;

        ctx.rotate(Math.PI / points);

        var b3x = 0,
            b3y = 0 - innerRadius,
            b4x = -bezierOffset,
            b4y = 0 - outerRadius;

        ctx.bezierCurveTo(b3x, b3y, b4x, b4y, 0, 0 - outerRadius);

        ctx.save();
        ctx.fillStyle = "green";
        ctx.fillRect(b3x, b3y, 5, 5);
        ctx.fillRect(b4x, b4y, 5, 5);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0 - outerRadius, 5, 5);
        ctx.restore();

//            break;

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

Polystar.prototype.reset = function () {
    this.points.reset();
    this.position.reset();
    this.innerRadius.reset();
    this.outerRadius.reset();
    this.innerRoundness.reset();
    this.outerRoundness.reset();
};

module.exports = Polystar;
},{"./AnimatedProperty":3,"./Property":10}],10:[function(_dereq_,module,exports){
'use strict';

function Property(data) {
    if (!(data instanceof Array)) return null;
    this.frames = data;
}

Property.prototype.getValue = function (time) {
    return this.frames[0].v;
};

Property.prototype.reset = function () {
};

module.exports = Property;
},{}],11:[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Rect(data) {
    this.name = data.name;
    this.closed = true;

    if (data.size.length > 1) this.size = new AnimatedProperty(data.size);
    else this.size = new Property(data.size);

    if (data.position.length > 1) this.position = new AnimatedProperty(data.position);
    else this.position = new Property(data.position);

    if (data.roundness.length > 1) this.roundness = new AnimatedProperty(data.roundness);
    else this.roundness = new Property(data.roundness);

}

Rect.prototype.draw = function (ctx, time) {

    var size = this.size.getValue(time),
        position = this.position.getValue(time),
        roundness = this.roundness.getValue(time);

    if (size[0] < 2 * roundness) roundness = size[0] / 2;
    if (size[1] < 2 * roundness) roundness = size[1] / 2;

    var x = position[0] - size[0] / 2,
        y = position[1] - size[1] / 2;

    ctx.moveTo(x + roundness, y);
    ctx.arcTo(x + size[0], y, x + size[0], y + size[1], roundness);
    ctx.arcTo(x + size[0], y + size[1], x, y + size[1], roundness);
    ctx.arcTo(x, y + size[1], x, y, roundness);
    ctx.arcTo(x, y, x + size[0], y, roundness);

};

Rect.prototype.reset = function () {
    this.size.reset();
    this.position.reset();
    this.roundness.reset();
};

module.exports = Rect;
},{"./AnimatedProperty":3,"./Property":10}],12:[function(_dereq_,module,exports){
'use strict';

var Group = _dereq_('./Group');

function Runtime(data, canvas) {
    if (!data) return;

    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.duration = data.duration;
    this.baseWidth = data.width;
    this.baseHeight = data.height;
    this.ratio = data.width / data.height;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.baseWidth;
    this.buffer.height = this.baseHeight;
    this.bufferCtx = this.buffer.getContext('2d');

    this.groups = [];
    for (var i = 0; i < data.groups.length; i++) {
        this.groups.push(new Group(data.groups[i], this.bufferCtx));
    }
    this.reset();
    this.started = false;
    window.addEventListener('resize', this.setWidth.bind(this), false);
    this.setWidth();
}

Runtime.prototype = {

    start: function () {
        if (!this.started) {
            this.startTime = this.time;
            this.started = true;
        }
    },

    stop: function () {
        this.reset();
        this.draw();
        this.started = false;
    },

    pause: function () {
        if (this.started) {
            this.pausedTime = this.compTime;
            this.started = false;
        }
    },

    update: function (time) {
        this.time = time;
        if (this.started) {
            this.compTime = this.time - this.startTime + this.pausedTime;
            if (this.compTime <= this.duration) {
                this.draw();
            } else {
                this.stop();
                if (this.loop) this.start();
            }
        }
    },

    draw: function () {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
        for (var i = 0; i < this.groups.length; i++) {
            if (this.compTime >= this.groups[i].in &&
                this.compTime < this.groups[i].out) {
                this.groups[i].draw(this.ctx, this.compTime);
            }
        }
        this.ctx.restore();
    },

    reset: function () {
        this.startTime = 0;
        this.pausedTime = 0;
        this.compTime = 0;
        for (var i = 0; i < this.groups.length; i++) {
            this.groups[i].reset();
        }
    },

    setWidth: function () {
        var factor = 1;
        if (this.isHD) factor = 2;
        var width = this.canvas.getBoundingClientRect().width;
        this.canvas.width = width * factor;
        this.canvas.height = width / this.ratio * factor;
        this.scale = width / this.baseWidth * factor;
        this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
    }
};

module.exports = Runtime;
},{"./Group":6}],13:[function(_dereq_,module,exports){
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

Stroke.prototype.reset = function () {
    this.color.reset();
    this.opacity.reset();
    this.width.reset();
    if (this.miterLimit) this.miterLimit.reset();
};

module.exports = Stroke;
},{"./AnimatedProperty":3,"./Property":10}],14:[function(_dereq_,module,exports){
'use strict';

var Property = _dereq_('./Property'),
    AnimatedProperty = _dereq_('./AnimatedProperty');

function Transform(data) {
    if (!data) return;

    this.name = data.name;

    if (data.anchorX) {
        if (data.anchorX.length > 1) this.anchorX = new AnimatedProperty(data.anchorX);
        else this.anchorX = new Property(data.anchorX);
    }

    if (data.anchorY) {
        if (data.anchorY.length > 1) this.anchorY = new AnimatedProperty(data.anchorY);
        else this.anchorY = new Property(data.anchorY);
    }

    if (data.positionX) {
        if (data.positionX.length > 1) this.positionX = new AnimatedProperty(data.positionX);
        else this.positionX = new Property(data.positionX);
    }

    if (data.positionY) {
        if (data.positionY.length > 1) this.positionY = new AnimatedProperty(data.positionY);
        else this.positionY = new Property(data.positionY);
    }

    if (data.scaleX) {
        if (data.scaleX.length > 1) this.scaleX = new AnimatedProperty(data.scaleX);
        else this.scaleX = new Property(data.scaleX);
    }

    if (data.scaleY) {
        if (data.scaleY.length > 1) this.scaleY = new AnimatedProperty(data.scaleY);
        else this.scaleY = new Property(data.scaleY);
    }

    if (data.skew) {
        if (data.skew.length > 1) this.skew = new AnimatedProperty(data.skew);
        else this.skew = new Property(data.skew);
    }

    if (data.skewAxis) {
        if (data.skewAxis.length > 1) this.skewAxis = new AnimatedProperty(data.skewAxis);
        else this.skewAxis = new Property(data.skewAxis);
    }

    if (data.rotation) {
        if (data.rotation.length > 1) this.rotation = new AnimatedProperty(data.rotation);
        else this.rotation = new Property(data.rotation);
    }

    if (data.opacity) {
        if (data.opacity.length > 1) this.opacity = new AnimatedProperty(data.opacity);
        else this.opacity = new Property(data.opacity);
    }

}

Transform.prototype.transform = function (ctx, time) {
    var anchorX = this.anchorX ? this.anchorX.getValue(time) : 0,
        anchorY = this.anchorY ? this.anchorY.getValue(time) : 0,
        rotation = this.rotation ? this.deg2rad(this.rotation.getValue(time)) : 0,
        skew = this.skew ? this.deg2rad(this.skew.getValue(time)) : 0,
        skewAxis = this.skewAxis ? this.deg2rad(this.skewAxis.getValue(time)) : 0,
        positionX = this.positionX ? this.positionX.getValue(time) : 0,
        positionY = this.positionY ? this.positionY.getValue(time) : 0,
        scaleX = this.scaleX ? this.scaleX.getValue(time) : 1,
        scaleY = this.scaleY ? this.scaleY.getValue(time) : 1,
        opacity = this.opacity ? this.opacity.getValue(time) * ctx.globalAlpha : ctx.globalAlpha; // FIXME wrong transparency if nested

    //order very very important :)
    ctx.transform(1, 0, 0, 1, positionX - anchorX, positionY - anchorY);
    this.setRotation(ctx, rotation, anchorX, anchorY);
    this.setSkew(ctx, skew, skewAxis, anchorX, anchorY);
    this.setScale(ctx, scaleX, scaleY, anchorX, anchorY);
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

Transform.prototype.reset = function () {
    if (this.anchorX) this.anchorX.reset();
    if (this.anchorY) this.anchorY.reset();
    if (this.rotation) this.rotation.reset();
    if (this.skew) this.skew.reset();
    if (this.skewAxis) this.skewAxis.reset();
    if (this.positionX) this.positionX.reset();
    if (this.positionY) this.positionY.reset();
    if (this.scaleX) this.scaleX.reset();
    if (this.scaleY) this.scaleY.reset();
    if (this.opacity) this.opacity.reset();
};

module.exports = Transform;
},{"./AnimatedProperty":3,"./Property":10}]},{},[12])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXHpncmFnZ2VubFxcV2Vic3Rvcm1Qcm9qZWN0c1xcYWUyY2FudmFzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL3pncmFnZ2VubC9XZWJzdG9ybVByb2plY3RzL2FlMmNhbnZhcy9zcmMvbGliL0JlemllckVhc2luZy5qcyIsIkM6L1VzZXJzL3pncmFnZ2VubC9XZWJzdG9ybVByb2plY3RzL2FlMmNhbnZhcy9zcmMvcnVudGltZS9BbmltYXRlZFBhdGguanMiLCJDOi9Vc2Vycy96Z3JhZ2dlbmwvV2Vic3Rvcm1Qcm9qZWN0cy9hZTJjYW52YXMvc3JjL3J1bnRpbWUvQW5pbWF0ZWRQcm9wZXJ0eS5qcyIsIkM6L1VzZXJzL3pncmFnZ2VubC9XZWJzdG9ybVByb2plY3RzL2FlMmNhbnZhcy9zcmMvcnVudGltZS9FbGxpcHNlLmpzIiwiQzovVXNlcnMvemdyYWdnZW5sL1dlYnN0b3JtUHJvamVjdHMvYWUyY2FudmFzL3NyYy9ydW50aW1lL0ZpbGwuanMiLCJDOi9Vc2Vycy96Z3JhZ2dlbmwvV2Vic3Rvcm1Qcm9qZWN0cy9hZTJjYW52YXMvc3JjL3J1bnRpbWUvR3JvdXAuanMiLCJDOi9Vc2Vycy96Z3JhZ2dlbmwvV2Vic3Rvcm1Qcm9qZWN0cy9hZTJjYW52YXMvc3JjL3J1bnRpbWUvTWVyZ2UuanMiLCJDOi9Vc2Vycy96Z3JhZ2dlbmwvV2Vic3Rvcm1Qcm9qZWN0cy9hZTJjYW52YXMvc3JjL3J1bnRpbWUvUGF0aC5qcyIsIkM6L1VzZXJzL3pncmFnZ2VubC9XZWJzdG9ybVByb2plY3RzL2FlMmNhbnZhcy9zcmMvcnVudGltZS9Qb2x5c3Rhci5qcyIsIkM6L1VzZXJzL3pncmFnZ2VubC9XZWJzdG9ybVByb2plY3RzL2FlMmNhbnZhcy9zcmMvcnVudGltZS9Qcm9wZXJ0eS5qcyIsIkM6L1VzZXJzL3pncmFnZ2VubC9XZWJzdG9ybVByb2plY3RzL2FlMmNhbnZhcy9zcmMvcnVudGltZS9SZWN0LmpzIiwiQzovVXNlcnMvemdyYWdnZW5sL1dlYnN0b3JtUHJvamVjdHMvYWUyY2FudmFzL3NyYy9ydW50aW1lL1J1bnRpbWUuanMiLCJDOi9Vc2Vycy96Z3JhZ2dlbmwvV2Vic3Rvcm1Qcm9qZWN0cy9hZTJjYW52YXMvc3JjL3J1bnRpbWUvU3Ryb2tlLmpzIiwiQzovVXNlcnMvemdyYWdnZW5sL1dlYnN0b3JtUHJvamVjdHMvYWUyY2FudmFzL3NyYy9ydW50aW1lL1RyYW5zZm9ybS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBCZXppZXJFYXNpbmcgLSB1c2UgYmV6aWVyIGN1cnZlIGZvciB0cmFuc2l0aW9uIGVhc2luZyBmdW5jdGlvblxyXG4gKiBpcyBiYXNlZCBvbiBGaXJlZm94J3MgbnNTTUlMS2V5U3BsaW5lLmNwcFxyXG4gKiBVc2FnZTpcclxuICogdmFyIHNwbGluZSA9IEJlemllckVhc2luZygwLjI1LCAwLjEsIDAuMjUsIDEuMClcclxuICogc3BsaW5lKHgpID0+IHJldHVybnMgdGhlIGVhc2luZyB2YWx1ZSB8IHggbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2VcclxuICpcclxuICovXHJcbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xyXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93LmRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB3aW5kb3cuZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIHdpbmRvdy5kZWZpbmUoW10sIGRlZmluaXRpb24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB3aW5kb3cuQmV6aWVyRWFzaW5nID0gZGVmaW5pdGlvbigpO1xyXG4gICAgfVxyXG59KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBUaGVzZSB2YWx1ZXMgYXJlIGVzdGFibGlzaGVkIGJ5IGVtcGlyaWNpc20gd2l0aCB0ZXN0cyAodHJhZGVvZmY6IHBlcmZvcm1hbmNlIFZTIHByZWNpc2lvbilcclxuICAgIHZhciBORVdUT05fSVRFUkFUSU9OUyA9IDQ7XHJcbiAgICB2YXIgTkVXVE9OX01JTl9TTE9QRSA9IDAuMDAxO1xyXG4gICAgdmFyIFNVQkRJVklTSU9OX1BSRUNJU0lPTiA9IDAuMDAwMDAwMTtcclxuICAgIHZhciBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwO1xyXG5cclxuICAgIHZhciBrU3BsaW5lVGFibGVTaXplID0gMTE7XHJcbiAgICB2YXIga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApO1xyXG5cclxuICAgIHZhciBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPSB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSBcImZ1bmN0aW9uXCI7XHJcblxyXG4gICAgZnVuY3Rpb24gQmV6aWVyRWFzaW5nIChtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcclxuXHJcbiAgICAgICAgLy8gVmFsaWRhdGUgYXJndW1lbnRzXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIHJlcXVpcmVzIDQgYXJndW1lbnRzLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPDQ7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSAhPT0gXCJudW1iZXJcIiB8fCBpc05hTihhcmd1bWVudHNbaV0pIHx8ICFpc0Zpbml0ZShhcmd1bWVudHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCZXppZXJFYXNpbmcgYXJndW1lbnRzIHNob3VsZCBiZSBpbnRlZ2Vycy5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1YMSA8IDAgfHwgbVgxID4gMSB8fCBtWDIgPCAwIHx8IG1YMiA+IDEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmV6aWVyRWFzaW5nIHggdmFsdWVzIG11c3QgYmUgaW4gWzAsIDFdIHJhbmdlLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBtU2FtcGxlVmFsdWVzID0gZmxvYXQzMkFycmF5U3VwcG9ydGVkID8gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKSA6IG5ldyBBcnJheShrU3BsaW5lVGFibGVTaXplKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gQSAoYUExLCBhQTIpIHsgcmV0dXJuIDEuMCAtIDMuMCAqIGFBMiArIDMuMCAqIGFBMTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIEIgKGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBhQTIgLSA2LjAgKiBhQTE7IH1cclxuICAgICAgICBmdW5jdGlvbiBDIChhQTEpICAgICAgeyByZXR1cm4gMy4wICogYUExOyB9XHJcblxyXG4gICAgICAgIC8vIFJldHVybnMgeCh0KSBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciB5KHQpIGdpdmVuIHQsIHkxLCBhbmQgeTIuXHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY0JlemllciAoYVQsIGFBMSwgYUEyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoKEEoYUExLCBhQTIpKmFUICsgQihhQTEsIGFBMikpKmFUICsgQyhhQTEpKSphVDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJldHVybnMgZHgvZHQgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgZHkvZHQgZ2l2ZW4gdCwgeTEsIGFuZCB5Mi5cclxuICAgICAgICBmdW5jdGlvbiBnZXRTbG9wZSAoYVQsIGFBMSwgYUEyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAzLjAgKiBBKGFBMSwgYUEyKSphVCphVCArIDIuMCAqIEIoYUExLCBhQTIpICogYVQgKyBDKGFBMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBuZXd0b25SYXBoc29uSXRlcmF0ZSAoYVgsIGFHdWVzc1QpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBORVdUT05fSVRFUkFUSU9OUzsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSByZXR1cm4gYUd1ZXNzVDtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XHJcbiAgICAgICAgICAgICAgICBhR3Vlc3NUIC09IGN1cnJlbnRYIC8gY3VycmVudFNsb3BlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhR3Vlc3NUO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY1NhbXBsZVZhbHVlcyAoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBtU2FtcGxlVmFsdWVzW2ldID0gY2FsY0JlemllcihpICoga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZSAoYVgsIGFBLCBhQikge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFgsIGN1cnJlbnRULCBpID0gMDtcclxuICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDIuMDtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFggPiAwLjApIHtcclxuICAgICAgICAgICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhQSA9IGN1cnJlbnRUO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IHdoaWxlIChNYXRoLmFicyhjdXJyZW50WCkgPiBTVUJESVZJU0lPTl9QUkVDSVNJT04gJiYgKytpIDwgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMpO1xyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRURm9yWCAoYVgpIHtcclxuICAgICAgICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwLjA7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50U2FtcGxlID0gMTtcclxuICAgICAgICAgICAgdmFyIGxhc3RTYW1wbGUgPSBrU3BsaW5lVGFibGVTaXplIC0gMTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9IGxhc3RTYW1wbGUgJiYgbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgKytjdXJyZW50U2FtcGxlKSB7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnZhbFN0YXJ0ICs9IGtTYW1wbGVTdGVwU2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAtLWN1cnJlbnRTYW1wbGU7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0byBwcm92aWRlIGFuIGluaXRpYWwgZ3Vlc3MgZm9yIHRcclxuICAgICAgICAgICAgdmFyIGRpc3QgPSAoYVggLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSAvIChtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUrMV0gLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKTtcclxuICAgICAgICAgICAgdmFyIGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplO1xyXG5cclxuICAgICAgICAgICAgdmFyIGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbFNsb3BlID49IE5FV1RPTl9NSU5fU0xPUEUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JUKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT0gMC4wKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ3Vlc3NGb3JUO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtWDEgIT0gbVkxIHx8IG1YMiAhPSBtWTIpXHJcbiAgICAgICAgICAgIGNhbGNTYW1wbGVWYWx1ZXMoKTtcclxuXHJcbiAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoYVgpIHtcclxuICAgICAgICAgICAgaWYgKG1YMSA9PT0gbVkxICYmIG1YMiA9PT0gbVkyKSByZXR1cm4gYVg7IC8vIGxpbmVhclxyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIEphdmFTY3JpcHQgbnVtYmVyIGFyZSBpbXByZWNpc2UsIHdlIHNob3VsZCBndWFyYW50ZWUgdGhlIGV4dHJlbWVzIGFyZSByaWdodC5cclxuICAgICAgICAgICAgaWYgKGFYID09PSAwKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgaWYgKGFYID09PSAxKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbGNCZXppZXIoZ2V0VEZvclgoYVgpLCBtWTEsIG1ZMik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc3RyID0gXCJCZXppZXJFYXNpbmcoXCIrW21YMSwgbVkxLCBtWDIsIG1ZMl0rXCIpXCI7XHJcbiAgICAgICAgZi50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0cjsgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGY7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ1NTIG1hcHBpbmdcclxuICAgIEJlemllckVhc2luZy5jc3MgPSB7XHJcbiAgICAgICAgXCJlYXNlXCI6ICAgICAgICBCZXppZXJFYXNpbmcoMC4yNSwgMC4xLCAwLjI1LCAxLjApLFxyXG4gICAgICAgIFwibGluZWFyXCI6ICAgICAgQmV6aWVyRWFzaW5nKDAuMDAsIDAuMCwgMS4wMCwgMS4wKSxcclxuICAgICAgICBcImVhc2UtaW5cIjogICAgIEJlemllckVhc2luZygwLjQyLCAwLjAsIDEuMDAsIDEuMCksXHJcbiAgICAgICAgXCJlYXNlLW91dFwiOiAgICBCZXppZXJFYXNpbmcoMC4wMCwgMC4wLCAwLjU4LCAxLjApLFxyXG4gICAgICAgIFwiZWFzZS1pbi1vdXRcIjogQmV6aWVyRWFzaW5nKDAuNDIsIDAuMCwgMC41OCwgMS4wKVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQmV6aWVyRWFzaW5nO1xyXG59KSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFBhdGggPSByZXF1aXJlKCcuL1BhdGgnKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4uL2xpYi9CZXppZXJFYXNpbmcnKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkUGF0aChkYXRhKSB7XHJcblxyXG4gICAgaWYgKCFkYXRhKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgZGF0YSk7XHJcbiAgICB0aGlzLmZyYW1lQ291bnQgPSB0aGlzLmZyYW1lcy5sZW5ndGg7XHJcbn1cclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhdGgucHJvdG90eXBlKTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgaWYgKCh0aW1lIDw9IHRoaXMubmV4dEZyYW1lLnQgJiYgIXRoaXMuc3RhcnRlZCkgfHwgdGhpcy5maW5pc2hlZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRGcmFtZS52O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0aW1lID4gdGhpcy5uZXh0RnJhbWUudCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb2ludGVyICsgMSA9PT0gdGhpcy5mcmFtZUNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5uZXh0RnJhbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50ZXIrKztcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0RWFzaW5nKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWVBdFRpbWUodGltZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFBhdGgucHJvdG90eXBlLmxlcnAgPSBmdW5jdGlvbiAoYSwgYiwgdCkge1xyXG4gICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxufTtcclxuXHJcbkFuaW1hdGVkUGF0aC5wcm90b3R5cGUuc2V0RWFzaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMubGFzdEZyYW1lLmVhc2VPdXQgJiYgdGhpcy5uZXh0RnJhbWUuZWFzZUluKSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBuZXcgQmV6aWVyRWFzaW5nKHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMF0sIHRoaXMubGFzdEZyYW1lLmVhc2VPdXRbMV0sIHRoaXMubmV4dEZyYW1lLmVhc2VJblswXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzFdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5nZXRWYWx1ZUF0VGltZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgZGVsdGEgPSAoIHRpbWUgLSB0aGlzLmxhc3RGcmFtZS50ICk7XHJcbiAgICB2YXIgZHVyYXRpb24gPSB0aGlzLm5leHRGcmFtZS50IC0gdGhpcy5sYXN0RnJhbWUudDtcclxuICAgIHZhciBlbGFwc2VkID0gZGVsdGEgLyBkdXJhdGlvbjtcclxuICAgIGlmIChlbGFwc2VkID4gMSkgZWxhcHNlZCA9IDE7XHJcbiAgICBlbHNlIGlmICh0aGlzLmVhc2luZykgZWxhcHNlZCA9IHRoaXMuZWFzaW5nKGVsYXBzZWQpO1xyXG4gICAgdmFyIGFjdHVhbFZlcnRpY2VzID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzQ291bnQ7IGkrKykge1xyXG4vLyAgICAgICAgdmFyIGNwMXggPSBNYXRoLnJvdW5kKHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzBdLCB0aGlzLm5leHRGcmFtZS52W2ldWzBdLCBlbGFwc2VkKSksXHJcbi8vICAgICAgICAgICAgY3AxeSA9IE1hdGgucm91bmQodGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bMV0sIHRoaXMubmV4dEZyYW1lLnZbaV1bMV0sIGVsYXBzZWQpKSxcclxuLy8gICAgICAgICAgICBjcDJ4ID0gTWF0aC5yb3VuZCh0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVsyXSwgdGhpcy5uZXh0RnJhbWUudltpXVsyXSwgZWxhcHNlZCkpLFxyXG4vLyAgICAgICAgICAgIGNwMnkgPSBNYXRoLnJvdW5kKHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzNdLCB0aGlzLm5leHRGcmFtZS52W2ldWzNdLCBlbGFwc2VkKSksXHJcbi8vICAgICAgICAgICAgeCA9IE1hdGgucm91bmQodGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnZbaV1bNF0sIHRoaXMubmV4dEZyYW1lLnZbaV1bNF0sIGVsYXBzZWQpKSxcclxuLy8gICAgICAgICAgICB5ID0gTWF0aC5yb3VuZCh0aGlzLmxlcnAodGhpcy5sYXN0RnJhbWUudltpXVs1XSwgdGhpcy5uZXh0RnJhbWUudltpXVs1XSwgZWxhcHNlZCkpO1xyXG5cclxuICAgICAgICB2YXIgY3AxeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzBdLCB0aGlzLm5leHRGcmFtZS52W2ldWzBdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AxeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzFdLCB0aGlzLm5leHRGcmFtZS52W2ldWzFdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzJdLCB0aGlzLm5leHRGcmFtZS52W2ldWzJdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgY3AyeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzNdLCB0aGlzLm5leHRGcmFtZS52W2ldWzNdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeCA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzRdLCB0aGlzLm5leHRGcmFtZS52W2ldWzRdLCBlbGFwc2VkKSxcclxuICAgICAgICAgICAgeSA9IHRoaXMubGVycCh0aGlzLmxhc3RGcmFtZS52W2ldWzVdLCB0aGlzLm5leHRGcmFtZS52W2ldWzVdLCBlbGFwc2VkKTtcclxuXHJcbiAgICAgICAgYWN0dWFsVmVydGljZXMucHVzaChbY3AxeCwgY3AxeSwgY3AyeCwgY3AyeSwgeCwgeV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjdHVhbFZlcnRpY2VzO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQYXRoLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5wb2ludGVyID0gMDtcclxuICAgIHRoaXMubmV4dEZyYW1lID0gdGhpcy5mcmFtZXNbdGhpcy5wb2ludGVyXTtcclxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpcy5uZXh0RnJhbWU7XHJcbiAgICB0aGlzLmVhc2luZyA9IG51bGw7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuaW1hdGVkUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4uL2xpYi9CZXppZXJFYXNpbmcnKTtcclxuICAgIEJlemllckVhc2luZyA9IHJlcXVpcmUoJy4uL2xpYi9CZXppZXJFYXNpbmcnKTtcclxuXHJcbmZ1bmN0aW9uIEFuaW1hdGVkUHJvcGVydHkoZGF0YSkge1xyXG4gICAgUHJvcGVydHkuY2FsbCh0aGlzLCBkYXRhKTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcclxufVxyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFByb3BlcnR5LnByb3RvdHlwZSk7XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5sZXJwID0gZnVuY3Rpb24gKGEsIGIsIHQpIHtcclxuICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICB2YXIgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFycltpXSA9IGFbaV0gKyB0ICogKGJbaV0gLSBhW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGEgKyB0ICogKGIgLSBhKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLnNldEVhc2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLm5leHRGcmFtZS5lYXNlSW4pIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG5ldyBCZXppZXJFYXNpbmcodGhpcy5sYXN0RnJhbWUuZWFzZU91dFswXSwgdGhpcy5sYXN0RnJhbWUuZWFzZU91dFsxXSwgdGhpcy5uZXh0RnJhbWUuZWFzZUluWzBdLCB0aGlzLm5leHRGcmFtZS5lYXNlSW5bMV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmVhc2luZyA9IG51bGw7XHJcbiAgICB9XHJcbn07XHJcblxyXG5BbmltYXRlZFByb3BlcnR5LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCB8fCAodGltZSA8PSB0aGlzLm5leHRGcmFtZS50ICYmICF0aGlzLnN0YXJ0ZWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEZyYW1lLnY7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRpbWUgPiB0aGlzLm5leHRGcmFtZS50KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvaW50ZXIgKyAxID09PSB0aGlzLmZyYW1lQ291bnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0RnJhbWUgPSB0aGlzLm5leHRGcmFtZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRlcisrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJhbWUgPSB0aGlzLmZyYW1lc1t0aGlzLnBvaW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRFYXNpbmcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZUF0VGltZSh0aW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbkFuaW1hdGVkUHJvcGVydHkucHJvdG90eXBlLmdldFZhbHVlQXRUaW1lID0gZnVuY3Rpb24gKHRpbWUpIHtcclxuICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMubGFzdEZyYW1lLnQgKTtcclxuICAgIHZhciBkdXJhdGlvbiA9IHRoaXMubmV4dEZyYW1lLnQgLSB0aGlzLmxhc3RGcmFtZS50O1xyXG4gICAgdmFyIGVsYXBzZWQgPSBkZWx0YSAvIGR1cmF0aW9uO1xyXG4gICAgaWYgKGVsYXBzZWQgPiAxKSBlbGFwc2VkID0gMTtcclxuICAgIGVsc2UgaWYgKHRoaXMuZWFzaW5nKSBlbGFwc2VkID0gdGhpcy5lYXNpbmcoZWxhcHNlZCk7XHJcbiAgICByZXR1cm4gdGhpcy5sZXJwKHRoaXMubGFzdEZyYW1lLnYsIHRoaXMubmV4dEZyYW1lLnYsIGVsYXBzZWQpO1xyXG59O1xyXG5cclxuQW5pbWF0ZWRQcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMucG9pbnRlciA9IDA7XHJcbiAgICB0aGlzLm5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMucG9pbnRlcl07XHJcbiAgICB0aGlzLmxhc3RGcmFtZSA9IHRoaXMubmV4dEZyYW1lO1xyXG4gICAgdGhpcy5lYXNpbmcgPSBudWxsO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRlZFByb3BlcnR5OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIEVsbGlwc2UoZGF0YSkge1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIGlmIChkYXRhLnNpemUubGVuZ3RoID4gMSkgdGhpcy5zaXplID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zaXplKTtcclxuICAgIGVsc2UgdGhpcy5zaXplID0gbmV3IFByb3BlcnR5KGRhdGEuc2l6ZSk7XHJcblxyXG4gICAgaWYgKGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSkgdGhpcy5wb3NpdGlvbiA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgZWxzZSB0aGlzLnBvc2l0aW9uID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG59XHJcblxyXG5FbGxpcHNlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuICAgIHZhciBzaXplID0gdGhpcy5zaXplLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKTtcclxuXHJcbiAgICB2YXIgeCA9IHBvc2l0aW9uWzBdIC0gc2l6ZVswXSAvIDIsXHJcbiAgICAgICAgeSA9IHBvc2l0aW9uWzFdIC0gc2l6ZVsxXSAvIDIsXHJcbiAgICAgICAgdyA9IHNpemVbMF0sXHJcbiAgICAgICAgaCA9IHNpemVbMV07XHJcblxyXG4gICAgdmFyIG94ID0gKHcgLyAyKSAqIC41NTIyODQ4LFxyXG4gICAgICAgIG95ID0gKGggLyAyKSAqIC41NTIyODQ4LFxyXG4gICAgICAgIHhlID0geCArIHcsXHJcbiAgICAgICAgeWUgPSB5ICsgaCxcclxuICAgICAgICB4bSA9IHggKyB3IC8gMixcclxuICAgICAgICB5bSA9IHkgKyBoIC8gMjtcclxuXHJcbiAgICBjdHgubW92ZVRvKHgsIHltKTtcclxuICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHgsIHltIC0gb3ksIHhtIC0gb3gsIHksIHhtLCB5KTtcclxuICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHhtICsgb3gsIHksIHhlLCB5bSAtIG95LCB4ZSwgeW0pO1xyXG4gICAgY3R4LmJlemllckN1cnZlVG8oeGUsIHltICsgb3ksIHhtICsgb3gsIHllLCB4bSwgeWUpO1xyXG4gICAgY3R4LmJlemllckN1cnZlVG8oeG0gLSBveCwgeWUsIHgsIHltICsgb3ksIHgsIHltKTtcclxufTtcclxuXHJcbkVsbGlwc2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zaXplLnJlc2V0KCk7XHJcbiAgICB0aGlzLnBvc2l0aW9uLnJlc2V0KCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVsbGlwc2U7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gRmlsbChkYXRhKSB7XHJcbiAgICBpZiAoZGF0YS5jb2xvci5sZW5ndGggPiAxKSB0aGlzLmNvbG9yID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcbiAgICBlbHNlIHRoaXMuY29sb3IgPSBuZXcgUHJvcGVydHkoZGF0YS5jb2xvcik7XHJcbiAgICBpZiAoZGF0YS5vcGFjaXR5Lmxlbmd0aCA+IDEpIHRoaXMub3BhY2l0eSA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcbiAgICBlbHNlIHRoaXMub3BhY2l0eSA9IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG59XHJcblxyXG5GaWxsLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICB2YXIgY29sb3IgPSB0aGlzLmNvbG9yLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSk7XHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoY29sb3JbMF0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMV0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMl0pICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5zZXRDb2xvciA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIHZhciBjb2xvciA9IHRoaXMuZ2V0VmFsdWUodGltZSk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbn07XHJcblxyXG5GaWxsLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuY29sb3IucmVzZXQoKTtcclxuICAgIHRoaXMub3BhY2l0eS5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGaWxsOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTdHJva2UgPSByZXF1aXJlKCcuL1N0cm9rZScpLFxyXG4gICAgUGF0aCA9IHJlcXVpcmUoJy4vUGF0aCcpLFxyXG4gICAgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpLFxyXG4gICAgRWxsaXBzZSA9IHJlcXVpcmUoJy4vRWxsaXBzZScpLFxyXG4gICAgUG9seXN0YXIgPSByZXF1aXJlKCcuL1BvbHlzdGFyJyksXHJcbiAgICBBbmltYXRlZFBhdGggPSByZXF1aXJlKCcuL0FuaW1hdGVkUGF0aCcpLFxyXG4gICAgRmlsbCA9IHJlcXVpcmUoJy4vRmlsbCcpLFxyXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcclxuICAgIE1lcmdlID0gcmVxdWlyZSgnLi9NZXJnZScpO1xyXG5cclxuZnVuY3Rpb24gR3JvdXAoZGF0YSwgYnVmZmVyQ3R4KSB7XHJcblxyXG4gICAgaWYgKCFkYXRhKSByZXR1cm47XHJcblxyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5pbmRleCA9IGRhdGEuaW5kZXg7XHJcblxyXG4gICAgdGhpcy5idWZmZXJDdHggPSBidWZmZXJDdHg7XHJcblxyXG4gICAgaWYgKGRhdGEuaW4pIHRoaXMuaW4gPSBkYXRhLmluO1xyXG4gICAgZWxzZSB0aGlzLmluID0gMDtcclxuXHJcbiAgICBpZiAoZGF0YS5vdXQpIHRoaXMub3V0ID0gZGF0YS5vdXQ7XHJcbiAgICBlbHNlIHRoaXMub3V0ID0gNTAwMDAwOyAvLyBGSVhNRSBnZXQgY29tcCB0b3RhbCBkdXJhdGlvblxyXG5cclxuICAgIGlmIChkYXRhLmZpbGwpIHRoaXMuZmlsbCA9IG5ldyBGaWxsKGRhdGEuZmlsbCk7XHJcbiAgICBpZiAoZGF0YS5zdHJva2UpIHRoaXMuc3Ryb2tlID0gbmV3IFN0cm9rZShkYXRhLnN0cm9rZSk7XHJcbiAgICBpZiAoZGF0YS5tZXJnZSkgdGhpcy5tZXJnZSA9IG5ldyBNZXJnZShkYXRhLm1lcmdlKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0oZGF0YS50cmFuc2Zvcm0pO1xyXG5cclxuICAgIGlmIChkYXRhLmdyb3Vwcykge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwcy5wdXNoKG5ldyBHcm91cChkYXRhLmdyb3Vwc1tpXSwgdGhpcy5idWZmZXJDdHgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEuc2hhcGVzKSB7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRhdGEuc2hhcGVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IGRhdGEuc2hhcGVzW2pdO1xyXG4gICAgICAgICAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3BhdGgnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUuaXNBbmltYXRlZCkgdGhpcy5zaGFwZXMucHVzaChuZXcgQW5pbWF0ZWRQYXRoKHNoYXBlKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXMuc2hhcGVzLnB1c2gobmV3IFBhdGgoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IFJlY3Qoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAnZWxsaXBzZScpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzLnB1c2gobmV3IEVsbGlwc2Uoc2hhcGUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAncG9seXN0YXInKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKG5ldyBQb2x5c3RhcihzaGFwZSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuR3JvdXAucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCB0aW1lLCBwYXJlbnRGaWxsLCBwYXJlbnRTdHJva2UpIHtcclxuXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBjdHguc2F2ZSgpO1xyXG5cclxuICAgIC8vVE9ETyBjaGVjayBpZiBjb2xvci9zdHJva2UgaXMgY2hhbmdpbmcgb3ZlciB0aW1lXHJcbiAgICB2YXIgZmlsbCA9IHRoaXMuZmlsbCB8fCBwYXJlbnRGaWxsO1xyXG4gICAgdmFyIHN0cm9rZSA9IHRoaXMuc3Ryb2tlIHx8IHBhcmVudFN0cm9rZTtcclxuXHJcbiAgICBpZiAoZmlsbCkgZmlsbC5zZXRDb2xvcihjdHgsIHRpbWUpO1xyXG4gICAgaWYgKHN0cm9rZSkgc3Ryb2tlLnNldFN0cm9rZShjdHgsIHRpbWUpO1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtLnRyYW5zZm9ybShjdHgsIHRpbWUpO1xyXG5cclxuICAgIGlmICh0aGlzLm1lcmdlKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDdHguc2F2ZSgpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJ1ZmZlckN0eC5jYW52YXMud2lkdGgsIHRoaXMuYnVmZmVyQ3R4LmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtLnRyYW5zZm9ybSh0aGlzLmJ1ZmZlckN0eCwgdGltZSk7XHJcblxyXG4gICAgICAgIGlmIChmaWxsKSBmaWxsLnNldENvbG9yKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgICAgICBpZiAoc3Ryb2tlKSBzdHJva2Uuc2V0U3Ryb2tlKHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBpZiAodGhpcy5tZXJnZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNoYXBlc1tpXS5kcmF3KHRoaXMuYnVmZmVyQ3R4LCB0aW1lKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbGwpIHRoaXMuYnVmZmVyQ3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJva2UpIHRoaXMuYnVmZmVyQ3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5idWZmZXJDdHguY2FudmFzLCAwLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zaGFwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLmRyYXcoY3R4LCB0aW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zaGFwZXNbdGhpcy5zaGFwZXMubGVuZ3RoIC0gMV0uY2xvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9UT0RPIGdldCBvcmRlclxyXG4gICAgaWYgKGZpbGwpIGN0eC5maWxsKCk7XHJcbiAgICBpZiAoc3Ryb2tlKSBjdHguc3Ryb2tlKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubWVyZ2UpIHtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJiB0aW1lIDwgdGhpcy5ncm91cHNbaV0ub3V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyh0aGlzLmJ1ZmZlckN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lcmdlLnNldENvbXBvc2l0ZU9wZXJhdGlvbih0aGlzLmJ1ZmZlckN0eCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmJ1ZmZlckN0eC5jYW52YXMsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lID49IHRoaXMuZ3JvdXBzW2ldLmluICYmIHRpbWUgPCB0aGlzLmdyb3Vwc1tpXS5vdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwc1tpXS5kcmF3KGN0eCwgdGltZSwgZmlsbCwgc3Ryb2tlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuR3JvdXAucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy50cmFuc2Zvcm0ucmVzZXQoKTtcclxuXHJcbiAgICBpZiAodGhpcy5zaGFwZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzW2ldLnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuZ3JvdXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1tqXS5yZXNldCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmZpbGwpIHtcclxuICAgICAgICB0aGlzLmZpbGwucmVzZXQoKTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLnN0cm9rZSkge1xyXG4gICAgICAgIHRoaXMuc3Ryb2tlLnJlc2V0KCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gTWVyZ2UoZGF0YSkge1xyXG4gICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xyXG59XHJcblxyXG5NZXJnZS5wcm90b3R5cGUuc2V0Q29tcG9zaXRlT3BlcmF0aW9uID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW91dCc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2UtaW4nO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDU6XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAneG9yJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lcmdlO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gUGF0aChkYXRhKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB0aGlzLmNsb3NlZCA9IGRhdGEuY2xvc2VkO1xyXG4gICAgdGhpcy5mcmFtZXMgPSBkYXRhLmZyYW1lcztcclxuICAgIHRoaXMudmVydGljZXNDb3VudCA9IHRoaXMuZnJhbWVzWzBdLnYubGVuZ3RoO1xyXG59XHJcblxyXG5QYXRoLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG4gICAgdmFyIHZlcnRpY2VzID0gdGhpcy5nZXRWYWx1ZSh0aW1lKTtcclxuICAgIGN0eC5tb3ZlVG8odmVydGljZXNbMF1bNF0sIHZlcnRpY2VzWzBdWzVdKTtcclxuXHJcbiAgICBmb3IgKHZhciBqID0gMTsgaiA8IHZlcnRpY2VzLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXh0VmVydGV4ID0gdmVydGljZXNbal07XHJcbiAgICAgICAgdmFyIGxhc3RWZXJ0ZXggPSB2ZXJ0aWNlc1tqIC0gMV07XHJcblxyXG4gICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKGxhc3RWZXJ0ZXhbMF0sIGxhc3RWZXJ0ZXhbMV0sIG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIG5leHRWZXJ0ZXhbNF0sIG5leHRWZXJ0ZXhbNV0pO1xyXG5cclxuLy8gICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4vLyAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMjU1LDAuNSknO1xyXG4vLyAgICAgICAgICAgIGN0eC5maWxsUmVjdChsYXN0VmVydGV4WzBdLCBsYXN0VmVydGV4WzFdLCA1LCA1KTtcclxuLy8gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4vL1xyXG4vLyAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbi8vICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMjU1LDAsMC41KSc7XHJcbi8vICAgICAgICAgICAgY3R4LmZpbGxSZWN0KG5leHRWZXJ0ZXhbMl0sIG5leHRWZXJ0ZXhbM10sIDUsIDUpO1xyXG4vLyAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuY2xvc2VkKSB7XHJcbiAgICAgICAgY3R4LmJlemllckN1cnZlVG8obmV4dFZlcnRleFswXSwgbmV4dFZlcnRleFsxXSwgdmVydGljZXNbMF1bMl0sIHZlcnRpY2VzWzBdWzNdLCB2ZXJ0aWNlc1swXVs0XSwgdmVydGljZXNbMF1bNV0pO1xyXG4vLyAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuXHJcbi8vICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuLy8gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMjU1LDAsMCwwLjUpJztcclxuLy8gICAgICAgICAgICBjdHguZmlsbFJlY3QobmV4dFZlcnRleFswXSwgbmV4dFZlcnRleFsxXSwgNSwgNSk7XHJcbi8vICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHZlcnRpY2VzWzBdWzJdLCB2ZXJ0aWNlc1swXVszXSwgNSwgNSk7XHJcbi8vICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgIH1cclxufTtcclxuXHJcblBhdGgucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdLnY7XHJcbn07XHJcblxyXG5QYXRoLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gUG9seXN0YXIoZGF0YSkge1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuc3RhclR5cGUgPSBkYXRhLnN0YXJUeXBlO1xyXG5cclxuICAgIGlmIChkYXRhLnBvaW50cy5sZW5ndGggPiAxKSB0aGlzLnBvaW50cyA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9pbnRzKTtcclxuICAgIGVsc2UgdGhpcy5wb2ludHMgPSBuZXcgUHJvcGVydHkoZGF0YS5wb2ludHMpO1xyXG5cclxuICAgIGlmIChkYXRhLnBvc2l0aW9uLmxlbmd0aCA+IDEpIHRoaXMucG9zaXRpb24gPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuICAgIGVsc2UgdGhpcy5wb3NpdGlvbiA9IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uKTtcclxuXHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbi5sZW5ndGggPiAxKSB0aGlzLnJvdGF0aW9uID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICBlbHNlIHRoaXMucm90YXRpb24gPSBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcblxyXG4gICAgaWYgKGRhdGEuaW5uZXJSYWRpdXMubGVuZ3RoID4gMSkgdGhpcy5pbm5lclJhZGl1cyA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuaW5uZXJSYWRpdXMpO1xyXG4gICAgZWxzZSB0aGlzLmlubmVyUmFkaXVzID0gbmV3IFByb3BlcnR5KGRhdGEuaW5uZXJSYWRpdXMpO1xyXG5cclxuICAgIGlmIChkYXRhLm91dGVyUmFkaXVzLmxlbmd0aCA+IDEpIHRoaXMub3V0ZXJSYWRpdXMgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm91dGVyUmFkaXVzKTtcclxuICAgIGVsc2UgdGhpcy5vdXRlclJhZGl1cyA9IG5ldyBQcm9wZXJ0eShkYXRhLm91dGVyUmFkaXVzKTtcclxuXHJcbiAgICBpZiAoZGF0YS5pbm5lclJvdW5kbmVzcy5sZW5ndGggPiAxKSB0aGlzLmlubmVyUm91bmRuZXNzID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5pbm5lclJvdW5kbmVzcyk7XHJcbiAgICBlbHNlIHRoaXMuaW5uZXJSb3VuZG5lc3MgPSBuZXcgUHJvcGVydHkoZGF0YS5pbm5lclJvdW5kbmVzcyk7XHJcblxyXG4gICAgaWYgKGRhdGEub3V0ZXJSb3VuZG5lc3MubGVuZ3RoID4gMSkgdGhpcy5vdXRlclJvdW5kbmVzcyA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEub3V0ZXJSb3VuZG5lc3MpO1xyXG4gICAgZWxzZSB0aGlzLm91dGVyUm91bmRuZXNzID0gbmV3IFByb3BlcnR5KGRhdGEub3V0ZXJSb3VuZG5lc3MpO1xyXG5cclxuLy8gICAgY29uc29sZS5sb2codGhpcy5wb3NpdGlvbik7XHJcbn1cclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgdGltZSkge1xyXG5cclxuLy8gICAgY29uc29sZS5sb2codGhpcy5wb3NpdGlvbik7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IHRoaXMucG9pbnRzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBpbm5lclJhZGl1cyA9IHRoaXMuaW5uZXJSYWRpdXMuZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgb3V0ZXJSYWRpdXMgPSB0aGlzLm91dGVyUmFkaXVzLmdldFZhbHVlKHRpbWUpLFxyXG4gICAgICAgIGlubmVyUm91bmRuZXNzID0gdGhpcy5pbm5lclJvdW5kbmVzcy5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBvdXRlclJvdW5kbmVzcyA9IHRoaXMub3V0ZXJSb3VuZG5lc3MuZ2V0VmFsdWUodGltZSk7XHJcblxyXG4gICAgdmFyIHggPSBwb3NpdGlvblswXSxcclxuICAgICAgICB5ID0gcG9zaXRpb25bMV0sXHJcbiAgICAgICAgYmV6aWVyT2Zmc2V0ID0gb3V0ZXJSYWRpdXMgLyAyO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgudHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgY3R4Lm1vdmVUbygwLCAwIC0gb3V0ZXJSYWRpdXMpO1xyXG5cclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgY3R4LmZpbGxSZWN0KDAsIDAgLSBvdXRlclJhZGl1cywgNSwgNSk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzOyBpKyspIHtcclxuICAgICAgICBjdHgucm90YXRlKE1hdGguUEkgLyBwb2ludHMpO1xyXG5cclxuICAgICAgICB2YXIgYjF4ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBiZXppZXJPZmZzZXQsIDAgLSBvdXRlclJhZGl1cywgLTEgKiBNYXRoLlBJIC8gcG9pbnRzKVswXSxcclxuICAgICAgICAgICAgYjF5ID0gdGhpcy5yb3RhdGVQb2ludCgwLCAwLCBiZXppZXJPZmZzZXQsIDAgLSBvdXRlclJhZGl1cywgLTEgKiBNYXRoLlBJIC8gcG9pbnRzKVsxXSxcclxuICAgICAgICAgICAgYjJ4ID0gMCxcclxuICAgICAgICAgICAgYjJ5ID0gMCAtIGlubmVyUmFkaXVzO1xyXG5cclxuICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhiMXgsIGIxeSwgYjJ4LCBiMnksIDAsIDAgLSBpbm5lclJhZGl1cyk7XHJcblxyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiYmx1ZVwiO1xyXG4gICAgICAgIGN0eC5maWxsUmVjdChiMXgsIGIxeSwgNSwgNSk7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KGIyeCwgYjJ5LCA1LCA1KTtcclxuICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuLy8gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY3R4LnJvdGF0ZShNYXRoLlBJIC8gcG9pbnRzKTtcclxuXHJcbiAgICAgICAgdmFyIGIzeCA9IDAsXHJcbiAgICAgICAgICAgIGIzeSA9IDAgLSBpbm5lclJhZGl1cyxcclxuICAgICAgICAgICAgYjR4ID0gLWJlemllck9mZnNldCxcclxuICAgICAgICAgICAgYjR5ID0gMCAtIG91dGVyUmFkaXVzO1xyXG5cclxuICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyhiM3gsIGIzeSwgYjR4LCBiNHksIDAsIDAgLSBvdXRlclJhZGl1cyk7XHJcblxyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiZ3JlZW5cIjtcclxuICAgICAgICBjdHguZmlsbFJlY3QoYjN4LCBiM3ksIDUsIDUpO1xyXG4gICAgICAgIGN0eC5maWxsUmVjdChiNHgsIGI0eSwgNSwgNSk7XHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgICAgIGN0eC5maWxsUmVjdCgwLCAwIC0gb3V0ZXJSYWRpdXMsIDUsIDUpO1xyXG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4vLyAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgIH1cclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG5Qb2x5c3Rhci5wcm90b3R5cGUucm90YXRlUG9pbnQgPSBmdW5jdGlvbiAoY3gsIGN5LCB4LCB5LCByYWRpYW5zKSB7XHJcbiAgICB2YXIgY29zID0gTWF0aC5jb3MocmFkaWFucyksXHJcbiAgICAgICAgc2luID0gTWF0aC5zaW4ocmFkaWFucyksXHJcbiAgICAgICAgbnggPSAoY29zICogKHggLSBjeCkpIC0gKHNpbiAqICh5IC0gY3kpKSArIGN4LFxyXG4gICAgICAgIG55ID0gKHNpbiAqICh4IC0gY3gpKSArIChjb3MgKiAoeSAtIGN5KSkgKyBjeTtcclxuICAgIHJldHVybiBbbngsIG55XTtcclxufTtcclxuXHJcblBvbHlzdGFyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMucG9pbnRzLnJlc2V0KCk7XHJcbiAgICB0aGlzLnBvc2l0aW9uLnJlc2V0KCk7XHJcbiAgICB0aGlzLmlubmVyUmFkaXVzLnJlc2V0KCk7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzLnJlc2V0KCk7XHJcbiAgICB0aGlzLmlubmVyUm91bmRuZXNzLnJlc2V0KCk7XHJcbiAgICB0aGlzLm91dGVyUm91bmRuZXNzLnJlc2V0KCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvbHlzdGFyOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIFByb3BlcnR5KGRhdGEpIHtcclxuICAgIGlmICghKGRhdGEgaW5zdGFuY2VvZiBBcnJheSkpIHJldHVybiBudWxsO1xyXG4gICAgdGhpcy5mcmFtZXMgPSBkYXRhO1xyXG59XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJhbWVzWzBdLnY7XHJcbn07XHJcblxyXG5Qcm9wZXJ0eS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3BlcnR5OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFJlY3QoZGF0YSkge1xyXG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xyXG5cclxuICAgIGlmIChkYXRhLnNpemUubGVuZ3RoID4gMSkgdGhpcy5zaXplID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5zaXplKTtcclxuICAgIGVsc2UgdGhpcy5zaXplID0gbmV3IFByb3BlcnR5KGRhdGEuc2l6ZSk7XHJcblxyXG4gICAgaWYgKGRhdGEucG9zaXRpb24ubGVuZ3RoID4gMSkgdGhpcy5wb3NpdGlvbiA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG4gICAgZWxzZSB0aGlzLnBvc2l0aW9uID0gbmV3IFByb3BlcnR5KGRhdGEucG9zaXRpb24pO1xyXG5cclxuICAgIGlmIChkYXRhLnJvdW5kbmVzcy5sZW5ndGggPiAxKSB0aGlzLnJvdW5kbmVzcyA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEucm91bmRuZXNzKTtcclxuICAgIGVsc2UgdGhpcy5yb3VuZG5lc3MgPSBuZXcgUHJvcGVydHkoZGF0YS5yb3VuZG5lc3MpO1xyXG5cclxufVxyXG5cclxuUmVjdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuXHJcbiAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZS5nZXRWYWx1ZSh0aW1lKSxcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uZ2V0VmFsdWUodGltZSksXHJcbiAgICAgICAgcm91bmRuZXNzID0gdGhpcy5yb3VuZG5lc3MuZ2V0VmFsdWUodGltZSk7XHJcblxyXG4gICAgaWYgKHNpemVbMF0gPCAyICogcm91bmRuZXNzKSByb3VuZG5lc3MgPSBzaXplWzBdIC8gMjtcclxuICAgIGlmIChzaXplWzFdIDwgMiAqIHJvdW5kbmVzcykgcm91bmRuZXNzID0gc2l6ZVsxXSAvIDI7XHJcblxyXG4gICAgdmFyIHggPSBwb3NpdGlvblswXSAtIHNpemVbMF0gLyAyLFxyXG4gICAgICAgIHkgPSBwb3NpdGlvblsxXSAtIHNpemVbMV0gLyAyO1xyXG5cclxuICAgIGN0eC5tb3ZlVG8oeCArIHJvdW5kbmVzcywgeSk7XHJcbiAgICBjdHguYXJjVG8oeCArIHNpemVbMF0sIHksIHggKyBzaXplWzBdLCB5ICsgc2l6ZVsxXSwgcm91bmRuZXNzKTtcclxuICAgIGN0eC5hcmNUbyh4ICsgc2l6ZVswXSwgeSArIHNpemVbMV0sIHgsIHkgKyBzaXplWzFdLCByb3VuZG5lc3MpO1xyXG4gICAgY3R4LmFyY1RvKHgsIHkgKyBzaXplWzFdLCB4LCB5LCByb3VuZG5lc3MpO1xyXG4gICAgY3R4LmFyY1RvKHgsIHksIHggKyBzaXplWzBdLCB5LCByb3VuZG5lc3MpO1xyXG5cclxufTtcclxuXHJcblJlY3QucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zaXplLnJlc2V0KCk7XHJcbiAgICB0aGlzLnBvc2l0aW9uLnJlc2V0KCk7XHJcbiAgICB0aGlzLnJvdW5kbmVzcy5yZXNldCgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWN0OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBHcm91cCA9IHJlcXVpcmUoJy4vR3JvdXAnKTtcclxuXHJcbmZ1bmN0aW9uIFJ1bnRpbWUoZGF0YSwgY2FudmFzKSB7XHJcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICB0aGlzLmR1cmF0aW9uID0gZGF0YS5kdXJhdGlvbjtcclxuICAgIHRoaXMuYmFzZVdpZHRoID0gZGF0YS53aWR0aDtcclxuICAgIHRoaXMuYmFzZUhlaWdodCA9IGRhdGEuaGVpZ2h0O1xyXG4gICAgdGhpcy5yYXRpbyA9IGRhdGEud2lkdGggLyBkYXRhLmhlaWdodDtcclxuXHJcbiAgICB0aGlzLmJ1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5idWZmZXIud2lkdGggPSB0aGlzLmJhc2VXaWR0aDtcclxuICAgIHRoaXMuYnVmZmVyLmhlaWdodCA9IHRoaXMuYmFzZUhlaWdodDtcclxuICAgIHRoaXMuYnVmZmVyQ3R4ID0gdGhpcy5idWZmZXIuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBzLnB1c2gobmV3IEdyb3VwKGRhdGEuZ3JvdXBzW2ldLCB0aGlzLmJ1ZmZlckN0eCkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5yZXNldCgpO1xyXG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5zZXRXaWR0aC5iaW5kKHRoaXMpLCBmYWxzZSk7XHJcbiAgICB0aGlzLnNldFdpZHRoKCk7XHJcbn1cclxuXHJcblJ1bnRpbWUucHJvdG90eXBlID0ge1xyXG5cclxuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFydFRpbWUgPSB0aGlzLnRpbWU7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgIHRoaXMuZHJhdygpO1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXVzZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZWRUaW1lID0gdGhpcy5jb21wVGltZTtcclxuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XHJcbiAgICAgICAgdGhpcy50aW1lID0gdGltZTtcclxuICAgICAgICBpZiAodGhpcy5zdGFydGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcFRpbWUgPSB0aGlzLnRpbWUgLSB0aGlzLnN0YXJ0VGltZSArIHRoaXMucGF1c2VkVGltZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcFRpbWUgPD0gdGhpcy5kdXJhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvb3ApIHRoaXMuc3RhcnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZHJhdzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuY3R4LnNhdmUoKTtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYXNlV2lkdGgsIHRoaXMuYmFzZUhlaWdodCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wVGltZSA+PSB0aGlzLmdyb3Vwc1tpXS5pbiAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wVGltZSA8IHRoaXMuZ3JvdXBzW2ldLm91dCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0uZHJhdyh0aGlzLmN0eCwgdGhpcy5jb21wVGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jdHgucmVzdG9yZSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcclxuICAgICAgICB0aGlzLnBhdXNlZFRpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuY29tcFRpbWUgPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ncm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5ncm91cHNbaV0ucmVzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFdpZHRoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGZhY3RvciA9IDE7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNIRCkgZmFjdG9yID0gMjtcclxuICAgICAgICB2YXIgd2lkdGggPSB0aGlzLmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aDtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICogZmFjdG9yO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHdpZHRoIC8gdGhpcy5yYXRpbyAqIGZhY3RvcjtcclxuICAgICAgICB0aGlzLnNjYWxlID0gd2lkdGggLyB0aGlzLmJhc2VXaWR0aCAqIGZhY3RvcjtcclxuICAgICAgICB0aGlzLmN0eC50cmFuc2Zvcm0odGhpcy5zY2FsZSwgMCwgMCwgdGhpcy5zY2FsZSwgMCwgMCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJ1bnRpbWU7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByb3BlcnR5ID0gcmVxdWlyZSgnLi9Qcm9wZXJ0eScpLFxyXG4gICAgQW5pbWF0ZWRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vQW5pbWF0ZWRQcm9wZXJ0eScpO1xyXG5cclxuZnVuY3Rpb24gU3Ryb2tlKGRhdGEpIHtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5qb2luID0gZGF0YS5qb2luO1xyXG4gICAgICAgIHRoaXMuY2FwID0gZGF0YS5jYXA7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLm1pdGVyTGltaXQpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEubWl0ZXJMaW1pdC5sZW5ndGggPiAxKSB0aGlzLm1pdGVyTGltaXQgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMubWl0ZXJMaW1pdCA9IG5ldyBQcm9wZXJ0eShkYXRhLm1pdGVyTGltaXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY29sb3IubGVuZ3RoID4gMSkgdGhpcy5jb2xvciA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuY29sb3IpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5jb2xvciA9IG5ldyBQcm9wZXJ0eShkYXRhLmNvbG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEub3BhY2l0eS5sZW5ndGggPiAxKSB0aGlzLm9wYWNpdHkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5vcGFjaXR5ID0gbmV3IFByb3BlcnR5KGRhdGEub3BhY2l0eSk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLndpZHRoLmxlbmd0aCA+IDEpIHRoaXMud2lkdGggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLndpZHRoKTtcclxuICAgICAgICBlbHNlIHRoaXMud2lkdGggPSBuZXcgUHJvcGVydHkoZGF0YS53aWR0aCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblN0cm9rZS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiAodGltZSkge1xyXG4gICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvci5nZXRWYWx1ZSh0aW1lKTtcclxuLy8gICAgY29uc29sZS5sb2coY29sb3IpO1xyXG4gICAgdmFyIG9wYWNpdHkgPSB0aGlzLm9wYWNpdHkuZ2V0VmFsdWUodGltZSk7XHJcbiAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoY29sb3JbMF0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMV0pICsgJywgJyArIE1hdGgucm91bmQoY29sb3JbMl0pICsgJywgJyArIG9wYWNpdHkgKyAnKSc7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnNldFN0cm9rZSA9IGZ1bmN0aW9uIChjdHgsIHRpbWUpIHtcclxuICAgIHZhciBzdHJva2VDb2xvciA9IHRoaXMuZ2V0VmFsdWUodGltZSk7XHJcbiAgICB2YXIgc3Ryb2tlV2lkdGggPSB0aGlzLndpZHRoLmdldFZhbHVlKHRpbWUpO1xyXG4gICAgdmFyIHN0cm9rZUpvaW4gPSB0aGlzLmpvaW47XHJcbiAgICBpZiAoc3Ryb2tlSm9pbiA9PT0gJ21pdGVyJykgdmFyIG1pdGVyTGltaXQgPSB0aGlzLm1pdGVyTGltaXQuZ2V0VmFsdWUodGltZSk7XHJcblxyXG4gICAgY3R4LmxpbmVXaWR0aCA9IHN0cm9rZVdpZHRoO1xyXG4gICAgY3R4LmxpbmVKb2luID0gc3Ryb2tlSm9pbjtcclxuICAgIGlmIChtaXRlckxpbWl0KSBjdHgubWl0ZXJMaW1pdCA9IG1pdGVyTGltaXQ7XHJcbiAgICBjdHgubGluZUNhcCA9IHRoaXMuY2FwO1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3I7XHJcbn07XHJcblxyXG5TdHJva2UucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5jb2xvci5yZXNldCgpO1xyXG4gICAgdGhpcy5vcGFjaXR5LnJlc2V0KCk7XHJcbiAgICB0aGlzLndpZHRoLnJlc2V0KCk7XHJcbiAgICBpZiAodGhpcy5taXRlckxpbWl0KSB0aGlzLm1pdGVyTGltaXQucmVzZXQoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3Ryb2tlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vUHJvcGVydHknKSxcclxuICAgIEFuaW1hdGVkUHJvcGVydHkgPSByZXF1aXJlKCcuL0FuaW1hdGVkUHJvcGVydHknKTtcclxuXHJcbmZ1bmN0aW9uIFRyYW5zZm9ybShkYXRhKSB7XHJcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcblxyXG4gICAgaWYgKGRhdGEuYW5jaG9yWCkge1xyXG4gICAgICAgIGlmIChkYXRhLmFuY2hvclgubGVuZ3RoID4gMSkgdGhpcy5hbmNob3JYID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5hbmNob3JYKTtcclxuICAgICAgICBlbHNlIHRoaXMuYW5jaG9yWCA9IG5ldyBQcm9wZXJ0eShkYXRhLmFuY2hvclgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLmFuY2hvclkpIHtcclxuICAgICAgICBpZiAoZGF0YS5hbmNob3JZLmxlbmd0aCA+IDEpIHRoaXMuYW5jaG9yWSA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuYW5jaG9yWSk7XHJcbiAgICAgICAgZWxzZSB0aGlzLmFuY2hvclkgPSBuZXcgUHJvcGVydHkoZGF0YS5hbmNob3JZKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5wb3NpdGlvblgpIHtcclxuICAgICAgICBpZiAoZGF0YS5wb3NpdGlvblgubGVuZ3RoID4gMSkgdGhpcy5wb3NpdGlvblggPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWCk7XHJcbiAgICAgICAgZWxzZSB0aGlzLnBvc2l0aW9uWCA9IG5ldyBQcm9wZXJ0eShkYXRhLnBvc2l0aW9uWCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEucG9zaXRpb25ZKSB7XHJcbiAgICAgICAgaWYgKGRhdGEucG9zaXRpb25ZLmxlbmd0aCA+IDEpIHRoaXMucG9zaXRpb25ZID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5wb3NpdGlvblkpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5wb3NpdGlvblkgPSBuZXcgUHJvcGVydHkoZGF0YS5wb3NpdGlvblkpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLnNjYWxlWCkge1xyXG4gICAgICAgIGlmIChkYXRhLnNjYWxlWC5sZW5ndGggPiAxKSB0aGlzLnNjYWxlWCA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2NhbGVYKTtcclxuICAgICAgICBlbHNlIHRoaXMuc2NhbGVYID0gbmV3IFByb3BlcnR5KGRhdGEuc2NhbGVYKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5zY2FsZVkpIHtcclxuICAgICAgICBpZiAoZGF0YS5zY2FsZVkubGVuZ3RoID4gMSkgdGhpcy5zY2FsZVkgPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnNjYWxlWSk7XHJcbiAgICAgICAgZWxzZSB0aGlzLnNjYWxlWSA9IG5ldyBQcm9wZXJ0eShkYXRhLnNjYWxlWSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEuc2tldykge1xyXG4gICAgICAgIGlmIChkYXRhLnNrZXcubGVuZ3RoID4gMSkgdGhpcy5za2V3ID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5za2V3KTtcclxuICAgICAgICBlbHNlIHRoaXMuc2tldyA9IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXcpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLnNrZXdBeGlzKSB7XHJcbiAgICAgICAgaWYgKGRhdGEuc2tld0F4aXMubGVuZ3RoID4gMSkgdGhpcy5za2V3QXhpcyA9IG5ldyBBbmltYXRlZFByb3BlcnR5KGRhdGEuc2tld0F4aXMpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5za2V3QXhpcyA9IG5ldyBQcm9wZXJ0eShkYXRhLnNrZXdBeGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGF0YS5yb3RhdGlvbikge1xyXG4gICAgICAgIGlmIChkYXRhLnJvdGF0aW9uLmxlbmd0aCA+IDEpIHRoaXMucm90YXRpb24gPSBuZXcgQW5pbWF0ZWRQcm9wZXJ0eShkYXRhLnJvdGF0aW9uKTtcclxuICAgICAgICBlbHNlIHRoaXMucm90YXRpb24gPSBuZXcgUHJvcGVydHkoZGF0YS5yb3RhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEub3BhY2l0eSkge1xyXG4gICAgICAgIGlmIChkYXRhLm9wYWNpdHkubGVuZ3RoID4gMSkgdGhpcy5vcGFjaXR5ID0gbmV3IEFuaW1hdGVkUHJvcGVydHkoZGF0YS5vcGFjaXR5KTtcclxuICAgICAgICBlbHNlIHRoaXMub3BhY2l0eSA9IG5ldyBQcm9wZXJ0eShkYXRhLm9wYWNpdHkpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY3R4LCB0aW1lKSB7XHJcbiAgICB2YXIgYW5jaG9yWCA9IHRoaXMuYW5jaG9yWCA/IHRoaXMuYW5jaG9yWC5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgYW5jaG9yWSA9IHRoaXMuYW5jaG9yWSA/IHRoaXMuYW5jaG9yWS5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgcm90YXRpb24gPSB0aGlzLnJvdGF0aW9uID8gdGhpcy5kZWcycmFkKHRoaXMucm90YXRpb24uZ2V0VmFsdWUodGltZSkpIDogMCxcclxuICAgICAgICBza2V3ID0gdGhpcy5za2V3ID8gdGhpcy5kZWcycmFkKHRoaXMuc2tldy5nZXRWYWx1ZSh0aW1lKSkgOiAwLFxyXG4gICAgICAgIHNrZXdBeGlzID0gdGhpcy5za2V3QXhpcyA/IHRoaXMuZGVnMnJhZCh0aGlzLnNrZXdBeGlzLmdldFZhbHVlKHRpbWUpKSA6IDAsXHJcbiAgICAgICAgcG9zaXRpb25YID0gdGhpcy5wb3NpdGlvblggPyB0aGlzLnBvc2l0aW9uWC5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgcG9zaXRpb25ZID0gdGhpcy5wb3NpdGlvblkgPyB0aGlzLnBvc2l0aW9uWS5nZXRWYWx1ZSh0aW1lKSA6IDAsXHJcbiAgICAgICAgc2NhbGVYID0gdGhpcy5zY2FsZVggPyB0aGlzLnNjYWxlWC5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgc2NhbGVZID0gdGhpcy5zY2FsZVkgPyB0aGlzLnNjYWxlWS5nZXRWYWx1ZSh0aW1lKSA6IDEsXHJcbiAgICAgICAgb3BhY2l0eSA9IHRoaXMub3BhY2l0eSA/IHRoaXMub3BhY2l0eS5nZXRWYWx1ZSh0aW1lKSAqIGN0eC5nbG9iYWxBbHBoYSA6IGN0eC5nbG9iYWxBbHBoYTsgLy8gRklYTUUgd3JvbmcgdHJhbnNwYXJlbmN5IGlmIG5lc3RlZFxyXG5cclxuICAgIC8vb3JkZXIgdmVyeSB2ZXJ5IGltcG9ydGFudCA6KVxyXG4gICAgY3R4LnRyYW5zZm9ybSgxLCAwLCAwLCAxLCBwb3NpdGlvblggLSBhbmNob3JYLCBwb3NpdGlvblkgLSBhbmNob3JZKTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCByb3RhdGlvbiwgYW5jaG9yWCwgYW5jaG9yWSk7XHJcbiAgICB0aGlzLnNldFNrZXcoY3R4LCBza2V3LCBza2V3QXhpcywgYW5jaG9yWCwgYW5jaG9yWSk7XHJcbiAgICB0aGlzLnNldFNjYWxlKGN0eCwgc2NhbGVYLCBzY2FsZVksIGFuY2hvclgsIGFuY2hvclkpO1xyXG4gICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0Um90YXRpb24gPSBmdW5jdGlvbiAoY3R4LCByYWQsIHgsIHkpIHtcclxuICAgIHZhciBjID0gTWF0aC5jb3MocmFkKTtcclxuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcclxuICAgIHZhciBkeCA9IHggLSBjICogeCArIHMgKiB5O1xyXG4gICAgdmFyIGR5ID0geSAtIHMgKiB4IC0gYyAqIHk7XHJcbiAgICBjdHgudHJhbnNmb3JtKGMsIHMsIC1zLCBjLCBkeCwgZHkpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIChjdHgsIHN4LCBzeSwgeCwgeSkge1xyXG4gICAgY3R4LnRyYW5zZm9ybShzeCwgMCwgMCwgc3ksIC14ICogc3ggKyB4LCAteSAqIHN5ICsgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNrZXcgPSBmdW5jdGlvbiAoY3R4LCBza2V3LCBheGlzLCB4LCB5KSB7XHJcbiAgICB2YXIgdCA9IE1hdGgudGFuKC1za2V3KTtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oY3R4LCAtYXhpcywgeCwgeSk7XHJcbiAgICBjdHgudHJhbnNmb3JtKDEsIDAsIHQsIDEsIC15ICogdCwgMCk7XHJcbiAgICB0aGlzLnNldFJvdGF0aW9uKGN0eCwgYXhpcywgeCwgeSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XHJcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmFuY2hvclgpIHRoaXMuYW5jaG9yWC5yZXNldCgpO1xyXG4gICAgaWYgKHRoaXMuYW5jaG9yWSkgdGhpcy5hbmNob3JZLnJlc2V0KCk7XHJcbiAgICBpZiAodGhpcy5yb3RhdGlvbikgdGhpcy5yb3RhdGlvbi5yZXNldCgpO1xyXG4gICAgaWYgKHRoaXMuc2tldykgdGhpcy5za2V3LnJlc2V0KCk7XHJcbiAgICBpZiAodGhpcy5za2V3QXhpcykgdGhpcy5za2V3QXhpcy5yZXNldCgpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25YKSB0aGlzLnBvc2l0aW9uWC5yZXNldCgpO1xyXG4gICAgaWYgKHRoaXMucG9zaXRpb25ZKSB0aGlzLnBvc2l0aW9uWS5yZXNldCgpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVYKSB0aGlzLnNjYWxlWC5yZXNldCgpO1xyXG4gICAgaWYgKHRoaXMuc2NhbGVZKSB0aGlzLnNjYWxlWS5yZXNldCgpO1xyXG4gICAgaWYgKHRoaXMub3BhY2l0eSkgdGhpcy5vcGFjaXR5LnJlc2V0KCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTsiXX0=
(12)
});
