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
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Property = function () {
    function Property(data) {
        _classCallCheck(this, Property);

        this.frames = data;
    }

    _createClass(Property, [{
        key: "getValue",
        value: function getValue() {
            return this.frames[0].v;
        }
    }, {
        key: "setKeyframes",
        value: function setKeyframes(time) {}
    }, {
        key: "reset",
        value: function reset(reversed) {}
    }]);

    return Property;
}();

exports.default = Property;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property2 = __webpack_require__(0);

var _Property3 = _interopRequireDefault(_Property2);

var _BezierEasing = __webpack_require__(8);

var _BezierEasing2 = _interopRequireDefault(_BezierEasing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AnimatedProperty = function (_Property) {
    _inherits(AnimatedProperty, _Property);

    function AnimatedProperty(data) {
        _classCallCheck(this, AnimatedProperty);

        var _this = _possibleConstructorReturn(this, (AnimatedProperty.__proto__ || Object.getPrototypeOf(AnimatedProperty)).call(this, data));

        _this.frameCount = _this.frames.length;
        return _this;
    }

    _createClass(AnimatedProperty, [{
        key: 'lerp',
        value: function lerp(a, b, t) {
            if (a instanceof Array) {
                var arr = [];
                for (var i = 0; i < a.length; i++) {
                    arr[i] = a[i] + t * (b[i] - a[i]);
                }
                return arr;
            } else {
                return a + t * (b - a);
            }
        }
    }, {
        key: 'setEasing',
        value: function setEasing() {
            if (this.nextFrame.easeIn) {
                this.easing = new _BezierEasing2.default(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
            } else {
                this.easing = null;
            }
        }
    }, {
        key: 'getValue',
        value: function getValue(time) {
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
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
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
        }
    }, {
        key: 'onKeyframeChange',
        value: function onKeyframeChange() {
            this.setEasing();
        }
    }, {
        key: 'getElapsed',
        value: function getElapsed(time) {
            var delta = time - this.lastFrame.t;
            var duration = this.nextFrame.t - this.lastFrame.t;
            var elapsed = delta / duration;

            if (elapsed > 1) elapsed = 1;else if (elapsed < 0) elapsed = 0;else if (this.easing) elapsed = this.easing(elapsed);
            return elapsed;
        }
    }, {
        key: 'getValueAtTime',
        value: function getValueAtTime(time) {
            return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.finished = false;
            this.started = false;
            this.pointer = reversed ? this.frameCount - 1 : 1;
            this.nextFrame = this.frames[this.pointer];
            this.lastFrame = this.frames[this.pointer - 1];
            this.onKeyframeChange();
        }
    }]);

    return AnimatedProperty;
}(_Property3.default);

exports.default = AnimatedProperty;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Path = __webpack_require__(3);

var _Path2 = _interopRequireDefault(_Path);

var _AnimatedPath = __webpack_require__(7);

var _AnimatedPath2 = _interopRequireDefault(_AnimatedPath);

var _Transform = __webpack_require__(17);

var _Transform2 = _interopRequireDefault(_Transform);

var _DropShadow = __webpack_require__(19);

var _DropShadow2 = _interopRequireDefault(_DropShadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BaseLayer = function () {
    function BaseLayer(data) {
        _classCallCheck(this, BaseLayer);

        this.index = data.index;
        this.in = data.in || 0;
        this.out = data.out;
        if (data.parent) this.parent = data.parent;
        this.transform = new _Transform2.default(data.transform);

        if (data.effects) {
            if (data.effects.dropShadow) {
                this.dropShadow = new _DropShadow2.default(data.effects.dropShadow);
            }
        }

        if (data.masks) {
            this.masks = data.masks.map(function (mask) {
                return mask.isAnimated ? new _AnimatedPath2.default(mask) : new _Path2.default(mask);
            });
        }
    }

    _createClass(BaseLayer, [{
        key: 'draw',
        value: function draw(ctx, time) {
            ctx.save();

            if (this.parent) this.parent.setParentTransform(ctx, time);
            this.transform.update(ctx, time);

            if (this.dropShadow) {
                this.dropShadow.setShadow(ctx, time);
            }

            if (this.masks) {
                ctx.beginPath();
                this.masks.forEach(function (mask) {
                    return mask.draw(ctx, time);
                });
                ctx.clip();
            }
        }
    }, {
        key: 'setParentTransform',
        value: function setParentTransform(ctx, time) {
            if (this.parent) this.parent.setParentTransform(ctx, time);
            this.transform.update(ctx, time);
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            this.transform.setKeyframes(time);
            if (this.masks) this.masks.forEach(function (mask) {
                return mask.setKeyframes(time);
            });
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.transform.reset(reversed);
            if (this.masks) this.masks.forEach(function (mask) {
                return mask.reset(reversed);
            });
        }
    }]);

    return BaseLayer;
}();

exports.default = BaseLayer;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Bezier = __webpack_require__(6);

var _Bezier2 = _interopRequireDefault(_Bezier);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Path = function () {
    function Path(data) {
        _classCallCheck(this, Path);

        this.closed = data.closed;
        this.frames = data.frames;
        this.verticesCount = this.frames[0].v.length;
    }

    _createClass(Path, [{
        key: 'draw',
        value: function draw(ctx, time, trim) {
            var frame = this.getValue(time);
            var vertices = frame.v;
            var nextVertex = void 0;
            var lastVertex = void 0;

            if (trim) {
                if (trim.start === 0 && trim.end === 0 || trim.start === 1 && trim.end === 1) {
                    return;
                } else {
                    trim = this.getTrimValues(trim, frame);
                }
            }

            for (var j = 1; j < vertices.length; j++) {
                nextVertex = vertices[j];
                lastVertex = vertices[j - 1];

                if (trim) {
                    var tv = void 0;

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
    }, {
        key: 'getValue',
        value: function getValue() {
            return this.frames[0];
        }
    }, {
        key: 'getTrimValues',
        value: function getTrimValues(trim, frame) {
            var i = void 0;

            var actualTrim = {
                startIndex: 0,
                endIndex: 0,
                start: 0,
                end: 0

                // TODO clean up
            };if (trim.start === 0) {
                if (trim.end === 0) {
                    return actualTrim;
                } else if (trim.end === 1) {
                    actualTrim.endIndex = frame.len.length;
                    actualTrim.end = 1;
                    return actualTrim;
                }
            }

            var totalLen = this.sumArray(frame.len);
            var trimAtLen = void 0;

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
    }, {
        key: 'trim',
        value: function trim(lastVertex, nextVertex, from, to, len) {

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
                this.bezier = new _Bezier2.default([lastVertex[4], lastVertex[5], lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]]);
                this.bezier.getLength(len);
                from = this.bezier.map(from);
                to = this.bezier.map(to);
                to = (to - from) / (1 - from);

                var e1 = void 0;
                var f1 = void 0;
                var g1 = void 0;
                var h1 = void 0;
                var j1 = void 0;
                var k1 = void 0;
                var e2 = void 0;
                var f2 = void 0;
                var g2 = void 0;
                var h2 = void 0;
                var j2 = void 0;
                var k2 = void 0;
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
    }, {
        key: 'lerp',
        value: function lerp(a, b, t) {
            var s = 1 - t;
            return a * s + b * t;
        }
    }, {
        key: 'sumArray',
        value: function sumArray(arr) {
            function add(a, b) {
                return a + b;
            }

            return arr.reduce(add);
        }
    }, {
        key: 'isStraight',
        value: function isStraight(startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY) {
            return startX === ctrl1X && startY === ctrl1Y && endX === ctrl2X && endY === ctrl2Y;
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {}
    }, {
        key: 'reset',
        value: function reset(reversed) {}
    }]);

    return Path;
}();

exports.default = Path;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.remove = exports.add = exports.autoPlay = exports.update = undefined;

var _shim = __webpack_require__(13);

var _animations = [];
var _animationsLength = 0;

var _autoPlay = false;
var _rafId = void 0;

var update = function update(time) {
    if (_autoPlay) {
        _rafId = (0, _shim.requestAnimationFrame)(update);
    }
    time = time !== undefined ? time : performance.now();

    for (var i = 0; i < _animationsLength; i++) {
        _animations[i].update(time);
    }
};

var autoPlay = function autoPlay(auto) {
    _autoPlay = auto;
    _autoPlay ? _rafId = (0, _shim.requestAnimationFrame)(update) : cancelAnimationFrame(_rafId);
};

function add(tween) {
    _animations.push(tween);
    _animationsLength = _animations.length;
}

function remove(tween) {
    var i = _animations.indexOf(tween);
    if (i > -1) {
        _animations.splice(i, 1);
        _animationsLength = _animations.length;
    }
}

exports.update = update;
exports.autoPlay = autoPlay;
exports.add = add;
exports.remove = remove;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BaseLayer2 = __webpack_require__(2);

var _BaseLayer3 = _interopRequireDefault(_BaseLayer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ImageLayer = function (_BaseLayer) {
    _inherits(ImageLayer, _BaseLayer);

    function ImageLayer(data) {
        _classCallCheck(this, ImageLayer);

        var _this = _possibleConstructorReturn(this, (ImageLayer.__proto__ || Object.getPrototypeOf(ImageLayer)).call(this, data));

        _this.source = data.source;
        _this.isLoaded = false;
        return _this;
    }

    _createClass(ImageLayer, [{
        key: 'preload',
        value: function preload(cb) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                _this2.img = new Image();
                _this2.img.onload = function () {
                    _this2.isLoaded = true;
                    resolve();
                };
                _this2.img.src = _this2.source;
            });
        }
    }, {
        key: 'draw',
        value: function draw(ctx, time) {
            _get(ImageLayer.prototype.__proto__ || Object.getPrototypeOf(ImageLayer.prototype), 'draw', this).call(this, ctx, time);

            ctx.drawImage(this.img, 0, 0);

            ctx.restore();
        }
    }]);

    return ImageLayer;
}(_BaseLayer3.default);

exports.default = ImageLayer;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bezier = function () {
    function Bezier(path) {
        _classCallCheck(this, Bezier);

        this.path = path;
    }

    _createClass(Bezier, [{
        key: "getLength",
        value: function getLength(len) {
            this.steps = Math.max(Math.floor(len / 10), 1);
            this.arcLengths = new Array(this.steps + 1);
            this.arcLengths[0] = 0;

            var ox = this.cubicN(0, this.path[0], this.path[2], this.path[4], this.path[6]);
            var oy = this.cubicN(0, this.path[1], this.path[3], this.path[5], this.path[7]);
            var clen = 0;
            var iterator = 1 / this.steps;

            for (var i = 1; i <= this.steps; i += 1) {
                var x = this.cubicN(i * iterator, this.path[0], this.path[2], this.path[4], this.path[6]);
                var y = this.cubicN(i * iterator, this.path[1], this.path[3], this.path[5], this.path[7]);
                var dx = ox - x;
                var dy = oy - y;

                clen += Math.sqrt(dx * dx + dy * dy);
                this.arcLengths[i] = clen;

                ox = x;
                oy = y;
            }

            this.length = clen;
        }
    }, {
        key: "map",
        value: function map(u) {
            var targetLength = u * this.arcLengths[this.steps];
            var low = 0;
            var high = this.steps;
            var index = 0;

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

            var lengthBefore = this.arcLengths[index];
            if (lengthBefore === targetLength) {
                return index / this.steps;
            } else {
                return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.steps;
            }
        }
    }, {
        key: "getValues",
        value: function getValues(elapsed) {
            var t = this.map(elapsed);
            var x = this.cubicN(t, this.path[0], this.path[2], this.path[4], this.path[6]);
            var y = this.cubicN(t, this.path[1], this.path[3], this.path[5], this.path[7]);

            return [x, y];
        }
    }, {
        key: "cubicN",
        value: function cubicN(pct, a, b, c, d) {
            var t2 = pct * pct;
            var t3 = t2 * pct;
            return a + (-a * 3 + pct * (3 * a - a * pct)) * pct + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct + (c * 3 - c * 3 * pct) * t2 + d * t3;
        }
    }]);

    return Bezier;
}();

exports.default = Bezier;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Path2 = __webpack_require__(3);

var _Path3 = _interopRequireDefault(_Path2);

var _BezierEasing = __webpack_require__(8);

var _BezierEasing2 = _interopRequireDefault(_BezierEasing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AnimatedPath = function (_Path) {
    _inherits(AnimatedPath, _Path);

    function AnimatedPath(data) {
        _classCallCheck(this, AnimatedPath);

        var _this = _possibleConstructorReturn(this, (AnimatedPath.__proto__ || Object.getPrototypeOf(AnimatedPath)).call(this, data));

        _this.frameCount = _this.frames.length;
        return _this;
    }

    _createClass(AnimatedPath, [{
        key: 'getValue',
        value: function getValue(time) {
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
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
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
        }
    }, {
        key: 'onKeyframeChange',
        value: function onKeyframeChange() {
            this.setEasing();
        }
    }, {
        key: 'lerp',
        value: function lerp(a, b, t) {
            return a + t * (b - a);
        }
    }, {
        key: 'setEasing',
        value: function setEasing() {
            if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
                this.easing = new _BezierEasing2.default(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
            } else {
                this.easing = null;
            }
        }
    }, {
        key: 'getValueAtTime',
        value: function getValueAtTime(time) {
            var delta = time - this.lastFrame.t;
            var duration = this.nextFrame.t - this.lastFrame.t;
            var elapsed = delta / duration;
            if (elapsed > 1) elapsed = 1;else if (elapsed < 0) elapsed = 0;else if (this.easing) elapsed = this.easing(elapsed);
            var actualVertices = [];
            var actualLength = [];

            for (var i = 0; i < this.verticesCount; i++) {
                var cp1x = this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed);
                var cp1y = this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed);
                var cp2x = this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed);
                var cp2y = this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed);
                var x = this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed);
                var y = this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed);

                actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y]);
            }

            for (var j = 0; j < this.verticesCount - 1; j++) {
                actualLength.push(this.lerp(this.lastFrame.len[j], this.nextFrame.len[j], elapsed));
            }

            return {
                v: actualVertices,
                len: actualLength
            };
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.finished = false;
            this.started = false;
            this.pointer = reversed ? this.frameCount - 1 : 1;
            this.nextFrame = this.frames[this.pointer];
            this.lastFrame = this.frames[this.pointer - 1];
            this.onKeyframeChange();
        }
    }]);

    return AnimatedPath;
}(_Path3.default);

