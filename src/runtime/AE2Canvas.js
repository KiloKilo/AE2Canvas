'use strict';

var Animation = require('./Animation');

var animations = [];

module.exports = {

    Animation: function (data, canvas) {
        var animation = new Animation(data, canvas);
        animations.push(animation);
        return animation;
    },

    update: function (time) {
        for (var i = 0; i < animations.length; i++) {
            animations[i].update(time);
        }
    }
};