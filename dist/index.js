(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["AE2Canvas"] = factory();
	else
		root["AE2Canvas"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 12);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class Property {
    constructor(data) {
        this.frames = data;
    }

    getValue() {
        return this.frames[0].v;
    }

    setKeyframes(time) {}

    reset(reversed) {}
}

/* harmony default export */ __webpack_exports__["a"] = (Property);

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing__);



class AnimatedProperty extends __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */] {

    constructor(data) {
        super(data);
        this.frameCount = this.frames.length;
    }

    lerp(a, b, t) {
        if (a instanceof Array) {
            const arr = [];
            for (let i = 0; i < a.length; i++) {
                arr[i] = a[i] + t * (b[i] - a[i]);
            }
            return arr;
        } else {
            return a + t * (b - a);
        }
    }

    setEasing() {
        if (this.nextFrame.easeIn) {
            this.easing = new __WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing___default.a(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
        } else {
            this.easing = null;
        }
    }

    getValue(time) {
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
    }

    setKeyframes(time) {
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

        for (let i = 1; i < this.frameCount; i++) {
            if (time >= this.frames[i - 1].t && time <= this.frames[i].t) {
                this.pointer = i;
                this.lastFrame = this.frames[i - 1];
                this.nextFrame = this.frames[i];
                this.onKeyframeChange();
                return;
            }
        }
    }

    onKeyframeChange() {
        this.setEasing();
    }

    getElapsed(time) {
        const delta = time - this.lastFrame.t;
        const duration = this.nextFrame.t - this.lastFrame.t;
        let elapsed = delta / duration;

        if (elapsed > 1) elapsed = 1;else if (elapsed < 0) elapsed = 0;else if (this.easing) elapsed = this.easing(elapsed);
        return elapsed;
    }

    getValueAtTime(time) {
        return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
    }

    reset(reversed) {
        this.finished = false;
        this.started = false;
        this.pointer = reversed ? this.frameCount - 1 : 1;
        this.nextFrame = this.frames[this.pointer];
        this.lastFrame = this.frames[this.pointer - 1];
        this.onKeyframeChange();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (AnimatedProperty);

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__objects_Path__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__objects_AnimatedPath__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__transform_Transform__ = __webpack_require__(17);




class BaseLayer {

    constructor(data) {
        this.index = data.index;
        this.in = data.in || 0;
        this.out = data.out;
        if (data.parent) this.parent = data.parent;
        this.transform = new __WEBPACK_IMPORTED_MODULE_2__transform_Transform__["a" /* default */](data.transform);

        if (data.masks) {
            this.masks = data.masks.map(mask => mask.isAnimated ? new __WEBPACK_IMPORTED_MODULE_1__objects_AnimatedPath__["a" /* default */](mask) : new __WEBPACK_IMPORTED_MODULE_0__objects_Path__["a" /* default */](mask));
        }
    }

    draw(ctx, time) {
        ctx.save();

        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.update(ctx, time);

        if (this.masks) {
            ctx.beginPath();
            this.masks.forEach(mask => mask.draw(ctx, time));
            ctx.clip();
        }
    }

    setParentTransform(ctx, time) {
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.update(ctx, time);
    }

    setKeyframes(time) {
        this.transform.setKeyframes(time);
        if (this.masks) this.masks.forEach(mask => mask.setKeyframes(time));
    }

    reset(reversed) {
        this.transform.reset(reversed);
        if (this.masks) this.masks.forEach(mask => mask.reset(reversed));
    }
}

/* harmony default export */ __webpack_exports__["a"] = (BaseLayer);

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_Bezier__ = __webpack_require__(6);


class Path {

    constructor(data) {
        this.closed = data.closed;
        this.frames = data.frames;
    }

    draw(ctx, time, trim) {
        const frame = this.getValue(time);
        const vertices = frame.v;

        if (trim) {
            if (trim.start === 0 && trim.end === 0 || trim.start === 1 && trim.end === 1) {
                return;
            } else {
                trim = this.getTrimValues(trim, frame);
            }
        }

        for (let j = 1; j < vertices.length; j++) {
            var nextVertex = vertices[j];
            const lastVertex = vertices[j - 1];

            if (trim) {
                let tv;

                if (j === 1 && trim.startIndex !== 0) {
                    ctx.moveTo(lastVertex[4], lastVertex[5]);
                } else if (j === trim.startIndex + 1 && j === trim.endIndex + 1) {
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
    }

    getValue() {
        return this.frames[0];
    }

    getTrimValues(trim, frame) {
        let i;

        const actualTrim = {
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

        const totalLen = this.sumArray(frame.len);
        let trimAtLen;

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
    }

    trim(lastVertex, nextVertex, from, to, len) {

        if (from === 0 && to === 1) {
            return {
                start: lastVertex,
                end: nextVertex
            };
        }

        if (this.isStraight(lastVertex[4], lastVertex[5], lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5])) {
            startVertex = [this.lerp(lastVertex[0], nextVertex[0], from), this.lerp(lastVertex[1], nextVertex[1], from), this.lerp(lastVertex[2], nextVertex[2], from), this.lerp(lastVertex[3], nextVertex[3], from), this.lerp(lastVertex[4], nextVertex[4], from), this.lerp(lastVertex[5], nextVertex[5], from)];

            endVertex = [this.lerp(lastVertex[0], nextVertex[0], to), this.lerp(lastVertex[1], nextVertex[1], to), this.lerp(lastVertex[2], nextVertex[2], to), this.lerp(lastVertex[3], nextVertex[3], to), this.lerp(lastVertex[4], nextVertex[4], to), this.lerp(lastVertex[5], nextVertex[5], to)];
        } else {
            this.bezier = new __WEBPACK_IMPORTED_MODULE_0__utils_Bezier__["a" /* default */]([lastVertex[4], lastVertex[5], lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]]);
            this.bezier.getLength(len);
            from = this.bezier.map(from);
            to = this.bezier.map(to);
            to = (to - from) / (1 - from);

            let e1;
            let f1;
            let g1;
            let h1;
            let j1;
            let k1;
            let e2;
            let f2;
            let g2;
            let h2;
            let j2;
            let k2;
            var startVertex;
            var endVertex;

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
    }

    lerp(a, b, t) {
        const s = 1 - t;
        return a * s + b * t;
    }

    sumArray(arr) {
        function add(a, b) {
            return a + b;
        }

        return arr.reduce(add);
    }

    isStraight(startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY) {
        return startX === ctrl1X && startY === ctrl1Y && endX === ctrl2X && endY === ctrl2Y;
    }

    setKeyframes(time) {}

    reset(reversed) {}
}

/* harmony default export */ __webpack_exports__["a"] = (Path);

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return update; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return autoPlay; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return add; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return remove; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_shim__ = __webpack_require__(13);


const _animations = [];
let _animationsLength = 0;

let _autoPlay = false;
let _rafId;

const update = time => {
    if (_autoPlay) {
        _rafId = Object(__WEBPACK_IMPORTED_MODULE_0__utils_shim__["a" /* requestAnimationFrame */])(update);
    }
    time = time !== undefined ? time : performance.now();

    for (let i = 0; i < _animationsLength; i++) {
        _animations[i].update(time);
    }
};

const autoPlay = auto => {
    _autoPlay = auto;
    _autoPlay ? _rafId = Object(__WEBPACK_IMPORTED_MODULE_0__utils_shim__["a" /* requestAnimationFrame */])(update) : cancelAnimationFrame(_rafId);
};

function add(tween) {
    _animations.push(tween);
    _animationsLength = _animations.length;
}

function remove(tween) {
    const i = _animations.indexOf(tween);
    if (i > -1) {
        _animations.splice(i, 1);
        _animationsLength = _animations.length;
    }
}



/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseLayer__ = __webpack_require__(2);


class ImageLayer extends __WEBPACK_IMPORTED_MODULE_0__BaseLayer__["a" /* default */] {
    constructor(data) {
        super(data);
        this.source = data.source;
        this.isLoaded = false;
    }

    preload(cb) {
        return new Promise((resolve, reject) => {
            this.img = new Image();
            this.img.onload = () => {
                this.isLoaded = true;
                resolve();
            };
            this.img.src = this.source;
        });
    }

    draw(ctx, time) {
        super.draw(ctx, time);

        ctx.drawImage(this.img, 0, 0);

        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (ImageLayer);

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class Bezier {

    constructor(path) {
        this.path = path;
    }

    getLength(len) {
        this.steps = Math.max(Math.floor(len / 10), 1);
        this.arcLengths = new Array(this.steps + 1);
        this.arcLengths[0] = 0;

        let ox = this.cubicN(0, this.path[0], this.path[2], this.path[4], this.path[6]);
        let oy = this.cubicN(0, this.path[1], this.path[3], this.path[5], this.path[7]);
        let clen = 0;
        const iterator = 1 / this.steps;

        for (let i = 1; i <= this.steps; i += 1) {
            const x = this.cubicN(i * iterator, this.path[0], this.path[2], this.path[4], this.path[6]);
            const y = this.cubicN(i * iterator, this.path[1], this.path[3], this.path[5], this.path[7]);
            const dx = ox - x;
            const dy = oy - y;

            clen += Math.sqrt(dx * dx + dy * dy);
            this.arcLengths[i] = clen;

            ox = x;
            oy = y;
        }

        this.length = clen;
    }

    map(u) {
        const targetLength = u * this.arcLengths[this.steps];
        let low = 0;
        let high = this.steps;
        let index = 0;

        while (low < high) {
            index = low + ((high - low) / 2 | 0);
            if (this.arcLengths[index] < targetLength) {
                low = index + 1;
            } else {
                high = index;
            }
        }
        if (this.arcLengths[index] > targetLength) {
            index--;
        }

        const lengthBefore = this.arcLengths[index];
        if (lengthBefore === targetLength) {
            return index / this.steps;
        } else {
            return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.steps;
        }
    }

    getValues(elapsed) {
        const t = this.map(elapsed);
        const x = this.cubicN(t, this.path[0], this.path[2], this.path[4], this.path[6]);
        const y = this.cubicN(t, this.path[1], this.path[3], this.path[5], this.path[7]);

        return [x, y];
    }

    cubicN(pct, a, b, c, d) {
        const t2 = pct * pct;
        const t3 = t2 * pct;
        return a + (-a * 3 + pct * (3 * a - a * pct)) * pct + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct + (c * 3 - c * 3 * pct) * t2 + d * t3;
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Bezier);

/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Path__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing__);



class AnimatedPath extends __WEBPACK_IMPORTED_MODULE_0__Path__["a" /* default */] {

    constructor(data) {
        super(data);
        this.frameCount = this.frames.length;
    }

    getValue(time) {
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
    }

    setKeyframes(time) {
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

        for (let i = 1; i < this.frameCount; i++) {
            if (time >= this.frames[i - 1].t && time <= this.frames[i]) {
                this.pointer = i;
                this.lastFrame = this.frames[i - 1];
                this.nextFrame = this.frames[i];
                this.onKeyframeChange();
                return;
            }
        }
    }

    onKeyframeChange() {
        this.setEasing();
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    setEasing() {
        if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
            this.easing = new __WEBPACK_IMPORTED_MODULE_1__utils_BezierEasing___default.a(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
        } else {
            this.easing = null;
        }
    }

    getValueAtTime(time) {
        const delta = time - this.lastFrame.t;
        const duration = this.nextFrame.t - this.lastFrame.t;
        let elapsed = delta / duration;
        if (elapsed > 1) elapsed = 1;else if (elapsed < 0) elapsed = 0;else if (this.easing) elapsed = this.easing(elapsed);
        const actualVertices = [];
        const actualLength = [];

        for (let i = 0; i < this.verticesCount; i++) {
            const cp1x = this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed);
            const cp1y = this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed);
            const cp2x = this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed);
            const cp2y = this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed);
            const x = this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed);
            const y = this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed);

            actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y]);
        }

        for (let j = 0; j < this.verticesCount - 1; j++) {
            actualLength.push(this.lerp(this.lastFrame.len[j], this.nextFrame.len[j], elapsed));
        }

        return {
            v: actualVertices,
            len: actualLength
        };
    }

    reset(reversed) {
        this.finished = false;
        this.started = false;
        this.pointer = reversed ? this.frameCount - 1 : 1;
        this.nextFrame = this.frames[this.pointer];
        this.lastFrame = this.frames[this.pointer - 1];
        this.onKeyframeChange();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (AnimatedPath);

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * BezierEasing - use bezier curve for transition easing function
 * is based on Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = BezierEasing(0.25, 0.1, 0.25, 1.0)
 * spline(x) => returns the easing value | x must be in [0, 1] range
 *
 */
(function (definition) {
    if (true) {
        module.exports = definition();
    } else if (typeof window.define === 'function' && window.define.amd) {
        window.define([], definition);
    } else {
        window.BezierEasing = definition();
    }
})(function () {

    // These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === "function";

    function BezierEasing(mX1, mY1, mX2, mY2) {

        // Validate arguments
        if (arguments.length !== 4) {
            throw new Error("BezierEasing requires 4 arguments.");
        }
        for (var i = 0; i < 4; ++i) {
            if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
                throw new Error("BezierEasing arguments should be integers.");
            }
        }
        if (mX1 < 0 || mX1 > 1 || mX2 < 0 || mX2 > 1) {
            throw new Error("BezierEasing x values must be in [0, 1] range.");
        }

        var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

        function A(aA1, aA2) {
            return 1.0 - 3.0 * aA2 + 3.0 * aA1;
        }
        function B(aA1, aA2) {
            return 3.0 * aA2 - 6.0 * aA1;
        }
        function C(aA1) {
            return 3.0 * aA1;
        }

        // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
        function calcBezier(aT, aA1, aA2) {
            return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
        }

        // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
        function getSlope(aT, aA1, aA2) {
            return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        }

        function newtonRaphsonIterate(aX, aGuessT) {
            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
                var currentSlope = getSlope(aGuessT, mX1, mX2);
                if (currentSlope === 0.0) return aGuessT;
                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            }
            return aGuessT;
        }

        function calcSampleValues() {
            for (var i = 0; i < kSplineTableSize; ++i) {
                mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
        }

        function binarySubdivide(aX, aA, aB) {
            var currentX,
                currentT,
                i = 0;
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

        function getTForX(aX) {
            var intervalStart = 0.0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;

            for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }
            --currentSample;

            // Interpolate to provide an initial guess for t
            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]);
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

        if (mX1 != mY1 || mX2 != mY2) calcSampleValues();

        var f = function (aX) {
            if (mX1 === mY1 && mX2 === mY2) return aX; // linear
            // Because JavaScript number are imprecise, we should guarantee the extremes are right.
            if (aX === 0) return 0;
            if (aX === 1) return 1;
            return calcBezier(getTForX(aX), mY1, mY2);
        };
        var str = "BezierEasing(" + [mX1, mY1, mX2, mY2] + ")";
        f.toString = function () {
            return str;
        };

        return f;
    }

    // CSS mapping
    BezierEasing.css = {
        "ease": BezierEasing(0.25, 0.1, 0.25, 1.0),
        "linear": BezierEasing(0.00, 0.0, 1.00, 1.0),
        "ease-in": BezierEasing(0.42, 0.0, 1.00, 1.0),
        "ease-out": BezierEasing(0.00, 0.0, 0.58, 1.0),
        "ease-in-out": BezierEasing(0.42, 0.0, 0.58, 1.0)
    };

    return BezierEasing;
});

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseLayer__ = __webpack_require__(2);


class NullLayer extends __WEBPACK_IMPORTED_MODULE_0__BaseLayer__["a" /* default */] {
    constructor(data) {
        super(data);
    }

