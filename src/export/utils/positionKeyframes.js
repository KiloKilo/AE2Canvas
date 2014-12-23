function normalizePositionKeyframes(frames) {

    for (var i = 1; i < frames.length; i++) {

        var lastKey = frames[i - 1],
            key = frames[i],
            duration = key.t - lastKey.t,
            diff,
            easeOut, easeIn,
            normInfluenceIn, normSpeedIn,
            normInfluenceOut, normSpeedOut,
            ratio;

        if (key.easeIn) {
            var xDiff = key.v[0] - key.v[0],
                yDiff = key.v[1] - key.v[1];

            var xRatio = normInfluenceIn = key.easeIn[0] / 100;

            normSpeedIn = key.easeIn[1] / averageTempo * normInfluenceIn;
            easeIn = [];

            //dimensionsepareted position
            if (key.inTangent && !key.motionpath) {
                ratio = key.inTangent[1] / diff;
                easeIn[0] = 0.000001;
                easeIn[1] = 1 + ratio;
            } else {
                easeIn[0] = Math.round((1 - normInfluenceIn) * 1000) / 1000;
                easeIn[1] = Math.round((1 - normSpeedIn) * 1000) / 1000;
            }

            key.easeIn = easeIn;
        }

        //easeOut
        if (lastKey.easeOut) {
            normInfluenceOut = lastKey.easeOut[0] / 100;
            normSpeedOut = lastKey.easeOut[1] / averageTempo * normInfluenceOut;
            easeOut = [];

            //position
            if (lastKey.outTangent && !lastKey.motionpath) {
                ratio = lastKey.outTangent[0] / diff;
                easeOut[0] = 0.000001;
                easeOut[1] = ratio;
                delete lastKey.inTangent;
                delete lastKey.outTangent;
            } else {
                easeOut[0] = Math.round(normInfluenceOut * 1000) / 1000;
                easeOut[1] = Math.round(normSpeedOut * 1000) / 1000;
            }
            lastKey.easeOut = easeOut;
        }

        //set default values if not set
        if (lastKey.easeOut && !key.easeIn) {
            key.easeIn = [0.16667, 1];
        } else if (key.easeIn && !lastKey.easeOut) {
            lastKey.easeOut = [0.16667, 0];
        }

        if (key.inType) delete key.inType;
        if (key.outType) delete key.outType;
    }

    return frames;
}

function getDifference(lastKey, key) {

    var x, y, z, diff;

    // multidimensional properties, e.g. fill array has 4 fields. don't need last one
    if (key.v instanceof Array && key.v.length > 2) {
        x = key.v[0] - lastKey.v[0];
        y = key.v[1] - lastKey.v[1];
        z = key.v[2] - lastKey.v[2];
        diff = Math.pow(x * x + y * y + z * z, 1 / 3);
    } else if (key.v instanceof Array && key.v.length === 2) {
        x = key.v[0] - lastKey.v[0];
        y = key.v[1] - lastKey.v[1];
        diff = Math.sqrt(x * x + y * y);
    } else {
        diff = key.v - lastKey.v;
    }

    return diff;
}