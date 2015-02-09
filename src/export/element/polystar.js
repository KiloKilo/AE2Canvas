function getPolystar(data) {

    if (!(data instanceof PropertyGroup)) return null;

    var polystar = {};
    polystar.name = data.name;
    polystar.index = data.propertyIndex;
    polystar.type = 'polystar';
    polystar.starType = data.property('ADBE Vector Star Type').value;

    polystar.points = getProperty(data.property('ADBE Vector Star Points'));
    polystar.points = normalizeKeyframes(polystar.points);

    polystar.outerRadius = getProperty(data.property('ADBE Vector Star Outer Radius'));
    polystar.outerRadius = normalizeKeyframes(polystar.outerRadius);

    polystar.innerRadius = getProperty(data.property('ADBE Vector Star Inner Radius'));
    polystar.innerRadius = normalizeKeyframes(polystar.innerRadius);

    //optionals
    var position = data.property('ADBE Vector Star Position');
    if (position.isTimeVarying || position.value[0] !== 0 || position.value[1] !== 0) {
        polystar.position = getProperty(position);
        polystar.position = normalizeKeyframes(polystar.position);
    }

    var rotation = data.property('ADBE Vector Star Rotation');
    if (rotation.isTimeVarying || rotation.value !== 0) {
        polystar.rotation = getProperty(rotation);
        polystar.rotation = normalizeKeyframes(polystar.rotation);
    }

    var innerRoundness = data.property('ADBE Vector Star Inner Roundess');// is in AE called Roundess not Roundness...
    if (innerRoundness.isTimeVarying || innerRoundness.value !== 0) {
        polystar.innerRoundness = getProperty(innerRoundness);
        polystar.innerRoundness = normalizeKeyframes(polystar.innerRoundness);
    }

    var outerRoundness = data.property('ADBE Vector Star Outer Roundess');
    if (outerRoundness.isTimeVarying || outerRoundness.value !== 0) {
        polystar.outerRoundness = getProperty(outerRoundness);
        polystar.outerRoundness = normalizeKeyframes(polystar.outerRoundness);
    }

    return polystar;
}

