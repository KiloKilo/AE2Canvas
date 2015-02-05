'use strict';

function normalizeSpatialKeyframes(frames, dimension) {

    for (var i = 1; i < frames.length; i++) {

        var lastKey = frames[i - 1],
            key = frames[i],
            duration = key.t - lastKey.t,
            diff,
            easeOut, easeIn,
            normInfluenceIn, normSpeedIn,
            normInfluenceOut, normSpeedOut,
            ratio;

        //break if lastkey and this key easing is both linear
        //if (lastKey.outType === KeyframeInterpolationType.LINEAR && key.inType === KeyframeInterpolationType.LINEAR) {
        //    delete lastKey.outType;
        //    delete lastKey.easeOut;
        //    delete lastKey.outTangent;
        //    delete key.inType;
        //    delete key.easeIn;
        //    delete key.inTangent;
        //    continue;
        //}

        diff = lastKey.len || getValueDifference(lastKey, key);

        //FIXME hackiest shit ever :)
        // fix problem if lastKey.v === key.v, but has easing
        //TODO use modulo
        if (diff < 0.01 && diff > -0.01) {
            diff = 0.01;
            if (key.v instanceof Array) {
                for (var j = 0; j < key.v.length; j++) {
                    key.v[j] = lastKey.v[j] + 0.01;
                }
            } else {
                key.v = lastKey.v + 0.01;
            }
        }

        var averageTempo = diff / duration * 1000;

        if (key.easeIn) {
            normInfluenceIn = key.easeIn[0] / 100;
            normSpeedIn = key.easeIn[1] / averageTempo * normInfluenceIn;
            easeIn = [];

            easeIn[0] = Math.round((1 - normInfluenceIn) * 1000) / 1000;
            easeIn[1] = Math.round((1 - normSpeedIn) * 1000) / 1000;

            //dimension separated position
            if (key.inTangent && !key.motionpath && typeof dimension === 'number') {
                //testing
                key.oldEaseIn = [];
                key.oldEaseIn[0] = easeIn[0];
                key.oldEaseIn[1] = easeIn[1];

                ratio = key.inTangent[dimension] / diff;
                easeIn[0] = 0.000001;
                easeIn[1] = 1 + ratio;
            }

            key.easeIn = easeIn;
        }

        //easeOut
        if (lastKey.easeOut) {
            normInfluenceOut = lastKey.easeOut[0] / 100;
            normSpeedOut = lastKey.easeOut[1] / averageTempo * normInfluenceOut;
            easeOut = [];

            easeOut[0] = Math.round(normInfluenceOut * 1000) / 1000;
            easeOut[1] = Math.round(normSpeedOut * 1000) / 1000;

            //dimension separated position
            if (lastKey.outTangent && !lastKey.motionpath && typeof dimension === 'number') {

                //testing
                lastKey.oldEaseOut = [];
                lastKey.oldEaseOut[0] = easeOut[0];
                lastKey.oldEaseOut[1] = easeOut[1];

                ratio = lastKey.outTangent[dimension] / diff;
                easeOut[0] = 0.000001;
                easeOut[1] = ratio;
                delete lastKey.inTangent;
                delete lastKey.outTangent;
            }

            lastKey.easeOut = easeOut;
        }

        //set default values if not set
        if (lastKey.easeOut && !key.easeIn) {
            key.easeIn = [0.16667, 1];
        } else if (key.easeIn && !lastKey.easeOut) {
            lastKey.easeOut = [0.16667, 0];
        }

        //TODO remove in- & outType
        if (key.inType) delete key.inType;
        if (key.outType) delete key.outType;
    }

    return frames;
}