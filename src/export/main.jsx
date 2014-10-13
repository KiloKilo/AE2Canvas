#include 'utils/json2.js'
#include 'utils/utils.js'
#include 'utils/keyframes.js'
#include 'utils/color.js'

#include 'transform/transform.js'
#include 'transform/anchor.js'
#include 'transform/scale.js'
#include 'transform/position.js'
#include 'transform/rotation.js'
#include 'transform/opacity.js'
#include 'transform/skew.js'
#include 'transform/skewAxis.js'

#include 'element/comp.js'
#include 'element/group.js'
#include 'element/path.js'
#include 'element/rect.js'
#include 'element/ellipse.js'
#include 'element/polystar.js'

#include 'element/fill.js'
#include 'element/gradient.js'
#include 'element/stroke.js'

#include 'element/merge.js'
#include 'element/vectorTrim.js'

#include 'property/property.js'
#include 'property/staticProperty.js'
#include 'property/animatedProperty.js'

#include 'optimize/optimize.js'
#include 'optimize/groupOptimize.js'
#include 'optimize/vectorTrimOptimize.js'


function start() {

    var data = getComp(app.project.activeItem);
    var json = JSON.stringify(data);

    var theFile = File.saveDialog('Save the json file');
    if (theFile != null) {
       theFile.open("w", "TEXT", "????");
       theFile.write(json);
       theFile.close();
 }
}
start();