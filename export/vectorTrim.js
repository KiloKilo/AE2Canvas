function getVectorTrim(data) {

    if (!data) return null;

    var trim = {};
    trim.start = getProperty(data.property('ADBE Vector Trim Start'));
    trim.end = getProperty(data.property('ADBE Vector Trim End'));
    trim.offset = getProperty(data.property('ADBE Vector Trim Offset'));
    trim.type = data.property('ADBE Vector Trim Type').value;

    return trim;
}