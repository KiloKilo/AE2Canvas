(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("AE2Canvas", [], factory);
	else if(typeof exports === 'object')
		exports["AE2Canvas"] = factory();
	else
		root["AE2Canvas"] = factory();
})((typeof self !== 'undefined' ? self : this), function() {
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
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// CONCATENATED MODULE: ./src/core.js
var _animations = [];
var _animationsLength = 0;
var _autoPlay = false;

var _rafId;

var update = function update(time) {
  if (_autoPlay) {
    _rafId = requestAnimationFrame(update);
  }

  time = time !== undefined ? time : performance.now();

  for (var i = 0; i < _animationsLength; i++) {
    _animations[i].update(time);
  }
};

var autoPlay = function autoPlay(auto) {
  _autoPlay = auto;
  _autoPlay ? _rafId = requestAnimationFrame(update) : cancelAnimationFrame(_rafId);
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


// EXTERNAL MODULE: ./node_modules/tiny-emitter/index.js
var tiny_emitter = __webpack_require__(0);
var tiny_emitter_default = /*#__PURE__*/__webpack_require__.n(tiny_emitter);

// CONCATENATED MODULE: ./src/utils/Bezier.js
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Bezier =
/*#__PURE__*/
function () {
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

/* harmony default export */ var utils_Bezier = (Bezier);
// CONCATENATED MODULE: ./src/objects/Path.js
function Path_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Path_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Path_createClass(Constructor, protoProps, staticProps) { if (protoProps) Path_defineProperties(Constructor.prototype, protoProps); if (staticProps) Path_defineProperties(Constructor, staticProps); return Constructor; }



var Path_Path =
/*#__PURE__*/
function () {
  function Path(data) {
    Path_classCallCheck(this, Path);

    this.closed = data.closed;
    this.frames = data.frames;
  }

  Path_createClass(Path, [{
    key: "draw",
    value: function draw(ctx, time, trim) {
      var frame = this.getValue(time);
      trim && (trim.start !== 0 || trim.end !== 1) ? this.drawTrimmed(frame, ctx, trim) : this.drawNormal(frame, ctx);
    }
  }, {
    key: "drawNormal",
    value: function drawNormal(frame, ctx) {
      var vertices = frame.v;
      var numVertices = this.closed ? vertices.length : vertices.length - 1;
      var lastVertex = null;
      var nextVertex = null;

      for (var i = 1; i <= numVertices; i++) {
        lastVertex = vertices[i - 1];
        nextVertex = vertices[i] ? vertices[i] : vertices[0];
        if (i === 1) ctx.moveTo(lastVertex[4], lastVertex[5]);
        ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);
      }

      if (this.closed) {
        if (!nextVertex) debugger;
        ctx.bezierCurveTo(nextVertex[0], nextVertex[1], vertices[0][2], vertices[0][3], vertices[0][4], vertices[0][5]);
        ctx.closePath();
      }
    }
  }, {
    key: "drawTrimmed",
    value: function drawTrimmed(frame, ctx, trim) {
      if (trim.start === trim.end) return;
      var vertices = frame.v;
      var numVertices = this.closed ? vertices.length : vertices.length - 1;
      var nextVertex;
      var lastVertex;

      var _this$getTrimValues = this.getTrimValues(trim, frame),
          start = _this$getTrimValues.start,
          end = _this$getTrimValues.end,
          endIndex = _this$getTrimValues.endIndex,
          startIndex = _this$getTrimValues.startIndex,
          looped = _this$getTrimValues.looped;

      if (looped && this.closed) {
        var index = startIndex;
        var firstRound = true;

        for (var i = 1; i <= numVertices + 1; i++) {
          lastVertex = vertices[index];
          nextVertex = vertices[index + 1] ? vertices[index + 1] : vertices[0];
          var _length = frame.len[index];

          if (index === startIndex && firstRound) {
            firstRound = false;
            var tv = this.trim(lastVertex, nextVertex, start, 1, _length);
            ctx.moveTo(tv.start[4], tv.start[5]);
            ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
          } else if (index === startIndex && index === endIndex) {
            var _tv = this.trim(lastVertex, nextVertex, 0, end, _length);

            ctx.bezierCurveTo(_tv.start[0], _tv.start[1], _tv.end[2], _tv.end[3], _tv.end[4], _tv.end[5]);
          } else if (index === endIndex) {
            var _tv2 = this.trim(lastVertex, nextVertex, 0, end, _length);

            ctx.bezierCurveTo(_tv2.start[0], _tv2.start[1], _tv2.end[2], _tv2.end[3], _tv2.end[4], _tv2.end[5]);
          } else if (index < endIndex || index > startIndex) {
            ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);
          }

          index + 1 < numVertices ? index++ : index = 0;
        }
      } else if (looped && !this.closed) {
        for (var _i = 1; _i <= numVertices; _i++) {
          var _index = _i - 1;

          lastVertex = vertices[_index];
          nextVertex = vertices[_index + 1] ? vertices[_index + 1] : vertices[0];
          var _length2 = frame.len[_index];

          if (_index === startIndex && _index === endIndex) {
            var tv1 = this.trim(lastVertex, nextVertex, 0, end, _length2);
            ctx.bezierCurveTo(tv1.start[0], tv1.start[1], tv1.end[2], tv1.end[3], tv1.end[4], tv1.end[5]);
            var tv2 = this.trim(lastVertex, nextVertex, start, 1, _length2);
            ctx.moveTo(tv2.start[4], tv2.start[5]);
            ctx.bezierCurveTo(tv2.start[0], tv2.start[1], tv2.end[2], tv2.end[3], tv2.end[4], tv2.end[5]);
          } else if (_index === startIndex) {
            var _tv3 = this.trim(lastVertex, nextVertex, start, 1, _length2);

            ctx.moveTo(_tv3.start[4], _tv3.start[5]);
            ctx.bezierCurveTo(_tv3.start[0], _tv3.start[1], _tv3.end[2], _tv3.end[3], _tv3.end[4], _tv3.end[5]);
          } else if (_index === endIndex) {
            var _tv4 = this.trim(lastVertex, nextVertex, 0, end, _length2);

            ctx.bezierCurveTo(_tv4.start[0], _tv4.start[1], _tv4.end[2], _tv4.end[3], _tv4.end[4], _tv4.end[5]);
          } else if (_index < endIndex || _index > startIndex) {
            ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);
          }
        }
      } else {
        for (var _i2 = 1; _i2 <= numVertices; _i2++) {
          var _index2 = _i2 - 1;

          lastVertex = vertices[_i2 - 1];
          nextVertex = vertices[_i2] ? vertices[_i2] : vertices[0];

          if (_index2 === startIndex && _index2 === endIndex) {
            var _tv5 = this.trim(lastVertex, nextVertex, start, end, length);

            ctx.moveTo(_tv5.start[4], _tv5.start[5]);
            ctx.bezierCurveTo(_tv5.start[0], _tv5.start[1], _tv5.end[2], _tv5.end[3], _tv5.end[4], _tv5.end[5]);
          } else if (_index2 === startIndex) {
            var _tv6 = this.trim(lastVertex, nextVertex, start, 1, length);

            ctx.moveTo(_tv6.start[4], _tv6.start[5]);
            ctx.bezierCurveTo(_tv6.start[0], _tv6.start[1], _tv6.end[2], _tv6.end[3], _tv6.end[4], _tv6.end[5]);
          } else if (_index2 === endIndex) {
            var _tv7 = this.trim(lastVertex, nextVertex, 0, end, length);

            ctx.bezierCurveTo(_tv7.start[0], _tv7.start[1], _tv7.end[2], _tv7.end[3], _tv7.end[4], _tv7.end[5]);
          } else if (_index2 > startIndex && _index2 < endIndex) {
            ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);
          }
        }
      }
    }
  }, {
    key: "getValue",
    value: function getValue() {
      return this.frames[0];
    }
  }, {
    key: "getTrimValues",
    value: function getTrimValues(trim, frame) {
      var actualTrim = {
        startIndex: 0,
        endIndex: 0,
        start: 0,
        end: 0,
        looped: false
      };

      if (trim.start === 0 && trim.end === 1) {
        return null;
      }

      var totalLen = this.sumArray(frame.len);
      var trimStartAtLength = totalLen * trim.start;

      for (var i = 0; i < frame.len.length; i++) {
        if (trimStartAtLength === 0 || trimStartAtLength < frame.len[i]) {
          actualTrim.startIndex = i;
          actualTrim.start = trimStartAtLength / frame.len[i];
          break;
        }

        trimStartAtLength -= frame.len[i];
      }

      var trimEndAtLength = totalLen * trim.end;

      if (trim.end === 1) {
        actualTrim.endIndex = frame.len.length;
        actualTrim.end = 1;
        return actualTrim;
      }

      for (var _i3 = 0; _i3 < frame.len.length; _i3++) {
        if (trimEndAtLength === 0 || trimEndAtLength < frame.len[_i3]) {
          actualTrim.endIndex = _i3;
          actualTrim.end = trimEndAtLength / frame.len[_i3];
          break;
        }

        trimEndAtLength -= frame.len[_i3];
      }

      actualTrim.looped = actualTrim.startIndex > actualTrim.endIndex || actualTrim.startIndex === actualTrim.endIndex && actualTrim.start >= actualTrim.end;
      return actualTrim;
    }
  }, {
    key: "trim",
    value: function trim(lastVertex, nextVertex, from, to, len) {
      var values = {
        start: lastVertex,
        end: nextVertex
      };

      if (from === 0 && to === 1) {
        return values;
      }

      if (this.isStraight(lastVertex[4], lastVertex[5], lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5])) {
        values.start = [this.lerp(lastVertex[0], nextVertex[0], from), this.lerp(lastVertex[1], nextVertex[1], from), this.lerp(lastVertex[2], nextVertex[2], from), this.lerp(lastVertex[3], nextVertex[3], from), this.lerp(lastVertex[4], nextVertex[4], from), this.lerp(lastVertex[5], nextVertex[5], from)];
        values.end = [this.lerp(lastVertex[0], nextVertex[0], to), this.lerp(lastVertex[1], nextVertex[1], to), this.lerp(lastVertex[2], nextVertex[2], to), this.lerp(lastVertex[3], nextVertex[3], to), this.lerp(lastVertex[4], nextVertex[4], to), this.lerp(lastVertex[5], nextVertex[5], to)];
        return values;
      } else {
        this.bezier = new utils_Bezier([lastVertex[4], lastVertex[5], lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]]);
        this.bezier.getLength(len);
        from = this.bezier.map(from);
        to = this.bezier.map(to);
        to = (to - from) / (1 - from);
        var e1 = [this.lerp(lastVertex[4], lastVertex[0], from), this.lerp(lastVertex[5], lastVertex[1], from)];
        var f1 = [this.lerp(lastVertex[0], nextVertex[2], from), this.lerp(lastVertex[1], nextVertex[3], from)];
        var g1 = [this.lerp(nextVertex[2], nextVertex[4], from), this.lerp(nextVertex[3], nextVertex[5], from)];
        var h1 = [this.lerp(e1[0], f1[0], from), this.lerp(e1[1], f1[1], from)];
        var j1 = [this.lerp(f1[0], g1[0], from), this.lerp(f1[1], g1[1], from)];
        var k1 = [this.lerp(h1[0], j1[0], from), this.lerp(h1[1], j1[1], from)];
        var startVertex = [j1[0], j1[1], h1[0], h1[1], k1[0], k1[1]];
        var endVertex = [nextVertex[0], nextVertex[1], g1[0], g1[1], nextVertex[4], nextVertex[5]];
        var e2 = [this.lerp(startVertex[4], startVertex[0], to), this.lerp(startVertex[5], startVertex[1], to)];
        var f2 = [this.lerp(startVertex[0], endVertex[2], to), this.lerp(startVertex[1], endVertex[3], to)];
        var g2 = [this.lerp(endVertex[2], endVertex[4], to), this.lerp(endVertex[3], endVertex[5], to)];
        var h2 = [this.lerp(e2[0], f2[0], to), this.lerp(e2[1], f2[1], to)];
        var j2 = [this.lerp(f2[0], g2[0], to), this.lerp(f2[1], g2[1], to)];
        var k2 = [this.lerp(h2[0], j2[0], to), this.lerp(h2[1], j2[1], to)];
        values.start = [e2[0], e2[1], startVertex[2], startVertex[3], startVertex[4], startVertex[5]];
        values.end = [j2[0], j2[1], h2[0], h2[1], k2[0], k2[1]];
        return values;
      }
    }
  }, {
    key: "lerp",
    value: function lerp(a, b, t) {
      var s = 1 - t;
      return a * s + b * t;
    }
  }, {
    key: "sumArray",
    value: function sumArray(arr) {
      function add(a, b) {
        return a + b;
      }

      return arr.reduce(add);
    }
  }, {
    key: "isStraight",
    value: function isStraight(startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY) {
      return startX === ctrl1X && startY === ctrl1Y && endX === ctrl2X && endY === ctrl2Y;
    }
  }, {
    key: "setKeyframes",
    value: function setKeyframes(time) {}
  }, {
    key: "reset",
    value: function reset(reversed) {}
  }]);

  return Path;
}();

