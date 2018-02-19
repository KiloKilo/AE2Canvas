import Property from './Property';
import BezierEasing from '../utils/BezierEasing';

class AnimatedProperty extends Property {

    constructor(data) {
        super(data);
        this.frameCount = this.frames.length;
    }

    lerp(a, b, t) {
        if (a instanceof Array) {
            const arr = [];
            for (let i = 0; i < a.length; i++) {
                arr[i] = a[i] + t * (b[i] - a[i]);
            }
            return arr;
        } else {
            return a + t * (b - a);
        }
    }

    setEasing() {
        if (this.nextFrame.easeIn) {
            this.easing = new BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
        } else {
            this.easing = null;
        }
    }

    getValue(time) {
        if (this.finished && time >= this.nextFrame.t) {
            return this.nextFrame.v;
        } else if (!this.started && time <= this.lastFrame.t) {
            return this.lastFrame.v;
        } else {
            this.started = true;
            this.finished = false;
            if (time > this.nextFrame.t) {
                if (this.pointer + 1 === this.frameCount) {
                    this.finished = true;
                } else {
                    this.pointer++;
                    this.lastFrame = this.frames[this.pointer - 1];
                    this.nextFrame = this.frames[this.pointer];
                    this.onKeyframeChange();
                }
            } else if (time < this.lastFrame.t) {
                if (this.pointer < 2) {
                    this.started = false;
                } else {
                    this.pointer--;
                    this.lastFrame = this.frames[this.pointer - 1];
                    this.nextFrame = this.frames[this.pointer];
                    this.onKeyframeChange();
                }
            }
            return this.getValueAtTime(time);
        }
    }

    setKeyframes(time) {
        //console.log(time, this.frames[this.frameCount - 2].t, this.frames[this.frameCount - 1].t);

        if (time < this.frames[0].t) {
            this.pointer = 1;
            this.nextFrame = this.frames[this.pointer];
            this.lastFrame = this.frames[this.pointer - 1];
            this.onKeyframeChange();
            return;
        }

        if (time > this.frames[this.frameCount - 1].t) {
            this.pointer = this.frameCount - 1;
            this.nextFrame = this.frames[this.pointer];
            this.lastFrame = this.frames[this.pointer - 1];
            this.onKeyframeChange();
            return;
        }

        for (let i = 1; i < this.frameCount; i++) {
            if (time >= this.frames[i - 1].t && time <= this.frames[i].t) {
                this.pointer = i;
                this.lastFrame = this.frames[i - 1];
                this.nextFrame = this.frames[i];
                this.onKeyframeChange();
                return;
            }
        }
    }

    onKeyframeChange() {
        this.setEasing();
    }

    getElapsed(time) {
        const delta = (time - this.lastFrame.t);
        const duration = this.nextFrame.t - this.lastFrame.t;
        let elapsed = delta / duration;

        if (elapsed > 1) elapsed = 1;
        else if (elapsed < 0) elapsed = 0;
        else if (this.easing) elapsed = this.easing(elapsed);
        return elapsed;
    }

    getValueAtTime(time) {
        return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time));
    }

    reset(reversed) {
        this.finished = false;
        this.started = false;
        this.pointer = reversed ? this.frameCount - 1 : 1;
        this.nextFrame = this.frames[this.pointer];
        this.lastFrame = this.frames[this.pointer - 1];
        this.onKeyframeChange();
    }
}

export default AnimatedProperty;