    draw(ctx, time) {
        super.draw(ctx, time);
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (NullLayer);

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseLayer__ = __webpack_require__(2);


class TextLayer extends __WEBPACK_IMPORTED_MODULE_0__BaseLayer__["a" /* default */] {
    constructor(data, baseFont) {
        super(data);
        this.text = data.text;
        this.leading = data.leading;
        this.fontSize = data.fontSize;
        this.font = data.font;
        this.color = data.color;
        this.justification = data.justification;
        this.baseFont = baseFont;
    }

    draw(ctx, time) {
        super.draw(ctx, time);

        ctx.textAlign = this.justification;
        ctx.font = `${this.fontSize}px ${this.baseFont}` || this.font;
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        for (let j = 0; j < this.text.length; j++) {
            ctx.fillText(this.text[j], 0, j * this.leading);
        }

        ctx.restore();
    }

}

/* harmony default export */ __webpack_exports__["a"] = (TextLayer);

/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__objects_AnimatedPath__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__objects_Ellipse__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__objects_Path__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__objects_Polystar__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__objects_Rect__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__property_Fill__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__property_GradientFill__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__property_Stroke__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__property_Trim__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__BaseLayer__ = __webpack_require__(2);











class VectorLayer extends __WEBPACK_IMPORTED_MODULE_9__BaseLayer__["a" /* default */] {
    constructor(data, gradients) {
        super(data);

        if (data.fill) this.fill = new __WEBPACK_IMPORTED_MODULE_5__property_Fill__["a" /* default */](data.fill);
        if (data.gradientFill) this.fill = new __WEBPACK_IMPORTED_MODULE_6__property_GradientFill__["a" /* default */](data.gradientFill, gradients);
        if (data.stroke) this.stroke = new __WEBPACK_IMPORTED_MODULE_7__property_Stroke__["a" /* default */](data.stroke);
        if (data.trim) this.trim = new __WEBPACK_IMPORTED_MODULE_8__property_Trim__["a" /* default */](data.trim);

        if (data.groups) {
            this.groups = data.groups.map(group => new VectorLayer(group, gradients));
        }

        if (data.shapes) {
            this.shapes = data.shapes.map(shape => {
                if (shape.type === 'path') {
                    return shape.isAnimated ? new __WEBPACK_IMPORTED_MODULE_0__objects_AnimatedPath__["a" /* default */](shape) : new __WEBPACK_IMPORTED_MODULE_2__objects_Path__["a" /* default */](shape);
                } else if (shape.type === 'rect') {
                    return new __WEBPACK_IMPORTED_MODULE_4__objects_Rect__["a" /* default */](shape);
                } else if (shape.type === 'ellipse') {
                    return new __WEBPACK_IMPORTED_MODULE_1__objects_Ellipse__["a" /* default */](shape);
                } else if (shape.type === 'polystar') {
                    return new __WEBPACK_IMPORTED_MODULE_3__objects_Polystar__["a" /* default */](shape);
                }
            });
        }
    }

    draw(ctx, time, parentFill, parentStroke, parentTrim) {
        super.draw(ctx, time);

        const fill = this.fill || parentFill;
        const stroke = this.stroke || parentStroke;
        const trimValues = this.trim ? this.trim.getTrim(time) : parentTrim;

        if (fill) fill.update(ctx, time);
        if (stroke) stroke.update(ctx, time);

        ctx.beginPath();
        if (this.shapes) {
            this.shapes.forEach(shape => shape.draw(ctx, time, trimValues));
            if (this.shapes[this.shapes.length - 1].closed) {
                // ctx.closePath();
            }
        }

        if (fill) ctx.fill();
        if (stroke) ctx.stroke();

        if (this.groups) this.groups.forEach(group => group.draw(ctx, time, fill, stroke, trimValues));
        ctx.restore();
    }

    setKeyframes(time) {
        super.setKeyframes(time);

        if (this.shapes) this.shapes.forEach(shape => shape.setKeyframes(time));
        if (this.groups) this.groups.forEach(group => group.setKeyframes(time));

        if (this.fill) this.fill.setKeyframes(time);
        if (this.stroke) this.stroke.setKeyframes(time);
        if (this.trim) this.trim.setKeyframes(time);
    }

    reset(reversed) {
        super.reset(reversed);

        if (this.shapes) this.shapes.forEach(shape => shape.reset(reversed));
        if (this.groups) this.groups.forEach(group => group.reset(reversed));

        if (this.fill) this.fill.reset(reversed);
        if (this.stroke) this.stroke.reset(reversed);
        if (this.trim) this.trim.reset(reversed);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (VectorLayer);

/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Animation__ = __webpack_require__(15);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Animation", function() { return __WEBPACK_IMPORTED_MODULE_1__Animation__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "update", function() { return __WEBPACK_IMPORTED_MODULE_0__core__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "autoPlay", function() { return __WEBPACK_IMPORTED_MODULE_0__core__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "add", function() { return __WEBPACK_IMPORTED_MODULE_0__core__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "remove", function() { return __WEBPACK_IMPORTED_MODULE_0__core__["c"]; });




/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {const root = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;

const requestAnimationFrame = root.requestAnimationFrame || function (fn) {
    return root.setTimeout(fn, 16);
};
/* harmony export (immutable) */ __webpack_exports__["a"] = requestAnimationFrame;


const cancelAnimationFrame = root.cancelAnimationFrame || function (id) {
    return root.clearTimeout(id);
};
/* unused harmony export cancelAnimationFrame */


const performance = root.performance || {
    offset: Date.now(),
    now: function now() {
        return Date.now() - this.offset;
    }
};
/* unused harmony export performance */

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(14)))

/***/ }),
/* 14 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_tiny_emitter__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_tiny_emitter___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_tiny_emitter__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__layers_ImageLayer__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__layers_NullLayer__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__layers_TextLayer__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__layers_CompLayer__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__layers_VectorLayer__ = __webpack_require__(11);








class Animation extends __WEBPACK_IMPORTED_MODULE_1_tiny_emitter___default.a {

    constructor(options) {
        super();

        this.gradients = {};
        this.pausedTime = 0;
        this.duration = options.data.duration;
        this.baseWidth = options.data.width;
        this.baseHeight = options.data.height;
        this.ratio = options.data.width / options.data.height;
        this.markers = options.data.markers;
        this.baseFont = options.baseFont;
        this.loop = options.loop || false;
        this.devicePixelRatio = options.devicePixelRatio || (window && window.devicePixelRatio ? window.devicePixelRatio : 1);
        this.fluid = options.fluid || true;
        this.imageBasePath = options.imageBasePath || '';

        this.isPaused = false;
        this.isPlaying = false;
        this.drawFrame = true;

        this.canvas = options.canvas || document.createElement('canvas');
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        this.ctx = this.canvas.getContext('2d');

        this.layers = options.data.layers.map(layer => {
            switch (layer.type) {
                case 'vector':
                    return new __WEBPACK_IMPORTED_MODULE_6__layers_VectorLayer__["a" /* default */](layer, this.gradients);
                case 'image':
                    return new __WEBPACK_IMPORTED_MODULE_2__layers_ImageLayer__["a" /* default */](layer, this.imageBasePath);
                case 'text':
                    return new __WEBPACK_IMPORTED_MODULE_4__layers_TextLayer__["a" /* default */](layer, this.baseFont);
                case 'comp':
                    return new __WEBPACK_IMPORTED_MODULE_5__layers_CompLayer__["a" /* default */](layer, this.baseFont, this.gradients, this.imageBasePath);
                case 'null':
                    return new __WEBPACK_IMPORTED_MODULE_3__layers_NullLayer__["a" /* default */](layer);
            }
        });

        this.layers.forEach(layer => {
            if (layer.parent) {
                const parentIndex = layer.parent;
                layer.parent = this.layers.find(layer => layer.index === parentIndex);
            }
        });

        this.reversed = options.reversed || false;
        this.reset(this.reversed);
        this.resize();

        Object(__WEBPACK_IMPORTED_MODULE_0__core__["a" /* add */])(this);
    }

    play() {
        if (!this.isPlaying) {
            if (!this.isPaused) this.reset(this.reversed);
            this.isPaused = false;
            this.pausedTime = 0;
            this.isPlaying = true;
        }
    }

    stop() {
        this.reset(this.reversed);
        this.isPlaying = false;
        this.drawFrame = true;
    }

    pause() {
        if (this.isPlaying) {
            this.isPaused = true;
            this.pausedTime = this.time;
            this.isPlaying = false;
        }
    }

    gotoAndPlay(id) {
        const marker = this.getMarker(id);
        if (marker) {
            this.time = marker.time;
            this.pausedTime = 0;
            this.setKeyframes(this.time);
            this.isPlaying = true;
        }
    }

    gotoAndStop(id) {
        const marker = this.getMarker(id);
        if (marker) {
            this.time = marker.time;
            this.setKeyframes(this.time);
            this.drawFrame = true;
            this.isPlaying = false;
        }
    }

    getMarker(id) {
        let marker;
        if (typeof id === 'number') {
            marker = this.markers[id];
        } else if (typeof id === 'string') {
            marker = this.markers.find(marker => marker.comment === id);
        }

        if (marker) return marker;
        console.warn('Marker not found');
    }

    checkStopMarkers(from, to) {
        return this.markers.find(marker => marker.stop && marker.time > from && marker.time < to);
    }

    preload() {
        const promises = this.layers.filter(layer => layer instanceof __WEBPACK_IMPORTED_MODULE_2__layers_ImageLayer__["a" /* default */]).map(layer => new layer.preload());
        return Promise.all(promises).catch(error => console.error(error));
    }

    reset() {
        this.pausedTime = 0;
        this.time = this.reversed ? this.duration : 0;
        this.layers.forEach(layer => layer.reset(this.reversed));
    }

    setKeyframes(time) {
        this.layers.forEach(layer => layer.setKeyframes(time));
    }

    destroy() {
        this.isPlaying = false;
        if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        Object(__WEBPACK_IMPORTED_MODULE_0__core__["c" /* remove */])(this);
    }

    resize(w) {
        if (this.fluid) {
            const width = w || this.canvas.clientWidth || this.baseWidth;
            this.canvas.width = width * this.devicePixelRatio;
            this.canvas.height = width / this.ratio * this.devicePixelRatio;

            this.scale = width / this.baseWidth * this.devicePixelRatio;
            this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
            this.setKeyframes(this.time);
            this.drawFrame = true;
        }
    }

    setGradients(name, stops) {
        if (!this.gradients[name]) {
            console.warn(`Gradient with name: ${name} not found.`);
            return;
        }

        this.gradients[name].forEach(gradient => {
            gradient.stops = stops;
        });
    }

    getSpriteSheet(fps = 25, width = 50, maxWidth = 4096) {
        const ratio = width / this.baseWidth;
        const height = this.baseHeight * ratio;
        const numFrames = Math.floor(this.duration / 1000 * fps);
        const buffer = document.createElement('canvas');
        const ctx = buffer.getContext('2d');

        const rowsX = Math.floor(maxWidth / width);
        const rowsY = Math.ceil(numFrames / rowsX);

        let indexX = 0;
        let indexY = 0;

        buffer.width = rowsX * width;
        buffer.height = rowsY * height;

        this.resize(width);

        for (let i = 0; i < numFrames; i++) {
            this.step = i / numFrames;
            this.draw(this.time);

            const x = indexX * width;
            const y = indexY * height;

            if (indexX + 1 > rowsX) {
                indexX = 0;
                indexY++;
            } else {
                indexX++;
            }

            ctx.drawImage(this.canvas, x, y, width, height);
        }

        document.body.appendChild(buffer);

        return {
            frames: numFrames,
            canvas: buffer,
            offsetX: width,
            offsetY: height,
            rowsX,
            rowsY
        };
    }

    draw(time) {
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

        this.layers.forEach(layer => {
            if (time >= layer.in && time <= layer.out) {
                layer.draw(this.ctx, time);
            }
        });
    }

    update(time) {
        if (!this.then) this.then = time;

        const delta = time - this.then;
        this.then = time;

        if (this.isPlaying) {
            this.time = this.reversed ? this.time - delta : this.time + delta;

            const stopMarker = this.checkStopMarkers(this.time - delta, this.time);

            if (this.time > this.duration || this.reversed && this.time < 0) {
                this.time = this.reversed ? 0 : this.duration - 1;
                this.isPlaying = false;
                this.emit('complete');
                if (this.loop) {
                    this.play();
                }
            } else if (stopMarker) {
                this.time = stopMarker.time;
                this.pause();
                this.emit('stop', stopMarker);
            } else {
                this.draw(this.time);
            }
            this.emit('update');
        } else if (this.drawFrame) {
            this.drawFrame = false;
            this.draw(this.time);
            this.emit('update');
        }
    }

    set step(step) {
        this.isPlaying = false;
        this.time = step * this.duration;
        this.pausedTime = this.time;
        this.setKeyframes(this.time);
        this.drawFrame = true;
    }

    get step() {
        return this.time / this.duration;
    }

    get reversed() {
        return this._reversed;
    }

    set reversed(bool) {
        this._reversed = bool;
        if (this.pausedTime) {
            this.time = this.pausedTime;
        } else if (!this.isPlaying) {
            this.time = this.reversed ? this.duration : 0;
        }
        this.setKeyframes(this.time);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Animation);

