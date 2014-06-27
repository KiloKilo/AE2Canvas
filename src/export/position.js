function getPosition(data) {
    if (!data instanceof Property) return null;

    var frames = [];
    var numKeys = data.numKeys;

    if (numKeys > 0) {
        // Spatial keyframes for position
        if (data.propertyValueType === PropertyValueType.TwoD_SPATIAL || data.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
            for (var i = 1; i <= numKeys; i++) {
                var obj = getSpatialKeyframe(data, i, numKeys, split);
                frames.push(obj);
            }
            frames = normalizeSpatialKeyframes(frames);
        } else {
            for (var i = 1; i <= numKeys; i++) {
                var obj = getKeyframe(data, i, numKeys, split);
                frames.push(obj);
            }
            frames = normalizeKeyframes(frames);
        }
    }
    else {
        var obj = {
            x: {
                t: 0,
                v: data.value[0]
            },
            y: {
                t: 0,
                v: data.value[1]
            }
        };

        frames.push(obj);
    }

    return frames;
}

function getSpatialKeyframe(data, i, numKeys) {

    var obj = {
        t: data.keyTime(i) * 1000,
        v: data.keyValue(i)
    };

    var spatialIn = data.keyInSpatialTangent(i);
    var spatialOut = data.keyOutSpatialTangent(i);

    if (spatialIn && i > 1) {
        obj.easeIn = [];
        obj.easeIn[0] = spatialIn[0];
        obj.easeIn[1] = spatialIn[1];
    }
    if (spatialOut && i < numKeys) {
        obj.easeOut = [];
        obj.easeOut[0] = spatialOut[0];
        obj.easeOut[1] = spatialOut[1];
    }

    return obj;
}

function normalizeSpatialKeyframes(frames) {

    for (var i = 1; i < frames.length; i++) {

        var lastKey = frames[i - 1];
        var key = frames[i];

        //posX
        var diff = Math.abs(key.x.v - lastKey.x.v);
        if (diff <= 0) diff = 0.1;

        if (key.easeIn) {
            var easeIn = [];
            easeIn[0] = 0.1;
            easeIn[1] = key.easeIn[0] / diff;
            key.x.easeIn = easeIn;
        }

        if (lastKey.easeOut) {
            var easeOut = [];
            easeOut[0] = 0.1;
            easeOut[1] = lastKey.easeOut[0] / diff;
            lastKey.easeOut = easeOut;
        }

        //posY
        var diff = Math.abs(key.y.v - lastKey.y.v);
        if (diff <= 0) diff = 0.1;

        if (key.easeIn) {
            var easeIn = [];
            easeIn[0] = 0.1;
            easeIn[1] = key.easeIn[1] / diff;
            key.x.easeIn = easeIn;
        }

        if (lastKey.easeOut) {
            var easeOut = [];
            easeOut[0] = 0.1;
            easeOut[1] = lastKey.easeOut[1] / diff;
            lastKey.easeOut = easeOut;
        }

    }

    return frames;
}