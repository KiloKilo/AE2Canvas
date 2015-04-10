function getAnchor(data, transform) {
    var obj;

    if (data.property('ADBE Anchor Point') instanceof Property) {
        obj = data.property('ADBE Anchor Point');
    } else if (data.property('ADBE Vector Anchor') instanceof Property) {
        obj = data.property('ADBE Vector Anchor');
    } else {
        return null;
    }

    if (obj.isTimeVarying || obj.value[0] !== 0 || obj.value[1] !== 0) {

        var anchor = getProperty(obj);
        anchor = removeZValue(anchor);
        anchor = roundValue(anchor);
        anchor = normalizeKeyframes(anchor);

        transform.anchor = anchor;
    }
}