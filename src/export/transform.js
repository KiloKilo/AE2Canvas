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

    if (data.property('ADBE Anchor Point') instanceof Property) {
        anchorProp = data.property('ADBE Anchor Point');
    } else if (data.property('ADBE Vector Anchor') instanceof Property) {
        anchorProp = data.property('ADBE Vector Anchor');
    }

    if (anchorProp) {
        if (anchorProp.isTimeVarying ||
            anchorProp.value[0] !== 0 ||
            anchorProp.value[1] !== 0) {
            transform.anchorX = roundAnchor(getProperty(anchorProp, 0));
            transform.anchorY = roundAnchor(getProperty(anchorProp, 1));
        }
    }

    if (data.property('ADBE Position')instanceof Property) {
        positionProp = data.property('ADBE Position');
    } else if (data.property('ADBE Vector Position')instanceof Property) {
        positionProp = data.property('ADBE Vector Position');
    }

    if (positionProp) {
        if (positionProp.isTimeVarying ||
            positionProp.value[0] !== 0 ||
            positionProp.value[1] !== 0) {
            if (positionProp.dimensionsSeparated) {
                transform.positionX = normalizePosition(getProperty(positionProp, 0));
                transform.positionY = normalizePosition(getProperty(positionProp, 1));
            } else {
                transform.position = normalizePosition(getProperty(positionProp));
            }
        }
    }

    if (data.property('ADBE Scale')instanceof Property) {
        scaleProp = data.property('ADBE Scale');
    } else if (data.property('ADBE Vector Scale')instanceof Property) {
        scaleProp = data.property('ADBE Vector Scale');
    }

    if (scaleProp) {
        if (scaleProp.isTimeVarying ||
            scaleProp.value[0] !== 100 ||
            scaleProp.value[1] !== 100) {
            transform.scaleX = normalizeScale(getProperty(scaleProp, 0));
            transform.scaleY = normalizeScale(getProperty(scaleProp, 1));
        }
    }

    if (data.property('ADBE Vector Skew')instanceof Property) {
        skewProp = data.property('ADBE Vector Skew');
    }

    if (skewProp) {
        if (skewProp.isTimeVarying ||
            skewProp.value !== 0) {
            transform.skew = getProperty(skewProp);
        }
    }

    if (data.property('ADBE Vector Skew Axis')instanceof Property) {
        skewAxisProp = data.property('ADBE Vector Skew Axis');
    }

    if (skewAxisProp) {
        if (skewAxisProp.isTimeVarying ||
            skewAxisProp.value !== 0) {
            transform.skewAxis = getProperty(skewAxisProp);
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
        }
    }

    return transform;
}

function normalizeScale(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = frames[i].v / 100;
        frames[i].v = Math.round(frames[i].v * 10000) / 10000;
    }

    return frames;
}

function normalizeOpacity(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = frames[i].v / 100;
        frames[i].v = Math.round(frames[i].v * 10000) / 10000;
    }

    return frames;
}

function normalizePosition(frames) {
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                frames[i].v[j] = Math.round(frames[i].v[j]);
            }
        } else {
            frames[i].v = Math.round(frames[i].v);
        }
    }

    return frames;
}

function roundAnchor(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = Math.round(frames[i].v);
    }

    return frames;
}

function roundRotation(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = Math.round(frames[i].v * 10000) / 10000;
    }

    return frames;
}