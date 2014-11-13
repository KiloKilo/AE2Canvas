function getAnchor(data, transform) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Anchor Point') instanceof Property) {
        obj = data.property('ADBE Anchor Point');
    } else if (data.property('ADBE Vector Anchor') instanceof Property) {
        obj = data.property('ADBE Vector Anchor');
    } else {
        return null;
    }

    //set if not default values
    if (obj.isTimeVarying || obj.value[0] !== 0 || obj.value[1] !== 0) {

        var anchor = getProperty(obj);
        anchor = removeZValue(anchor);
        anchor = roundValue(anchor);
        anchor = normalizeKeyframes(anchor);

        transform.anchor = anchor;
    }
}