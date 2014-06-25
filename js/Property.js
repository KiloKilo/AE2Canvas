Property = function (data) {
    if (!(data instanceof Array)) return null;
    this.frames = data;
};

Property.prototype = {
    getValue: function (time) {
        return this.frames[0].value;
    }
}