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