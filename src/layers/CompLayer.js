import Path from '../objects/Path';
import ImageLayer from './ImageLayer';
import TextLayer from './TextLayer';
import Layer from './Layer';
import VectorLayer from './VectorLayer';

class CompLayer extends Layer {

    constructor(data, bufferCtx, parentIn, parentOut, baseFont, gradients, imageBasePath) {
        super(data, parentIn, parentOut);

        if (data.layers) {
            this.layers = data.layers.map(layer => {
                if (layer.type === 'vector') {
                    return new VectorLayer(layer, bufferCtx, 0, this.out, gradients);
                } else if (layer.type === 'image') {
                    return new ImageLayer(layer, 0, this.out, imageBasePath);
                } else if (layer.type === 'text') {
                    return new TextLayer(layer, 0, this.out, baseFont);
                } else if (layer.type === 'comp') {
                    return new CompLayer(layer, bufferCtx, 0, this.out, baseFont, gradients, imageBasePath, baseFont);
                }
            });
        }
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

        if (this.layers) {
            const internalTime = time - this.in;
            this.layers.forEach(layer => {
                if (internalTime >= layer.in && internalTime <= layer.out) {
                    layer.draw(ctx, internalTime);
                }
            });
        }

        ctx.restore();
    }

    setParentTransform(ctx, time) {
        super.setParentTransform(ctx, time);
        if (this.layers) this.layers.forEach(layer => layer.setParentTransform(ctx, time));
    }

    setKeyframes(time) {
        super.setKeyframes(time);
        if (this.layers) this.layers.forEach(layer => layer.setKeyframes(time));
    }

    reset(reversed) {
        super.reset(reversed);
        if (this.layers) this.layers.forEach(layer => layer.reset(reversed));
    }
}

export default CompLayer;

