exports.default = AnimatedPath;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * BezierEasing - use bezier curve for transition easing function
 * is based on Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = BezierEasing(0.25, 0.1, 0.25, 1.0)
 * spline(x) => returns the easing value | x must be in [0, 1] range
 *
 */
(function (definition) {
    if (( false ? "undefined" : _typeof(exports)) === "object") {
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

        var f = function f(aX) {
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
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BaseLayer2 = __webpack_require__(2);

var _BaseLayer3 = _interopRequireDefault(_BaseLayer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NullLayer = function (_BaseLayer) {
    _inherits(NullLayer, _BaseLayer);

    function NullLayer(data) {
        _classCallCheck(this, NullLayer);

        return _possibleConstructorReturn(this, (NullLayer.__proto__ || Object.getPrototypeOf(NullLayer)).call(this, data));
    }

    _createClass(NullLayer, [{
        key: 'draw',
        value: function draw(ctx, time) {
            _get(NullLayer.prototype.__proto__ || Object.getPrototypeOf(NullLayer.prototype), 'draw', this).call(this, ctx, time);
            ctx.restore();
        }
    }]);

    return NullLayer;
}(_BaseLayer3.default);

exports.default = NullLayer;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BaseLayer2 = __webpack_require__(2);

var _BaseLayer3 = _interopRequireDefault(_BaseLayer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TextLayer = function (_BaseLayer) {
    _inherits(TextLayer, _BaseLayer);

    function TextLayer(data, baseFont) {
        _classCallCheck(this, TextLayer);

        var _this = _possibleConstructorReturn(this, (TextLayer.__proto__ || Object.getPrototypeOf(TextLayer)).call(this, data));

        _this.text = data.text;
        _this.leading = data.leading;
        _this.fontSize = data.fontSize;
        _this.font = data.font;
        _this.color = data.color;
        _this.justification = data.justification;
        _this.baseFont = baseFont;
        return _this;
    }

    _createClass(TextLayer, [{
        key: 'draw',
        value: function draw(ctx, time) {
            _get(TextLayer.prototype.__proto__ || Object.getPrototypeOf(TextLayer.prototype), 'draw', this).call(this, ctx, time);

            ctx.textAlign = this.justification;
            ctx.font = this.fontSize + 'px ' + this.baseFont || this.font;
            ctx.fillStyle = 'rgb(' + this.color[0] + ', ' + this.color[1] + ', ' + this.color[2] + ')';
            for (var j = 0; j < this.text.length; j++) {
                ctx.fillText(this.text[j], 0, j * this.leading);
            }

            ctx.restore();
        }
    }]);

    return TextLayer;
}(_BaseLayer3.default);

exports.default = TextLayer;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _AnimatedPath = __webpack_require__(7);

var _AnimatedPath2 = _interopRequireDefault(_AnimatedPath);

var _Ellipse = __webpack_require__(21);

var _Ellipse2 = _interopRequireDefault(_Ellipse);

var _Path = __webpack_require__(3);

var _Path2 = _interopRequireDefault(_Path);

var _Polystar = __webpack_require__(22);

var _Polystar2 = _interopRequireDefault(_Polystar);

var _Rect = __webpack_require__(23);

var _Rect2 = _interopRequireDefault(_Rect);

var _Fill = __webpack_require__(24);

var _Fill2 = _interopRequireDefault(_Fill);

var _GradientFill = __webpack_require__(25);

var _GradientFill2 = _interopRequireDefault(_GradientFill);

var _Stroke = __webpack_require__(26);

var _Stroke2 = _interopRequireDefault(_Stroke);

var _Trim = __webpack_require__(27);

var _Trim2 = _interopRequireDefault(_Trim);

var _BaseLayer2 = __webpack_require__(2);

var _BaseLayer3 = _interopRequireDefault(_BaseLayer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var VectorLayer = function (_BaseLayer) {
    _inherits(VectorLayer, _BaseLayer);

    function VectorLayer(data, gradients) {
        _classCallCheck(this, VectorLayer);

        var _this = _possibleConstructorReturn(this, (VectorLayer.__proto__ || Object.getPrototypeOf(VectorLayer)).call(this, data));

        if (data.fill) _this.fill = new _Fill2.default(data.fill);
        if (data.gradientFill) _this.fill = new _GradientFill2.default(data.gradientFill, gradients);
        if (data.stroke) _this.stroke = new _Stroke2.default(data.stroke);
        if (data.trim) _this.trim = new _Trim2.default(data.trim);

        if (data.groups) {
            _this.groups = data.groups.map(function (group) {
                return new VectorLayer(group, gradients);
            });
        }

        if (data.shapes) {
            _this.shapes = data.shapes.map(function (shape) {
                if (shape.type === 'path') {
                    return shape.isAnimated ? new _AnimatedPath2.default(shape) : new _Path2.default(shape);
                } else if (shape.type === 'rect') {
                    return new _Rect2.default(shape);
                } else if (shape.type === 'ellipse') {
                    return new _Ellipse2.default(shape);
                } else if (shape.type === 'polystar') {
                    return new _Polystar2.default(shape);
                }
            });
        }
        return _this;
    }

    _createClass(VectorLayer, [{
        key: 'draw',
        value: function draw(ctx, time, parentFill, parentStroke, parentTrim) {
            _get(VectorLayer.prototype.__proto__ || Object.getPrototypeOf(VectorLayer.prototype), 'draw', this).call(this, ctx, time);

            var fill = this.fill || parentFill;
            var stroke = this.stroke || parentStroke;
            var trimValues = this.trim ? this.trim.getTrim(time) : parentTrim;

            if (fill) fill.update(ctx, time);
            if (stroke) stroke.update(ctx, time);

            ctx.beginPath();
            if (this.shapes) {
                this.shapes.forEach(function (shape) {
                    return shape.draw(ctx, time, trimValues);
                });
                if (this.shapes[this.shapes.length - 1].closed) {
                    // ctx.closePath();
                }
            }

            if (fill) ctx.fill();
            if (stroke) ctx.stroke();

            if (this.groups) this.groups.forEach(function (group) {
                return group.draw(ctx, time, fill, stroke, trimValues);
            });
            ctx.restore();
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            _get(VectorLayer.prototype.__proto__ || Object.getPrototypeOf(VectorLayer.prototype), 'setKeyframes', this).call(this, time);

            if (this.shapes) this.shapes.forEach(function (shape) {
                return shape.setKeyframes(time);
            });
            if (this.groups) this.groups.forEach(function (group) {
                return group.setKeyframes(time);
            });

            if (this.fill) this.fill.setKeyframes(time);
            if (this.stroke) this.stroke.setKeyframes(time);
            if (this.trim) this.trim.setKeyframes(time);
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            _get(VectorLayer.prototype.__proto__ || Object.getPrototypeOf(VectorLayer.prototype), 'reset', this).call(this, reversed);

            if (this.shapes) this.shapes.forEach(function (shape) {
                return shape.reset(reversed);
            });
            if (this.groups) this.groups.forEach(function (group) {
                return group.reset(reversed);
            });

            if (this.fill) this.fill.reset(reversed);
            if (this.stroke) this.stroke.reset(reversed);
            if (this.trim) this.trim.reset(reversed);
        }
    }]);

    return VectorLayer;
}(_BaseLayer3.default);

exports.default = VectorLayer;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.remove = exports.add = exports.autoPlay = exports.update = exports.Animation = undefined;

var _core = __webpack_require__(4);

var _Animation = __webpack_require__(15);

var _Animation2 = _interopRequireDefault(_Animation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Animation = _Animation2.default;
exports.update = _core.update;
exports.autoPlay = _core.autoPlay;
exports.add = _core.add;
exports.remove = _core.remove;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
var root = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : undefined;

var requestAnimationFrame = exports.requestAnimationFrame = root.requestAnimationFrame || function (fn) {
    return root.setTimeout(fn, 16);
};

var cancelAnimationFrame = exports.cancelAnimationFrame = root.cancelAnimationFrame || function (id) {
    return root.clearTimeout(id);
};

var performance = exports.performance = root.performance || {
    offset: Date.now(),
    now: function now() {
        return Date.now() - this.offset;
    }
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)))

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
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _core = __webpack_require__(4);

var _tinyEmitter = __webpack_require__(16);

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

var _ImageLayer = __webpack_require__(5);

var _ImageLayer2 = _interopRequireDefault(_ImageLayer);

var _NullLayer = __webpack_require__(9);

var _NullLayer2 = _interopRequireDefault(_NullLayer);

var _TextLayer = __webpack_require__(10);

var _TextLayer2 = _interopRequireDefault(_TextLayer);

var _CompLayer = __webpack_require__(20);

var _CompLayer2 = _interopRequireDefault(_CompLayer);

var _VectorLayer = __webpack_require__(11);

var _VectorLayer2 = _interopRequireDefault(_VectorLayer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Animation = function (_Emitter) {
    _inherits(Animation, _Emitter);

    function Animation(options) {
        _classCallCheck(this, Animation);

        var _this = _possibleConstructorReturn(this, (Animation.__proto__ || Object.getPrototypeOf(Animation)).call(this));

        _this.gradients = {};
        _this.pausedTime = 0;
        _this.duration = options.data.duration;
        _this.baseWidth = options.data.width;
        _this.baseHeight = options.data.height;
        _this.ratio = options.data.width / options.data.height;
        _this.markers = options.data.markers;
        _this.baseFont = options.baseFont;
        _this.loop = options.loop || false;
        _this.devicePixelRatio = options.devicePixelRatio || (window && window.devicePixelRatio ? window.devicePixelRatio : 1);
        _this.fluid = options.fluid || true;
        _this.imageBasePath = options.imageBasePath || '';
        var comps = options.data.comps;

        _this.isPaused = false;
        _this.isPlaying = false;
        _this.drawFrame = true;

        _this.canvas = options.canvas || document.createElement('canvas');
        _this.canvas.width = _this.baseWidth;
        _this.canvas.height = _this.baseHeight;
        _this.ctx = _this.canvas.getContext('2d');

        _this.layers = options.data.layers.map(function (layer) {
            switch (layer.type) {
                case 'vector':
                    return new _VectorLayer2.default(layer, _this.gradients);
                case 'image':
                    return new _ImageLayer2.default(layer, _this.imageBasePath);
                case 'text':
                    return new _TextLayer2.default(layer, _this.baseFont);
                case 'comp':
                    return new _CompLayer2.default(layer, comps, _this.baseFont, _this.gradients, _this.imageBasePath);
                case 'null':
                    return new _NullLayer2.default(layer);
            }
        });

        _this.layers.forEach(function (layer) {
            if (layer.parent) {
                var parentIndex = layer.parent;
                layer.parent = _this.layers.find(function (layer) {
                    return layer.index === parentIndex;
                });
            }
        });

        _this.reversed = options.reversed || false;
        _this.reset(_this.reversed);
        _this.resize();

        (0, _core.add)(_this);
        return _this;
    }

    _createClass(Animation, [{
        key: 'play',
        value: function play() {
            if (!this.isPlaying) {
                if (!this.isPaused) this.reset(this.reversed);
                this.isPaused = false;
                this.pausedTime = 0;
                this.isPlaying = true;
            }
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.reset(this.reversed);
            this.isPlaying = false;
            this.drawFrame = true;
        }
    }, {
        key: 'pause',
        value: function pause() {
            if (this.isPlaying) {
                this.isPaused = true;
                this.pausedTime = this.time;
                this.isPlaying = false;
            }
        }
    }, {
        key: 'gotoAndPlay',
        value: function gotoAndPlay(id) {
            var marker = this.getMarker(id);
            if (marker) {
                this.time = marker.time;
                this.pausedTime = 0;
                this.setKeyframes(this.time);
                this.isPlaying = true;
            }
        }
    }, {
        key: 'gotoAndStop',
        value: function gotoAndStop(id) {
            var marker = this.getMarker(id);
            if (marker) {
                this.time = marker.time;
                this.setKeyframes(this.time);
                this.drawFrame = true;
                this.isPlaying = false;
            }
        }
    }, {
        key: 'getMarker',
        value: function getMarker(id) {
            var marker = void 0;
            if (typeof id === 'number') {
                marker = this.markers[id];
            } else if (typeof id === 'string') {
                marker = this.markers.find(function (marker) {
                    return marker.comment === id;
                });
            }

            if (marker) return marker;
            console.warn('Marker not found');
        }
    }, {
        key: 'checkStopMarkers',
        value: function checkStopMarkers(from, to) {
            return this.markers.find(function (marker) {
                return marker.stop && marker.time > from && marker.time < to;
            });
        }
    }, {
        key: 'preload',
        value: function preload() {
            var promises = this.layers.filter(function (layer) {
                return layer instanceof _ImageLayer2.default;
            }).map(function (layer) {
                return new layer.preload();
            });
            return Promise.all(promises).catch(function (error) {
                return console.error(error);
            });
        }
    }, {
        key: 'reset',
        value: function reset() {
            var _this2 = this;

            this.pausedTime = 0;
            this.time = this.reversed ? this.duration : 0;
            this.layers.forEach(function (layer) {
                return layer.reset(_this2.reversed);
            });
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            this.layers.forEach(function (layer) {
                return layer.setKeyframes(time);
            });
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.isPlaying = false;
            if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
            (0, _core.remove)(this);
        }
    }, {
        key: 'resize',
        value: function resize(w) {
            if (this.fluid) {
                var width = w || this.canvas.clientWidth || this.baseWidth;
                this.canvas.width = width * this.devicePixelRatio;
                this.canvas.height = width / this.ratio * this.devicePixelRatio;

                this.scale = width / this.baseWidth * this.devicePixelRatio;
                this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
                this.setKeyframes(this.time);
                this.drawFrame = true;
            }
        }
    }, {
        key: 'setGradients',
        value: function setGradients(name, stops) {
            if (!this.gradients[name]) {
                console.warn('Gradient with name: ' + name + ' not found.');
                return;
            }

            this.gradients[name].forEach(function (gradient) {
                gradient.stops = stops;
            });
        }
    }, {
        key: 'getSpriteSheet',
        value: function getSpriteSheet() {
            var fps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 25;
            var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;
            var maxWidth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4096;

            var ratio = width / this.baseWidth;
            var height = this.baseHeight * ratio;
            var numFrames = Math.floor(this.duration / 1000 * fps);
            var buffer = document.createElement('canvas');
            var ctx = buffer.getContext('2d');

            var rowsX = Math.floor(maxWidth / width);
            var rowsY = Math.ceil(numFrames / rowsX);

            var indexX = 0;
            var indexY = 0;

            buffer.width = rowsX * width;
            buffer.height = rowsY * height;

            this.resize(width);

            for (var i = 0; i < numFrames; i++) {
                var step = i / numFrames;
                var time = step * this.duration;
                this.setKeyframes(time);
                this.draw(time);

                var x = indexX * width;
                var y = indexY * height;

                if (indexX + 1 >= rowsX) {
                    indexX = 0;
                    indexY++;
                } else {
                    indexX++;
                }

                ctx.drawImage(this.canvas, x, y, width, height);
            }

            return {
                frames: numFrames,
                canvas: buffer,
                offsetX: width,
                offsetY: height,
                rowsX: rowsX,
                rowsY: rowsY
            };
        }
    }, {
        key: 'draw',
        value: function draw(time) {
            var _this3 = this;

            this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

            this.layers.forEach(function (layer) {
                if (time >= layer.in && time <= layer.out) {
                    layer.draw(_this3.ctx, time);
                }
            });
        }
    }, {
        key: 'update',
        value: function update(time) {
            if (!this.then) this.then = time;

            var delta = time - this.then;
            this.then = time;

            if (this.isPlaying) {
                this.time = this.reversed ? this.time - delta : this.time + delta;

                var stopMarker = this.checkStopMarkers(this.time - delta, this.time);

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
    }, {
        key: 'step',
        set: function set(step) {
            this.isPlaying = false;
            this.time = step * this.duration;
            this.pausedTime = this.time;
            this.setKeyframes(this.time);
            this.drawFrame = true;
        },
        get: function get() {
            return this.time / this.duration;
        }
    }, {
        key: 'reversed',
        get: function get() {
            return this._reversed;
        },
        set: function set(bool) {
            this._reversed = bool;
            if (this.pausedTime) {
                this.time = this.pausedTime;
            } else if (!this.isPlaying) {
                this.time = this.reversed ? this.duration : 0;
            }
            this.setKeyframes(this.time);
        }
    }]);

    return Animation;
}(_tinyEmitter2.default);

exports.default = Animation;

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
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

var _Position = __webpack_require__(18);

var _Position2 = _interopRequireDefault(_Position);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Transform = function () {
    function Transform(data) {
        _classCallCheck(this, Transform);

        if (data.position) {
            if (data.position.length > 1) {
                this.position = new _Position2.default(data.position);
            } else {
                this.position = new _Property2.default(data.position);
            }
        }

        if (data.positionX) this.positionX = data.positionX.length > 1 ? new _AnimatedProperty2.default(data.positionX) : new _Property2.default(data.positionX);
        if (data.positionY) this.positionY = data.positionY.length > 1 ? new _AnimatedProperty2.default(data.positionY) : new _Property2.default(data.positionY);
        if (data.anchor) this.anchor = data.anchor.length > 1 ? new _AnimatedProperty2.default(data.anchor) : new _Property2.default(data.anchor);
        if (data.scaleX) this.scaleX = data.scaleX.length > 1 ? new _AnimatedProperty2.default(data.scaleX) : new _Property2.default(data.scaleX);
        if (data.scaleY) this.scaleY = data.scaleY.length > 1 ? new _AnimatedProperty2.default(data.scaleY) : new _Property2.default(data.scaleY);
        if (data.skew) this.skew = data.skew.length > 1 ? new _AnimatedProperty2.default(data.skew) : new _Property2.default(data.skew);
        if (data.skewAxis) this.skewAxis = data.skewAxis.length > 1 ? new _AnimatedProperty2.default(data.skewAxis) : new _Property2.default(data.skewAxis);
        if (data.rotation) this.rotation = data.rotation.length > 1 ? new _AnimatedProperty2.default(data.rotation) : new _Property2.default(data.rotation);
        if (data.opacity) this.opacity = data.opacity.length > 1 ? new _AnimatedProperty2.default(data.opacity) : new _Property2.default(data.opacity);
    }

    _createClass(Transform, [{
        key: 'update',
        value: function update(ctx, time) {
            var positionX = void 0; // FIXME wrong transparency if nested
            var positionY = void 0;
            var anchor = this.anchor ? this.anchor.getValue(time) : [0, 0];
            var rotation = this.rotation ? this.deg2rad(this.rotation.getValue(time)) : 0;
            var skew = this.skew ? this.deg2rad(this.skew.getValue(time)) : 0;
            var skewAxis = this.skewAxis ? this.deg2rad(this.skewAxis.getValue(time)) : 0;
            var scaleX = this.scaleX ? this.scaleX.getValue(time) : 1;
            var scaleY = this.scaleY ? this.scaleY.getValue(time) : 1;
            var opacity = this.opacity ? this.opacity.getValue(time) * ctx.globalAlpha : ctx.globalAlpha;

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
        }
    }, {
        key: 'setRotation',
        value: function setRotation(ctx, rad, x, y) {
            var c = Math.cos(rad);
            var s = Math.sin(rad);
            var dx = x - c * x + s * y;
            var dy = y - s * x - c * y;
            ctx.transform(c, s, -s, c, dx, dy);
        }
    }, {
        key: 'setScale',
        value: function setScale(ctx, sx, sy, x, y) {
            ctx.transform(sx, 0, 0, sy, -x * sx + x, -y * sy + y);
        }
    }, {
        key: 'setSkew',
        value: function setSkew(ctx, skew, axis, x, y) {
            var t = Math.tan(-skew);
            this.setRotation(ctx, -axis, x, y);
            ctx.transform(1, 0, t, 1, -y * t, 0);
            this.setRotation(ctx, axis, x, y);
        }
    }, {
        key: 'deg2rad',
        value: function deg2rad(deg) {
            return deg * (Math.PI / 180);
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
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
    }, {
        key: 'reset',
        value: function reset(reversed) {
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
    }]);

    return Transform;
}();

exports.default = Transform;

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Bezier = __webpack_require__(6);

var _Bezier2 = _interopRequireDefault(_Bezier);

var _AnimatedProperty2 = __webpack_require__(1);

var _AnimatedProperty3 = _interopRequireDefault(_AnimatedProperty2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Position = function (_AnimatedProperty) {
    _inherits(Position, _AnimatedProperty);

    function Position() {
        _classCallCheck(this, Position);

        return _possibleConstructorReturn(this, (Position.__proto__ || Object.getPrototypeOf(Position)).apply(this, arguments));
    }

    _createClass(Position, [{
        key: 'onKeyframeChange',
        value: function onKeyframeChange() {
            this.setEasing();
            this.setMotionPath();
        }
    }, {
        key: 'getValueAtTime',
        value: function getValueAtTime(time) {
            if (this.motionpath) {
                return this.motionpath.getValues(this.getElapsed(time));
            } else {
                return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
            }
        }
    }, {
        key: 'setMotionPath',
        value: function setMotionPath() {
            if (this.lastFrame.motionpath) {
                this.motionpath = new _Bezier2.default(this.lastFrame.motionpath);
                this.motionpath.getLength(this.lastFrame.len);
            } else {
                this.motionpath = null;
            }
        }
    }]);

    return Position;
}(_AnimatedProperty3.default);

exports.default = Position;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DropShadow = function () {
    function DropShadow(data) {
        _classCallCheck(this, DropShadow);

        this.color = data.color.length > 1 ? new _AnimatedProperty2.default(data.color) : new _Property2.default(data.color);
        this.opacity = data.opacity.length > 1 ? new _AnimatedProperty2.default(data.opacity) : new _Property2.default(data.opacity);
        this.direction = data.direction.length > 1 ? new _AnimatedProperty2.default(data.direction) : new _Property2.default(data.direction);
        this.distance = data.distance.length > 1 ? new _AnimatedProperty2.default(data.distance) : new _Property2.default(data.distance);
        this.softness = data.softness.length > 1 ? new _AnimatedProperty2.default(data.softness) : new _Property2.default(data.softness);
    }

    _createClass(DropShadow, [{
        key: 'getColor',
        value: function getColor(time) {
            var color = this.color.getValue(time);
            var opacity = this.opacity.getValue(time);
            return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
        }
    }, {
        key: 'setShadow',
        value: function setShadow(ctx, time) {
            var color = this.getColor(time);
            var dist = this.distance.getValue(time);
            var blur = this.softness.getValue(time);
            ctx.shadowColor = color;
            ctx.shadowOffsetX = dist;
            ctx.shadowOffsetY = dist;
            ctx.shadowBlur = blur;
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            this.color.setKeyframes(time);
            this.opacity.setKeyframes(time);
            this.direction.setKeyframes(time);
            this.distance.setKeyframes(time);
            this.softness.setKeyframes(time);
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.color.reset(reversed);
            this.opacity.reset(reversed);
            this.direction.reset(reversed);
            this.distance.reset(reversed);
            this.softness.reset(reversed);
        }
    }]);

    return DropShadow;
}();

exports.default = DropShadow;

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _ImageLayer = __webpack_require__(5);

var _ImageLayer2 = _interopRequireDefault(_ImageLayer);

var _NullLayer = __webpack_require__(9);

var _NullLayer2 = _interopRequireDefault(_NullLayer);

var _TextLayer = __webpack_require__(10);

var _TextLayer2 = _interopRequireDefault(_TextLayer);

var _BaseLayer2 = __webpack_require__(2);

var _BaseLayer3 = _interopRequireDefault(_BaseLayer2);

var _VectorLayer = __webpack_require__(11);

var _VectorLayer2 = _interopRequireDefault(_VectorLayer);

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CompLayer = function (_BaseLayer) {
    _inherits(CompLayer, _BaseLayer);

    function CompLayer(data, comps, baseFont, gradients, imageBasePath) {
        _classCallCheck(this, CompLayer);

        var _this = _possibleConstructorReturn(this, (CompLayer.__proto__ || Object.getPrototypeOf(CompLayer)).call(this, data));

        var sourceID = data.sourceID;
        var layers = comps && comps[sourceID] ? comps[sourceID].layers : null;

        if (layers) {

            _this.layers = layers.map(function (layer) {
                switch (layer.type) {
                    case 'vector':
                        return new _VectorLayer2.default(layer, gradients);
                    case 'image':
                        return new _ImageLayer2.default(layer, imageBasePath);
                    case 'text':
                        return new _TextLayer2.default(layer, baseFont);
                    case 'comp':
                        return new CompLayer(layer, baseFont, gradients, imageBasePath);
                    case 'null':
                        return new _NullLayer2.default(layer);
                }
            });

            _this.layers.forEach(function (layer) {
                if (layer.parent) {
                    var parentIndex = layer.parent;
                    layer.parent = _this.layers.find(function (layer) {
                        return layer.index === parentIndex;
                    });
                }
            });
        }

        if (data.timeRemapping) {
            _this.timeRemapping = data.timeRemapping.length > 1 ? new _AnimatedProperty2.default(data.timeRemapping) : new _Property2.default(data.timeRemapping);
        }
        return _this;
    }

    _createClass(CompLayer, [{
        key: 'draw',
        value: function draw(ctx, time) {
            _get(CompLayer.prototype.__proto__ || Object.getPrototypeOf(CompLayer.prototype), 'draw', this).call(this, ctx, time);

            if (this.layers) {
                var internalTime = time - this.in;
                if (this.timeRemapping) internalTime = this.timeRemapping.getValue(internalTime);
                this.layers.forEach(function (layer) {
                    if (internalTime >= layer.in && internalTime <= layer.out) {
                        layer.draw(ctx, internalTime);
                    }
                });
            }

            ctx.restore();
        }
    }, {
        key: 'setParentTransform',
        value: function setParentTransform(ctx, time) {
            _get(CompLayer.prototype.__proto__ || Object.getPrototypeOf(CompLayer.prototype), 'setParentTransform', this).call(this, ctx, time);
            var internalTime = time - this.in;
            if (this.layers) this.layers.forEach(function (layer) {
                return layer.setParentTransform(ctx, internalTime);
            });
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            _get(CompLayer.prototype.__proto__ || Object.getPrototypeOf(CompLayer.prototype), 'setKeyframes', this).call(this, time);
            var internalTime = time - this.in;
            if (this.timeRemapping) this.timeRemapping.setKeyframes(internalTime);
            if (this.layers) this.layers.forEach(function (layer) {
                return layer.setKeyframes(internalTime);
            });
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            _get(CompLayer.prototype.__proto__ || Object.getPrototypeOf(CompLayer.prototype), 'reset', this).call(this, reversed);
            if (this.timeRemapping) this.timeRemapping.reset(reversed);
            if (this.layers) this.layers.forEach(function (layer) {
                return layer.reset(reversed);
            });
        }
    }]);

    return CompLayer;
}(_BaseLayer3.default);

exports.default = CompLayer;

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

var _Path2 = __webpack_require__(3);

var _Path3 = _interopRequireDefault(_Path2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Ellipse = function (_Path) {
    _inherits(Ellipse, _Path);

    function Ellipse(data) {
        _classCallCheck(this, Ellipse);

        var _this = _possibleConstructorReturn(this, (Ellipse.__proto__ || Object.getPrototypeOf(Ellipse)).call(this, data));

        _this.closed = true;

        _this.size = data.size.length > 1 ? new _AnimatedProperty2.default(data.size) : new _Property2.default(data.size);
        //optional
        if (data.position) _this.position = data.position.length > 1 ? new _AnimatedProperty2.default(data.position) : new _Property2.default(data.position);
        return _this;
    }

    _createClass(Ellipse, [{
        key: 'draw',
        value: function draw(ctx, time, trim) {
            var size = this.size.getValue(time);
            var position = this.position ? this.position.getValue(time) : [0, 0];

            var i = void 0;
            var j = void 0;
            var w = size[0] / 2;
            var h = size[1] / 2;
            var x = position[0] - w;
            var y = position[1] - h;
            var ow = w * .5522848;
            var oh = h * .5522848;

            var vertices = [[x + w + ow, y, x + w - ow, y, x + w, y], [x + w + w, y + h + oh, x + w + w, y + h - oh, x + w + w, y + h], [x + w - ow, y + h + h, x + w + ow, y + h + h, x + w, y + h + h], [x, y + h - oh, x, y + h + oh, x, y + h]];

            if (trim) {
                var tv = void 0;
                var len = w + h;

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
    }, {
        key: 'getTrimValues',
        value: function getTrimValues(trim) {
            var startIndex = Math.floor(trim.start * 4);
            var endIndex = Math.floor(trim.end * 4);
            var start = (trim.start - startIndex * 0.25) * 4;
            var end = (trim.end - endIndex * 0.25) * 4;

            return {
                startIndex: startIndex,
                endIndex: endIndex,
                start: start,
                end: end
            };
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            this.size.setKeyframes(time);
            if (this.position) this.position.setKeyframes(time);
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.size.reset(reversed);
            if (this.position) this.position.reset(reversed);
        }
    }]);

    return Ellipse;
}(_Path3.default);

exports.default = Ellipse;

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Polystar = function () {
    function Polystar(data) {
        _classCallCheck(this, Polystar);

        //this.name = data.name;
        this.closed = true; // TODO ??

        this.starType = data.starType;
        this.points = data.points.length > 1 ? new _AnimatedProperty2.default(data.points) : new _Property2.default(data.points);
        this.innerRadius = data.innerRadius.length > 1 ? new _AnimatedProperty2.default(data.innerRadius) : new _Property2.default(data.innerRadius);
        this.outerRadius = data.outerRadius.length > 1 ? new _AnimatedProperty2.default(data.outerRadius) : new _Property2.default(data.outerRadius);
        if (data.position) this.position = data.position.length > 1 ? new _AnimatedProperty2.default(data.position) : new _Property2.default(data.position);
        if (data.rotation) this.rotation = data.rotation.length > 1 ? new _AnimatedProperty2.default(data.rotation) : new _Property2.default(data.rotation);
        if (data.innerRoundness) this.innerRoundness = data.innerRoundness.length > 1 ? new _AnimatedProperty2.default(data.innerRoundness) : new _Property2.default(data.innerRoundness);
        if (data.outerRoundness) this.outerRoundness = data.outerRoundness.length > 1 ? new _AnimatedProperty2.default(data.outerRoundness) : new _Property2.default(data.outerRoundness);
    }

    _createClass(Polystar, [{
        key: 'draw',
        value: function draw(ctx, time) {
            var points = this.points.getValue(time);
            var innerRadius = this.innerRadius.getValue(time);
            var outerRadius = this.outerRadius.getValue(time);
            var position = this.position ? this.position.getValue(time) : [0, 0];
            var rotation = this.rotation ? this.rotation.getValue(time) : 0;
            var innerRoundness = this.innerRoundness ? this.innerRoundness.getValue(time) : 0;
            var outerRoundness = this.outerRoundness ? this.outerRoundness.getValue(time) : 0;

            rotation = this.deg2rad(rotation);
            var start = this.rotatePoint(0, 0, 0, 0 - outerRadius, rotation);

            ctx.save();
            ctx.beginPath();
            ctx.translate(position[0], position[1]);
            ctx.moveTo(start[0], start[1]);

            for (var i = 0; i < points; i++) {
                var pInner = void 0;
                var pOuter = void 0;
                var pOuter1Tangent = void 0;
                var pOuter2Tangent = void 0;
                var pInner1Tangent = void 0;
                var pInner2Tangent = void 0;
                var outerOffset = void 0;
                var innerOffset = void 0;
                var rot = void 0;

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
    }, {
        key: 'rotatePoint',
        value: function rotatePoint(cx, cy, x, y, radians) {
            var cos = Math.cos(radians);
            var sin = Math.sin(radians);
            var nx = cos * (x - cx) - sin * (y - cy) + cx;
            var ny = sin * (x - cx) + cos * (y - cy) + cy;
            return [nx, ny];
        }
    }, {
        key: 'deg2rad',
        value: function deg2rad(deg) {
            return deg * (Math.PI / 180);
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            this.points.setKeyframes(time);
            this.innerRadius.setKeyframes(time);
            this.outerRadius.setKeyframes(time);
            if (this.position) this.position.setKeyframes(time);
            if (this.rotation) this.rotation.setKeyframes(time);
            if (this.innerRoundness) this.innerRoundness.setKeyframes(time);
            if (this.outerRoundness) this.outerRoundness.setKeyframes(time);
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.points.reset(reversed);
            this.innerRadius.reset(reversed);
            this.outerRadius.reset(reversed);
            if (this.position) this.position.reset(reversed);
            if (this.rotation) this.rotation.reset(reversed);
            if (this.innerRoundness) this.innerRoundness.reset(reversed);
            if (this.outerRoundness) this.outerRoundness.reset(reversed);
        }
    }]);

    return Polystar;
}();

exports.default = Polystar;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rect = function () {
    function Rect(data) {
        _classCallCheck(this, Rect);

        //this.name = data.name;
        this.closed = true;

        this.size = data.size.length > 1 ? new _AnimatedProperty2.default(data.size) : new _Property2.default(data.size);

        //optionals
        if (data.position) this.position = data.position.length > 1 ? new _AnimatedProperty2.default(data.position) : new _Property2.default(data.position);
        if (data.roundness) this.roundness = data.roundness.length > 1 ? new _AnimatedProperty2.default(data.roundness) : new _Property2.default(data.roundness);
    }

    _createClass(Rect, [{
        key: 'draw',
        value: function draw(ctx, time, trim) {
            var size = this.size.getValue(time);
            var position = this.position ? this.position.getValue(time) : [0, 0];
            var roundness = this.roundness ? this.roundness.getValue(time) : 0;

            if (size[0] < 2 * roundness) roundness = size[0] / 2;
            if (size[1] < 2 * roundness) roundness = size[1] / 2;

            var x = position[0] - size[0] / 2;
            var y = position[1] - size[1] / 2;

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
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            this.size.setKeyframes(time);
            if (this.position) this.position.setKeyframes(time);
            if (this.roundness) this.roundness.setKeyframes(time);
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.size.reset(reversed);
            if (this.position) this.position.reset(reversed);
            if (this.roundness) this.roundness.reset(reversed);
        }
    }]);

    return Rect;
}();

exports.default = Rect;

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Fill = function () {
    function Fill(data) {
        _classCallCheck(this, Fill);

        this.color = data.color.length > 1 ? new _AnimatedProperty2.default(data.color) : new _Property2.default(data.color);
        if (data.opacity) this.opacity = data.opacity.length > 1 ? new _AnimatedProperty2.default(data.opacity) : new _Property2.default(data.opacity);
    }

    _createClass(Fill, [{
        key: 'getValue',
        value: function getValue(time) {
            var color = this.color.getValue(time);
            var opacity = this.opacity ? this.opacity.getValue(time) : 1;
            return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
        }
    }, {
        key: 'update',
        value: function update(ctx, time) {
            var color = this.getValue(time);
            ctx.fillStyle = color;
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            this.color.setKeyframes(time);
            if (this.opacity) this.opacity.setKeyframes(time);
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            this.color.reset(reversed);
            if (this.opacity) this.opacity.reset(reversed);
        }
    }]);

    return Fill;
}();

exports.default = Fill;

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GradientFill = function () {
    function GradientFill(data, gradients) {
        _classCallCheck(this, GradientFill);

        if (!gradients[data.name]) gradients[data.name] = [];
        gradients[data.name].push(this);

        this.stops = data.stops;
        this.type = data.type;
        this.startPoint = data.startPoint.length > 1 ? new _AnimatedProperty2.default(data.startPoint) : new _Property2.default(data.startPoint);
        this.endPoint = data.endPoint.length > 1 ? new _AnimatedProperty2.default(data.endPoint) : new _Property2.default(data.endPoint);
        if (data.opacity) this.opacity = data.opacity.length > 1 ? new _AnimatedProperty2.default(data.opacity) : new _Property2.default(data.opacity);
    }

    _createClass(GradientFill, [{
        key: 'update',
        value: function update(ctx, time) {
            var startPoint = this.startPoint.getValue(time);
            var endPoint = this.endPoint.getValue(time);
            var radius = 0;

            if (this.type === 'radial') {
                var distX = startPoint[0] - endPoint[0];
                var distY = startPoint[1] - endPoint[1];
                radius = Math.sqrt(distX * distX + distY * distY);
            }

            var gradient = this.type === 'radial' ? ctx.createRadialGradient(startPoint[0], startPoint[1], 0, startPoint[0], startPoint[1], radius) : ctx.createLinearGradient(startPoint[0], startPoint[1], endPoint[0], endPoint[1]);

            var opacity = this.opacity ? this.opacity.getValue(time) : 1;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.stops[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var stop = _step.value;

                    var color = stop.color;
                    gradient.addColorStop(stop.location, 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + color[3] * opacity + ')');
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            ctx.fillStyle = gradient;
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            if (this.opacity) this.opacity.setKeyframes(time);
            this.startPoint.setKeyframes(time);
            this.endPoint.setKeyframes(time);
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            if (this.opacity) this.opacity.setKeyframes(reversed);
            this.startPoint.setKeyframes(reversed);
            this.endPoint.setKeyframes(reversed);
        }
    }]);

    return GradientFill;
}();

exports.default = GradientFill;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Stroke = function () {
    function Stroke(data) {
        _classCallCheck(this, Stroke);

        if (data) {
            this.join = data.join;
            this.cap = data.cap;

            if (data.miterLimit) {
                if (data.miterLimit.length > 1) this.miterLimit = new _AnimatedProperty2.default(data.miterLimit);else this.miterLimit = new _Property2.default(data.miterLimit);
            }

            if (data.color.length > 1) this.color = new _AnimatedProperty2.default(data.color);else this.color = new _Property2.default(data.color);

            if (data.opacity.length > 1) this.opacity = new _AnimatedProperty2.default(data.opacity);else this.opacity = new _Property2.default(data.opacity);

            if (data.width.length > 1) this.width = new _AnimatedProperty2.default(data.width);else this.width = new _Property2.default(data.width);

            if (data.dashes) {
                this.dashes = {};

                if (data.dashes.dash.length > 1) this.dashes.dash = new _AnimatedProperty2.default(data.dashes.dash);else this.dashes.dash = new _Property2.default(data.dashes.dash);

                if (data.dashes.gap.length > 1) this.dashes.gap = new _AnimatedProperty2.default(data.dashes.gap);else this.dashes.gap = new _Property2.default(data.dashes.gap);

                if (data.dashes.offset.length > 1) this.dashes.offset = new _AnimatedProperty2.default(data.dashes.offset);else this.dashes.offset = new _Property2.default(data.dashes.offset);
            }
        }
    }

    _createClass(Stroke, [{
        key: 'getValue',
        value: function getValue(time) {
            var color = this.color.getValue(time);
            var opacity = this.opacity.getValue(time);
            color[0] = Math.round(color[0]);
            color[1] = Math.round(color[1]);
            color[2] = Math.round(color[2]);
            var s = color.join(', ');

            return 'rgba(' + s + ', ' + opacity + ')';
        }
    }, {
        key: 'update',
        value: function update(ctx, time) {
            var strokeColor = this.getValue(time);
            var strokeWidth = this.width.getValue(time);
            var strokeJoin = this.join;
            var miterLimit = void 0;
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
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
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
    }, {
        key: 'reset',
        value: function reset(reversed) {
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
    }]);

    return Stroke;
}();

exports.default = Stroke;

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Property = __webpack_require__(0);

var _Property2 = _interopRequireDefault(_Property);

var _AnimatedProperty = __webpack_require__(1);

var _AnimatedProperty2 = _interopRequireDefault(_AnimatedProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Trim = function () {
    function Trim(data) {
        _classCallCheck(this, Trim);

        this.type = data.type;

        if (data.start) this.start = data.start.length > 1 ? new _AnimatedProperty2.default(data.start) : new _Property2.default(data.start);
        if (data.end) this.end = data.end.length > 1 ? new _AnimatedProperty2.default(data.end) : new _Property2.default(data.end);
        //if (data.offset) this.offset = data.offset.length > 1 ? new AnimatedProperty(data.offset) : new Property(data.offset);
    }

    _createClass(Trim, [{
        key: 'getTrim',
        value: function getTrim(time) {
            var start = this.start ? this.start.getValue(time) : 0;
            var end = this.end ? this.end.getValue(time) : 1;

            var trim = {
                start: Math.min(start, end),
                end: Math.max(start, end)
            };

            if (trim.start === 0 && trim.end === 1) {
                return null;
            } else {
                return trim;
            }
        }
    }, {
        key: 'setKeyframes',
        value: function setKeyframes(time) {
            if (this.start) this.start.setKeyframes(time);
            if (this.end) this.end.setKeyframes(time);
            //if (this.offset) this.offset.reset();
        }
    }, {
        key: 'reset',
        value: function reset(reversed) {
            if (this.start) this.start.reset(reversed);
            if (this.end) this.end.reset(reversed);
            //if (this.offset) this.offset.reset();
        }
    }]);

    return Trim;
}();

exports.default = Trim;

/***/ })
/******/ ]);
});
//# sourceMappingURL=index.js.map