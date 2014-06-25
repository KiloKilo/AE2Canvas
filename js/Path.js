Path = function (data) {
    if (!data) return null;

    this.name = data.name;
    this.closed = data.closed;
    this.frames = data.frames;
    this.verticesCount = this.frames[0].value.length;
};

Path.prototype = {
    getValue: function (time) {
        return this.frames[0].value;
    }
}



