/***/ }),
/* 16 */
/***/ (function(module, exports) {

function E () {
  // Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__property_Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Position__ = __webpack_require__(18);




class Transform {

    constructor(data) {
        if (data.position) {
            if (data.position.length > 1) {
                this.position = new __WEBPACK_IMPORTED_MODULE_2__Position__["a" /* default */](data.position);
            } else {
                this.position = new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.position);
            }
        }

        if (data.positionX) this.positionX = data.positionX.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.positionX) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.positionX);
        if (data.positionY) this.positionY = data.positionY.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.positionY) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.positionY);
        if (data.anchor) this.anchor = data.anchor.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.anchor) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.anchor);
        if (data.scaleX) this.scaleX = data.scaleX.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.scaleX) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.scaleX);
        if (data.scaleY) this.scaleY = data.scaleY.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.scaleY) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.scaleY);
        if (data.skew) this.skew = data.skew.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.skew) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.skew);
        if (data.skewAxis) this.skewAxis = data.skewAxis.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.skewAxis) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.skewAxis);
        if (data.rotation) this.rotation = data.rotation.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.rotation) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.rotation);
        if (data.opacity) this.opacity = data.opacity.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.opacity) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.opacity);
    }

    update(ctx, time) {
        let positionX; // FIXME wrong transparency if nested
        let positionY;
        const anchor = this.anchor ? this.anchor.getValue(time) : [0, 0];
        const rotation = this.rotation ? this.deg2rad(this.rotation.getValue(time)) : 0;
        const skew = this.skew ? this.deg2rad(this.skew.getValue(time)) : 0;
        const skewAxis = this.skewAxis ? this.deg2rad(this.skewAxis.getValue(time)) : 0;
        const scaleX = this.scaleX ? this.scaleX.getValue(time) : 1;
        const scaleY = this.scaleY ? this.scaleY.getValue(time) : 1;
        const opacity = this.opacity ? this.opacity.getValue(time) * ctx.globalAlpha : ctx.globalAlpha;

        if (this.position) {
            const position = this.position.getValue(time, ctx);
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
    }

    setRotation(ctx, rad, x, y) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const dx = x - c * x + s * y;
        const dy = y - s * x - c * y;
        ctx.transform(c, s, -s, c, dx, dy);
    }

    setScale(ctx, sx, sy, x, y) {
        ctx.transform(sx, 0, 0, sy, -x * sx + x, -y * sy + y);
    }

    setSkew(ctx, skew, axis, x, y) {
        const t = Math.tan(-skew);
        this.setRotation(ctx, -axis, x, y);
        ctx.transform(1, 0, t, 1, -y * t, 0);
        this.setRotation(ctx, axis, x, y);
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    setKeyframes(time) {
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
    }

    reset(reversed) {
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
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Transform);

/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_Bezier__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__ = __webpack_require__(1);



class Position extends __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */] {

