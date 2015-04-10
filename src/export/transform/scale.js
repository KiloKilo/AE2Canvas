function getScale(data, transform) {

    var obj;

    if (data.property('ADBE Scale')instanceof Property) {
        obj = data.property('ADBE Scale');
    } else if (data.property('ADBE Vector Scale')instanceof Property) {
        obj = data.property('ADBE Vector Scale');
    } else {
        return null;
    }

    //scale can have two different easing, needs always two separate properties
    if (obj.isTimeVarying || obj.value[0] !== 100 || obj.value[1] !== 100) {

        var scaleX = getProperty(obj, 0);
        scaleX = normalizeKeyframes(scaleX);
        scaleX = divideValue(scaleX, 100);
        scaleX = roundValue(scaleX, 10000);

        var scaleY = getProperty(obj, 1);
        scaleY = normalizeKeyframes(scaleY);
        scaleY = divideValue(scaleY, 100);
        scaleY = roundValue(scaleY, 10000);

        transform.scaleX = scaleX;
        transform.scaleY = scaleY;
    }
}