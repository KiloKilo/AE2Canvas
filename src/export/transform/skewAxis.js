function getSkewAxis(data) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Vector Skew Axis')instanceof Property) {
        obj = data.property('ADBE Vector Skew Axis');
    } else {
        return null;
    }

    if (obj && obj.isTimeVarying || obj && obj.value !== 0) {
        obj = getProperty(obj);
        obj = normalizeKeyframes(obj);
    }

    return obj;
}