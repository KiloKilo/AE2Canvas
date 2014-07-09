(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

(function () {

    // prepare base perf object
    if (typeof window.performance === 'undefined') {
        window.performance = {};
    }

    if (!window.performance.now) {

        var nowOffset = Date.now();

        if (performance.timing && performance.timing.navigationStart) {
            nowOffset = performance.timing.navigationStart
        }

        window.performance.now = function now() {
            return Date.now() - nowOffset;
        }

    }

})();

var Runtime = require('./Runtime');

var stats, ctx, runtime;
var file = 'animation';

if (location.hash) {
    console.log(location.hash);
    file = location.hash.substring(1);
}

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

    var width = window.innerWidth * 0.8;
    canvas.style.width = width + 'px';
    runtime.setWidth(width);

    window.addEventListener('resize', function () {
        width = window.innerWidth * 0.5;
        canvas.style.width = width + 'px';
        runtime.setWidth(width);
    }, false);
}

function render(time) {
    if (!time) time = performance.now();
    runtime.update(time);
    stats.update();
}

fetchJSONFile('json/' + file + '.json', function (data) {
    runtime = new Runtime(data);
    start();
});