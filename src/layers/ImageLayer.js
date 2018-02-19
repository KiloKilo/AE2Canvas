import Transform from '../transform/Transform';
import Path from '../objects/Path';
import AnimatedPath from '../objects/AnimatedPath';

class ImageLayer {
    constructor(data, parentIn, parentOut, basePath) {

        this.isLoaded = false;
        this.index = data.index;
        this.source = basePath + data.source;
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
    }

    preload(cb) {
        this.img = new Image;
        this.img.onload = () => {
            this.isLoaded = true;
            if (typeof cb === 'function') {
                cb();
            }
        };

        this.img.src = this.source;
    }

    draw(ctx, time) {

        if (!this.isLoaded) return;

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

        ctx.drawImage(this.img, 0, 0);

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

export default ImageLayer;

























