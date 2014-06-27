function getProperty(data, split) {
    if (!data instanceof Property) return null;

    if (data.numKeys < 1) {
        return getStaticProperty(data, split);
    } else {
        return getAnimatedProperty(data, split);
    }
}

function getStaticProperty(data, split) {

    var arr = [];

    if (data.value instanceof Array && typeof split === 'number') {
        arr.push({
            t: 0,
            v: data.value[split]
        });
    } else {
        arr.push({
            t: 0,
            v: data.value
        });
    }

    return arr;
}

function getAnimatedProperty(data, split) {
    var arr;

//    if (data.propertyValueType === PropertyValueType.TwoD_SPATIAL
//        || data.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
//
////        arr = normalizeSpatialKeyframes(getSpatialKeyframe(data, split));
//        arr = normalizeKeyframes(getKeyframes(data, split));
//    } else {
//
//    }

    arr = normalizeKeyframes(getKeyframes(data, split));

    return arr;
}

function getKeyframes(data, split) {

    var arr = [],
        numKeys = data.numKeys;

    for (var i = 1; i <= numKeys; i++) {

        var obj = {},
            inType,
            outType,
            inTangent,
            outTangent,
            easeIn,
            easeOut;

        inType = data.keyInInterpolationType(i);
        outType = data.keyOutInterpolationType(i);

        //position
        if (data.propertyValueType === PropertyValueType.TwoD_SPATIAL || data.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
            inTangent = data.keyInSpatialTangent(i);
            outTangent = data.keyOutSpatialTangent(i);
        }

        //anchor needs split, but has no second keyframeobject
        if (typeof split === 'number' && data.keyInTemporalEase(i)[split] && data.keyOutTemporalEase(i)[split]) {
            easeIn = data.keyInTemporalEase(i)[split];
            easeOut = data.keyOutTemporalEase(i)[split];
        } else {
            easeIn = data.keyInTemporalEase(i)[0];
            easeOut = data.keyOutTemporalEase(i)[0];
        }

        obj.t = data.keyTime(i) * 1000;

        if (typeof split === 'number') {
            obj.v = data.keyValue(i)[split || 0];
        } else {
            obj.v = data.keyValue(i);
        }

        for (key in KeyframeInterpolationType) {
            $.writeln('------------------------------');
            $.writeln(key);
            $.writeln(KeyframeInterpolationType[key]);
            $.writeln('------------------------------');
            if (outType === key) {
            }
        }

        if (i > 1 && inType === KeyframeInterpolationType.BEZIER) {
            obj.easeIn = [];
            obj.easeIn[0] = easeIn.influence;
            obj.easeIn[1] = easeIn.speed;
        }
        if (i < numKeys && outType === KeyframeInterpolationType.BEZIER) {
            obj.easeOut = [];
            obj.easeOut[0] = easeOut.influence;
            obj.easeOut[1] = easeOut.speed;
        }

        arr.push(obj);
    }

    return arr;
}

function getKeyframe(data, keyIndex, arrIndex) {

    var obj = {},
        numKeys = data.numKeys,
        inType,
        outType,
        easeIn,
        easeOut;

    inType = data.keyInInterpolationType(keyIndex);
    outType = data.keyOutInterpolationType(keyIndex);

    easeIn = data.keyInTemporalEase(keyIndex)[arrIndex];
    easeOut = data.keyOutTemporalEase(keyIndex)[arrIndex];

    obj.t = data.keyTime(keyIndex) * 1000;
    obj.v = data.keyValue(keyIndex)[arrIndex];

    if (easeIn && keyIndex > 1 && inType === KeyframeInterpolationType.BEZIER) {
        obj.easeIn = [];
        obj.easeIn[0] = easeIn.influence;
        obj.easeIn[1] = easeIn.speed;
    }
    if (easeOut && keyIndex < numKeys && outType === KeyframeInterpolationType.BEZIER) {
        obj.easeOut = [];
        obj.easeOut[0] = easeOut.influence;
        obj.easeOut[1] = easeOut.speed;
    }

    return obj;
}

function normalizeKeyframes(frames) {

    for (var i = 1; i < frames.length; i++) {

        var lastKey = frames[i - 1],
            key = frames[i],
            duration = key.t - lastKey.t,
            diff,
            x, y, z;

        // multidimensional properties, fill
        if (key.v instanceof Array && key.v.length === 3) {
            x = Math.abs(key.v[0] - lastKey.v[0]);
            y = Math.abs(key.v[1] - lastKey.v[1]);
            z = Math.abs(key.v[1] - lastKey.v[2]);
            diff = Math.pow(x * x + y * y + z * z, 1 / 3);
        } else if (key.v instanceof Array && key.v.length === 2) {
            x = Math.abs(key.v[0] - lastKey.v[0]);
            y = Math.abs(key.v[1] - lastKey.v[1]);
            diff = Math.sqrt(x * x + y * y);
        } else {
            diff = Math.abs(key.v - lastKey.v);
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

            //easeOut
            if (lastKey.easeOut) {
                var normInfluenceOut = lastKey.easeOut[0] / 100;
                var normSpeedOut = lastKey.easeOut[1] / averageTempo * normInfluenceOut;
                var easeOut = [];
                easeOut[0] = normInfluenceOut;
                easeOut[1] = normSpeedOut;
                lastKey.easeOut = easeOut;
            } else {
                var easeOut = [];
                easeOut[0] = 0;
                easeOut[1] = 0;
                lastKey.easeOut = easeOut;
            }
        }

    }

    return frames;
}