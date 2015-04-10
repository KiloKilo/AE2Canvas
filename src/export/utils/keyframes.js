function normalizeKeyframes(frames) {

    for (var i = 1; i < frames.length; i++) {

        var lastKey = frames[i - 1],
            key = frames[i],
            duration = key.t - lastKey.t,
            diff,
            easeOut, easeIn,
            normInfluenceIn, normSpeedIn,
            normInfluenceOut, normSpeedOut;

        if (lastKey.outType === KeyframeInterpolationType.LINEAR && key.inType === KeyframeInterpolationType.LINEAR) {
            delete lastKey.outType;
            delete lastKey.easeOut;
            delete lastKey.outTangent;
            delete key.inType;
            delete key.easeIn;
            delete key.inTangent;
            continue;
        }

        diff = lastKey.len ? lastKey.len : getValueDifference(lastKey, key);

        var sign = 1;
        if (diff < 0.01 && diff > -0.01) {
            diff = 0.01;
            if (key.v instanceof Array) {
                for (var j = 0; j < key.v.length; j++) {
                    key.v[j] = lastKey.v[j] + 0.01 * sign;
                }
            } else {
                key.v = lastKey.v + 0.01 * sign;
            }

            sign = sign * -1;
        }

        var averageTempo = diff / duration * 1000;

        if (key.easeIn) {
            normInfluenceIn = key.easeIn[0] / 100;
            normSpeedIn = key.easeIn[1] / averageTempo * normInfluenceIn;
            easeIn = [];

            easeIn[0] = Math.round((1 - normInfluenceIn) * 1000) / 1000;
            easeIn[1] = Math.round((1 - normSpeedIn) * 1000) / 1000;

            key.easeIn = easeIn;
        }

        if (lastKey.easeOut) {
            normInfluenceOut = lastKey.easeOut[0] / 100;
            normSpeedOut = lastKey.easeOut[1] / averageTempo * normInfluenceOut;
            easeOut = [];

            easeOut[0] = Math.round(normInfluenceOut * 1000) / 1000;
            easeOut[1] = Math.round(normSpeedOut * 1000) / 1000;

            lastKey.easeOut = easeOut;
        }

        if (lastKey.easeOut && !key.easeIn) {
            key.easeIn = [0.16667, 1];
        } else if (key.easeIn && !lastKey.easeOut) {
            lastKey.easeOut = [0.16667, 0];
        }

        if (lastKey.easeOut[0] === lastKey.easeOut[1] && key.easeIn[0] === key.easeIn[1]) {
            delete lastKey.easeOut;
            delete key.easeIn;
        }

        if (key.inType) delete key.inType;
        if (key.outType) delete key.outType;
        if (key.inTangent) delete key.inTangent;
        if (key.outTangent) delete key.outTangent;

        if (lastKey.inType) delete lastKey.inType;
        if (lastKey.outType) delete lastKey.outType;
        if (lastKey.inTangent) delete lastKey.inTangent;
        if (lastKey.outTangent) delete lastKey.outTangent;
    }

    return frames;
}