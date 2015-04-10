function getRect(data) {

    var rect = {};
    rect.name = data.name;
    //rect.index = data.propertyIndex;
    rect.type = 'rect';

    rect.size = getProperty(data.property('ADBE Vector Rect Size'));
    rect.size = roundValue(rect.size);
    rect.size = normalizeKeyframes(rect.size);

    //optional
    var position = data.property('ADBE Vector Rect Position');
    if (position.isTimeVarying || position.value[0] !== 0 || position.value[1] !== 0) {
        position = getProperty(position);
        position = normalizeKeyframes(position);
        rect.position = position;
    }

    var roundness = data.property('ADBE Vector Rect Roundness');
    if (roundness.isTimeVarying || roundness.value !== 0) {
        roundness = getProperty(roundness);
        roundness = normalizeKeyframes(roundness);
        rect.roundness = roundness;
    }

    return rect;
}


