'use strict';

function getScale(data) {

    var obj;

    if (data.property('ADBE Scale')instanceof Property) {
        obj = data.property('ADBE Scale');
    } else if (data.property('ADBE Vector Scale')instanceof Property) {
        obj = data.property('ADBE Vector Scale');
    } else {
        return false;
    }

    if (obj.isTimeVarying ||
        obj.value[0] !== 100 ||
        obj.value[1] !== 100) {

        obj = getProperty(obj);
        obj = removeZValue(obj);
        obj = roundValue(obj, 10000);
        obj = normalizeKeyframes(obj);

        return obj;
    }
    else {
        return false;
    }
}