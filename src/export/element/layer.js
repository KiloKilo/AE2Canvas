function getLayer(data, comp) {
    var i;
    var layer;
    var layers = [];

    for (i = data.numLayers; i > 0; i--) {
        layer = data.layer(i);

        if (layer.enabled) {
            if (layer instanceof ShapeLayer) {
                layers.push(getGroup(layer));
            } else if (layer instanceof TextLayer) {
                layers.push(getText(layer));
            } else if (layer instanceof AVLayer && layer.source instanceof FootageItem) {
                layers.push(getImage(layer));
            } else if (layer instanceof AVLayer && layer.source instanceof CompItem) {
                layers.push(getComp(layer));
            }
        }
    }

    return layers;
}