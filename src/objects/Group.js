import Stroke from '../property/Stroke';
import Path from './Path';
import Rect from './Rect';
import Ellipse from './Ellipse';
import Polystar from './Polystar';
import AnimatedPath from './AnimatedPath';
import Fill from '../property/Fill';
import GradientFill from '../property/GradientFill';
import Transform from '../transform/Transform';
import Trim from '../property/Trim';

class Group {
    constructor(data, parentIn, parentOut, gradients) {

        this.index = data.index;
        this.in = data.in ? data.in : parentIn;
        this.out = data.out ? data.out : parentOut;

        if (data.parent) this.parent = data.parent;
        if (data.fill) this.fill = new Fill(data.fill);
        if (data.gradientFill) this.fill = new GradientFill(data.gradientFill, gradients);
        if (data.stroke) this.stroke = new Stroke(data.stroke);
        if (data.trim) this.trim = new Trim(data.trim);

        this.transform = new Transform(data.transform);

        if (data.groups) {
            this.groups = [];
            for (let i = 0; i < data.groups.length; i++) {
                this.groups.push(new Group(data.groups[i], this.in, this.out, gradients));
            }
        }

        if (data.shapes) {
            this.shapes = [];

            for (const shape of data.shapes) {
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

        if (data.masks) {
            this.masks = [];

            for (const mask of data.masks) {
                if (mask.isAnimated) this.masks.push(new AnimatedPath(mask));
                else this.masks.push(new Path(mask));
            }
        }
    }

    draw(ctx, time, parentFill, parentStroke, parentTrim) {

        if (this.transform.opacity && this.transform.opacity.getValue(time) === 0) return;

        let i;

        ctx.save();

        //TODO check if color/stroke is changing over time
        const fill = this.fill || parentFill;
        const stroke = this.stroke || parentStroke;
        const trimValues = this.trim ? this.trim.getTrim(time) : parentTrim;

        if (fill) fill.setColor(ctx, time);
        if (stroke) stroke.setStroke(ctx, time);

        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);

        if (this.masks) {
            ctx.beginPath();
            for (i = 0; i < this.masks.length; i++) {
                this.masks[i].draw(ctx, time);
            }
            ctx.clip();
        }

        ctx.beginPath();
        if (this.shapes) this.drawShapes(ctx, time, fill, stroke, trimValues);

        //TODO get order
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();

        if (this.groups) this.drawGroups(ctx, time, fill, stroke, trimValues);

        ctx.restore();
    }

    drawShapes(ctx, time, fill, stroke, trimValues) {
        let i;
        for (i = 0; i < this.shapes.length; i++) {
            this.shapes[i].draw(ctx, time, trimValues);
        }
        if (this.shapes[this.shapes.length - 1].closed) {
            // ctx.closePath();
        }
    }

    drawGroups(ctx, time, fill, stroke, trimValues) {
        let i;
        for (i = 0; i < this.groups.length; i++) {
            if (time >= this.groups[i].in && time <= this.groups[i].out) {
                this.groups[i].draw(ctx, time, fill, stroke, trimValues, false);
            }
        }
    }

    setParentTransform(ctx, time) {
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);
    }

    setKeyframes(time) {
        this.transform.setKeyframes(time);

        if (this.shapes) {
            for (let i = 0; i < this.shapes.length; i++) {
                this.shapes[i].setKeyframes(time);
            }
        }
        if (this.masks) {
            for (let j = 0; j < this.masks.length; j++) {
                this.masks[j].setKeyframes(time);
            }
        }
        if (this.groups) {
            for (let k = 0; k < this.groups.length; k++) {
                this.groups[k].setKeyframes(time);
            }
        }

        if (this.fill) this.fill.setKeyframes(time);
        if (this.stroke) this.stroke.setKeyframes(time);
        if (this.trim) this.trim.setKeyframes(time);
    }

    reset(reversed) {
        this.transform.reset(reversed);

        if (this.shapes) {
            for (let i = 0; i < this.shapes.length; i++) {
                this.shapes[i].reset(reversed);
            }
        }
        if (this.masks) {
            for (let j = 0; j < this.masks.length; j++) {
                this.masks[j].reset(reversed);
            }
        }
        if (this.groups) {
            for (let k = 0; k < this.groups.length; k++) {
                this.groups[k].reset(reversed);
            }
        }
        if (this.fill) this.fill.reset(reversed);
        if (this.stroke) this.stroke.reset(reversed);
        if (this.trim) this.trim.reset(reversed);
    }
}

export default Group;

