/* harmony default export */ var objects_Path = (Path_Path);
// CONCATENATED MODULE: ./src/utils/BezierEasing.js
/**
 * BezierEasing - use bezier curve for transition easing function
 * is based on Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = BezierEasing(0.25, 0.1, 0.25, 1.0)
 * spline(x) => returns the easing value | x must be in [0, 1] range
 *
 */
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
  } // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.


  function calcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
  } // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.


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

    --currentSample; // Interpolate to provide an initial guess for t

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
} // CSS mapping


BezierEasing.css = {
  "ease": BezierEasing(0.25, 0.1, 0.25, 1.0),
  "linear": BezierEasing(0.00, 0.0, 1.00, 1.0),
  "ease-in": BezierEasing(0.42, 0.0, 1.00, 1.0),
  "ease-out": BezierEasing(0.00, 0.0, 0.58, 1.0),
  "ease-in-out": BezierEasing(0.42, 0.0, 0.58, 1.0)
};
/* harmony default export */ var utils_BezierEasing = (BezierEasing);
// CONCATENATED MODULE: ./src/objects/AnimatedPath.js
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function AnimatedPath_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function AnimatedPath_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function AnimatedPath_createClass(Constructor, protoProps, staticProps) { if (protoProps) AnimatedPath_defineProperties(Constructor.prototype, protoProps); if (staticProps) AnimatedPath_defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }




