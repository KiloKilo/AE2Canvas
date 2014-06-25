AE2Canvas = function (data) {
    'use strict';

    if (!data) return null;

    this.shapeCount = 0;
    this.startTime = 0;
    this.delta = 0;

    this.groups = [];
    for (var i = 0; i < data.groups.length; i++) {
        this.groups.push(new Group(data.groups[i]));
    }
    this.transform = new Transform(data.transform);
};

AE2Canvas.prototype = {

    onUpdate: function (time) {
        this.delta = time - this.startTime;
        this.draw(time);
    },
    draw    : function (time) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.transform.transform(this.ctx, time);
        for (var i = 0; i < this.groups.length; i++) {
            this.groups[i].draw(this.ctx, time);
        }
        this.ctx.restore();
    }
};
