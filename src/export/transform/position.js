function getPosition(data, transform) {
    var obj;

    if (data.property('ADBE Position') instanceof Property) {
        obj = data.property('ADBE Position');
    } else if (data.property('ADBE Vector Position') instanceof Property) {
        obj = data.property('ADBE Vector Position');
    } else {
        return null;
    }


    if (obj.dimensionsSeparated) {
        if (obj.isTimeVarying || obj.value[0] !== 0) {

            var positionX = getProperty(obj, 0);
            positionX = roundValue(positionX);

            if (positionX.length > 1) {
                positionX = normalizeKeyframes(positionX, true);
            }

            transform.positionX = positionX;
        }

        if (obj.isTimeVarying || obj.value[1] !== 0) {

            var positionY = getProperty(obj, 1);
            positionY = roundValue(positionY);

            if (positionY.length > 1) {
                positionY = normalizeKeyframes(positionY, true);
            }

            transform.positionY = positionY;
        }
    } else {
        if (obj.isTimeVarying ||
            obj.value[0] !== 0 ||
            obj.value[1] !== 0) {

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