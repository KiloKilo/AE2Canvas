function Bezier(points) {
    this.points = points;
    this.order = points.length;
};
function distance(p0, p1) {
    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    return Math.sqrt(dx * dx + dy * dy);
};
Bezier.prototype._triangle = function () {
    var upper = this.points;
    var m = [upper];
    for (var i = 1; i < this.order; i++) {
        var lower = [];
        for (var j = 0; j < this.order - i; j++) {
            var c0 = upper[j];
            var c1 = upper[j + 1];
            lower[j] = {x: (c0.x + c1.x) / 2, y: (c0.y + c1.y) / 2};
        }
        m.push(lower);
        upper = lower;
    }
    return(this._triangle = function () {
        return m
    })();
};
Bezier.prototype.split = function () {
    var m = this._triangle();
    var left = new Array(this.order), right = new Array(this.order);
    for (var i = 0; i < this.order; i++) {
        left[i] = m[i][0];
        right[i] = m[this.order - 1 - i][i];
    }
    return[new Bezier(left), new Bezier(right)];
};
Bezier.prototype.midpointT = function () {
    return this.atT(.5);
};
Bezier.prototype.getCoefficients = function () {
    function interpolate(p0, p1) {
        p0.push(0);
        var p = new Array(p0.length);
        p[0] = p0[0];
        for (var i = 0; i < p1.length; i++)
            p[i + 1] = p0[i + 1] + p1[i] - p0[i];
        return p;
    }

    function collapse(ns) {
        while (ns.length > 1) {
            var ps = new Array(ns.length - 1);
            for (var i = 0; i < ns.length - 1; i++)
                ps[i] = interpolate(ns[i], ns[i + 1]);
            ns = ps;
        }
        return ns[0];
    }

    var xps = [];
    var yps = [];
    for (var i = 0, pt; pt = this.points[i++];) {
        xps.push([pt.x]);
        yps.push([pt.y]);
    }
    var result = {xs: collapse(xps), ys: collapse(yps)};
    return(this.getCoefficients = function () {
        return result
    })();
};
Bezier.prototype.atT = function (t) {
    var c = this.getCoefficients();
    var cx = c.xs, cy = c.ys;
    var x = cx[cx.length - 1], y = cy[cy.length - 1];
    for (var i = cx.length - 1; --i >= 0;) {
        x = x * t + cx[i];
        y = y * t + cy[i];
    }
    return{x: x, y: y}
};
Bezier.prototype.measureLength = function (tolerance) {
    if (arguments.length < 1)tolerance = 1;
    var sum = 0;
    var queue = [this];
    do {
        var b = queue.pop();
        var points = b.points;
        var chordlen = distance(points[0], points[this.order - 1]);
        var polylen = 0;
        for (var i = 0; i < this.order - 1; i++)
            polylen += distance(points[i], points[i + 1]);
        if (polylen - chordlen <= tolerance)
            sum += polylen; else
            queue = queue.concat(b.split());
    } while (queue.length);
    return(this.measureLength = function () {
        return sum
    })();
};
Bezier.prototype.draw = function (ctx) {
    var pts = this.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    var fn = Bezier.drawCommands[this.order];
    if (fn) {
        var coordinates = [];
        for (var i = pts.length ? 1 : 0; i < pts.length; i++) {
            coordinates.push(pts[i].x);
            coordinates.push(pts[i].y);
        }
        fn.apply(ctx, coordinates);
    } else
        error("don't know how to draw an order *" + this.order + " bezier");
};
Bezier.drawCommands = [null, function (x, y) {
    this.lineTo(x, y)
}, function (x, y) {
    this.lineTo(x, y)
}, function (x1, y1, x2, y2) {
    this.quadraticCurveTo(x1, y1, x2, y2)
}, function (x1, y1, x2, y2, x3, y3) {
    this.bezierCurveTo(x1, y1, x2, y2, x3, y3)
}];