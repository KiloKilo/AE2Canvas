function getProperty(data, split) {
    if (!data instanceof Property) return null;

    var frames = [];
    var numKeys = data.numKeys;

    if (numKeys > 0) {
        for (var i = 1; i <= numKeys; i++) {
            var obj = {};
            obj.time = data.keyTime(i) * 1000; // sec -> millisec}}

            if (typeof split !== 'undefined') {
                obj.value = data.keyValue(i)[split];
            }
            else {
                obj.value = data.keyValue(i);
            }

            var inType = data.keyInInterpolationType(i);
            var outType = data.keyOutInterpolationType(i);

            var easeIn = data.keyInTemporalEase(i)[split || 0];
            var easeOut = data.keyOutTemporalEase(i)[split || 0];
            //FIXME maybe wrong for scaleX/scaleY?
//            var easeIn = data.keyInTemporalEase(i)[0];
//            var easeOut = data.keyOutTemporalEase(i)[0];

            // dont need easeIn for first keyframe / easeOut for last keyframe
            if (easeIn && i > 1 && inType === KeyframeInterpolationType.BEZIER) {
                obj.easeIn = [];
                obj.easeIn[0] = easeIn.influence;
                obj.easeIn[1] = easeIn.speed;
            }
            if (easeOut && i < numKeys && outType === KeyframeInterpolationType.BEZIER) {
                obj.easeOut = [];
                obj.easeOut[0] = easeOut.influence;
                obj.easeOut[1] = easeOut.speed;
            }

            frames.push(obj);
        }
        //frames = removeUnnecessaryFrames(frames);
        frames = normalizeKeyframes(frames);
    }
    else {
        var obj = {};
        obj.time = 0;
        // split = 0 -> false :(
        if (typeof split !== 'undefined') {
            obj.value = data.value[split];
        }
        else {
            obj.value = data.value;
        }
        frames.push(obj);
    }

    return frames;
}

function removeUnnecessaryFrames(frames) {
    for (var i = 1; i < frames.length; i++) {
        var lastKey = frames[i - 1];
        var key = frames[i];

        if (lastKey.value === key.value) {
            frames.splice(i, 1);
            i--;
        }
    }
    return frames;
}

function normalizeKeyframes(frames) {

    for (var i = 1; i < frames.length; i++) {


        var lastKey = frames[i - 1];
        var key = frames[i];
        var duration = key.time - lastKey.time;

        // twodimensional properties, e.g. position or anchorpoint
        if (key.value instanceof Array) {
            var x = Math.abs(key.value[0] - lastKey.value[0]);
            var y = Math.abs(key.value[1] - lastKey.value[1]);
            var diff = Math.sqrt(x * x + y * y);
        } else {
            var diff = Math.abs(key.value - lastKey.value);
        }


        if (diff <= 0) diff = 0.1;
        var averageTempo = diff / duration * 1000;

        //easeIn
        if (key.easeIn) {
            var normInfluenceIn = key.easeIn[0] / 100;
            var normSpeedIn = key.easeIn[1] / averageTempo * normInfluenceIn;
            var easeIn = [];
            easeIn[0] = 1 - normInfluenceIn;
            easeIn[1] = 1 - normSpeedIn;
            key.easeIn = easeIn;
        }

        //easeOut
        if (lastKey.easeOut) {
            var normInfluenceOut = lastKey.easeOut[0] / 100;
            var normSpeedOut = lastKey.easeOut[1] / averageTempo * normInfluenceOut;
            var easeOut = [];
            easeOut[0] = normInfluenceOut;
            easeOut[1] = normSpeedOut;
            lastKey.easeOut = easeOut;
        }

    }

    return frames;
};
