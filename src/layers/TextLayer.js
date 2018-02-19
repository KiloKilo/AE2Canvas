import Transform from '../transform/Transform';
import Path from '../objects/Path';
import AnimatedPath from '../objects/AnimatedPath';

class TextLayer {
    constructor(data, parentIn, parentOut, baseFont) {
        this.index = data.index;
        this.text = data.text;
        this.leading = data.leading;
        this.fontSize = data.fontSize;
        this.font = data.font;
        this.color = data.color;
        this.justification = data.justification;
        this.in = data.in ? data.in : parentIn;
        this.out = data.out ? data.out : parentOut;
        this.baseFont = baseFont;

        if (data.parent) this.parent = data.parent;
        this.transform = new Transform(data.transform);

        if (data.masks) {
            this.masks = [];

            for (const mask of data.masks) {
                if (mask.isAnimated) this.masks.push(new AnimatedPath(mask));
                else this.masks.push(new Path(mask));
            }
        }
    }

    draw(ctx, time) {

        ctx.save();
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);

        if (this.masks) {
            ctx.beginPath();
            for (let i = 0; i < this.masks.length; i++) {
                this.masks[i].draw(ctx, time);
            }
            ctx.clip();
        }

        ctx.textAlign = this.justification;
        ctx.font = `${this.fontSize}px ${this.baseFont}` || this.font;
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        for (let j = 0; j < this.text.length; j++) {
            ctx.fillText(this.text[j], 0, j * this.leading);
        }

        ctx.restore();
    }

    setParentTransform(ctx, time) {
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);
    }

    setKeyframes(time) {
        this.transform.setKeyframes(time);
        if (this.masks) {
            for (let j = 0; j < this.masks.length; j++) {
                this.masks[j].setKeyframes(time);
            }
        }
    }

    reset(reversed) {
        this.transform.reset(reversed);

        if (this.masks) {
            for (let j = 0; j < this.masks.length; j++) {
                this.masks[j].reset(reversed);
            }
        }
    }
}

export default TextLayer;

























