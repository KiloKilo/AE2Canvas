'use strict';

function getVectorTransform(data) {
    if (!(data instanceof PropertyGroup)) return null;

    var transform = {},
        prop,
        opacity;

    if (data.property('ADBE Anchor Point') instanceof Property) {
        prop = data.property('ADBE Anchor Point');
    } else if (data.property('ADBE Vector Anchor') instanceof Property) {
        prop = data.property('ADBE Vector Anchor');
    }

    if (prop.isTimeVarying ||
        prop.value[0] !== 0 ||
        prop.value[1] !== 0) {
        transform.anchorX = roundAnchor(getProperty(prop, 0));
        transform.anchorY = roundAnchor(getProperty(prop, 1));
    }

//    //Position
//    //TODO check for dimensionsSeparated
//    var position;

    if (data.property('ADBE Position')instanceof Property) {
        prop = data.property('ADBE Position');
    } else if (data.property('ADBE Vector Position')instanceof Property) {
        prop = data.property('ADBE Vector Position');
    }

    if (prop.isTimeVarying ||
        prop.value[0] !== 0 ||
        prop.value[1] !== 0) {
        transform.positionX = normalizePosition(getProperty(prop, 0));
        transform.positionY = normalizePosition(getProperty(prop, 1));
    }

    if (data.property('ADBE Scale')instanceof Property) {
        prop = data.property('ADBE Scale');
    } else if (data.property('ADBE Vector Scale')instanceof Property) {
        prop = data.property('ADBE Vector Scale');
    }

    if (prop.isTimeVarying ||
        prop.value[0] !== 100 ||
        prop.value[1] !== 100) {
        transform.scaleX = normalizeScale(getProperty(prop, 0));
        transform.scaleY = normalizeScale(getProperty(prop, 1));
    }

    if (data.property('ADBE Vector Skew')instanceof Property && data.property('ADBE Vector Skew Axis')instanceof Property) {
        transform.skew = getProperty(data.property('ADBE Vector Skew'));
        transform.skewAxis = getProperty(data.property('ADBE Vector Skew Axis'));
    }

    if (data.property('ADBE Rotate Z')instanceof Property) {
        prop = data.property('ADBE Rotate Z');
    } else if (data.property('ADBE Vector Rotation')instanceof Property) {
        prop = data.property('ADBE Vector Rotation');
    }

    if (prop.isTimeVarying ||
        prop.value !== 0) {
        transform.rotation = normalizeRotation(getProperty(prop));
    }

    if (data.property('ADBE Opacity')instanceof Property) {
        prop = data.property('ADBE Opacity');
    } else if (data.property('ADBE Vector Group Opacity')instanceof Property) {
        prop = data.property('ADBE Vector Group Opacity');
    }

    if (prop.isTimeVarying ||
        prop.value !== 100) {
        transform.opacity = normalizeOpacity(getProperty(prop));
    }

    return transform;
}

function normalizeScale(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = frames[i].v / 100;
        frames[i].v = Math.round(frames[i].v * 1000) / 1000;
    }

    return frames;
}

function normalizeOpacity(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = frames[i].v / 100;
    }

    return frames;
}

function normalizePosition(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = Math.round(frames[i].v);
    }

    return frames;
}

function roundAnchor(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = Math.round(frames[i].v);
    }

    return frames;
}

function normalizeRotation(frames) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v = Math.round(frames[i].v * 1000) / 1000;
    }

    return frames;
}