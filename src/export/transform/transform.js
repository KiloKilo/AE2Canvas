'use strict';

function getVectorTransform(data) {
    if (!(data instanceof PropertyGroup)) return null;

    var transform = {},
        anchorProp,
        positionProp,
        scaleXProp,
        scaleYProp,
        skewProp,
        skewAxisProp,
        rotationProp,
        opacityProp;

    anchorProp = getAnchor(data);
    if (anchorProp) transform.anchor = anchorProp;

    positionProp = getPosition(data);
    if (positionProp) transform.position = positionProp;

    //scale can have two different easing, needs always two separate properties
    scaleXProp = getScale(data, 0);
    if (scaleXProp) transform.scaleX = scaleXProp;

    scaleYProp = getScale(data, 1);
    if (scaleYProp) transform.scaleY = scaleYProp;

    skewProp = getSkew(data);
    if (skewProp) transform.skew = skewProp;

    skewAxisProp = getSkew(data);
    if (skewAxisProp) transform.skewAxis = skewAxisProp;

    rotationProp = getRotation(data);
    if (rotationProp) transform.rotation = rotationProp;

    opacityProp = getOpacity(data);
    if (opacityProp) transform.opacity = opacityProp;

    //TODO only return if isnt empty -> utils isEmpty()
    return transform;
}

