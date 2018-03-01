import Layer from './Layer'

class TextLayer extends Layer {
    constructor(data, parentIn, parentOut, baseFont) {
        super(data, parentIn, parentOut);
        this.text = data.text;
        this.leading = data.leading;
        this.fontSize = data.fontSize;
        this.font = data.font;
        this.color = data.color;
        this.justification = data.justification;
        this.baseFont = baseFont;
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

        ctx.textAlign = this.justification;
        ctx.font = `${this.fontSize}px ${this.baseFont}` || this.font;
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        for (let j = 0; j < this.text.length; j++) {
            ctx.fillText(this.text[j], 0, j * this.leading);
        }

        ctx.restore();
    }

}

export default TextLayer;

























