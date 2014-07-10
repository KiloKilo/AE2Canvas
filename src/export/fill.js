function getFill(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var fill = {};
    fill.index = data.propertyIndex;
//    fill.composite = data.property('ADBE Vector Composite Order');
    fill.color = getProperty(data.property('ADBE Vector Fill Color'));
    fill.color = normalizeColor(fill.color);
    fill.opacity = getProperty(data.property('ADBE Vector Fill Opacity'));
    fill.opacity = normalizeOpacity(fill.opacity);

    return fill;
}

function normalizeOpacity(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = frames[i].v / 100;
    }

    return frames;
};

function normalizeColor(frames) {
    for (var i = 0; i < frames.length; i++) {
        var color = frames[i].v;
        frames[i].v = [
            Math.round(color[0] * 255),
            Math.round(color[1] * 255),
            Math.round(color[2] * 255)
        ]
    }

    return frames;
};