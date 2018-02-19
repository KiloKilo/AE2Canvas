import {requestAnimationFrame} from "./utils/shim";

var _animations = [],
    _animationsLength = 0;

var _autoPlay = false;
var _rafId;

const update = function (time) {
    if (_autoPlay) {
        _rafId = requestAnimationFrame(update);
    }
    time = time !== undefined ? time : performance.now();

    for (var i = 0; i < _animationsLength; i++) {
        _animations[i].update(time);
    }
};

const autoPlay = function (auto) {
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

export {update, autoPlay, add, remove};
