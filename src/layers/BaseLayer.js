import Path from '../objects/Path';
import AnimatedPath from '../objects/AnimatedPath';
import Transform from '../transform/Transform';

class BaseLayer {

    constructor(data, parentIn, parentOut) {
        this.index = data.index;
        this.in = data.in ? data.in : parentIn;
        this.out = data.out ? data.out : parentOut;
        if (data.parent) this.parent = data.parent;
        this.transform = new Transform(data.transform);

        if (data.masks) {
            this.masks = data.masks.map(mask => mask.isAnimated ? new AnimatedPath(mask) : new Path(mask));
        }
    }

    setParentTransform(ctx, time) {
        if (this.parent) this.parent.setParentTransform(ctx, time);
        this.transform.transform(ctx, time);
    }

    setKeyframes(time) {
        this.transform.setKeyframes(time);
    }

    reset(reversed) {
        this.transform.reset(reversed);
    }
}

export default BaseLayer;

























