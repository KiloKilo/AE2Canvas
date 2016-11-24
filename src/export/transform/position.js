function getPosition(data, transform) {
    var pos;
    var posX;
    var posY;

    if (data.property('ADBE Position_0') instanceof Property &&
        data.property('ADBE Position_1') instanceof Property &&
        data.property('ADBE Position') instanceof Property) {

        posX = data.property('ADBE Position_0');
        posY = data.property('ADBE Position_1');
        pos = data.property('ADBE Position');

    } else if (data.property('ADBE Position') instanceof Property) {
        pos = data.property('ADBE Position');

    } else if (data.property('ADBE Vector Position') instanceof Property) {
        pos = data.property('ADBE Vector Position');

    } else {
        return null;
    }

    if (pos.dimensionsSeparated) {
        if (posX.isTimeVarying || posX.value[0] !== 0) {

            var positionX = getProperty(posX);
            positionX = roundValue(positionX);

            if (positionX.length > 1) {
                positionX = normalizeKeyframes(positionX, true);
            }

            transform.positionX = positionX;
        }

        if (posY.isTimeVarying || posY.value[1] !== 0) {

            var positionY = getProperty(posY);
            positionY = roundValue(positionY);

            if (positionY.length > 1) {
                positionY = normalizeKeyframes(positionY, true);
            }

            transform.positionY = positionY;
        }

    } else {
        if (pos.isTimeVarying ||
            pos.value[0] !== 0 ||
            pos.value[1] !== 0) {

            var position = getProperty(pos);
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