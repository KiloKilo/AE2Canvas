ae2canvas
=========

AE2Canvas is HTML Canvas 2d renderer for After Effects Shape Layers.

The engine contains a script for saving the animation data to JSON and a runtime to play these animations in the browser.

AE2Canvas is an alpha state and supports atm only a subset of the functionality of shape layers.

The following properties/objects are supported:
* All Transform Properties
* Group
* Rectangle
* Rounded Rectangle
* Ellipse
* Polystar (buggy)
* Path
* Stroke
* Fill
* Merge (partially)
* Trim Paths (only for Path)

AE2Canvas contains an ExtendScript File to save the animation data to JSON and a Javascript runtime to play the animation in the Browser

## Download
### Export Script
[ae2canvas-export.jsx]()
### Runtime
[ae2canvas.js]()
[ae2canvas.min.js]()
## Usage
Open in After Effects the composition you want to export and run the file `ae2canvas-export.jsx` from the menu: `File -> Scripts -> Run Script File...`.

Save the the file as JSON.

Include `ae2canvas.js` or `ae2canvas.min.js` in your html.
```html
<script src="ae2canvas.js"></script>
```
Load the json file and pass the result to the AE2Canvas.Animation constructor.
```javascript
fetchJSONFile('animation.json', function (result) {
    animation = new AE2Canvas.Animation({data: result});
});
```
You can pass the following options to the constructor, or set it later on the instance:

*`canvas {DOM Node}` if this is empty, AE2Canvas will create a canvas for you
*`loop {Boolean}` set this to `true` to loop the animation
*`loop {Boolean}` set this to `true` to render for high dpi devices
*`reversed {Boolean}` set this to `true` to run the animation backwards
*`onComplete {Function}` Function which will be called when the animation finishes

If you didn't pass a canvas to the constructor, you have to add the canvas manually to the DOM.
If your canvas has a different size than your animation, you can call resize on the instance to scale the animation accordingly.
```javascript
document.getElementById('wrapper').appendChild(animation.canvas);
animation.resize();
```
AE2Canvas needs a tick to run, so you want to add the update function to your animation loop
```javascript
function loop(time) {
    requestAnimationFrame(loop);
    AE2Canvas.update(time);
}
```

###Controls
An animation instance has the following control functions:
* `play()` play from the actual frame
* `pause()` pause at the actual frame
* `stop()` stop the animation set the time back to start and render the first frame
* `setStep(Number)` pass a number between 0 and 100 to render the frame at this position
* `gotoAndPlay(String or Number)` pass a in an identifier to jump to the marker and play the animation from there
* `gotoAndStop(String or Number)` pass a in an identifier to jump to the marker render this frame and stop the animation

###Markers
Markers can be set in After Effects as composition marker. You can add a text to the comments field to access this marker later via `gotoAndPlay()` or `gotoAndStop()`.
If you pass a number to `gotoAndPlay()` or `gotoAndStop()` the marker at this index will be used.

