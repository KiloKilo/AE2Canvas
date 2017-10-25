function getText(data) {

    var text = {};
    text.index = data.index;
    text.type = 'text';

    if (data.parent) text.parent = data.parent.index;

    if (data.inPoint) text.in = Math.round(data.inPoint * 1000);
    if (data.outPoint) text.out = Math.round(data.outPoint * 1000);
    if (typeof text.in !== 'undefined' && text.in < 0) text.in = 0;

    var masks = getMask(data);
    if (masks && masks.length > 0) {
        text.masks = masks;
    }

    for (var i = 1; i <= data.numProperties; i++) {
        var prop = data.property(i);
        var matchName = prop.matchName;

        if (prop.enabled) {
            switch (matchName) {
                case 'ADBE Transform Group':
                    text.transform = getTransform(prop);
                    break;
                case 'ADBE Text Properties': {
                    var textDoc = prop.property('ADBE Text Document').value;
                    text.text = textDoc.text.split('\r');
                    text.leading = textDoc.leading;
                    text.fontSize = textDoc.fontSize;
                    text.font = textDoc.font;
                    text.color = setTextColor(textDoc.fillColor);
                    text.justification = setJustifitcationAsString(textDoc.justification);
                    break;
                }
            }
        }
    }

    return text;

    function setJustifitcationAsString(number) {
        switch (number) {
            case ParagraphJustification.LEFT_JUSTIFY:
                return 'left';
                break;
            case ParagraphJustification.RIGHT_JUSTIFY:
                return 'right';
                break;
            case ParagraphJustification.CENTER_JUSTIFY:
                return 'center';
                break;
            default:
                return 'left';
        }
    }

    function setTextColor(color) {
        for (var i = 0; i < color.length; i++) {
            color[i] = Math.round(color[i] * 255);
        }

        return color;
    }
}

