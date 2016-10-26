function getMask(data) {

    var masks = [];
    var masksData = data.mask;

    if(!masksData) return null;

    for (var j = 0; j < masksData.numProperties; j++) {
        var mask = masksData(j + 1);
        var shape = getShape(mask.property('maskShape'));
        masks.push(shape);
    }

    return masks;
}