    onKeyframeChange() {
        this.setEasing();
        this.setMotionPath();
    }

    getValueAtTime(time) {
        if (this.motionpath) {
            return this.motionpath.getValues(this.getElapsed(time));
        } else {
            return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
        }
    }

    setMotionPath() {
        if (this.lastFrame.motionpath) {
            this.motionpath = new __WEBPACK_IMPORTED_MODULE_0__utils_Bezier__["a" /* default */](this.lastFrame.motionpath);
            this.motionpath.getLength(this.lastFrame.len);
        } else {
            this.motionpath = null;
        }
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Position);

/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ImageLayer__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__NullLayer__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__TextLayer__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__BaseLayer__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__VectorLayer__ = __webpack_require__(11);






class CompLayer extends __WEBPACK_IMPORTED_MODULE_3__BaseLayer__["a" /* default */] {

    constructor(data, baseFont, gradients, imageBasePath) {
        super(data);

        if (data.layers) {

            this.layers = data.layers.map(layer => {
                switch (layer.type) {
                    case 'vector':
                        return new __WEBPACK_IMPORTED_MODULE_4__VectorLayer__["a" /* default */](layer, gradients);
                    case 'image':
                        return new __WEBPACK_IMPORTED_MODULE_0__ImageLayer__["a" /* default */](layer, imageBasePath);
                    case 'text':
                        return new __WEBPACK_IMPORTED_MODULE_2__TextLayer__["a" /* default */](layer, baseFont);
                    case 'comp':
                        return new CompLayer(layer, baseFont, gradients, imageBasePath);
                    case 'null':
                        return new __WEBPACK_IMPORTED_MODULE_1__NullLayer__["a" /* default */](layer);
                }
            });

            this.layers.forEach(layer => {
                if (layer.parent) {
                    const parentIndex = layer.parent;
                    layer.parent = this.layers.find(layer => layer.index === parentIndex);
                }
            });
        }
    }

