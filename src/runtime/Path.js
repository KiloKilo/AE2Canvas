'use strict';

function Path(data) {
    if (!data) return null;

    this.name = data.name;
    this.closed = data.closed;
    this.frames = data.frames;
    this.verticesCount = this.frames[0].v.length;
}

Path.prototype = {

    draw: function (ctx, time) {
//        ctx.save();

        var vertices = this.getValue(time);

//        ctx.beginPath();
        ctx.moveTo(vertices[0][4], vertices[0][5]);

        for (var j = 1; j < vertices.length; j++) {

            var nextVertex = vertices[j];
            var lastVertex = vertices[j - 1];
            ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5]);

//            ctx.save();
//            ctx.fillStyle = 'rgba(0,0,255,0.5)';
//            ctx.fillRect(lastVertex[0], lastVertex[1], 5, 5);
//            ctx.restore();
//
//            ctx.save();
//            ctx.fillStyle = 'rgba(0,255,0,0.5)';
//            ctx.fillRect(nextVertex[2], nextVertex[3], 5, 5);
//            ctx.restore();

        }
        if (this.closed) {
            ctx.bezierCurveTo(nextVertex[0], nextVertex[1], vertices[0][2], vertices[0][3], vertices[0][4], vertices[0][5]);
//            ctx.closePath();

//            ctx.save();
//            ctx.fillStyle = 'rgba(255,0,0,0.5)';
//            ctx.fillRect(nextVertex[0], nextVertex[1], 5, 5);
//            ctx.fillRect(vertices[0][2], vertices[0][3], 5, 5);
//            ctx.restore();
        }

//        ctx.closePath();

//        ctx.restore();
    },

    getValue: function (time) {
        return this.frames[0].v;
    }
};

module.exports = Path;



























