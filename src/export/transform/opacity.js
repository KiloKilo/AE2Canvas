function getOpacity(data) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Opacity')instanceof Property) {
        obj = data.property('ADBE Opacity');
    } else if (data.property('ADBE Vector Group Opacity')instanceof Property) {
        obj = data.property('ADBE Vector Group Opacity');
    } else {
        return null;
    }

    if (obj.isTimeVarying || obj.value !== 100) {
        obj = getProperty(obj);
//        obj = roundValue(obj);
        obj = normalizeOpacity(obj);
        if (obj.length > 1) obj = normalizeKeyframes(obj);

        return obj
    } else {
        return null;
    }

    function normalizeOpacity(frames) {
        for (var i = 0; i < frames.length; i++) {
            frames[i].v = frames[i].v / 100;
            frames[i].v = Math.round(frames[i].v * 10000) / 10000;
        }

        return frames;
    }
}