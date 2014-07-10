function getPolystar(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var polystar = {};
    polystar.name = data.name;
    polystar.index = data.propertyIndex;
    polystar.type = 'polystar';
    polystar.starType = data.property('ADBE Vector Star Type').value;
    polystar.points = getProperty(data.property('ADBE Vector Star Points'));
    polystar.position = getProperty(data.property('ADBE Vector Star Position'));
    polystar.rotation = getProperty(data.property('ADBE Vector Star Rotation'));
    polystar.innerRadius = getProperty(data.property('ADBE Vector Star Inner Radius'));
    polystar.outerRadius = getProperty(data.property('ADBE Vector Star Outer Radius'));
    // is called Roundess not Roundness... wtf?
    polystar.innerRoundness = getProperty(data.property('ADBE Vector Star Inner Roundess'));
    polystar.outerRoundness = getProperty(data.property('ADBE Vector Star Outer Roundess'));

    return polystar;
}

