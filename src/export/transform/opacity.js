function getOpacity(data, transform) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Opacity')instanceof Property) {
        obj = data.property('ADBE Opacity');
    } else if (data.property('ADBE Vector Group Opacity')instanceof Property) {
        obj = data.property('ADBE Vector Group Opacity');
    } else {
        return null;
    }

    if (obj.isTimeVarying || obj.value !== 100) {
        var opacity = getProperty(obj);
        opacity = normalizeOpacity(opacity);
        if (opacity.length > 1) opacity = normalizeKeyframes(opacity);

        transform.opacity = opacity;
    }
}