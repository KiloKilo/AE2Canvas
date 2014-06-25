function vectorTrimOptimize(data) {

    if (!data) return null;

    var paths = data.paths;
    var trim = data.trim;

    function trimPath(frame) {
        var length;
        var path = frame.value;
    }

    function getLength(a, b, c, d) {
        var len = 100;
        var arcLengths = new Array(len + 1);
        arcLengths[0] = 0;

        var ox = this.x(0);
        var oy = this.y(0);
        var clen = 0;

        for (var i = 1; i <= len; i += 1) {
            var x = this.x(i * 0.01);
            var y = this.y(i * 0.01);
            var dx = ox - x;
            var dy = oy - y;
            clen += Math.sqrt(dx * dx + dy * dy);
            arcLengths[i] = clen;
            ox = x;
            oy = y;
        }
        this.length = clen;
    }

//    // Simpson's method
//    function getLength(q, div_num) {
//        var div_unit = 1 / div_num;
//        var m = [q[3][0] - q[0][0] + 3 * (q[1][0] - q[2][0]),
//                3 * (q[0][0] - 2 * q[1][0] + q[2][0]),
//                3 * (q[1][0] - q[0][0])];
//        var n = [q[3][1] - q[0][1] + 3 * (q[1][1] - q[2][1]),
//                3 * (q[0][1] - 2 * q[1][1] + q[2][1]),
//                3 * (q[1][1] - q[0][1])];
//        var fc = function (t, m, n) {
//            return Math.sqrt(Math.pow(3 * t * t * m[0] + 2 * t * m[1] + m[2], 2)
//                + Math.pow(3 * t * t * n[0] + 2 * t * n[1] + n[2], 2)) || 0;
//        };
//        var total = 0;
//        var i;
//        for (i = 1; i < div_num; i += 2) {
//            total += 4.0 * fc(i * div_unit, m, n);
//        }
//        for (i = 2; i < div_num; i += 2) {
//            total += 2.0 * fc(i * div_unit, m, n);
//        }
//        return (fc(0, m, n) + fc(1, m, n) + total) * div_unit / 3;
//    }
}

