import Path from '../objects/Path';
import AnimatedPath from '../objects/AnimatedPath';
import Transform from '../transform/Transform';
import ImageLayer from './ImageLayer';
import TextLayer from './TextLayer';
import Group from '../objects/Group';
import Layer from "./Layer";

class CompLayer extends Layer {

    constructor(data, bufferCtx, parentIn, parentOut, baseFont, gradients, imageBasePath) {
        super(data, parentIn, parentOut);

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
        super.setParentTransform(ctx, time);
        this.layers.forEach(layer => layer.setParentTransform(ctx, time));
    }

    setKeyframes(time) {
        super.setParentTransform(time);
        this.layers.forEach(layer => layer.setKeyframes(ctx, time));
    }

    reset(reversed) {
        super.setParentTransform(reversed);
        this.layers.forEach(layer => layer.reset(reversed));
    }
}

export default CompLayer;

























