function getPosition(data, transform) {
    var obj;

    if (data.property('ADBE Position') instanceof Property) {
        obj = data.property('ADBE Position');
    } else if (data.property('ADBE Vector Position') instanceof Property) {
        obj = data.property('ADBE Vector Position');
    } else {
        return null;
    }

    if (obj.isTimeVarying ||
        obj.value[0] !== 0 ||
        obj.value[1] !== 0) {

        var position = getProperty(obj);
        position = removeZValue(position);
        position = roundValue(position);

        if (position.length > 1) {
            position = getMotionpath(position);
            position = normalizeKeyframes(position);
        }

        transform.position = position;
    }
}