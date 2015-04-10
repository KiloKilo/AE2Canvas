function getOpacity(data, transform) {
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
        opacity = normalizeKeyframes(opacity);
        opacity = divideValue(opacity, 100);

        transform.opacity = opacity;
    }
}