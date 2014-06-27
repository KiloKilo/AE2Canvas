function getEllipse(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var ellipse = {};
    ellipse.name = data.name;
    ellipse.type = 'ellipse';
    ellipse.size = getProperty(data.property('ADBE Vector Ellipse Size'));
    ellipse.position = getProperty(data.property('ADBE Vector Ellipse Position'));

    return ellipse;
}

