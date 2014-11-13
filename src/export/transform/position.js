function getPosition(data, transform) {
    if (!data instanceof PropertyGroup) return null;

    var obj;

    if (data.property('ADBE Position') instanceof Property) {
        obj = data.property('ADBE Position');
    } else if (data.property('ADBE Vector Position') instanceof Property) {
        obj = data.property('ADBE Vector Position');
    } else {
        return null;
    }

    if (obj.isTimeVarying ||
        obj.value[0] !== 0 ||
        obj.value[1] !== 0) {

        if (obj.dimensionsSeparated) {
            var positionX = getProperty(obj, 0),
                positionY = getProperty(obj, 1);
            positionX = roundValue(positionX);
            positionY = roundValue(positionY);
            if (positionX.length > 1) {
                positionX = normalizeKeyframes(positionX, 0);
            }

            if (positionY.length > 1) {
                positionY = normalizeKeyframes(positionY, 1);
            }

            transform.positionX = positionX;
            transform.positionY = positionY;

        } else {
            var position = getProperty(obj);
            position = removeZValue(position);
            position = roundValue(position);

            if (position.length > 1) {
                position = getMotionpath(position);
                position = normalizeKeyframes(position);
            }

            transform.position = position;
        }
    }
}