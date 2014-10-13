function getRotation(data) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Rotate Z')instanceof Property) {
        obj = data.property('ADBE Rotate Z');
    } else if (data.property('ADBE Vector Rotation')instanceof Property) {
        obj = data.property('ADBE Vector Rotation');
    } else {
        return null;
    }

    if (obj.isTimeVarying || obj.value !== 0) {
        obj = getProperty(obj);
        obj = roundValue(obj, 10000);
        if (obj.length > 1) obj = normalizeKeyframes(obj);

        return obj
    } else {
        return null;
    }
}