const _animations = [];
let _animationsLength = 0;

let _autoPlay = false;
let _rafId;

const update = time => {
    if (_autoPlay) {
        _rafId = requestAnimationFrame(update);
    }

    for (let i = 0; i < _animationsLength; i++) {
        _animations[i].update(time);
    }
};

const autoPlay = auto => {
    _autoPlay = auto;
    _autoPlay ? _rafId = requestAnimationFrame(update) : cancelAnimationFrame(_rafId);
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

export {update, autoPlay, add, remove};