    draw(ctx, time) {
        super.draw(ctx, time);

        if (this.layers) {
            const internalTime = time - this.in;
            this.layers.forEach(layer => {
                if (internalTime >= layer.in && internalTime <= layer.out) {
                    layer.draw(ctx, internalTime);
                }
            });
        }

        ctx.restore();
    }

    setParentTransform(ctx, time) {
        super.setParentTransform(ctx, time);
        const internalTime = time - this.in;
        if (this.layers) this.layers.forEach(layer => layer.setParentTransform(ctx, internalTime));
    }

    setKeyframes(time) {
        super.setKeyframes(time);
        const internalTime = time - this.in;
        if (this.layers) this.layers.forEach(layer => layer.setKeyframes(internalTime));
    }

    reset(reversed) {
        super.reset(reversed);
        if (this.layers) this.layers.forEach(layer => layer.reset(reversed));
    }
}

/* harmony default export */ __webpack_exports__["a"] = (CompLayer);

/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__property_Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Path__ = __webpack_require__(3);




class Ellipse extends __WEBPACK_IMPORTED_MODULE_2__Path__["a" /* default */] {

    constructor(data) {
        super(data);
        this.closed = true;

        this.size = data.size.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.size) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.size);
        //optional
        if (data.position) this.position = data.position.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.position) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.position);
    }

    draw(ctx, time, trim) {
        const size = this.size.getValue(time);
        const position = this.position ? this.position.getValue(time) : [0, 0];

        let i;
        let j;
        const w = size[0] / 2;
        const h = size[1] / 2;
        const x = position[0] - w;
        const y = position[1] - h;
        const ow = w * .5522848;
        const oh = h * .5522848;

        const vertices = [[x + w + ow, y, x + w - ow, y, x + w, y], [x + w + w, y + h + oh, x + w + w, y + h - oh, x + w + w, y + h], [x + w - ow, y + h + h, x + w + ow, y + h + h, x + w, y + h + h], [x, y + h - oh, x, y + h + oh, x, y + h]];

        if (trim) {
            let tv;
            const len = w + h;

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
    }

    getTrimValues(trim) {
        const startIndex = Math.floor(trim.start * 4);
        const endIndex = Math.floor(trim.end * 4);
        const start = (trim.start - startIndex * 0.25) * 4;
        const end = (trim.end - endIndex * 0.25) * 4;

        return {
            startIndex,
            endIndex,
            start,
            end
        };
    }

    setKeyframes(time) {
        this.size.setKeyframes(time);
        if (this.position) this.position.setKeyframes(time);
    }

    reset(reversed) {
        this.size.reset(reversed);
        if (this.position) this.position.reset(reversed);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Ellipse);

/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__property_Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__ = __webpack_require__(1);



class Polystar {

    constructor(data) {
        //this.name = data.name;
        this.closed = true; // TODO ??

        this.starType = data.starType;
        this.points = data.points.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.points) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.points);
        this.innerRadius = data.innerRadius.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.innerRadius) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.innerRadius);
        this.outerRadius = data.outerRadius.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.outerRadius) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.outerRadius);
        if (data.position) this.position = data.position.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.position) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.position);
        if (data.rotation) this.rotation = data.rotation.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.rotation) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.rotation);
        if (data.innerRoundness) this.innerRoundness = data.innerRoundness.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.innerRoundness) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.innerRoundness);
        if (data.outerRoundness) this.outerRoundness = data.outerRoundness.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.outerRoundness) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.outerRoundness);
    }

    draw(ctx, time) {
        const points = this.points.getValue(time);
        const innerRadius = this.innerRadius.getValue(time);
        const outerRadius = this.outerRadius.getValue(time);
        const position = this.position ? this.position.getValue(time) : [0, 0];
        let rotation = this.rotation ? this.rotation.getValue(time) : 0;
        const innerRoundness = this.innerRoundness ? this.innerRoundness.getValue(time) : 0;
        const outerRoundness = this.outerRoundness ? this.outerRoundness.getValue(time) : 0;

        rotation = this.deg2rad(rotation);
        const start = this.rotatePoint(0, 0, 0, 0 - outerRadius, rotation);

        ctx.save();
        ctx.beginPath();
        ctx.translate(position[0], position[1]);
        ctx.moveTo(start[0], start[1]);

        for (let i = 0; i < points; i++) {
            let pInner;
            let pOuter;
            let pOuter1Tangent;
            let pOuter2Tangent;
            let pInner1Tangent;
            let pInner2Tangent;
            let outerOffset;
            let innerOffset;
            let rot;

            rot = Math.PI / points * 2;

            pInner = this.rotatePoint(0, 0, 0, 0 - innerRadius, rot * (i + 1) - rot / 2 + rotation);
            pOuter = this.rotatePoint(0, 0, 0, 0 - outerRadius, rot * (i + 1) + rotation);

            //FIxME
            if (!outerOffset) outerOffset = (start[0] + pInner[0]) * outerRoundness / 100 * .5522848;
            if (!innerOffset) innerOffset = (start[0] + pInner[0]) * innerRoundness / 100 * .5522848;

            pOuter1Tangent = this.rotatePoint(0, 0, outerOffset, 0 - outerRadius, rot * i + rotation);
            pInner1Tangent = this.rotatePoint(0, 0, innerOffset * -1, 0 - innerRadius, rot * (i + 1) - rot / 2 + rotation);
            pInner2Tangent = this.rotatePoint(0, 0, innerOffset, 0 - innerRadius, rot * (i + 1) - rot / 2 + rotation);
            pOuter2Tangent = this.rotatePoint(0, 0, outerOffset * -1, 0 - outerRadius, rot * (i + 1) + rotation);

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
    }

    rotatePoint(cx, cy, x, y, radians) {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const nx = cos * (x - cx) - sin * (y - cy) + cx;
        const ny = sin * (x - cx) + cos * (y - cy) + cy;
        return [nx, ny];
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    setKeyframes(time) {
        this.points.setKeyframes(time);
        this.innerRadius.setKeyframes(time);
        this.outerRadius.setKeyframes(time);
        if (this.position) this.position.setKeyframes(time);
        if (this.rotation) this.rotation.setKeyframes(time);
        if (this.innerRoundness) this.innerRoundness.setKeyframes(time);
        if (this.outerRoundness) this.outerRoundness.setKeyframes(time);
    }

    reset(reversed) {
        this.points.reset(reversed);
        this.innerRadius.reset(reversed);
        this.outerRadius.reset(reversed);
        if (this.position) this.position.reset(reversed);
        if (this.rotation) this.rotation.reset(reversed);
        if (this.innerRoundness) this.innerRoundness.reset(reversed);
        if (this.outerRoundness) this.outerRoundness.reset(reversed);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Polystar);

/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__property_Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__ = __webpack_require__(1);



class Rect {

    constructor(data) {
        //this.name = data.name;
        this.closed = true;

        this.size = data.size.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.size) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.size);

        //optionals
        if (data.position) this.position = data.position.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.position) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.position);
        if (data.roundness) this.roundness = data.roundness.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__property_AnimatedProperty__["a" /* default */](data.roundness) : new __WEBPACK_IMPORTED_MODULE_0__property_Property__["a" /* default */](data.roundness);
    }

    draw(ctx, time, trim) {
        const size = this.size.getValue(time);
        const position = this.position ? this.position.getValue(time) : [0, 0];
        let roundness = this.roundness ? this.roundness.getValue(time) : 0;

        if (size[0] < 2 * roundness) roundness = size[0] / 2;
        if (size[1] < 2 * roundness) roundness = size[1] / 2;

        const x = position[0] - size[0] / 2;
        const y = position[1] - size[1] / 2;

        if (trim) {
            // let tv;
            // trim = this.getTrimValues(trim);
            //TODO add trim
        } else {
            ctx.moveTo(x + roundness, y);
            ctx.arcTo(x + size[0], y, x + size[0], y + size[1], roundness);
            ctx.arcTo(x + size[0], y + size[1], x, y + size[1], roundness);
            ctx.arcTo(x, y + size[1], x, y, roundness);
            ctx.arcTo(x, y, x + size[0], y, roundness);
        }
    }

    setKeyframes(time) {
        this.size.setKeyframes(time);
        if (this.position) this.position.setKeyframes(time);
        if (this.roundness) this.roundness.setKeyframes(time);
    }

    reset(reversed) {
        this.size.reset(reversed);
        if (this.position) this.position.reset(reversed);
        if (this.roundness) this.roundness.reset(reversed);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Rect);

