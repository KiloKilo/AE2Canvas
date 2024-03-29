/**
 * BezierEasing - use bezier curve for transition easing function
 * is based on Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = BezierEasing(0.25, 0.1, 0.25, 1.0)
 * spline(x) => returns the easing value | x must be in [0, 1] range
 *
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 4
var NEWTON_MIN_SLOPE = 0.001
var SUBDIVISION_PRECISION = 0.0000001
var SUBDIVISION_MAX_ITERATIONS = 10

var kSplineTableSize = 11
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0)

var float32ArraySupported = typeof Float32Array === 'function'

function BezierEasing(mX1: number, mY1: number, mX2: number, mY2: number) {
	// Validate arguments
	if (arguments.length !== 4) {
		throw new Error('BezierEasing requires 4 arguments.')
	}
	for (var i = 0; i < 4; ++i) {
		if (typeof arguments[i] !== 'number' || isNaN(arguments[i]) || !isFinite(arguments[i])) {
			throw new Error('BezierEasing arguments should be integers.')
		}
	}
	if (mX1 < 0 || mX1 > 1 || mX2 < 0 || mX2 > 1) {
		throw new Error('BezierEasing x values must be in [0, 1] range.')
	}

	var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize)

	function A(aA1: number, aA2: number) {
		return 1.0 - 3.0 * aA2 + 3.0 * aA1
	}
	function B(aA1: number, aA2: number) {
		return 3.0 * aA2 - 6.0 * aA1
	}
	function C(aA1: number) {
		return 3.0 * aA1
	}

	// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
	function calcBezier(aT: number, aA1: number, aA2: number) {
		return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT
	}

	// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
	function getSlope(aT: number, aA1: number, aA2: number) {
		return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1)
	}

	function newtonRaphsonIterate(aX: number, aGuessT: number) {
		for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
			var currentSlope = getSlope(aGuessT, mX1, mX2)
			if (currentSlope === 0.0) return aGuessT
			var currentX = calcBezier(aGuessT, mX1, mX2) - aX
			aGuessT -= currentX / currentSlope
		}
		return aGuessT
	}

	function calcSampleValues() {
		for (var i = 0; i < kSplineTableSize; ++i) {
			mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2)
		}
	}

	function binarySubdivide(aX: number, aA: number, aB: number) {
		var currentX,
			currentT,
			i = 0
		do {
			currentT = aA + (aB - aA) / 2.0
			currentX = calcBezier(currentT, mX1, mX2) - aX
			if (currentX > 0.0) {
				aB = currentT
			} else {
				aA = currentT
			}
		} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS)
		return currentT
	}

	function getTForX(aX: number) {
		var intervalStart = 0.0
		var currentSample = 1
		var lastSample = kSplineTableSize - 1

		for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
			intervalStart += kSampleStepSize
		}
		--currentSample

		// Interpolate to provide an initial guess for t
		var dist =
			(aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample])
		var guessForT = intervalStart + dist * kSampleStepSize

		var initialSlope = getSlope(guessForT, mX1, mX2)
		if (initialSlope >= NEWTON_MIN_SLOPE) {
			return newtonRaphsonIterate(aX, guessForT)
		} else if (initialSlope == 0.0) {
			return guessForT
		} else {
			return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize)
		}
	}

	if (mX1 != mY1 || mX2 != mY2) calcSampleValues()

	var f = function (aX: number) {
		if (mX1 === mY1 && mX2 === mY2) return aX // linear
		// Because JavaScript number are imprecise, we should guarantee the extremes are right.
		if (aX === 0) return 0
		if (aX === 1) return 1
		return calcBezier(getTForX(aX), mY1, mY2)
	}
	var str = 'BezierEasing(' + [mX1, mY1, mX2, mY2] + ')'
	f.toString = function () {
		return str
	}

	return f
}

// CSS mapping
BezierEasing.css = {
	ease: BezierEasing(0.25, 0.1, 0.25, 1.0),
	linear: BezierEasing(0.0, 0.0, 1.0, 1.0),
	'ease-in': BezierEasing(0.42, 0.0, 1.0, 1.0),
	'ease-out': BezierEasing(0.0, 0.0, 0.58, 1.0),
	'ease-in-out': BezierEasing(0.42, 0.0, 0.58, 1.0),
}

export default BezierEasing
