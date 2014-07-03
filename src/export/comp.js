'use strict';

function getComp(data) {

    if (!(data instanceof CompItem))return null;

    var comp = {};
    comp.groups = [];
    comp.duration = data.duration * 1000;
    comp.width = data.width;
    comp.height = data.height;

    for (var i = data.numLayers; i > 0; i--) {
        var layer = data.layer(i);

        if (layer instanceof ShapeLayer && layer.enabled) {
            comp.groups.push(getGroup(layer));
        }
    }

    return comp;
}