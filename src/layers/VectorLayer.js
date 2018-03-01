import Layer from './Layer';
import Group from '../objects/Group'

class VectorLayer extends Layer {
    constructor(data, bufferCtx, parentIn, parentOut, gradients) {
        super(data, parentIn, parentOut);

        if (data.groups) {
            this.groups = data.groups.map(group => new Group(group, bufferCtx, this.in, this.out, gradients));
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

        if (this.groups) this.groups.forEach(group => group.draw(ctx, time));

        ctx.restore();
    }

    setKeyframes(time) {
        super.setKeyframes(time);
        if(this.groups) this.groups.forEach(layer => layer.setKeyframes(ctx, time));
    }

    reset(reversed) {
        super.reset(reversed);
        if(this.groups) this.groups.forEach(layer => layer.reset(reversed));
    }
}

export default VectorLayer;

























