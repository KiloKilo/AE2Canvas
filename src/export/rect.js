function getRect(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var rect = {};
    rect.name = data.name;
    rect.type = 'rect';
    rect.size = getProperty(data.property('ADBE Vector Rect Size'));
    rect.position = getProperty(data.property('ADBE Vector Rect Position'));
    rect.roundness = getProperty(data.property('ADBE Vector Rect Roundness'));

    return rect;
}
