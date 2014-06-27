var Runtime = require('./Runtime');

var stats, ctx, runtime;

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
        runtime = new Runtime(data);
        start();
    });
};

function loop(time) {
    requestAnimationFrame(loop);
    render(time);
}

function start() {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    document.getElementsByTagName('body')[0].appendChild(stats.domElement);

    document.getElementById('start').addEventListener('click', function () {
        runtime.start();
    }, false);
    document.getElementById('stop').addEventListener('click', function () {
        runtime.stop();
    }, false);
    document.getElementById('pause').addEventListener('click', function () {
        runtime.pause();
    }, false);

    var canvas = document.getElementById('canvas');
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        runtime.canvas = canvas;
        runtime.ctx = ctx;
        loop();
    }
}

function render(time) {
    if (!time) time = performance.now();
    runtime.update(time);
    stats.update();
}

