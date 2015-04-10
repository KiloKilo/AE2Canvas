function getVectorTrim(data) {

    var trim = {};
    trim.index = data.propertyIndex;
    trim.type = data.property('ADBE Vector Trim Type').value;

    //optionals
    var start = data.property('ADBE Vector Trim Start');
    if (start.isTimeVarying || start.value !== 0) {
        trim.start = getProperty(start);
        trim.start = normalizeKeyframes(trim.start);
        trim.start = divideValue(trim.start, 100);
    }

    var end = data.property('ADBE Vector Trim End');
    if (end.isTimeVarying || end.value !== 100) {
        trim.end = getProperty(end);
        trim.end = normalizeKeyframes(trim.end);
        trim.end = divideValue(trim.end, 100);
    }

    //not implemented
    //var offset = data.property('ADBE Vector Trim Offset');
    //if (offset.isTimeVarying || offset.value !== 0) {
    //    trim.offset = getProperty(offset);
    //    trim.offset = normalizeKeyframes(trim.offset);
    //    trim.offset = divideValue(trim.offset, 100);
    //    trim.offset = capValue(trim.offset, 0.01, 0.99);
    //}
    return trim;
}