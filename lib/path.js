function Path(segments) {
    this.segments = segments || [];
}
Path.prototype.resetMetrics = function () {
    this.measureLength = Path.prototype.measureLength;
};
Path.prototype.measureLength = function () {
    var s = 0;
    for (var i = 0, segment; segment = this.segments[i++];)
        s += segment.measureLength();
    return(this.measureLength = function () {
        return s
    })();
};
Path.prototype.atT = function (t) {
    var s = t * this.measureLength();
    var i = 0;
    var segment = this.segments[i++];
    while (s > segment.measureLength() && i < this.segments.length) {
        s -= segment.measureLength();
        segment = this.segments[i++];
    }
    return segment.atT(s / segment.measureLength());
};
Path.prototype.draw = function (ctx) {
    for (var i = 0, segment; segment = this.segments[i++];)
        segment.draw(ctx);
};
Path.prototype.addBezier = function (pointsOrBezier) {
    this.segments.push(new Path.Bezier(pointsOrBezier));
    this.resetMetrics();
};
Path.Bezier = function (pointsOrBezier) {
    this.bezier = (pointsOrBezier instanceof Array ? new Bezier(pointsOrBezier) : pointsOrBezier);
};
Path.Bezier.prototype.atT = function (t) {
    return this.bezier.atT(t);
};
Path.Bezier.prototype.measureLength = function () {
    var s = this.bezier.measureLength();
    return(this.measureLength = function () {
        return s
    })();
};
Path.Bezier.prototype.draw = function (ctx) {
    this.bezier.draw(ctx);
};
Path.prototype.addLine = function (p0, p1) {
    this.segments.push(new Path.Line([p0, p1]));
    this.resetMetrics();
};
Path.Line = function (points) {
    this.points = points;
};
Path.Line.prototype.measureLength = function () {
    var s = distance.apply(null, this.points);
    return(this.measureLength = function () {
        return s
    })();
};
Path.Line.prototype.atT = function (t) {
    var p0 = this.points[0], p1 = this.points[1];
    return{x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t};
};
Path.Line.prototype.draw = function (ctx) {
    var points = this.points;
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
};