#include 'utils/json2.js'
#include 'utils/utils.js'
#include 'utils/keyframes.js'
#include 'utils/spatialKeyframes.js'
#include 'utils/motionpath.js'

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

}}],"transform":{"positionX":[{"t":0,"v":501,"easeOut":[0.167,0.237],"outTangent":0},{"t":1992.8515625,"v":574,"easeIn":[0.833,0.763],"easeOut":[0.167,-0.235],"inTangent":0,"outTangent":0},{"t":4133.359375,"v":498,"easeIn":[0.833,1.235],"easeOut":[0.167,-0.176],"inTangent":0,"outTangent":0},{"t":5240,"v":274,"easeIn":[0.833,1.176],"easeOut":[0.167,0.234],"inTangent":0,"outTangent":0},{"t":8000,"v":501,"easeIn":[0.833,0.766],"inTangent":0}],"positionY":[{"t":0,"v":213,"easeOut":[0.167,0.234],"outTangent":0},{"t":1992.8515625,"v":287,"easeIn":[0.833,0.766],"easeOut":[0.167,0.237],"inTangent":0,"outTangent":0},{"t":4133.359375,"v":361,"easeIn":[0.833,0.763],"easeOut":[0.167,0.523],"inTangent":0,"outTangent":0},{"t":5240,"v":437,"easeIn":[0.833,0.477],"easeOut":[0.167,-0.238],"inTangent":0,"outTangent":0},{"t":8000,"v":213,"easeIn":[0.833,1.238],"inTangent":0}]}},{"out":8040,"name":"polygons edge3","groups":[{"name":"edge","index":1,"groups":[{"name":"Group 2","index":2,"shapes":[{"name":"Ellipse Path 1","index":1,"type":"ellipse","size":[{"t":0,"v":[14,14]}],"position":[{"t":0,"v":[0,0]}]}],"fill":{"index":2,"color":[{"t":0,"v":[0,0,0]}],"opacity":[{"t":0,"v":1}]},"transform":{

function start() {

    clearConsole();

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