/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__ = __webpack_require__(1);



class Fill {

    constructor(data) {
        this.color = data.color.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.color) : new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.color);
        if (data.opacity) this.opacity = data.opacity.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.opacity) : new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.opacity);
    }

    getValue(time) {
        const color = this.color.getValue(time);
        const opacity = this.opacity ? this.opacity.getValue(time) : 1;
        return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${opacity})`;
    }

    update(ctx, time) {
        const color = this.getValue(time);
        ctx.fillStyle = color;
    }

    setKeyframes(time) {
        this.color.setKeyframes(time);
        if (this.opacity) this.opacity.setKeyframes(time);
    }

    reset(reversed) {
        this.color.reset(reversed);
        if (this.opacity) this.opacity.reset(reversed);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Fill);

/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__ = __webpack_require__(1);



class GradientFill {

    constructor(data, gradients) {
        if (!gradients[data.name]) gradients[data.name] = [];
        gradients[data.name].push(this);

        this.stops = data.stops;
        this.type = data.type;
        this.startPoint = data.startPoint.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.startPoint) : new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.startPoint);
        this.endPoint = data.endPoint.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.endPoint) : new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.endPoint);
        if (data.opacity) this.opacity = data.opacity.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.opacity) : new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.opacity);
    }

    update(ctx, time) {
        const startPoint = this.startPoint.getValue(time);
        const endPoint = this.endPoint.getValue(time);
        let radius = 0;

        if (this.type === 'radial') {
            const distX = startPoint[0] - endPoint[0];
            const distY = startPoint[1] - endPoint[1];
            radius = Math.sqrt(distX * distX + distY * distY);
        }

        const gradient = this.type === 'radial' ? ctx.createRadialGradient(startPoint[0], startPoint[1], 0, startPoint[0], startPoint[1], radius) : ctx.createLinearGradient(startPoint[0], startPoint[1], endPoint[0], endPoint[1]);

        const opacity = this.opacity ? this.opacity.getValue(time) : 1;

        for (const stop of this.stops) {
            const color = stop.color;
            gradient.addColorStop(stop.location, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] * opacity})`);
        }

        ctx.fillStyle = gradient;
    }

    setKeyframes(time) {
        if (this.opacity) this.opacity.setKeyframes(time);
        this.startPoint.setKeyframes(time);
        this.endPoint.setKeyframes(time);
    }

    reset(reversed) {
        if (this.opacity) this.opacity.setKeyframes(reversed);
        this.startPoint.setKeyframes(reversed);
        this.endPoint.setKeyframes(reversed);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (GradientFill);

/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__ = __webpack_require__(1);



class Stroke {

    constructor(data) {
        if (data) {
            this.join = data.join;
            this.cap = data.cap;

            if (data.miterLimit) {
                if (data.miterLimit.length > 1) this.miterLimit = new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.miterLimit);else this.miterLimit = new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.miterLimit);
            }

            if (data.color.length > 1) this.color = new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.color);else this.color = new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.color);

            if (data.opacity.length > 1) this.opacity = new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.opacity);else this.opacity = new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.opacity);

            if (data.width.length > 1) this.width = new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.width);else this.width = new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.width);

            if (data.dashes) {
                this.dashes = {};

                if (data.dashes.dash.length > 1) this.dashes.dash = new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.dashes.dash);else this.dashes.dash = new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.dashes.dash);

                if (data.dashes.gap.length > 1) this.dashes.gap = new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.dashes.gap);else this.dashes.gap = new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.dashes.gap);

                if (data.dashes.offset.length > 1) this.dashes.offset = new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.dashes.offset);else this.dashes.offset = new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.dashes.offset);
            }
        }
    }

    getValue(time) {
        const color = this.color.getValue(time);
        const opacity = this.opacity.getValue(time);
        color[0] = Math.round(color[0]);
        color[1] = Math.round(color[1]);
        color[2] = Math.round(color[2]);
        const s = color.join(', ');

        return `rgba(${s}, ${opacity})`;
    }

    update(ctx, time) {
        const strokeColor = this.getValue(time);
        const strokeWidth = this.width.getValue(time);
        const strokeJoin = this.join;
        let miterLimit;
        if (strokeJoin === 'miter') miterLimit = this.miterLimit.getValue(time);

        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = strokeJoin;
        if (miterLimit) ctx.miterLimit = miterLimit;
        ctx.lineCap = this.cap;
        ctx.strokeStyle = strokeColor;

        if (this.dashes) {
            ctx.setLineDash([this.dashes.dash.getValue(time), this.dashes.gap.getValue(time)]);
            ctx.lineDashOffset = this.dashes.offset.getValue(time);
        }
    }

    setKeyframes(time) {
        this.color.setKeyframes(time);
        this.opacity.setKeyframes(time);
        this.width.setKeyframes(time);
        if (this.miterLimit) this.miterLimit.setKeyframes(time);
        if (this.dashes) {
            this.dashes.dash.setKeyframes(time);
            this.dashes.gap.setKeyframes(time);
            this.dashes.offset.setKeyframes(time);
        }
    }

    reset(reversed) {
        this.color.reset(reversed);
        this.opacity.reset(reversed);
        this.width.reset(reversed);
        if (this.miterLimit) this.miterLimit.reset(reversed);
        if (this.dashes) {
            this.dashes.dash.reset(reversed);
            this.dashes.gap.reset(reversed);
            this.dashes.offset.reset(reversed);
        }
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Stroke);

