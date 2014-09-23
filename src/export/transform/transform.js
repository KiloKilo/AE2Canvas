'use strict';

function getVectorTransform(data) {
    if (!(data instanceof PropertyGroup)) return null;

    var transform = {},
        anchorProp,
        positionProp,
        scaleProp,
        skewProp,
        skewAxisProp,
        rotationProp,
        opacityProp;

    anchorProp = getAnchor(data);
    if (anchorProp) transform.anchor = anchorProp;

    positionProp = getPosition(data);
    if (positionProp) transform.position = positionProp;

    scaleProp = getScale(data);
    if (scaleProp) transform.scale = scaleProp;

    if (data.property('ADBE Vector Skew')instanceof Property) {
        skewProp = data.property('ADBE Vector Skew');
    }

    if (skewProp) {
        if (skewProp.isTimeVarying ||
            skewProp.value !== 0) {
            transform.skew = getProperty(skewProp);
            transform.skew = normalizeKeyframes(transform.skew);
        }
    }

    if (data.property('ADBE Vector Skew Axis')instanceof Property) {
        skewAxisProp = data.property('ADBE Vector Skew Axis');
    }

    if (skewAxisProp) {
        if (skewAxisProp.isTimeVarying ||
            skewAxisProp.value !== 0) {
            transform.skewAxis = getProperty(skewAxisProp);
            transform.skewAxis = normalizeKeyframes(transform.skewAxis);
        }
    }

    if (data.property('ADBE Rotate Z')instanceof Property) {
        rotationProp = data.property('ADBE Rotate Z');
    } else if (data.property('ADBE Vector Rotation')instanceof Property) {
        rotationProp = data.property('ADBE Vector Rotation');
    }

    if (rotationProp) {
        if (rotationProp.isTimeVarying ||
            rotationProp.value !== 0) {
            transform.rotation = roundRotation(getProperty(rotationProp));
            transform.rotation = normalizeKeyframes(transform.rotation);
        }
    }

    if (data.property('ADBE Opacity')instanceof Property) {
        opacityProp = data.property('ADBE Opacity');
    } else if (data.property('ADBE Vector Group Opacity')instanceof Property) {
        opacityProp = data.property('ADBE Vector Group Opacity');
    }

    if (opacityProp) {
        if (opacityProp.isTimeVarying ||
            opacityProp.value !== 100) {
            transform.opacity = normalizeOpacity(getProperty(opacityProp));
            transform.opacity = normalizeKeyframes(transform.opacity);
        }
    }

    return transform;

    function normalizeOpacity(frames) {
        for (var i = 0; i < frames.length; i++) {
            frames[i].v = frames[i].v / 100;
            frames[i].v = Math.round(frames[i].v * 10000) / 10000;
        }

        return frames;
    }

    function roundRotation(frames) {
        for (var i = 0; i < frames.length; i++) {
            frames[i].v = Math.round(frames[i].v * 10000) / 10000;
        }

        return frames;
    }
}

