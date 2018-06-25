class BlendingMode {
    constructor(data) {
        this.type = data.type;
    }

    setCompositeOperation(ctx) {
        switch (this.type) {
            case 2:
                ctx.globalCompositeOperation = 'source-over';
                break;
            case 3:
                ctx.globalCompositeOperation = 'source-out';
                break;
            case 4:
                ctx.globalCompositeOperation = 'source-in';
                break;
            case 5:
                ctx.globalCompositeOperation = 'xor';
                break;
            default:
                ctx.globalCompositeOperation = 'source-over';
        }
    }
}

export default BlendingMode;

























