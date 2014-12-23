'use strict';

function removeZValue(frames) {
    //remove z-value for layer transform
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v.length > 2) {
            frames[i].v.pop();
        }
    }

    return frames;
}

function roundValue(frames, prcsn) {

    var precision = prcsn || 1;

    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                frames[i].v[j] = Math.round(frames[i].v[j] * precision) / precision;
            }
        } else {
            frames[i].v = Math.round(frames[i].v * precision) / precision;
        }
    }

    return frames;
}

function divideValue(frames, divider) {
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                frames[i].v[j] = frames[i].v[j] / divider;
            }
        } else {
            frames[i].v = frames[i].v / divider;
        }
    }

    return frames;
}

function clampValue(frames, from, to) {
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                if (frames[i].v[j] > to) frames[i].v[j] = to;
                else if (frames[i].v[j] < from) frames[i].v[j] = from;
            }
        } else {
            if (frames[i].v > to) frames[i].v = to;
            else if (frames[i].v < from) frames[i].v = from;
        }
    }

    return frames;
}

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}