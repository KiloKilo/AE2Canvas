import ImageLayer from './ImageLayer';
import NullLayer from './NullLayer';
import TextLayer from './TextLayer';
import Layer from './Layer';
import VectorLayer from './VectorLayer';

class CompLayer extends Layer {

    constructor(data, baseFont, gradients, imageBasePath) {
        super(data);

        if (data.layers) {

            this.layers = data.layers.map(layer => {
                switch (layer.type) {
                    case 'vector':
                        return new VectorLayer(layer, gradients);
                    case 'image':
                        return new ImageLayer(layer, imageBasePath);
                    case 'text':
                        return new TextLayer(layer, baseFont);
                    case 'comp':
                        return new CompLayer(layer, baseFont, gradients, imageBasePath);
                    case 'null':
                        return new NullLayer(layer);
                }
            });

            this.layers.forEach(layer => {
                if (layer.parent) {
                    const parentIndex = layer.parent;
                    layer.parent = this.layers.find(layer => layer.index === parentIndex)
                }
            });
        }
    }

    draw(ctx, time) {
        super.draw(ctx, time);

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

























