#include '../lib/json2.js'
#include 'comp.js'
#include 'group.js'
#include 'path.js'
#include 'rect.js'
#include 'ellipse.js'
#include 'polystar.js'
#include 'transform.js'
#include 'fill.js'
#include 'gradient.js'
#include 'stroke.js'
#include 'property.js'
#include 'vectorTrim.js'
#include 'optimize/optimize.js'
#include 'optimize/groupOptimize.js'
#include 'optimize/vectorTrimOptimize.js'


function start() {

    var data = getComp(app.project.activeItem);
    var json = JSON.stringify(data);

    //return;

    var theFile = File.saveDialog('Save the json file');
    if (theFile != null) {
       theFile.open("w", "TEXT", "????");
       theFile.write(json);
       theFile.close();
 }
}
start();