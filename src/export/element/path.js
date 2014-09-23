function getPath(data) {
    if (!(data instanceof PropertyGroup)) return null;

    data = data.property('ADBE Vector Shape');

    var path = {};
    path.name = data.name;
    path.index = data.propertyIndex;
    path.type = 'path';
    path.closed = data.value.closed;
    path.frames = [];

    var numKeys = data.numKeys;

    if (numKeys > 1) {
        path.isAnimated = true;
        for (var i = 1; i <= numKeys; i++) {
            var obj = {};

            $.writeln(data.keyInInterpolationType(i));
            $.writeln(data.keyOutInterpolationType(i));

            obj.v = getPoint(data.keyValue(i));
            obj.t = Math.round(data.keyTime(i) * 1000);

            if (i > 1 && (data.keyInInterpolationType(i) === KeyframeInterpolationType.BEZIER)) {
                var easeIn = data.keyInTemporalEase(i)[0];
                obj.easeIn = [];
                obj.easeIn[0] = 1 - easeIn.influence / 100;
                obj.easeIn[1] = 1 - Math.round(easeIn.speed * 10000) / 10000;
            }

            if (i < numKeys && (data.keyOutInterpolationType(i) === KeyframeInterpolationType.BEZIER)) {
                var easeOut = data.keyOutTemporalEase(i)[0];
                obj.easeOut = [];
                obj.easeOut[0] = easeOut.influence / 100;
                obj.easeOut[1] = Math.round(easeOut.speed * 10000) / 10000;
            }

            path.frames.push(obj);
        }
        path.frames = normalizeKeyframes(path.frames);
    }
    else {
        var obj = {};

        path.isAnimated = false;
        obj.t = 0;
        obj.v = getPoint(data.value);
        path.frames.push(obj);
    }

    return path;

    function getPoint(pointData) {
        var vertices = [];
        for (var i = 0; i < pointData.vertices.length; i++) {
//        var x = Math.round(pointData.vertices[i][0]);
//        var y = Math.round(pointData.vertices[i][1]);
//        var cp1x = x + Math.round(pointData.outTangents[i][0]);
//        var cp1y = y + Math.round(pointData.outTangents[i][1]);
//        var cp2x = x + Math.round(pointData.inTangents[i][0]);
//        var cp2y = y + Math.round(pointData.inTangents[i][1]);

            var x = pointData.vertices[i][0];
            var y = pointData.vertices[i][1];
            var cp1x = x + pointData.outTangents[i][0];
            var cp1y = y + pointData.outTangents[i][1];
            var cp2x = x + pointData.inTangents[i][0];
            var cp2y = y + pointData.inTangents[i][1];

            var vertex = [cp1x, cp1y, cp2x, cp2y, x, y];
            vertices.push(vertex);
        }
        return vertices;
    }

    function normalizeKeyframes(frames) {
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

