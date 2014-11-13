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
        }
    }

    return frames;
}