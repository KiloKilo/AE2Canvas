function getRect(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var rect = {};
    rect.name = data.name;
    rect.type = 'rect';
    rect.size = getProperty(data.property('ADBE Vector Rect Size'));
    rect.position = getProperty(data.property('ADBE Vector Rect Position'));
    rect.roundness = getProperty(data.property('ADBE Vector Rect Roundness'));

    rect.size = normalizeSize(rect.size);

    return rect;
}

function normalizeSize(frames) {
    for (var i = 0; i < frames.length; i++) {
        for (var j = 0; j < frames[i].length; j++) {
            frames[i].v[j] = Math.round(frames[i].v[j]);
        }
    }

    return frames;
}