/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Property__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__ = __webpack_require__(1);



class Trim {
    constructor(data) {

        this.type = data.type;

        if (data.start) this.start = data.start.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.start) : new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.start);
        if (data.end) this.end = data.end.length > 1 ? new __WEBPACK_IMPORTED_MODULE_1__AnimatedProperty__["a" /* default */](data.end) : new __WEBPACK_IMPORTED_MODULE_0__Property__["a" /* default */](data.end);
        //if (data.offset) this.offset = data.offset.length > 1 ? new AnimatedProperty(data.offset) : new Property(data.offset);
    }

    getTrim(time) {
        const start = this.start ? this.start.getValue(time) : 0;
        const end = this.end ? this.end.getValue(time) : 1;

        const trim = {
            start: Math.min(start, end),
            end: Math.max(start, end)
        };

        if (trim.start === 0 && trim.end === 1) {
            return null;
        } else {
            return trim;
        }
    }

    setKeyframes(time) {
        if (this.start) this.start.setKeyframes(time);
        if (this.end) this.end.setKeyframes(time);
        //if (this.offset) this.offset.reset();
    }

    reset(reversed) {
        if (this.start) this.start.reset(reversed);
        if (this.end) this.end.reset(reversed);
        //if (this.offset) this.offset.reset();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Trim);

/***/ })
/******/ ]);
});
//# sourceMappingURL=index.js.map