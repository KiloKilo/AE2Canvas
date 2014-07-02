'use strict';

var Stroke = require('./Stroke'),
    Path = require('./Path'),
    Rect = require('./Rect'),
    Ellipse = require('./Ellipse'),
    Polystar = require('./Polystar'),
    AnimatedPath = require('./AnimatedPath'),
    Fill = require('./Fill'),
    Transform = require('./Transform');

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
    this.transform = new Transform(data.transform);
    if (data.groups.length) {
        this.groups = [];
        for (var i = 0; i < data.groups.length; i++) {
            this.groups.push(new Group(data.groups[i]));
        }
    }

    if (data.shapes.length) {
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

Group.prototype = {

    draw: function (ctx, time) {
        ctx.save();

        //TODO check if color/stroke is changing over time
        //TODO set functionality inside fill/stroke class

        if (this.fill) this.fill.setColor(ctx, time);
        if (this.stroke) this.stroke.setStroke(ctx, time);

        this.transform.transform(ctx, time);
        ctx.beginPath();
        if (this.shapes) {
            for (var i = 0; i < this.shapes.length; i++) {
                this.shapes[i].draw(ctx, time);
            }
        }
        ctx.closePath();

        //TODO get order stroke - fill
        if (this.fill) ctx.fill();
        if (this.stroke) ctx.stroke();

        if (this.groups) {
            for (var j = 0; j < this.groups.length; j++) {
                if (time >= this.groups[j].in && time < this.groups[j].out) {
                    this.groups[j].draw(ctx, time);
                }
            }
        }

        ctx.restore();
    }
};

module.exports = Group;

























