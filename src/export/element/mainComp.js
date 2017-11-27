function getMainComp(data) {
    var comp = {};
    comp.layers = [];
    comp.duration = data.duration * 1000;
    comp.width = data.width;
    comp.height = data.height;
    comp.markers = getCompMarkers(data);
    comp.layers = getLayer(data);

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


            time = Math.round(time);
            tempText.remove();

            var isStopMarker = comment.toLocaleLowerCase().indexOf('{stop}') > -1;

            comment = comment.replace(/(\r\n|\n|\r)/gm, '');
            comment = comment.replace(/\{.*?\}/g, '');
            comment = comment.replace(/^\s+|\s+$/g, '');

            markers.push({
                comment: comment,
                time: time,
                stop: isStopMarker
            });
        }

        tempNull.source.remove();

        return markers;
    }
}