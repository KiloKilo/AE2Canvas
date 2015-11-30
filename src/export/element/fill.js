function getFill(data) {
    var fill = {};

    //fill.index = data.propertyIndex;
    //fill.composite = data.property('ADBE Vector Composite Order');

    fill.color = getProperty(data.property('ADBE Vector Fill Color'));
    fill.color = removeValues(fill.color, 3);
    fill.color = multiplyValue(fill.color, 255);
    fill.color = roundValue(fill.color);
    fill.color = normalizeKeyframes(fill.color);

    //optional
    var opacity = data.property('ADBE Vector Fill Opacity');

    if (opacity.isTimeVarying || opacity.value !== 100) {
        opacity = getProperty(opacity);
        opacity = normalizeKeyframes(opacity);
        opacity = divideValue(opacity, 100);
        fill.opacity = opacity;
    }

    return fill;
}

