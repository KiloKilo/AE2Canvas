import Layer from './Layer';

class ImageLayer extends Layer {
    constructor(data) {
        super(data);
        this.source = data.source;
        this.isLoaded = false;
    }

    preload(cb) {
        return new Promise((resolve, reject) => {
            this.img = new Image;
            this.img.onload = () => {
                this.isLoaded = true;
                resolve();
            };
            this.img.src = this.source;
        });
    }

    draw(ctx, time) {
        super.draw(ctx, time);

        ctx.drawImage(this.img, 0, 0);

        ctx.restore();
    }
}

export default ImageLayer;

























