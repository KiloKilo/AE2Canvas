'use strict';

function getTransform(data) {
    if (!(data instanceof PropertyGroup)) return null;

    var transform = {};

    getAnchor(data, transform);
    getPosition(data, transform);
    getScale(data, transform);
    getSkew(data, transform);
    getSkewAxis(data, transform);
    getRotation(data, transform);
    getOpacity(data, transform);

//    if (!isEmpty(transform)) return transform;
//    else return null;

    return transform;
}

