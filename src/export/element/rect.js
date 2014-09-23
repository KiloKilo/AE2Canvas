function getRect(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var rect = {};
    rect.name = data.name;
    rect.index = data.propertyIndex;
    rect.type = 'rect';

    rect.size = getProperty(data.property('ADBE Vector Rect Size'));
    rect.size = normalizeSize(rect.size);
    rect.size = normalizeKeyframes(rect.size);

    rect.position = getProperty(data.property('ADBE Vector Rect Position'));
    rect.position = normalizeKeyframes(rect.position);

    rect.roundness = getProperty(data.property('ADBE Vector Rect Roundness'));
    rect.roundness = normalizeKeyframes(rect.roundness);

    return rect;

    function normalizeSize(frames) {
        for (var i = 0; i < frames.length; i++) {
            for (var j = 0; j < frames[i].length; j++) {
                frames[i].v[j] = Math.round(frames[i].v[j]);
            }
        }

        return frames;
    }
}


