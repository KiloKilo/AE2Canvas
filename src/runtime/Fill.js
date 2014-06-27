'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Fill(data) {
//    if (data) {
    if (data.color.length > 1) this.color = new AnimatedProperty(data.color);
    else this.color = new Property(data.color);
    if (data.opacity.length > 1) this.opacity = new AnimatedProperty(data.opacity);
    else this.opacity = new Property(data.opacity);

//  }  else {
//        //defaults -> transparent
//        this.color = new Property([
//            {time: 0, value: [0, 0, 0, 0]}
//        ]);
//        this.opacity = new Property([
//            {time: 0, value: 0}
//        ]);
//    }
}

Fill.prototype = {
    getValue: function (time) {
        var color = this.color.getValue(time);
        var opacity = this.opacity.getValue(time);
        return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + opacity + ')';
    },

    setColor: function (ctx, time) {
        var color = this.getValue(time);
        ctx.fillStyle = color;
    }
};

module.exports = Fill;