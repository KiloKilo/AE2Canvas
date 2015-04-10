function getRotation(data, transform) {
    var obj;

    if (data.property('ADBE Rotate Z')instanceof Property) {
        obj = data.property('ADBE Rotate Z');
    } else if (data.property('ADBE Vector Rotation')instanceof Property) {
        obj = data.property('ADBE Vector Rotation');
    } else {
        return null;
    }

    if (obj.isTimeVarying || obj.value !== 0) {
        var rotation = getProperty(obj);
        rotation = roundValue(rotation, 10000);
        if (rotation.length > 1) rotation = normalizeKeyframes(rotation);

        transform.rotation = rotation;
    }
}