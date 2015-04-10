function getMotionpath(frames) {

    for (var i = 1; i < frames.length; i++) {

        var lastKey = frames[i - 1],
            key = frames[i];

        if (lastKey && key) {

            var startX = lastKey.v[0],
                startY = lastKey.v[1],
                ctrl1X = lastKey.outTangent[0] + lastKey.v[0],
                ctrl1Y = lastKey.outTangent[1] + lastKey.v[1],
                ctrl2X = key.inTangent[0] + key.v[0],
                ctrl2Y = key.inTangent[1] + key.v[1],
                endX = key.v[0],
                endY = key.v[1];

            if (isCurved(startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY)) {
                lastKey.motionpath = [
                    startX,
                    startY,
                    ctrl1X,
                    ctrl1Y,
                    ctrl2X,
                    ctrl2Y,
                    endX,
                    endY
                ];

                lastKey.len = getArcLength(lastKey.motionpath);
            }
        }
    }

    return frames;

    function isCurved(startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY) {
        var threshold = 5;
        return distanceToLine(startX, startY, endX, endY, ctrl1X, ctrl1Y) > threshold
            || distanceToLine(startX, startY, endX, endY, ctrl2X, ctrl2Y) > threshold;
    }

    function distanceToLine(startX, startY, endX, endY, ctrlX, ctrlY) {
        var m = (endY - startY) / (endX - startX),
            b = startY - (m * startX);

        var pX = (m * ctrlY + ctrlX - m * b) / (m * m + 1),
            pY = (m * m * ctrlY + m * ctrlX + b) / (m * m + 1);

        if (dist2d(pX, pY, startX, startY) > dist2d(startX, startY, endX, endY) || dist2d(pX, pY, endX, endY) > dist2d(startX, startY, endX, endY)) {
            return Infinity
        } else {
            return dist2d(pX, pY, ctrlX, ctrlY);
        }
    }
}