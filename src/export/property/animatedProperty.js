'use strict';

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
//                //anchor needs split, but has no second keyframeobject
//                easeIn = data.keyInTemporalEase(i)[0];
//                easeOut = data.keyOutTemporalEase(i)[0];
        }

        if (typeof split === 'number') {
            obj.v = data.keyValue(i)[split || 0];
        } else {
            obj.v = data.keyValue(i);
        }

        if (i > 1 && inType !== KeyframeInterpolationType.HOLD) {
            obj.easeIn = [];
            obj.easeIn[0] = easeIn.influence;
            obj.easeIn[1] = easeIn.speed;
        }

        if (i < numKeys && outType !== KeyframeInterpolationType.HOLD) {
            obj.easeOut = [];
            obj.easeOut[0] = easeOut.influence;
            obj.easeOut[1] = easeOut.speed;
        }

        //FIXME buggy if no easing set
//        position
        if (typeof split === 'number' &&
            (data.propertyValueType === PropertyValueType.TwoD_SPATIAL || data.propertyValueType === PropertyValueType.ThreeD_SPATIAL)) {

            if (i > 1) {
                obj.inTangent = data.keyInSpatialTangent(i)[split];
                obj.easeIn = [];
                obj.easeIn[0] = easeIn.influence;
                obj.easeIn[1] = easeIn.speed;
            }

            if (i < numKeys) {
                obj.outTangent = data.keyOutSpatialTangent(i)[split];
                obj.easeOut = [];
                obj.easeOut[0] = easeOut.influence;
                obj.easeOut[1] = easeOut.speed;
            }
        }

        arr.push(obj);
    }

    return arr;
}