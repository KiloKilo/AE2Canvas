function getAnimatedProperty(data, split) {

    var arr = [],
        numKeys = data.numKeys;

    for (var i = 1; i <= numKeys; i++) {

        var obj = {},
            inType,
            outType,
            easeIn,
            easeOut;

        obj.t = data.keyTime(i) * 1000;

        inType = data.keyInInterpolationType(i);
        outType = data.keyOutInterpolationType(i);

        if (typeof split === 'number' && data.keyInTemporalEase(i)[split] && data.keyOutTemporalEase(i)[split]) {
            easeIn = data.keyInTemporalEase(i)[split];
            easeOut = data.keyOutTemporalEase(i)[split];
        } else {
            // is always array
            easeIn = data.keyInTemporalEase(i)[0];
            easeOut = data.keyOutTemporalEase(i)[0];
        }

        if (typeof split === 'number') {
            obj.v = data.keyValue(i)[split];
        } else {
            obj.v = data.keyValue(i);
        }

        if (i > 1 && inType !== KeyframeInterpolationType.HOLD) {
            obj.inType = inType;
            obj.easeIn = [];
            obj.easeIn[0] = easeIn.influence;
            obj.easeIn[1] = easeIn.speed;
        }

        if (i < numKeys && outType !== KeyframeInterpolationType.HOLD) {
            obj.outType = outType;
            obj.easeOut = [];
            obj.easeOut[0] = easeOut.influence;
            obj.easeOut[1] = easeOut.speed;
        }

//        position
        if (data.propertyValueType === PropertyValueType.TwoD_SPATIAL || data.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {

            if (i > 1) {
                obj.inTangent = data.keyInSpatialTangent(i);
                obj.easeIn = [];
                obj.easeIn[0] = easeIn.influence;
                obj.easeIn[1] = easeIn.speed;
            }

            if (i < numKeys) {
                obj.outTangent = data.keyOutSpatialTangent(i);
                obj.easeOut = [];
                obj.easeOut[0] = easeOut.influence;
                obj.easeOut[1] = easeOut.speed;
            }
        }

        arr.push(obj);
    }

    return arr;
}