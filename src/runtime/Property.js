'use strict';

function Property(data) {
    if (!(data instanceof Array)) return null;
    this.frames = data;
}

Property.prototype = {
    getValue: function (time) {
        return this.frames[0].v;
    }
};

module.exports = Property;