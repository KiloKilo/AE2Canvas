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
            obj.x = getProperty(obj, 0);
            obj.y = getProperty(obj, 1);
            obj.x = roundValue(obj.x);
            obj.y = roundValue(obj.y);
            if (obj.x.length > 1) obj.x = normalizeKeyframes(obj.x);
            if (obj.y.length > 1) obj.y = normalizeKeyframes(obj.y);
        } else {
            obj = getProperty(obj);
            obj = removeZValue(obj);
            obj = roundValue(obj);
            if (obj.length > 1) obj = normalizeKeyframes(obj);
        }

        return obj;

    } else {
        return null;
    }
}