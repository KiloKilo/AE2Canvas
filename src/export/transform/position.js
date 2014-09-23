function getPosition(data) {
    if (!data instanceof PropertyGroup) return null;

    var obj = {};

    if (data.property('ADBE Position')instanceof Property) {
        obj = data.property('ADBE Position');
    } else if (data.property('ADBE Vector Position')instanceof Property) {
        obj = data.property('ADBE Vector Position');
    } else {
        return null;
    }

    if (obj.isTimeVarying ||
        obj.value[0] !== 0 ||
        obj.value[1] !== 0) {

        if (obj.dimensionsSeparated) {
//            obj.positionX = normalizePosition(getProperty(positionProp, 0));
//            obj.positionY = normalizePosition(getProperty(positionProp, 1));
//            obj.positionX = normalizeKeyframes(transform.positionX);
//            obj.positionY = normalizeKeyframes(transform.positionY);
        } else {
            obj = getProperty(obj);
            obj = removeZValue(obj);
            obj = roundValue(obj);
            obj = normalizeKeyframes(obj);
        }

        return obj;

    } else {
        return null;
    }
}