function getEllipse(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var ellipse = {};
    ellipse.name = data.name;
    ellipse.index = data.propertyIndex;
    ellipse.type = 'ellipse';

    ellipse.size = getProperty(data.property('ADBE Vector Ellipse Size'));
    ellipse.size = normalizeKeyframes(ellipse.size);

    //optional
    var position = data.property('ADBE Vector Ellipse Position');
    if (position.isTimeVarying || position.value[0] !== 0 || position.value[1] !== 0) {
        ellipse.position = getProperty(position);
        ellipse.position = normalizeKeyframes(ellipse.position);
    }

    return ellipse;
}

