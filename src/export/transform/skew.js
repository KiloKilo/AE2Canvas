function getSkew(data, transform) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Vector Skew')instanceof Property) {
        obj = data.property('ADBE Vector Skew');
    } else {
        return null;
    }

    if (obj && obj.isTimeVarying || obj && obj.value !== 0) {
        var skew = getProperty(obj);
        if (skew.length > 1) skew = normalizeKeyframes(skew);

        transform.skew = skew;
    }
}