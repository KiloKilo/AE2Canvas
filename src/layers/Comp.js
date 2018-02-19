import Path from '../objects/Path';
import AnimatedPath from '../objects/AnimatedPath';
import Transform from '../transform/Transform';
import ImageLayer from './ImageLayer';
import TextLayer from './TextLayer';
import Group from '../objects/Group';

class Comp {
    constructor(data, bufferCtx, parentIn, parentOut, baseFont, gradients, imageBasePath) {
        this.index = data.index;
        this.in = data.in ? data.in : parentIn;
        this.out = data.out ? data.out : parentOut;

        if (data.parent) this.parent = data.parent;

        this.transform = new Transform(data.transform);

        if (data.masks) {
            this.masks = [];

            for (const mask of data.masks) {
                if (mask.isAnimated) this.masks.push(new AnimatedPath(mask));
                else this.masks.push(new Path(mask));
            }
        }

        this.layers = [];
        for (let i = 0; i < data.layers.length; i++) {
            if (data.layers[i].type === 'vector') {
                this.layers.push(new Group(data.layers[i], bufferCtx, 0, this.duration, gradients));
            } else if (data.layers[i].type === 'image') {
                this.layers.push(new ImageLayer(data.layers[i], 0, this.duration, imageBasePath));
            } else if (data.layers[i].type === 'text') {
                this.layers.push(new TextLayer(data.layers[i], 0, this.duration, baseFont));
            } else if (data.layers[i].type === 'comp') {
                this.layers.push(new Comp(data.layers[i], bufferCtx, 0, this.duration, this.baseFont, gradients, imageBasePath, baseFont));
            }
        }
        this.numLayers = this.layers.length;
    }

    draw(ctx, time) {

        ctx.save();

        let i;

        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);

        if (this.masks) {
            ctx.beginPath();
            for (i = 0; i < this.masks.length; i++) {
                this.masks[i].draw(ctx, time);
            }
            ctx.clip();
        }

        const internalTime = time - this.in;
        for (i = 0; i < this.numLayers; i++) {
            if (internalTime >= this.layers[i].in && internalTime <= this.layers[i].out) {
                this.layers[i].draw(ctx, internalTime);
            }
        }

        ctx.restore();

    }

    setParentTransform(ctx, time) {
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);
        for (let i = 0; i < this.numLayers; i++) {
            this.layers[i].setParentTransform(ctx, time);
        }
    }

    setKeyframes(time) {
        this.transform.setKeyframes(time);
        for (let i = 0; i < this.numLayers; i++) {
            this.layers[i].setKeyframes(time);
        }
    }

    reset(reversed) {
        this.transform.reset(reversed);
        for (let i = 0; i < this.numLayers; i++) {
            this.layers[i].reset(this.reversed);
        }
    }
}

export default Comp;

























