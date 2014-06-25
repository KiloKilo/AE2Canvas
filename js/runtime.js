var stats;
var ctx;
var animationObject;

function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send();
}

window.onload = function () {
    fetchJSONFile('json/animation.json', function (data) {
        animationObject = new AE2Canvas(data);
        start();
    });
};

function loop(time) {
    requestAnimationFrame(loop);
    TWEEN.update();
    render(time);
};

function start() {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    document.getElementsByTagName('body')[0].appendChild(stats.domElement);

    var canvas = document.getElementById('canvas');
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        animationObject.canvas = canvas;
        animationObject.ctx = ctx;
        loop();
    }
}

function render(time) {
    if (!time) time = performance.now();
    animationObject.onUpdate(time);
    stats.update();
};

