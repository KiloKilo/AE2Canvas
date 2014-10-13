'use strict';

function getScale(data, split) {

    var obj;

    if (data.property('ADBE Scale')instanceof Property) {
        obj = data.property('ADBE Scale');
    } else if (data.property('ADBE Vector Scale')instanceof Property) {
        obj = data.property('ADBE Vector Scale');
    } else {
        return false;
    }

    if (obj.isTimeVarying || obj.value[split] !== 100) {

        obj = getProperty(obj, split);
        obj = normalizeKeyframes(obj);
        obj = divideValue(obj, 100);
        obj = roundValue(obj, 10000);

        return obj;
    }
    else {
        return false;
    }
}