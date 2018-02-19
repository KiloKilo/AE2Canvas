import Path from '../objects/Path';
import AnimatedPath from '../objects/AnimatedPath';
import Transform from '../transform/Transform';
import ImageLayer from './ImageLayer';
import TextLayer from './TextLayer';
import Group from '../objects/Group';

class CompLayer {

    constructor(data, bufferCtx, parentIn, parentOut, baseFont, gradients, imageBasePath) {
        this.index = data.index;
        this.in = data.in ? data.in : parentIn;
        this.out = data.out ? data.out : parentOut;

        if (data.parent) this.parent = data.parent;

        this.transform = new Transform(data.transform);

        if (data.masks) {
            this.masks = data.masks.map(mask => mask.isAnimated ? new AnimatedPath(mask) : new Path(mask));
        }

        this.layers = data.layers.map(layer => {
            if (layer.type === 'vector') {
                return new Group(layer, bufferCtx, 0, this.out, gradients);
            } else if (layer.type === 'image') {
                return new ImageLayer(layer, 0, this.out, imageBasePath);
            } else if (layer.type === 'text') {
                return new TextLayer(layer, 0, this.out, baseFont);
            } else if (layer.type === 'comp') {
                return new CompLayer(layer, bufferCtx, 0, this.out, baseFont, gradients, imageBasePath, baseFont);
            }
        });

        this.numLayers = this.layers.length;
    }

    draw(ctx, time) {
        ctx.save();

        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);

        if (this.masks) {
            ctx.beginPath();
            this.masks.forEach(mask => mask.draw(ctx, time));
            ctx.clip();
        }

        const internalTime = time - this.in;
        this.layers.forEach(layer => {
            if (internalTime >= layer.in && internalTime <= layer.out) {
                layer.draw(ctx, internalTime);
            }
        });

        ctx.restore();
    }

    setParentTransform(ctx, time) {
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);
        this.layers.forEach(layer => layer.setParentTransform(ctx, time));
    }

    setKeyframes(time) {
        this.transform.setKeyframes(time);
        this.layers.forEach(layer => layer.setKeyframes(ctx, time));
    }

    reset(reversed) {
        this.transform.reset(reversed);
        this.layers.forEach(layer => layer.reset(reversed));
    }
}

export default CompLayer;

























