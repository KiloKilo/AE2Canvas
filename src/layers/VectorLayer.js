import Layer from './Layer';
import Group from '../objects/Group'

class VectorLayer extends Layer {
    constructor(data, parentIn, parentOut, gradients) {
        super(data, parentIn, parentOut);

        if (data.groups) {
            this.groups = data.groups.map(group => new Group(group, this.in, this.out, gradients));
        }
    }

    draw(ctx, time) {
        super.draw(ctx,time);

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

