var AnimatedPath_AnimatedPath =
/*#__PURE__*/
function (_Path) {
  _inherits(AnimatedPath, _Path);

  function AnimatedPath(data) {
    var _this;

    AnimatedPath_classCallCheck(this, AnimatedPath);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(AnimatedPath).call(this, data));
    _this.frameCount = _this.frames.length;
    _this.verticesCount = _this.frames[0].v.length;
    return _this;
  }

  AnimatedPath_createClass(AnimatedPath, [{
    key: "getValue",
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
    key: "setKeyframes",
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
    key: "onKeyframeChange",
    value: function onKeyframeChange() {
      this.setEasing();
    }
  }, {
    key: "lerp",
    value: function lerp(a, b, t) {
      return a + t * (b - a);
    }
  }, {
    key: "setEasing",
    value: function setEasing() {
      if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
        this.easing = new utils_BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
      } else {
        this.easing = null;
      }
    }
  }, {
    key: "getValueAtTime",
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
    key: "reset",
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
}(objects_Path);

/* harmony default export */ var objects_AnimatedPath = (AnimatedPath_AnimatedPath);
// CONCATENATED MODULE: ./src/property/Property.js
function Property_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Property_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Property_createClass(Constructor, protoProps, staticProps) { if (protoProps) Property_defineProperties(Constructor.prototype, protoProps); if (staticProps) Property_defineProperties(Constructor, staticProps); return Constructor; }

var Property =
/*#__PURE__*/
function () {
  function Property(data) {
    Property_classCallCheck(this, Property);

    this.frames = data;
  }

  Property_createClass(Property, [{
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

/* harmony default export */ var property_Property = (Property);
// CONCATENATED MODULE: ./src/property/AnimatedProperty.js
function AnimatedProperty_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { AnimatedProperty_typeof = function _typeof(obj) { return typeof obj; }; } else { AnimatedProperty_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return AnimatedProperty_typeof(obj); }

function AnimatedProperty_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function AnimatedProperty_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function AnimatedProperty_createClass(Constructor, protoProps, staticProps) { if (protoProps) AnimatedProperty_defineProperties(Constructor.prototype, protoProps); if (staticProps) AnimatedProperty_defineProperties(Constructor, staticProps); return Constructor; }

function AnimatedProperty_possibleConstructorReturn(self, call) { if (call && (AnimatedProperty_typeof(call) === "object" || typeof call === "function")) { return call; } return AnimatedProperty_assertThisInitialized(self); }

function AnimatedProperty_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function AnimatedProperty_getPrototypeOf(o) { AnimatedProperty_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return AnimatedProperty_getPrototypeOf(o); }

function AnimatedProperty_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) AnimatedProperty_setPrototypeOf(subClass, superClass); }

function AnimatedProperty_setPrototypeOf(o, p) { AnimatedProperty_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return AnimatedProperty_setPrototypeOf(o, p); }




var AnimatedProperty_AnimatedProperty =
/*#__PURE__*/
function (_Property) {
  AnimatedProperty_inherits(AnimatedProperty, _Property);

  function AnimatedProperty(data) {
    var _this;

    AnimatedProperty_classCallCheck(this, AnimatedProperty);

    _this = AnimatedProperty_possibleConstructorReturn(this, AnimatedProperty_getPrototypeOf(AnimatedProperty).call(this, data));
    _this.frameCount = _this.frames.length;
    return _this;
  }

  AnimatedProperty_createClass(AnimatedProperty, [{
    key: "lerp",
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
    key: "setEasing",
    value: function setEasing() {
      if (this.nextFrame.easeIn) {
        this.easing = new utils_BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
      } else {
        this.easing = null;
      }
    }
  }, {
    key: "getValue",
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
    key: "setKeyframes",
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
    key: "onKeyframeChange",
    value: function onKeyframeChange() {
      this.setEasing();
    }
  }, {
    key: "getElapsed",
    value: function getElapsed(time) {
      var delta = time - this.lastFrame.t;
      var duration = this.nextFrame.t - this.lastFrame.t;
      var elapsed = delta / duration;
      if (elapsed > 1) elapsed = 1;else if (elapsed < 0) elapsed = 0;else if (this.easing) elapsed = this.easing(elapsed);
      return elapsed;
    }
  }, {
    key: "getValueAtTime",
    value: function getValueAtTime(time) {
      return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
    }
  }, {
    key: "reset",
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
}(property_Property);

/* harmony default export */ var property_AnimatedProperty = (AnimatedProperty_AnimatedProperty);
// CONCATENATED MODULE: ./src/transform/Position.js
function Position_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { Position_typeof = function _typeof(obj) { return typeof obj; }; } else { Position_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return Position_typeof(obj); }

function Position_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Position_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Position_createClass(Constructor, protoProps, staticProps) { if (protoProps) Position_defineProperties(Constructor.prototype, protoProps); if (staticProps) Position_defineProperties(Constructor, staticProps); return Constructor; }

function Position_possibleConstructorReturn(self, call) { if (call && (Position_typeof(call) === "object" || typeof call === "function")) { return call; } return Position_assertThisInitialized(self); }

function Position_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function Position_getPrototypeOf(o) { Position_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return Position_getPrototypeOf(o); }

function Position_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) Position_setPrototypeOf(subClass, superClass); }

function Position_setPrototypeOf(o, p) { Position_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return Position_setPrototypeOf(o, p); }




var Position_Position =
/*#__PURE__*/
function (_AnimatedProperty) {
  Position_inherits(Position, _AnimatedProperty);

  function Position() {
    Position_classCallCheck(this, Position);

    return Position_possibleConstructorReturn(this, Position_getPrototypeOf(Position).apply(this, arguments));
  }

  Position_createClass(Position, [{
    key: "onKeyframeChange",
    value: function onKeyframeChange() {
      this.setEasing();
      this.setMotionPath();
    }
  }, {
    key: "getValueAtTime",
    value: function getValueAtTime(time) {
      if (this.motionpath) {
        return this.motionpath.getValues(this.getElapsed(time));
      } else {
        return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
      }
    }
  }, {
    key: "setMotionPath",
    value: function setMotionPath() {
      if (this.lastFrame.motionpath) {
        this.motionpath = new utils_Bezier(this.lastFrame.motionpath);
        this.motionpath.getLength(this.lastFrame.len);
      } else {
        this.motionpath = null;
      }
    }
  }]);

  return Position;
}(property_AnimatedProperty);

/* harmony default export */ var transform_Position = (Position_Position);
// CONCATENATED MODULE: ./src/transform/Transform.js
function Transform_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Transform_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Transform_createClass(Constructor, protoProps, staticProps) { if (protoProps) Transform_defineProperties(Constructor.prototype, protoProps); if (staticProps) Transform_defineProperties(Constructor, staticProps); return Constructor; }





var Transform_Transform =
/*#__PURE__*/
function () {
  function Transform(data) {
    Transform_classCallCheck(this, Transform);

    if (data.position) {
      if (data.position.length > 1) {
        this.position = new transform_Position(data.position);
      } else {
        this.position = new property_Property(data.position);
      }
    }

    if (data.positionX) this.positionX = data.positionX.length > 1 ? new property_AnimatedProperty(data.positionX) : new property_Property(data.positionX);
    if (data.positionY) this.positionY = data.positionY.length > 1 ? new property_AnimatedProperty(data.positionY) : new property_Property(data.positionY);
    if (data.anchor) this.anchor = data.anchor.length > 1 ? new property_AnimatedProperty(data.anchor) : new property_Property(data.anchor);
    if (data.scaleX) this.scaleX = data.scaleX.length > 1 ? new property_AnimatedProperty(data.scaleX) : new property_Property(data.scaleX);
    if (data.scaleY) this.scaleY = data.scaleY.length > 1 ? new property_AnimatedProperty(data.scaleY) : new property_Property(data.scaleY);
    if (data.skew) this.skew = data.skew.length > 1 ? new property_AnimatedProperty(data.skew) : new property_Property(data.skew);
    if (data.skewAxis) this.skewAxis = data.skewAxis.length > 1 ? new property_AnimatedProperty(data.skewAxis) : new property_Property(data.skewAxis);
    if (data.rotation) this.rotation = data.rotation.length > 1 ? new property_AnimatedProperty(data.rotation) : new property_Property(data.rotation);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new property_AnimatedProperty(data.opacity) : new property_Property(data.opacity);
  }

  Transform_createClass(Transform, [{
    key: "update",
    value: function update(ctx, time) {
      var positionX; // FIXME wrong transparency if nested

      var positionY;
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
      } // console.log(ctx, positionX, positionY, anchor, rotation, skew, skewAxis, scaleX, scaleY, opacity);
      //order very very important :)


      ctx.transform(1, 0, 0, 1, positionX - anchor[0], positionY - anchor[1]);
      this.setRotation(ctx, rotation, anchor[0], anchor[1]);
      this.setSkew(ctx, skew, skewAxis, anchor[0], anchor[1]);
      this.setScale(ctx, scaleX, scaleY, anchor[0], anchor[1]);
      ctx.globalAlpha = opacity;
    }
  }, {
    key: "setRotation",
    value: function setRotation(ctx, rad, x, y) {
      var c = Math.cos(rad);
      var s = Math.sin(rad);
      var dx = x - c * x + s * y;
      var dy = y - s * x - c * y;
      ctx.transform(c, s, -s, c, dx, dy);
    }
  }, {
    key: "setScale",
    value: function setScale(ctx, sx, sy, x, y) {
      ctx.transform(sx, 0, 0, sy, -x * sx + x, -y * sy + y);
    }
  }, {
    key: "setSkew",
    value: function setSkew(ctx, skew, axis, x, y) {
      var t = Math.tan(-skew);
      this.setRotation(ctx, -axis, x, y);
      ctx.transform(1, 0, t, 1, -y * t, 0);
      this.setRotation(ctx, axis, x, y);
    }
  }, {
    key: "deg2rad",
    value: function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
  }, {
    key: "setKeyframes",
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
    key: "reset",
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

/* harmony default export */ var transform_Transform = (Transform_Transform);
// CONCATENATED MODULE: ./src/effects/DropShadow.js
function DropShadow_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function DropShadow_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function DropShadow_createClass(Constructor, protoProps, staticProps) { if (protoProps) DropShadow_defineProperties(Constructor.prototype, protoProps); if (staticProps) DropShadow_defineProperties(Constructor, staticProps); return Constructor; }




var DropShadow_DropShadow =
/*#__PURE__*/
function () {
  function DropShadow(data) {
    DropShadow_classCallCheck(this, DropShadow);

    this.color = data.color.length > 1 ? new property_AnimatedProperty(data.color) : new property_Property(data.color);
    this.opacity = data.opacity.length > 1 ? new property_AnimatedProperty(data.opacity) : new property_Property(data.opacity);
    this.direction = data.direction.length > 1 ? new property_AnimatedProperty(data.direction) : new property_Property(data.direction);
    this.distance = data.distance.length > 1 ? new property_AnimatedProperty(data.distance) : new property_Property(data.distance);
    this.softness = data.softness.length > 1 ? new property_AnimatedProperty(data.softness) : new property_Property(data.softness);
  }

  DropShadow_createClass(DropShadow, [{
    key: "getColor",
    value: function getColor(time) {
      var color = this.color.getValue(time);
      var opacity = this.opacity.getValue(time);
      return "rgba(".concat(Math.round(color[0]), ", ").concat(Math.round(color[1]), ", ").concat(Math.round(color[2]), ", ").concat(opacity, ")");
    }
  }, {
    key: "setShadow",
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
    key: "setKeyframes",
    value: function setKeyframes(time) {
      this.color.setKeyframes(time);
      this.opacity.setKeyframes(time);
      this.direction.setKeyframes(time);
      this.distance.setKeyframes(time);
      this.softness.setKeyframes(time);
    }
  }, {
    key: "reset",
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

/* harmony default export */ var effects_DropShadow = (DropShadow_DropShadow);
// CONCATENATED MODULE: ./src/layers/BaseLayer.js
function BaseLayer_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function BaseLayer_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function BaseLayer_createClass(Constructor, protoProps, staticProps) { if (protoProps) BaseLayer_defineProperties(Constructor.prototype, protoProps); if (staticProps) BaseLayer_defineProperties(Constructor, staticProps); return Constructor; }






var BaseLayer_BaseLayer =
/*#__PURE__*/
function () {
  function BaseLayer(data) {
    BaseLayer_classCallCheck(this, BaseLayer);

    this.index = data.index;
    this.in = data.in || 0;
    this.out = data.out;
    if (data.parent) this.parent = data.parent;
    this.transform = new transform_Transform(data.transform);

    if (data.effects) {
      if (data.effects.dropShadow) {
        this.dropShadow = new effects_DropShadow(data.effects.dropShadow);
      }
    }

    if (data.masks) {
      this.masks = data.masks.map(function (mask) {
        return mask.isAnimated ? new objects_AnimatedPath(mask) : new objects_Path(mask);
      });
    }
  }

  BaseLayer_createClass(BaseLayer, [{
    key: "draw",
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
    key: "setParentTransform",
    value: function setParentTransform(ctx, time) {
      if (this.parent) this.parent.setParentTransform(ctx, time);
      this.transform.update(ctx, time);
    }
  }, {
    key: "setKeyframes",
    value: function setKeyframes(time) {
      this.transform.setKeyframes(time);
      if (this.masks) this.masks.forEach(function (mask) {
        return mask.setKeyframes(time);
      });
    }
  }, {
    key: "reset",
    value: function reset(reversed) {
      this.transform.reset(reversed);
      if (this.masks) this.masks.forEach(function (mask) {
        return mask.reset(reversed);
      });
    }
  }]);

  return BaseLayer;
}();

/* harmony default export */ var layers_BaseLayer = (BaseLayer_BaseLayer);
// CONCATENATED MODULE: ./src/layers/ImageLayer.js
function ImageLayer_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ImageLayer_typeof = function _typeof(obj) { return typeof obj; }; } else { ImageLayer_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ImageLayer_typeof(obj); }

function ImageLayer_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ImageLayer_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ImageLayer_createClass(Constructor, protoProps, staticProps) { if (protoProps) ImageLayer_defineProperties(Constructor.prototype, protoProps); if (staticProps) ImageLayer_defineProperties(Constructor, staticProps); return Constructor; }

function ImageLayer_possibleConstructorReturn(self, call) { if (call && (ImageLayer_typeof(call) === "object" || typeof call === "function")) { return call; } return ImageLayer_assertThisInitialized(self); }

function ImageLayer_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = ImageLayer_getPrototypeOf(object); if (object === null) break; } return object; }

function ImageLayer_getPrototypeOf(o) { ImageLayer_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return ImageLayer_getPrototypeOf(o); }

function ImageLayer_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) ImageLayer_setPrototypeOf(subClass, superClass); }

function ImageLayer_setPrototypeOf(o, p) { ImageLayer_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return ImageLayer_setPrototypeOf(o, p); }



var ImageLayer =
/*#__PURE__*/
function (_BaseLayer) {
  ImageLayer_inherits(ImageLayer, _BaseLayer);

  function ImageLayer(data) {
    var _this;

    ImageLayer_classCallCheck(this, ImageLayer);

    _this = ImageLayer_possibleConstructorReturn(this, ImageLayer_getPrototypeOf(ImageLayer).call(this, data));
    _this.source = data.source;
    _this.isLoaded = false;
    return _this;
  }

  ImageLayer_createClass(ImageLayer, [{
    key: "preload",
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
    key: "draw",
    value: function draw(ctx, time) {
      _get(ImageLayer_getPrototypeOf(ImageLayer.prototype), "draw", this).call(this, ctx, time);

      ctx.drawImage(this.img, 0, 0);
      ctx.restore();
    }
  }]);

  return ImageLayer;
}(layers_BaseLayer);

/* harmony default export */ var layers_ImageLayer = (ImageLayer);
// CONCATENATED MODULE: ./src/layers/NullLayer.js
function NullLayer_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { NullLayer_typeof = function _typeof(obj) { return typeof obj; }; } else { NullLayer_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return NullLayer_typeof(obj); }

function NullLayer_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function NullLayer_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function NullLayer_createClass(Constructor, protoProps, staticProps) { if (protoProps) NullLayer_defineProperties(Constructor.prototype, protoProps); if (staticProps) NullLayer_defineProperties(Constructor, staticProps); return Constructor; }

function NullLayer_possibleConstructorReturn(self, call) { if (call && (NullLayer_typeof(call) === "object" || typeof call === "function")) { return call; } return NullLayer_assertThisInitialized(self); }

function NullLayer_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function NullLayer_get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { NullLayer_get = Reflect.get; } else { NullLayer_get = function _get(target, property, receiver) { var base = NullLayer_superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return NullLayer_get(target, property, receiver || target); }

function NullLayer_superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = NullLayer_getPrototypeOf(object); if (object === null) break; } return object; }

function NullLayer_getPrototypeOf(o) { NullLayer_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return NullLayer_getPrototypeOf(o); }

function NullLayer_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) NullLayer_setPrototypeOf(subClass, superClass); }

function NullLayer_setPrototypeOf(o, p) { NullLayer_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return NullLayer_setPrototypeOf(o, p); }



var NullLayer =
/*#__PURE__*/
function (_BaseLayer) {
  NullLayer_inherits(NullLayer, _BaseLayer);

  function NullLayer(data) {
    NullLayer_classCallCheck(this, NullLayer);

    return NullLayer_possibleConstructorReturn(this, NullLayer_getPrototypeOf(NullLayer).call(this, data));
  }

  NullLayer_createClass(NullLayer, [{
    key: "draw",
    value: function draw(ctx, time) {
      NullLayer_get(NullLayer_getPrototypeOf(NullLayer.prototype), "draw", this).call(this, ctx, time);

      ctx.restore();
    }
  }]);

  return NullLayer;
}(layers_BaseLayer);

/* harmony default export */ var layers_NullLayer = (NullLayer);
// CONCATENATED MODULE: ./src/layers/TextLayer.js
function TextLayer_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { TextLayer_typeof = function _typeof(obj) { return typeof obj; }; } else { TextLayer_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return TextLayer_typeof(obj); }

function TextLayer_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function TextLayer_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function TextLayer_createClass(Constructor, protoProps, staticProps) { if (protoProps) TextLayer_defineProperties(Constructor.prototype, protoProps); if (staticProps) TextLayer_defineProperties(Constructor, staticProps); return Constructor; }

function TextLayer_possibleConstructorReturn(self, call) { if (call && (TextLayer_typeof(call) === "object" || typeof call === "function")) { return call; } return TextLayer_assertThisInitialized(self); }

function TextLayer_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function TextLayer_get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { TextLayer_get = Reflect.get; } else { TextLayer_get = function _get(target, property, receiver) { var base = TextLayer_superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return TextLayer_get(target, property, receiver || target); }

function TextLayer_superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = TextLayer_getPrototypeOf(object); if (object === null) break; } return object; }

function TextLayer_getPrototypeOf(o) { TextLayer_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return TextLayer_getPrototypeOf(o); }

function TextLayer_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) TextLayer_setPrototypeOf(subClass, superClass); }

