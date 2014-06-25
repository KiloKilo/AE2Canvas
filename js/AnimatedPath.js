AnimatedPath = function (data) {
    if (!data) return null;

    Path.call(this, data);

    this.finished = false;
    this.started = false;
    this.pointer = 0;

    this.frameCount = this.frames.length;
    this.nextFrame = this.frames[this.pointer];
    this.lastFrame = this.nextFrame;

    this.easing = null;
};

AnimatedPath.prototype = Object.create(Path.prototype);

AnimatedPath.prototype = {

    getValue: function (time) {
        if ((time <= this.nextFrame.time && !this.started) || this.finished) {
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

    lerp: function (a, b, t) {
        return a + t * (b - a);
    },

    setEasing: function () {
        if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
            this.easing = new BezierEasing(this.lastFrame.easeOut[0], this.lastFrame.easeOut[1], this.nextFrame.easeIn[0], this.nextFrame.easeIn[1]);
        } else {
            this.easing = null;
        }
    },

    getValueAtTime: function (time) {
        var delta = ( time - this.lastFrame.time );
        var duration = this.nextFrame.time - this.lastFrame.time;
        var elapsed = delta / duration;
        if (elapsed > 1) elapsed = 1;
        else if (this.easing) elapsed = this.easing(elapsed);
        var actualVertices = [];

        for (var i = 0; i < this.verticesCount; i++) {
            var cp1x = this.lerp(this.lastFrame.value[i][0], this.nextFrame.value[i][0], elapsed),
                cp1y = this.lerp(this.lastFrame.value[i][1], this.nextFrame.value[i][1], elapsed),
                cp2x = this.lerp(this.lastFrame.value[i][2], this.nextFrame.value[i][2], elapsed),
                cp2y = this.lerp(this.lastFrame.value[i][3], this.nextFrame.value[i][3], elapsed),
                x = this.lerp(this.lastFrame.value[i][4], this.nextFrame.value[i][4], elapsed),
                y = this.lerp(this.lastFrame.value[i][5], this.nextFrame.value[i][5], elapsed);

            actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y]);
        }
        return actualVertices;
    }
};



























