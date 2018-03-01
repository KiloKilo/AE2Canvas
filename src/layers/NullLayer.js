import Layer from './Layer';

class NullLayer extends Layer {
    constructor(data) {
        super(data);
    }

    draw(ctx, time) {
        super.draw(ctx, time);
        ctx.restore();
    }
}

export default NullLayer;

























