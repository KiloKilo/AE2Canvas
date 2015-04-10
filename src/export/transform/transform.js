function getTransform(data) {
    var transform = {};

    getAnchor(data, transform);
    getPosition(data, transform);
    getScale(data, transform);
    getSkew(data, transform);
    getSkewAxis(data, transform);
    getRotation(data, transform);
    getOpacity(data, transform);

    return transform;
}

