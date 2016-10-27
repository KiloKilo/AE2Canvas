function getShape(data) {

    var path = {};
    //path.name = data.name;
    //path.index = data.propertyIndex;
    path.type = 'path';
    path.closed = data.value.closed;
    path.frames = [];

    var numKeys = data.numKeys;

    if (numKeys > 1) {

        path.isAnimated = true;

        for (var i = 1; i <= numKeys; i++) {
            var obj = {};

            var inType = data.keyInInterpolationType(i),
                outType = data.keyOutInterpolationType(i);

            obj.v = getPoint(data.keyValue(i));
            obj.t = Math.round(data.keyTime(i) * 1000);

            if (i > 1 && (inType === KeyframeInterpolationType.BEZIER)) {
                var easeIn = data.keyInTemporalEase(i)[0];
                obj.easeIn = [];
                obj.easeIn[0] = 1 - easeIn.influence / 100;
                obj.easeIn[1] = 1 - Math.round(easeIn.speed * 10000) / 10000;
            }

            if (i < numKeys && (outType === KeyframeInterpolationType.BEZIER)) {
                var easeOut = data.keyOutTemporalEase(i)[0];
                obj.easeOut = [];
                obj.easeOut[0] = easeOut.influence / 100;
                obj.easeOut[1] = Math.round(easeOut.speed * 10000) / 10000;
            }

            path.frames.push(obj);
        }

        path.frames = normalizePathKeyframes(path.frames);

    }
    else {
        var obj = {};

        path.isAnimated = false;
        obj.t = 0;
        obj.v = getPoint(data.value);
        path.frames.push(obj);
    }

    path.frames = getTotalLength(path.frames);

    return path;

    function getPoint(pointData) {
        var vertices = [];
        for (var i = 0; i < pointData.vertices.length; i++) {

            var x = pointData.vertices[i][0],
                y = pointData.vertices[i][1],
                outX = x + pointData.outTangents[i][0],
                outY = y + pointData.outTangents[i][1],
                inX = x + pointData.inTangents[i][0],
                inY = y + pointData.inTangents[i][1],
                vertex = [
                    roundValue(outX, 10000),
                    roundValue(outY, 10000),
                    roundValue(inX, 10000),
                    roundValue(inY, 10000),
                    roundValue(x, 10000),
                    roundValue(y, 10000)
                ];

            vertices.push(vertex);
        }
        return vertices;
    }

    function getTotalLength(frames) {

        for (var i = 0; i < frames.length; i++) {

            frames[i].len = [];

            for (var j = 1; j < frames[i].v.length; j++) {
                var path,
                    point = frames[i].v[j],
                    lastPoint = frames[i].v[j - 1];

                if (lastPoint && point) {
                    var startX = lastPoint[4],
                        startY = lastPoint[5],
                        ctrl1X = lastPoint[0],
                        ctrl1Y = lastPoint[1],
                        ctrl2X = point[2],
                        ctrl2Y = point[3],
                        endX = point[4],
                        endY = point[5];

                    path = [
                        startX,
                        startY,
                        ctrl1X,
                        ctrl1Y,
                        ctrl2X,
                        ctrl2Y,
                        endX,
                        endY
                    ];

                    var len = getArcLength(path);
                    frames[i].len.push(roundValue(len, 1000));
                }
            }
        }

        return frames;
    }

    function normalizePathKeyframes(frames) {
        for (var i = 1; i < frames.length; i++) {
            var key = frames[i],
                lastKey = frames[i - 1];

            if (lastKey.easeOut && !key.easeIn) {
                key.easeIn = [0.16667, 1];
            } else if (key.easeIn && !lastKey.easeOut) {
                lastKey.easeOut = [0.16667, 0];
            }
        }
        return frames;
    }
}

