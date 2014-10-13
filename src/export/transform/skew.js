function getSkew(data) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Vector Skew')instanceof Property) {
        obj = data.property('ADBE Vector Skew');
    }

    if (obj && obj.isTimeVarying || obj && obj.value !== 0) {
        obj = getProperty(obj);
        if (obj.length > 1) obj = normalizeKeyframes(obj);
    } else {
        return null;
    }

    return obj;
}