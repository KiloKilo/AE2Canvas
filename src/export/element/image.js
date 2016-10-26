function getImage(data) {

    var image = {};

    if (data.inPoint) image.in = Math.round(data.inPoint * 1000);
    if (data.outPoint) image.out = Math.round(data.outPoint * 1000);

    if (typeof image.in !== 'undefined' && image.in < 0) image.in = 0;

    //image.name = data.name;
    image.source = data.source.name;
    image.type = 'image';

    var masks = getMask(data);
    if (masks && masks.length > 0) {
        image.masks = masks;
    }

    var effects = data.property('Effects');

    for (var i = 1; i <= data.numProperties; i++) {
        var prop = data.property(i);
        var matchName = prop.matchName;

        if (prop.enabled) {
            switch (matchName) {
                case 'ADBE Transform Group':
                    image.transform = getTransform(prop);
                    break;
            }
        }
    }

    return image;
}

