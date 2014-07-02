'use strict';

var Group = require('./Group');

function Runtime(data) {
    if (!data) return null;

//    this.shapeCount = 0;

    this.started = false;
    this.time = 0;
    this.startTime = 0;
    this.pausedTime = 0;

    this.groups = [];
    for (var i = 0; i < data.groups.length; i++) {
        this.groups.push(new Group(data.groups[i]));
    }

    console.log(this);
}

Runtime.prototype = {

    start: function () {
        this.startTime = this.time;
        console.log('------------------------------- RESTART ---------------------------------------');
        this.started = true;
    },

    stop: function () {
        this.startTime = 0;
        this.started = false;
    },

    pause: function () {
        this.pausedTime = this.time;
        this.startTime = this.time;
        this.started = false;
    },

    update: function (time) {
        this.time = time;
        if (this.started) {
//            console.log('tick', this.time - this.startTime);
//            console.log(this.time);
            this.draw(this.time - this.startTime);
        }
    },

    draw: function (time) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        for (var i = 0; i < this.groups.length; i++) {
            if (time >= this.groups[i].in && time < this.groups[i].out) {
                this.groups[i].draw(this.ctx, time);
            }
        }
        this.ctx.restore();
    },

    resize: function (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
};

module.exports = Runtime;