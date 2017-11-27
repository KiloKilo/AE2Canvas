function getComp(data) {

    var comp = {};
    comp.index = data.index;
    comp.type = 'comp';

    if (data.parent) comp.parent = data.parent.index;

    if (data.inPoint) comp.in = Math.round(data.inPoint * 1000);
    if (data.outPoint) comp.out = Math.round(data.outPoint * 1000);
    if (typeof comp.in !== 'undefined' && comp.in < 0) comp.in = 0;

    var masks = getMask(data);
    if (masks && masks.length > 0) {
        comp.masks = masks;
    }

    for (var i = 1; i <= data.numProperties; i++) {
        var prop = data.property(i);
        var matchName = prop.matchName;

        if (prop.enabled) {
            switch (matchName) {
                case 'ADBE Transform Group':
                    comp.transform = getTransform(prop);
                    break;

            }
        }
    }

    comp.layers = getLayer(data.source);

    return comp;

}

