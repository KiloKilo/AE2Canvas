function getBlendingMode(data) {
    var mode = {};
    mode.type = data.property('ADBE Vector Merge Type').value;

    return mode;
}


// multiply
// screen
// overlay
// darken
// lighten
// color-dodge
// color-burn
// hard-light
// soft-light
// difference
// exclusion
// hue
// saturation
// color
// luminosity