function TextLayer_setPrototypeOf(o, p) { TextLayer_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return TextLayer_setPrototypeOf(o, p); }



var TextLayer =
/*#__PURE__*/
function (_BaseLayer) {
  TextLayer_inherits(TextLayer, _BaseLayer);

  function TextLayer(data, baseFont) {
    var _this;

    TextLayer_classCallCheck(this, TextLayer);

    _this = TextLayer_possibleConstructorReturn(this, TextLayer_getPrototypeOf(TextLayer).call(this, data));
    _this.text = data.text;
    _this.leading = data.leading;
    _this.fontSize = data.fontSize;
    _this.font = data.font;
    _this.color = data.color;
    _this.justification = data.justification;
    _this.baseFont = baseFont;
    return _this;
  }

  TextLayer_createClass(TextLayer, [{
    key: "draw",
    value: function draw(ctx, time) {
      TextLayer_get(TextLayer_getPrototypeOf(TextLayer.prototype), "draw", this).call(this, ctx, time);

      ctx.textAlign = this.justification;
      ctx.font = "".concat(this.fontSize, "px ").concat(this.baseFont) || this.font;
      ctx.fillStyle = "rgb(".concat(this.color[0], ", ").concat(this.color[1], ", ").concat(this.color[2], ")");

      for (var j = 0; j < this.text.length; j++) {
        ctx.fillText(this.text[j], 0, j * this.leading);
      }

      ctx.restore();
    }
  }]);

  return TextLayer;
}(layers_BaseLayer);

