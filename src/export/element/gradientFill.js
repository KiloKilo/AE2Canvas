function getGradientFill(data) {
    var gradientFill = {};
    gradientFill.name = data.name;

    gradientFill.type = setGradientTypeAsString(data.property('ADBE Vector Grad Type').value);
    gradientFill.startPoint = getProperty(data.property('ADBE Vector Grad Start Pt'));
    gradientFill.endPoint = getProperty(data.property('ADBE Vector Grad End Pt'));
    gradientFill.startPoint = normalizeKeyframes(gradientFill.startPoint);
    gradientFill.endPoint = normalizeKeyframes(gradientFill.endPoint);

    gradientFill.stops = [
        { color: [255, 255, 255, 1], location: 0 },
        { color: [0, 0, 0, 1], location: 1 }
    ];

    var opacity = data.property('ADBE Vector Fill Opacity');

    if (opacity.isTimeVarying || opacity.value !== 100) {
        opacity = getProperty(opacity);
        opacity = normalizeKeyframes(opacity);
        opacity = divideValue(opacity, 100);
        gradientFill.opacity = opacity;
    }

    return gradientFill;

    function setGradientTypeAsString(number) {
        switch (number) {
            case 1:
                return 'linear';
                break;
            case 2:
                return 'radial';
                break;
            default:
                return 'linear';
        }
    }
}

