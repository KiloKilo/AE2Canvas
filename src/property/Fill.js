import Property from './Property';
import AnimatedProperty from './AnimatedProperty';

class Fill {

    constructor(data) {
        this.color = data.color.length > 1 ? new AnimatedProperty(data.color) : new Property(data.color);
        if (data.opacity) this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity);
    }

    getValue(time) {
        const color = this.color.getValue(time);
        const opacity = this.opacity ? this.opacity.getValue(time) : 1;
        return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${opacity})`;
    }

    setColor(ctx, time) {
        const color = this.getValue(time);
        ctx.fillStyle = color;
    }

    setKeyframes(time) {
        this.color.setKeyframes(time);
        if (this.opacity) this.opacity.setKeyframes(time);
    }

    reset(reversed) {
        this.color.reset(reversed);
        if (this.opacity) this.opacity.reset(reversed);
    }
}

export default Fill;