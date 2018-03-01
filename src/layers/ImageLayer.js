import Layer from "./Layer";

class ImageLayer extends Layer {
    constructor(data, parentIn, parentOut) {
        super(data, parentIn, parentOut);
        this.isLoaded = false;
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
}

export default ImageLayer;

























