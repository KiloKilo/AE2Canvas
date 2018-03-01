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
        super.draw(ctx,time);

        ctx.drawImage(this.img, 0, 0);

        ctx.restore();
    }
}

export default ImageLayer;

