/* harmony default export */ var layers_TextLayer = (TextLayer);
// CONCATENATED MODULE: ./src/objects/Ellipse.js
function Ellipse_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { Ellipse_typeof = function _typeof(obj) { return typeof obj; }; } else { Ellipse_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return Ellipse_typeof(obj); }

function Ellipse_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Ellipse_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Ellipse_createClass(Constructor, protoProps, staticProps) { if (protoProps) Ellipse_defineProperties(Constructor.prototype, protoProps); if (staticProps) Ellipse_defineProperties(Constructor, staticProps); return Constructor; }

function Ellipse_possibleConstructorReturn(self, call) { if (call && (Ellipse_typeof(call) === "object" || typeof call === "function")) { return call; } return Ellipse_assertThisInitialized(self); }

function Ellipse_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function Ellipse_getPrototypeOf(o) { Ellipse_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return Ellipse_getPrototypeOf(o); }

function Ellipse_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) Ellipse_setPrototypeOf(subClass, superClass); }

function Ellipse_setPrototypeOf(o, p) { Ellipse_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return Ellipse_setPrototypeOf(o, p); }





var Ellipse_Ellipse =
/*#__PURE__*/
function (_Path) {
  Ellipse_inherits(Ellipse, _Path);

  function Ellipse(data) {
    var _this;

    Ellipse_classCallCheck(this, Ellipse);

    _this = Ellipse_possibleConstructorReturn(this, Ellipse_getPrototypeOf(Ellipse).call(this, data));
    _this.closed = true;
    _this.size = data.size.length > 1 ? new property_AnimatedProperty(data.size) : new property_Property(data.size);
    if (data.position) _this.position = data.position.length > 1 ? new property_AnimatedProperty(data.position) : new property_Property(data.position);
    return _this;
  }

  Ellipse_createClass(Ellipse, [{
    key: "draw",
    value: function draw(ctx, time, trim) {
      var size = this.size.getValue(time);
      var position = this.position ? this.position.getValue(time) : [0, 0];
      var i;
      var j;
      var w = size[0] / 2;
      var h = size[1] / 2;
      var x = position[0] - w;
      var y = position[1] - h;
      var ow = w * .5522848;
      var oh = h * .5522848;
      var vertices = [[x + w + ow, y, x + w - ow, y, x + w, y], [x + w + w, y + h + oh, x + w + w, y + h - oh, x + w + w, y + h], [x + w - ow, y + h + h, x + w + ow, y + h + h, x + w, y + h + h], [x, y + h - oh, x, y + h + oh, x, y + h]];

      if (trim) {
        var tv;
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
    key: "getTrimValues",
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
    key: "setKeyframes",
    value: function setKeyframes(time) {
      this.size.setKeyframes(time);
      if (this.position) this.position.setKeyframes(time);
    }
  }, {
    key: "reset",
    value: function reset(reversed) {
      this.size.reset(reversed);
      if (this.position) this.position.reset(reversed);
    }
  }]);

  return Ellipse;
}(objects_Path);

/* harmony default export */ var objects_Ellipse = (Ellipse_Ellipse);
// CONCATENATED MODULE: ./src/objects/Polystar.js
function Polystar_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Polystar_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Polystar_createClass(Constructor, protoProps, staticProps) { if (protoProps) Polystar_defineProperties(Constructor.prototype, protoProps); if (staticProps) Polystar_defineProperties(Constructor, staticProps); return Constructor; }




var Polystar_Polystar =
/*#__PURE__*/
function () {
  function Polystar(data) {
    Polystar_classCallCheck(this, Polystar);

    //this.name = data.name;
    this.closed = true; // TODO ??

    this.starType = data.starType;
    this.points = data.points.length > 1 ? new property_AnimatedProperty(data.points) : new property_Property(data.points);
    this.innerRadius = data.innerRadius.length > 1 ? new property_AnimatedProperty(data.innerRadius) : new property_Property(data.innerRadius);
    this.outerRadius = data.outerRadius.length > 1 ? new property_AnimatedProperty(data.outerRadius) : new property_Property(data.outerRadius);
    if (data.position) this.position = data.position.length > 1 ? new property_AnimatedProperty(data.position) : new property_Property(data.position);
    if (data.rotation) this.rotation = data.rotation.length > 1 ? new property_AnimatedProperty(data.rotation) : new property_Property(data.rotation);
    if (data.innerRoundness) this.innerRoundness = data.innerRoundness.length > 1 ? new property_AnimatedProperty(data.innerRoundness) : new property_Property(data.innerRoundness);
    if (data.outerRoundness) this.outerRoundness = data.outerRoundness.length > 1 ? new property_AnimatedProperty(data.outerRoundness) : new property_Property(data.outerRoundness);
  }

  Polystar_createClass(Polystar, [{
    key: "draw",
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
        pOuter = this.rotatePoint(0, 0, 0, 0 - outerRadius, rot * (i + 1) + rotation); //FIxME

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
        } //debug
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
    key: "rotatePoint",
    value: function rotatePoint(cx, cy, x, y, radians) {
      var cos = Math.cos(radians);
      var sin = Math.sin(radians);
      var nx = cos * (x - cx) - sin * (y - cy) + cx;
      var ny = sin * (x - cx) + cos * (y - cy) + cy;
      return [nx, ny];
    }
  }, {
    key: "deg2rad",
    value: function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
  }, {
    key: "setKeyframes",
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
    key: "reset",
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

/* harmony default export */ var objects_Polystar = (Polystar_Polystar);
// CONCATENATED MODULE: ./src/objects/Rect.js
function Rect_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Rect_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Rect_createClass(Constructor, protoProps, staticProps) { if (protoProps) Rect_defineProperties(Constructor.prototype, protoProps); if (staticProps) Rect_defineProperties(Constructor, staticProps); return Constructor; }




var Rect_Rect =
/*#__PURE__*/
function () {
  function Rect(data) {
    Rect_classCallCheck(this, Rect);

    //this.name = data.name;
    this.closed = true;
    this.size = data.size.length > 1 ? new property_AnimatedProperty(data.size) : new property_Property(data.size); //optionals

    if (data.position) this.position = data.position.length > 1 ? new property_AnimatedProperty(data.position) : new property_Property(data.position);
    if (data.roundness) this.roundness = data.roundness.length > 1 ? new property_AnimatedProperty(data.roundness) : new property_Property(data.roundness);
  }

  Rect_createClass(Rect, [{
    key: "draw",
    value: function draw(ctx, time, trim) {
      var size = this.size.getValue(time);
      var position = this.position ? this.position.getValue(time) : [0, 0];
      var roundness = this.roundness ? this.roundness.getValue(time) : 0;
      if (size[0] < 2 * roundness) roundness = size[0] / 2;
      if (size[1] < 2 * roundness) roundness = size[1] / 2;
      var x = position[0] - size[0] / 2;
      var y = position[1] - size[1] / 2;

      if (trim) {// let tv;
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
    key: "setKeyframes",
    value: function setKeyframes(time) {
      this.size.setKeyframes(time);
      if (this.position) this.position.setKeyframes(time);
      if (this.roundness) this.roundness.setKeyframes(time);
    }
  }, {
    key: "reset",
    value: function reset(reversed) {
      this.size.reset(reversed);
      if (this.position) this.position.reset(reversed);
      if (this.roundness) this.roundness.reset(reversed);
    }
  }]);

  return Rect;
}();

/* harmony default export */ var objects_Rect = (Rect_Rect);
// CONCATENATED MODULE: ./src/property/Fill.js
function Fill_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Fill_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Fill_createClass(Constructor, protoProps, staticProps) { if (protoProps) Fill_defineProperties(Constructor.prototype, protoProps); if (staticProps) Fill_defineProperties(Constructor, staticProps); return Constructor; }




var Fill_Fill =
/*#__PURE__*/
function () {
  function Fill(data) {
    Fill_classCallCheck(this, Fill);

    this.color = data.color.length > 1 ? new property_AnimatedProperty(data.color) : new property_Property(data.color);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new property_AnimatedProperty(data.opacity) : new property_Property(data.opacity);
  }

  Fill_createClass(Fill, [{
    key: "getValue",
    value: function getValue(time) {
      var color = this.color.getValue(time);
      var opacity = this.opacity ? this.opacity.getValue(time) : 1;
      return "rgba(".concat(Math.round(color[0]), ", ").concat(Math.round(color[1]), ", ").concat(Math.round(color[2]), ", ").concat(opacity, ")");
    }
  }, {
    key: "update",
    value: function update(ctx, time) {
      var color = this.getValue(time);
      ctx.fillStyle = color;
    }
  }, {
    key: "setKeyframes",
    value: function setKeyframes(time) {
      this.color.setKeyframes(time);
      if (this.opacity) this.opacity.setKeyframes(time);
    }
  }, {
    key: "reset",
    value: function reset(reversed) {
      this.color.reset(reversed);
      if (this.opacity) this.opacity.reset(reversed);
    }
  }]);

  return Fill;
}();

/* harmony default export */ var property_Fill = (Fill_Fill);
// CONCATENATED MODULE: ./src/property/GradientFill.js
function GradientFill_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function GradientFill_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function GradientFill_createClass(Constructor, protoProps, staticProps) { if (protoProps) GradientFill_defineProperties(Constructor.prototype, protoProps); if (staticProps) GradientFill_defineProperties(Constructor, staticProps); return Constructor; }




var GradientFill_GradientFill =
/*#__PURE__*/
function () {
  function GradientFill(data, gradients) {
    GradientFill_classCallCheck(this, GradientFill);

    if (!gradients[data.name]) gradients[data.name] = [];
    gradients[data.name].push(this);
    this.stops = data.stops;
    this.type = data.type;
    this.startPoint = data.startPoint.length > 1 ? new property_AnimatedProperty(data.startPoint) : new property_Property(data.startPoint);
    this.endPoint = data.endPoint.length > 1 ? new property_AnimatedProperty(data.endPoint) : new property_Property(data.endPoint);
    if (data.opacity) this.opacity = data.opacity.length > 1 ? new property_AnimatedProperty(data.opacity) : new property_Property(data.opacity);
  }

  GradientFill_createClass(GradientFill, [{
    key: "update",
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
          gradient.addColorStop(stop.location, "rgba(".concat(color[0], ", ").concat(color[1], ", ").concat(color[2], ", ").concat(color[3] * opacity, ")"));
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
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
    key: "setKeyframes",
    value: function setKeyframes(time) {
      if (this.opacity) this.opacity.setKeyframes(time);
      this.startPoint.setKeyframes(time);
      this.endPoint.setKeyframes(time);
    }
  }, {
    key: "reset",
    value: function reset(reversed) {
      if (this.opacity) this.opacity.setKeyframes(reversed);
      this.startPoint.setKeyframes(reversed);
      this.endPoint.setKeyframes(reversed);
    }
  }]);

  return GradientFill;
}();

/* harmony default export */ var property_GradientFill = (GradientFill_GradientFill);
// CONCATENATED MODULE: ./src/property/Stroke.js
function Stroke_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Stroke_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Stroke_createClass(Constructor, protoProps, staticProps) { if (protoProps) Stroke_defineProperties(Constructor.prototype, protoProps); if (staticProps) Stroke_defineProperties(Constructor, staticProps); return Constructor; }




var Stroke_Stroke =
/*#__PURE__*/
function () {
  function Stroke(data) {
    Stroke_classCallCheck(this, Stroke);

    if (data) {
      this.join = data.join;
      this.cap = data.cap;

      if (data.miterLimit) {
        if (data.miterLimit.length > 1) this.miterLimit = new property_AnimatedProperty(data.miterLimit);else this.miterLimit = new property_Property(data.miterLimit);
      }

      if (data.color.length > 1) this.color = new property_AnimatedProperty(data.color);else this.color = new property_Property(data.color);
      if (data.opacity.length > 1) this.opacity = new property_AnimatedProperty(data.opacity);else this.opacity = new property_Property(data.opacity);
      if (data.width.length > 1) this.width = new property_AnimatedProperty(data.width);else this.width = new property_Property(data.width);

      if (data.dashes) {
        this.dashes = {};
        if (data.dashes.dash.length > 1) this.dashes.dash = new property_AnimatedProperty(data.dashes.dash);else this.dashes.dash = new property_Property(data.dashes.dash);
        if (data.dashes.gap.length > 1) this.dashes.gap = new property_AnimatedProperty(data.dashes.gap);else this.dashes.gap = new property_Property(data.dashes.gap);
        if (data.dashes.offset.length > 1) this.dashes.offset = new property_AnimatedProperty(data.dashes.offset);else this.dashes.offset = new property_Property(data.dashes.offset);
      }
    }
  }

  Stroke_createClass(Stroke, [{
    key: "getValue",
    value: function getValue(time) {
      var color = this.color.getValue(time);
      var opacity = this.opacity.getValue(time);
      color[0] = Math.round(color[0]);
      color[1] = Math.round(color[1]);
      color[2] = Math.round(color[2]);
      var s = color.join(', ');
      return "rgba(".concat(s, ", ").concat(opacity, ")");
    }
  }, {
    key: "update",
    value: function update(ctx, time) {
      var strokeColor = this.getValue(time);
      var strokeWidth = this.width.getValue(time);
      var strokeJoin = this.join;
      var miterLimit;
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
    key: "setKeyframes",
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
    key: "reset",
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

/* harmony default export */ var property_Stroke = (Stroke_Stroke);
// CONCATENATED MODULE: ./src/property/Trim.js
function Trim_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Trim_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Trim_createClass(Constructor, protoProps, staticProps) { if (protoProps) Trim_defineProperties(Constructor.prototype, protoProps); if (staticProps) Trim_defineProperties(Constructor, staticProps); return Constructor; }




var Trim_Trim =
/*#__PURE__*/
function () {
  function Trim(data) {
    Trim_classCallCheck(this, Trim);

    this.type = data.type;
    if (data.start) this.start = data.start.length > 1 ? new property_AnimatedProperty(data.start) : new property_Property(data.start);
    if (data.end) this.end = data.end.length > 1 ? new property_AnimatedProperty(data.end) : new property_Property(data.end);
    if (data.offset) this.offset = data.offset.length > 1 ? new property_AnimatedProperty(data.offset) : new property_Property(data.offset);
  }

  Trim_createClass(Trim, [{
    key: "getTrim",
    value: function getTrim(time) {
      var startValue = this.start ? this.start.getValue(time) : 0;
      var endValue = this.end ? this.end.getValue(time) : 1;
      var start = Math.min(startValue, endValue);
      var end = Math.max(startValue, endValue);

      if (this.offset) {
        var offset = this.offset.getValue(time) % 1;

        if (offset > 0 && offset < 1 || offset > -1 && offset < 0) {
          start += offset;
          end += offset;
          start = start > 1 ? start - 1 : start;
          start = start < 0 ? 1 + start : start;
          end = end > 1 ? end - 1 : end;
          end = end < 0 ? 1 + end : end;
        }
      }

      if (start === 0 && end === 1) {
        return null;
      } else {
        return {
          start: start,
          end: end
        };
      }
    }
  }, {
    key: "setKeyframes",
    value: function setKeyframes(time) {
      if (this.start) this.start.setKeyframes(time);
      if (this.end) this.end.setKeyframes(time);
      if (this.offset) this.offset.reset();
    }
  }, {
    key: "reset",
    value: function reset(reversed) {
      if (this.start) this.start.reset(reversed);
      if (this.end) this.end.reset(reversed);
      if (this.offset) this.offset.reset();
    }
  }]);

  return Trim;
}();

/* harmony default export */ var property_Trim = (Trim_Trim);
// CONCATENATED MODULE: ./src/layers/VectorLayer.js
function VectorLayer_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { VectorLayer_typeof = function _typeof(obj) { return typeof obj; }; } else { VectorLayer_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return VectorLayer_typeof(obj); }

function VectorLayer_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function VectorLayer_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function VectorLayer_createClass(Constructor, protoProps, staticProps) { if (protoProps) VectorLayer_defineProperties(Constructor.prototype, protoProps); if (staticProps) VectorLayer_defineProperties(Constructor, staticProps); return Constructor; }

function VectorLayer_possibleConstructorReturn(self, call) { if (call && (VectorLayer_typeof(call) === "object" || typeof call === "function")) { return call; } return VectorLayer_assertThisInitialized(self); }

function VectorLayer_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function VectorLayer_get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { VectorLayer_get = Reflect.get; } else { VectorLayer_get = function _get(target, property, receiver) { var base = VectorLayer_superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return VectorLayer_get(target, property, receiver || target); }

function VectorLayer_superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = VectorLayer_getPrototypeOf(object); if (object === null) break; } return object; }

function VectorLayer_getPrototypeOf(o) { VectorLayer_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return VectorLayer_getPrototypeOf(o); }

function VectorLayer_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) VectorLayer_setPrototypeOf(subClass, superClass); }

function VectorLayer_setPrototypeOf(o, p) { VectorLayer_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return VectorLayer_setPrototypeOf(o, p); }












var VectorLayer_VectorLayer =
/*#__PURE__*/
function (_BaseLayer) {
  VectorLayer_inherits(VectorLayer, _BaseLayer);

  function VectorLayer(data, gradients) {
    var _this;

    VectorLayer_classCallCheck(this, VectorLayer);

    _this = VectorLayer_possibleConstructorReturn(this, VectorLayer_getPrototypeOf(VectorLayer).call(this, data));
    if (data.fill) _this.fill = new property_Fill(data.fill);
    if (data.gradientFill) _this.fill = new property_GradientFill(data.gradientFill, gradients);
    if (data.stroke) _this.stroke = new property_Stroke(data.stroke);
    if (data.trim) _this.trim = new property_Trim(data.trim);

    if (data.groups) {
      _this.groups = data.groups.map(function (group) {
        return new VectorLayer(group, gradients);
      });
    }

    if (data.shapes) {
      _this.shapes = data.shapes.map(function (shape) {
        if (shape.type === 'path') {
          return shape.isAnimated ? new objects_AnimatedPath(shape) : new objects_Path(shape);
        } else if (shape.type === 'rect') {
          return new objects_Rect(shape);
        } else if (shape.type === 'ellipse') {
          return new objects_Ellipse(shape);
        } else if (shape.type === 'polystar') {
          return new objects_Polystar(shape);
        }
      });
    }

    return _this;
  }

  VectorLayer_createClass(VectorLayer, [{
    key: "draw",
    value: function draw(ctx, time, parentFill, parentStroke, parentTrim) {
      VectorLayer_get(VectorLayer_getPrototypeOf(VectorLayer.prototype), "draw", this).call(this, ctx, time);

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

        if (this.shapes[this.shapes.length - 1].closed) {// ctx.closePath();
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
    key: "setKeyframes",
    value: function setKeyframes(time) {
      VectorLayer_get(VectorLayer_getPrototypeOf(VectorLayer.prototype), "setKeyframes", this).call(this, time);

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
    key: "reset",
    value: function reset(reversed) {
      VectorLayer_get(VectorLayer_getPrototypeOf(VectorLayer.prototype), "reset", this).call(this, reversed);

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
}(layers_BaseLayer);

/* harmony default export */ var layers_VectorLayer = (VectorLayer_VectorLayer);
// CONCATENATED MODULE: ./src/layers/CompLayer.js
function CompLayer_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { CompLayer_typeof = function _typeof(obj) { return typeof obj; }; } else { CompLayer_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return CompLayer_typeof(obj); }

function CompLayer_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function CompLayer_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function CompLayer_createClass(Constructor, protoProps, staticProps) { if (protoProps) CompLayer_defineProperties(Constructor.prototype, protoProps); if (staticProps) CompLayer_defineProperties(Constructor, staticProps); return Constructor; }

function CompLayer_possibleConstructorReturn(self, call) { if (call && (CompLayer_typeof(call) === "object" || typeof call === "function")) { return call; } return CompLayer_assertThisInitialized(self); }

function CompLayer_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function CompLayer_get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { CompLayer_get = Reflect.get; } else { CompLayer_get = function _get(target, property, receiver) { var base = CompLayer_superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return CompLayer_get(target, property, receiver || target); }

function CompLayer_superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = CompLayer_getPrototypeOf(object); if (object === null) break; } return object; }

function CompLayer_getPrototypeOf(o) { CompLayer_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return CompLayer_getPrototypeOf(o); }

function CompLayer_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) CompLayer_setPrototypeOf(subClass, superClass); }

function CompLayer_setPrototypeOf(o, p) { CompLayer_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return CompLayer_setPrototypeOf(o, p); }









var CompLayer_CompLayer =
/*#__PURE__*/
function (_BaseLayer) {
  CompLayer_inherits(CompLayer, _BaseLayer);

  function CompLayer(data, comps, baseFont, gradients, imageBasePath) {
    var _this;

    CompLayer_classCallCheck(this, CompLayer);

    _this = CompLayer_possibleConstructorReturn(this, CompLayer_getPrototypeOf(CompLayer).call(this, data));
    var sourceID = data.sourceID;
    var layers = comps && comps[sourceID] ? comps[sourceID].layers : null;

    if (layers) {
      _this.layers = layers.map(function (layer) {
        switch (layer.type) {
          case 'vector':
            return new layers_VectorLayer(layer, gradients);

          case 'image':
            return new layers_ImageLayer(layer, imageBasePath);

          case 'text':
            return new layers_TextLayer(layer, baseFont);

          case 'comp':
            return new CompLayer(layer, baseFont, gradients, imageBasePath);

          case 'null':
            return new layers_NullLayer(layer);
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
      _this.timeRemapping = data.timeRemapping.length > 1 ? new property_AnimatedProperty(data.timeRemapping) : new property_Property(data.timeRemapping);
    }

    return _this;
  }

  CompLayer_createClass(CompLayer, [{
    key: "draw",
    value: function draw(ctx, time) {
      CompLayer_get(CompLayer_getPrototypeOf(CompLayer.prototype), "draw", this).call(this, ctx, time);

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
    key: "setParentTransform",
    value: function setParentTransform(ctx, time) {
      CompLayer_get(CompLayer_getPrototypeOf(CompLayer.prototype), "setParentTransform", this).call(this, ctx, time);

      var internalTime = time - this.in;
      if (this.layers) this.layers.forEach(function (layer) {
        return layer.setParentTransform(ctx, internalTime);
      });
    }
  }, {
    key: "setKeyframes",
    value: function setKeyframes(time) {
      CompLayer_get(CompLayer_getPrototypeOf(CompLayer.prototype), "setKeyframes", this).call(this, time);

      var internalTime = time - this.in;
      if (this.timeRemapping) this.timeRemapping.setKeyframes(internalTime);
      if (this.layers) this.layers.forEach(function (layer) {
        return layer.setKeyframes(internalTime);
      });
    }
  }, {
    key: "reset",
    value: function reset(reversed) {
      CompLayer_get(CompLayer_getPrototypeOf(CompLayer.prototype), "reset", this).call(this, reversed);

      if (this.timeRemapping) this.timeRemapping.reset(reversed);
      if (this.layers) this.layers.forEach(function (layer) {
        return layer.reset(reversed);
      });
    }
  }]);

  return CompLayer;
}(layers_BaseLayer);

/* harmony default export */ var layers_CompLayer = (CompLayer_CompLayer);
// CONCATENATED MODULE: ./src/Animation.js
function Animation_typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { Animation_typeof = function _typeof(obj) { return typeof obj; }; } else { Animation_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return Animation_typeof(obj); }

function Animation_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function Animation_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function Animation_createClass(Constructor, protoProps, staticProps) { if (protoProps) Animation_defineProperties(Constructor.prototype, protoProps); if (staticProps) Animation_defineProperties(Constructor, staticProps); return Constructor; }

function Animation_possibleConstructorReturn(self, call) { if (call && (Animation_typeof(call) === "object" || typeof call === "function")) { return call; } return Animation_assertThisInitialized(self); }

function Animation_getPrototypeOf(o) { Animation_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return Animation_getPrototypeOf(o); }

function Animation_assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function Animation_inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) Animation_setPrototypeOf(subClass, superClass); }

function Animation_setPrototypeOf(o, p) { Animation_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return Animation_setPrototypeOf(o, p); }









var Animation_Animation =
/*#__PURE__*/
function (_Emitter) {
  Animation_inherits(Animation, _Emitter);

  function Animation(options) {
    var _this;

    Animation_classCallCheck(this, Animation);

    _this = Animation_possibleConstructorReturn(this, Animation_getPrototypeOf(Animation).call(this));
    _this.gradients = {};
    _this.pausedTime = 0;
    _this.duration = options.data.duration;
    _this.baseWidth = options.data.width;
    _this.baseHeight = options.data.height;
    _this.ratio = options.data.width / options.data.height;
    _this.markers = options.data.markers;
    _this.baseFont = options.baseFont;
    _this.loop = options.loop || false;
    _this.devicePixelRatio = options.devicePixelRatio || (typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1);
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
          return new layers_VectorLayer(layer, _this.gradients);

        case 'image':
          return new layers_ImageLayer(layer, _this.imageBasePath);

        case 'text':
          return new layers_TextLayer(layer, _this.baseFont);

        case 'comp':
          return new layers_CompLayer(layer, comps, _this.baseFont, _this.gradients, _this.imageBasePath);

        case 'null':
        default:
          return new layers_NullLayer(layer);
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

    add(Animation_assertThisInitialized(_this));
    return _this;
  }

  Animation_createClass(Animation, [{
    key: "play",
    value: function play() {
      if (!this.isPlaying) {
        if (!this.isPaused) this.reset(this.reversed);
        this.isPaused = false;
        this.pausedTime = 0;
        this.isPlaying = true;
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      this.reset(this.reversed);
      this.isPlaying = false;
      this.drawFrame = true;
    }
  }, {
    key: "pause",
    value: function pause() {
      if (this.isPlaying) {
        this.isPaused = true;
        this.pausedTime = this.time;
        this.isPlaying = false;
      }
    }
  }, {
    key: "gotoAndPlay",
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
    key: "gotoAndStop",
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
    key: "getMarker",
    value: function getMarker(id) {
      var marker;

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
    key: "checkStopMarkers",
    value: function checkStopMarkers(from, to) {
      return this.markers.find(function (marker) {
        return marker.stop && marker.time > from && marker.time < to;
      });
    }
  }, {
    key: "preload",
    value: function preload() {
      var promises = this.layers.filter(function (layer) {
        return layer instanceof layers_ImageLayer;
      }).map(function (layer) {
        return new layer.preload();
      });
      return Promise.all(promises).catch(function (error) {
        return console.error(error);
      });
    }
  }, {
    key: "reset",
    value: function reset() {
      var _this2 = this;

      this.pausedTime = 0;
      this.time = this.reversed ? this.duration : 0;
      this.layers.forEach(function (layer) {
        return layer.reset(_this2.reversed);
      });
    }
  }, {
    key: "setKeyframes",
    value: function setKeyframes(time) {
      this.layers.forEach(function (layer) {
        return layer.setKeyframes(time);
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.isPlaying = false;
      if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
      remove(this);
    }
  }, {
    key: "resize",
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
    key: "setGradients",
    value: function setGradients(name, stops) {
      if (!this.gradients[name]) {
        console.warn("Gradient with name: ".concat(name, " not found."));
        return;
      }

      this.gradients[name].forEach(function (gradient) {
        gradient.stops = stops;
      });
    }
  }, {
    key: "getSpriteSheet",
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
    key: "draw",
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
    key: "update",
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
    key: "step",
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
    key: "reversed",
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
}(tiny_emitter_default.a);

/* harmony default export */ var src_Animation = (Animation_Animation);
// CONCATENATED MODULE: ./src/index.js
/* concated harmony reexport Animation */__webpack_require__.d(__webpack_exports__, "Animation", function() { return src_Animation; });
/* concated harmony reexport update */__webpack_require__.d(__webpack_exports__, "update", function() { return update; });
/* concated harmony reexport autoPlay */__webpack_require__.d(__webpack_exports__, "autoPlay", function() { return autoPlay; });
/* concated harmony reexport add */__webpack_require__.d(__webpack_exports__, "add", function() { return add; });
/* concated harmony reexport remove */__webpack_require__.d(__webpack_exports__, "remove", function() { return remove; });




/***/ })
/******/ ]);
});