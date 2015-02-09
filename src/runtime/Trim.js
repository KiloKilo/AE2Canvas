'use strict';

var Property = require('./Property'),
    AnimatedProperty = require('./AnimatedProperty');

function Trim(data) {

    this.type = data.type;

    if (data.start) this.start = data.start.length > 1 ? new AnimatedProperty(data.start) : new Property(data.start);
    if (data.end) this.end = data.end.length > 1 ? new AnimatedProperty(data.end) : new Property(data.end);
    //if (data.offset) this.offset = data.offset.length > 1 ? new AnimatedProperty(data.offset) : new Property(data.offset);

}

Trim.prototype.getTrim = function (time) {

    var start = this.start ? this.start.getValue(time) : 0.01,
        end = this.end ? this.end.getValue(time) : 0.99;

    var trim = {
        start: Math.min(start, end),
        end  : Math.max(start, end)
    };

    if (trim.start !== 0.01 || trim.end !== 0.99) {
        return trim;
    } else {
        return null;
    }
};

Trim.prototype.reset = function () {
    if (this.start) this.start.reset();
    if (this.end) this.end.reset();
    //if (this.offset) this.offset.reset();
};

module.exports = Trim;























