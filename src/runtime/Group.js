'use strict';

var Stroke = require('./Stroke'),
    Path = require('./Path'),
    Rect = require('./Rect'),
    Ellipse = require('./Ellipse'),
    Polystar = require('./Polystar'),
    AnimatedPath = require('./AnimatedPath'),
    Fill = require('./Fill'),
    Transform = require('./Transform'),
    Merge = require('./Merge');

function Group(data) {

    if (!data) return;

    this.name = data.name;
    this.index = data.index;

    if (data.in) this.in = data.in;
    else this.in = 0;

    if (data.out) this.out = data.out;
    else this.out = 500000; // FIXME get comp total duration

    if (data.fill) this.fill = new Fill(data.fill);
    if (data.stroke) this.stroke = new Stroke(data.stroke);

    if (data.merge) this.merge = new Merge(data.merge);

    this.transform = new Transform(data.transform);
    if (data.groups) {
        this.groups = [];
        for (var i = 0; i < data.groups.length; i++) {
            this.groups.push(new Group(data.groups[i]));
        }
    }

    if (data.shapes) {
        this.shapes = [];
        for (var j = 0; j < data.shapes.length; j++) {
            var shape = data.shapes[j];
            if (shape.type === 'path') {
                if (shape.isAnimated) this.shapes.push(new AnimatedPath(shape));
                else this.shapes.push(new Path(shape));
            } else if (shape.type === 'rect') {
                this.shapes.push(new Rect(shape));
            } else if (shape.type === 'ellipse') {
                this.shapes.push(new Ellipse(shape));
            } else if (shape.type === 'polystar') {
                this.shapes.push(new Polystar(shape));
            }

        }
    }
}

Group.prototype.draw = function (ctx, time, parentFill, parentStroke) {

    ctx.save();

    //TODO check if color/stroke is changing over time

    var fill = this.fill || parentFill;
    var stroke = this.stroke || parentStroke;

    if (fill) fill.setColor(ctx, time);
    if (stroke) stroke.setStroke(ctx, time);

    this.transform.transform(ctx, time);
//    if (this.merge) this.merge.setCompositeOperation(ctx);
//    ctx.globalCompositeOperation = 'source-over';

//    console.log(this.name, ctx.globalCompositeOperation);

    ctx.beginPath();
    if (this.shapes) {
        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i].draw(ctx, time);
        }
        if (this.shapes[this.shapes.length - 1].closed) {
            ctx.closePath();
        }
    }

    //TODO get order
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();

    if (this.groups) {
        for (var j = 0; j < this.groups.length; j++) {
            if (time >= this.groups[j].in && time < this.groups[j].out) {
                this.groups[j].draw(ctx, time, fill, stroke);
                if (j === this.groups.length - 2)
                    if (this.merge) this.merge.setCompositeOperation(ctx);
//                if (j === 0 && this.merge) this.merge.setCompositeOperation(ctx);

            }
        }
    }

    //    reset

    ctx.restore();
};

Group.prototype.reset = function () {
    this.transform.reset();

    if (this.shapes) {
        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i].reset();
        }
    }
    if (this.groups) {
        for (var j = 0; j < this.groups.length; j++) {
            this.groups[j].reset();
        }
    }
    if (this.fill) {
        this.fill.reset();
    }
    if (this.stroke) {
        this.stroke.reset();
    }
};

module.exports = Group;

























