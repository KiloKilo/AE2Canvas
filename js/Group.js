Group = function (data) {
    'use strict';

    if (!data) return;

    this.name = data.name;
    this.index = data.index;
    if (data.fill) this.fill = new Fill(data.fill);
    if (data.stroke) this.stroke = new Stroke(data.stroke);
    this.transform = new Transform(data.transform);
    if (data.groups.length) {
        this.groups = [];
        for (var i = 0; i < data.groups.length; i++) {
            this.groups.push(new Group(data.groups[i]));
        }
    }

    if (data.paths.length) {
        this.paths = [];
        for (var j = 0; j < data.paths.length; j++) {
            if (data.paths[j].isAnimated) this.paths.push(new AnimatedPath(data.paths[j]));
            else this.paths.push(new Path(data.paths[j]));
        }
    }
};

Group.prototype = {

    draw: function (ctx, time) {
        ctx.save();

        //TODO check if color/stroke is changing over time
        //TODO set functionality inside fill/stroke class

        if (this.fill) this.fill.setColor(ctx, time);
        if (this.stroke) this.stroke.setStroke(ctx, time);
        this.transform.transform(ctx, time);
        if (this.paths) this.drawPaths(ctx, time);

        //TODO get order stroke - fill
        if (this.fill) ctx.fill();
        if (this.stroke) ctx.stroke();

        ctx.restore();
    },

    drawPaths: function (ctx, time) {
        for (var i = 0; i < this.paths.length; i++) {
            ctx.beginPath();
            var vertices = this.paths[i].getValue(time);
            ctx.moveTo(vertices[0][0], vertices[0][1]);
            for (var j = 1; j < vertices.length; j++) {
                var nextVertex = vertices[j];
                var lastVertex = vertices[j - 1];
                ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);
            }
            ctx.bezierCurveTo(nextVertex[0], nextVertex[1], vertices[0][2], vertices[0][3], vertices[0][4], vertices[0][5]);
            ctx.closePath();
        }
    }
}
;


























