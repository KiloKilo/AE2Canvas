function getComp(data) {
    var comp = {};
    comp.groups = [];
    comp.duration = data.duration * 1000;
    comp.width = data.width;
    comp.height = data.height;
    comp.markers = getCompMarkers(data);

    for (var i = data.numLayers; i > 0; i--) {
        var layer = data.layer(i);

        if (layer instanceof ShapeLayer && layer.enabled) {
            comp.groups.push(getGroup(layer));
        }
    }

    return comp;

    function getCompMarkers(data) {

        var markers = [],
            tempNull = data.layers.addNull(data.duration),
            tempPos = tempNull.property('ADBE Transform Group').property('ADBE Position');

        tempPos.expression = 'x = thisComp.marker.numKeys;[x,0];';
        var result = tempPos.value[0];

        for (var i = 1; i <= result; i++) {
            var tempText = data.layers.addText();
            var pos = tempText.property('ADBE Transform Group').property('ADBE Position');
            pos.expression = '[thisComp.marker.key(' + i + ').time,0];';
            tempText.property('ADBE Text Properties').property('ADBE Text Document').expression = 'thisComp.marker.key(' + i + ').comment;';

            var comment = tempText.property('ADBE Text Properties').property('ADBE Text Document').value.text,
                time = tempText.property('ADBE Transform Group').property('ADBE Position').value[0] * 1000;

            //remove linebreaks
            comment = comment.replace(/(\r\n|\n|\r)/gm, ' ');

            time = Math.round(time);

            tempText.remove();

            markers.push({
                comment: comment,
                time   : time
            });
        }

        tempNull.source.remove();

        return markers;
    }
}