import Property from './Property';
import AnimatedProperty from './AnimatedProperty';

class Trim {
    constructor(data) {

        this.type = data.type;

        if (data.start) this.start = data.start.length > 1 ? new AnimatedProperty(data.start) : new Property(data.start);
        if (data.end) this.end = data.end.length > 1 ? new AnimatedProperty(data.end) : new Property(data.end);
        //if (data.offset) this.offset = data.offset.length > 1 ? new AnimatedProperty(data.offset) : new Property(data.offset);

    }

    getTrim(time) {
        const start = this.start ? this.start.getValue(time) : 0;
        const end = this.end ? this.end.getValue(time) : 1;

        const trim = {
            start: Math.min(start, end),
            end: Math.max(start, end)
        };

        if (trim.start === 0 && trim.end === 1) {
            return null;
        } else {
            return trim;
        }
    }

    setKeyframes(time) {
        if (this.start) this.start.setKeyframes(time);
        if (this.end) this.end.setKeyframes(time);
        //if (this.offset) this.offset.reset();
    }

    reset(reversed) {
        if (this.start) this.start.reset(reversed);
        if (this.end) this.end.reset(reversed);
        //if (this.offset) this.offset.reset();
    }
}

export default Trim;























