import Path from './Path';
import BezierEasing from '../utils/BezierEasing';

class AnimatedPath extends Path {

    constructor(data) {
        super(data);
        this.frameCount = this.frames.length;
    }

    getValue(time) {
        if (this.finished && time >= this.nextFrame.t) {
            return this.nextFrame;
        } else if (!this.started && time <= this.lastFrame.t) {
            return this.lastFrame;
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
            if (time >= this.frames[i - 1].t && time <= this.frames[i]) {
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

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    setEasing() {
        if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
            this.easing = new BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
        } else {
            this.easing = null;
        }
    }

    getValueAtTime(time) {
        const delta = (time - this.lastFrame.t);
        const duration = this.nextFrame.t - this.lastFrame.t;
        let elapsed = delta / duration;
        if (elapsed > 1) elapsed = 1;
        else if (elapsed < 0) elapsed = 0;
        else if (this.easing) elapsed = this.easing(elapsed);
        const actualVertices = [];
        const actualLength = [];

        for (let i = 0; i < this.verticesCount; i++) {
            const cp1x = this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed);
            const cp1y = this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed);
            const cp2x = this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed);
            const cp2y = this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed);
            const x = this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed);
            const y = this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed);

            actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y]);
        }

        for (let j = 0; j < this.verticesCount - 1; j++) {
            actualLength.push(this.lerp(this.lastFrame.len[j], this.nextFrame.len[j], elapsed));
        }

        return {
            v: actualVertices,
            len: actualLength
        }
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

export default AnimatedPath;

























