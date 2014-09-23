function getRotation(data) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Anchor Point') instanceof Property) {
        obj = data.property('ADBE Anchor Point');
    } else if (data.property('ADBE Vector Anchor') instanceof Property) {
        obj = data.property('ADBE Vector Anchor');
    } else {
        return null;
    }

    //only process if not default values
    if (obj.isTimeVarying || obj.value[0] !== 0 || obj.value[1] !== 0) {

        obj = getProperty(obj);
        obj = removeZValue(obj);
        obj = roundValue(obj);
        obj = normalizeKeyframes(obj);

        return obj
    } else {
        return null;
    }
}