'use strict';

function getComp(data) {

    if (!(data instanceof CompItem))return null;

    var content = {};
    content.groups = [];

    for (var i = data.numLayers; i > 0; i--) {
        var layer = data.layer(i);

        $.writeln(layer.inPoint);

        if (layer instanceof ShapeLayer && layer.enabled) {
            content.groups.push(getGroup(layer));
        }
    }

    return content;
}