function getPath(data) {
    if (!(data instanceof PropertyGroup)) return null;

    data = data.property('ADBE Vector Shape');

    var path = {};
    path.name = data.name;
    path.type = 'path';
    path.closed = data.value.closed;
    path.frames = [];

    var numKeys = data.numKeys;

    if (numKeys > 1) {
        path.isAnimated = true;
        for (var i = 1; i <= numKeys; i++) {
            var obj = {};

            obj.v = getPoint(data.keyValue(i));
            obj.t = Math.round(data.keyTime(i) * 1000);

            if (obj.inInterpolation !== KeyframeInterpolationType.HOLD ||
                obj.outInterpolation !== KeyframeInterpolationType.HOLD) {

                var easeIn = data.keyInTemporalEase(i)[0];
                var easeOut = data.keyOutTemporalEase(i)[0];

                //check for frame before
                if (path.frames[i - 2]) {
                    var lastKey = path.frames[i - 2];

                    obj.easeIn = [];
                    obj.easeIn[0] = 1 - easeIn.influence / 100;
                    obj.easeIn[1] = 1 - Math.round(easeIn.speed * 10000) / 10000;

                    //easeOut
                    lastKey.easeOut = [];
                    lastKey.easeOut[0] = easeOut.influence / 100;
                    lastKey.easeOut[1] = Math.round(easeOut.speed * 10000) / 10000;

                    // FIXME
                    // dirty fix. removes standard 0.166 easing
                    if (obj.easeIn[1] === 0) obj.easeIn[0] = 0;
                    if (lastKey.easeOut[1] === 0) lastKey.easeOut[0] = 0;

                }
            }
            path.frames.push(obj);
        }
    }
    else {
        var obj = {};

        path.isAnimated = false;
        obj.t = 0;
        obj.v = getPoint(data.value);
        path.frames.push(obj);
    }

    return path;

}

function getPoint(pointData) {
    var vertices = [];
    for (var i = 0; i < pointData.vertices.length; i++) {
        var x = Math.round(pointData.vertices[i][0]);
        var y = Math.round(pointData.vertices[i][1]);
        var cp1x = x + Math.round(pointData.outTangents[i][0]);
        var cp1y = y + Math.round(pointData.outTangents[i][1]);
        var cp2x = x + Math.round(pointData.inTangents[i][0]);
        var cp2y = y + Math.round(pointData.inTangents[i][1]);

        var vertex = [cp1x, cp1y, cp2x, cp2y, x, y];
        vertices.push(vertex);
    }
    return vertices;
}