AnimatedProperty = function (data) {
    if (!data) return;

    Property.call(this, data);

    this.finished = false;
    this.started = false;

    this.pointer = 0;
    this.frameCount = this.frames.length;
    this.nextFrame = this.frames[this.pointer];
    this.lastFrame = this.nextFrame;

    this.easing = null;
};

AnimatedProperty.prototype = Object.create(Property.prototype);

AnimatedProperty.prototype = {

    lerp: function (a, b, t) {
        if (a instanceof Array) {
            var arr = [];
            for (var i = 0; i < a.length; i++) {
                arr[i] = a[i] + t * (b[i] - a[i]);
            }
            return arr;
        } else {
            return a + t * (b - a);
        }
    },

    setEasing: function () {
        if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
            this.easing = new BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
        } else {
            this.easing = null;
        }
    },

    getValue: function (time) {
        if (this.finished || (time <= this.nextFrame.time && !this.started)) {
            return this.nextFrame.value;
        } else {
            this.started = true;
            if (time > this.nextFrame.time) {
                if (this.pointer + 1 === this.frameCount) {
                    this.finished = true;
                } else {
                    this.lastFrame = this.nextFrame;
                    this.pointer++;
                    this.nextFrame = this.frames[this.pointer];
                    this.setEasing();
                }
            }
            return this.getValueAtTime(time);
        }
    },

    getValueAtTime: function (time) {
        var delta = ( time - this.lastFrame.time );
        var duration = this.nextFrame.time - this.lastFrame.time;
        var elapsed = delta / duration;
        if (elapsed > 1) elapsed = 1;
        else if (this.easing) elapsed = this.easing(elapsed);
        return this.lerp(this.lastFrame.value, this.nextFrame.value, elapsed);
    }
}