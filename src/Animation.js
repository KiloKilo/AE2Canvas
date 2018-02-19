import {add, remove} from './core'
import Group from './objects/Group';
import ImageLayer from './layers/ImageLayer';
import TextLayer from './layers/TextLayer';
import CompLayer from './layers/CompLayer';

class Animation {

    constructor(options) {
        this.gradients = {};
        this.pausedTime = 0;
        this.duration = options.data.duration;
        this.baseWidth = options.data.width;
        this.baseHeight = options.data.height;
        this.ratio = options.data.width / options.data.height;
        this.markers = options.data.markers;
        this.baseFont = options.baseFont;

        this.canvas = options.canvas || document.createElement('canvas');
        this.loop = options.loop || false;
        this.devicePixelRatio = options.devicePixelRatio || window && window.devicePixelRatio ? window.devicePixelRatio : 1;
        this.fluid = options.fluid || true;
        this.reversed = options.reversed || false;
        this.imageBasePath = options.imageBasePath || '';
        this.onUpdate = options.onUpdate || (() => {
        });
        this.onComplete = options.onComplete || (() => {
        });
        this.onStop = options.onStop || (() => {
        });

        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;

        this.buffer = document.createElement('canvas');
        this.buffer.width = this.baseWidth;
        this.buffer.height = this.baseHeight;
        this.bufferCtx = this.buffer.getContext('2d');

        this.layers = [];
        for (let i = 0; i < options.data.layers.length; i++) {
            if (options.data.layers[i].type === 'vector') {
                this.layers.push(new Group(options.data.layers[i], this.bufferCtx, 0, this.duration, this.gradients));
            } else if (options.data.layers[i].type === 'image') {
                this.layers.push(new ImageLayer(options.data.layers[i], 0, this.duration, this.imageBasePath));
            } else if (options.data.layers[i].type === 'text') {
                this.layers.push(new TextLayer(options.data.layers[i], 0, this.duration, this.baseFont));
            } else if (options.data.layers[i].type === 'comp') {
                this.layers.push(new CompLayer(options.data.layers[i], this.bufferCtx, 0, this.duration, this.baseFont, this.gradients, this.imageBasePath, this.baseFont));
            }
        }
        this.numLayers = this.layers.length;

        for (const layer of this.layers) {
            if (layer.parent) {
                for (let k = 0; k < this.layers.length; k++) {
                    //TODO stop loop
                    if (layer.parent === this.layers[k].index) {
                        layer.parent = this.layers[k];
                    }
                }
            }
        }

        this.reset(this.reversed);
        this.resize();

        this.isPaused = false;
        this.isPlaying = false;
        this.drawFrame = true;

        add(this);
    }

    play() {
        if (!this.isPlaying) {
            if (!this.isPaused) this.reset(this.reversed);
            this.isPaused = false;
            this.pausedTime = 0;
            this.isPlaying = true;
        }
    }

    stop() {
        this.reset(this.reversed);
        this.isPlaying = false;
        this.drawFrame = true;
    }

    pause() {
        if (this.isPlaying) {
            this.isPaused = true;
            this.pausedTime = this.compTime;
            this.isPlaying = false;
        }
    }

    gotoAndPlay(id) {
        const marker = this.getMarker(id);
        if (marker) {
            this.compTime = marker.time;
            this.pausedTime = 0;
            this.setKeyframes(this.compTime);
            this.isPlaying = true;
        }
    }

    gotoAndStop(id) {
        const marker = this.getMarker(id);
        if (marker) {
            this.isPlaying = false;
            this.compTime = marker.time;
            this.setKeyframes(this.compTime);
            this.drawFrame = true;
        }
    }

    getMarker(id) {
        if (typeof id === 'number') {
            return this.markers[id];
        } else if (typeof id === 'string') {
            for (let i = 0; i < this.markers.length; i++) {
                if (this.markers[i].comment === id) {
                    return this.markers[i];
                }
            }
        }
        console.warn('Marker not found');
    }

    checkStopMarkers(from, to) {
        for (let i = 0; i < this.markers.length; i++) {
            if (this.markers[i].stop && this.markers[i].time > from && this.markers[i].time < to) {
                return this.markers[i];
            }
        }
        return false;
    }

    setStep(step) {
        this.isPlaying = false;
        this.compTime = step * this.duration;
        this.pausedTime = this.compTime;
        this.setKeyframes(this.compTime);
        this.drawFrame = true;
    }

    getStep() {
        return this.compTime / this.duration;
    }

    update(time) {
        if (!this.then) this.then = time;

        const delta = time - this.then;
        this.then = time;

        if (this.isPlaying) {
            this.compTime = this.reversed ? this.compTime - delta : this.compTime + delta;

            const stopMarker = this.checkStopMarkers(this.compTime - delta, this.compTime);

            if (this.compTime > this.duration || this.reversed && this.compTime < 0) {
                this.compTime = this.reversed ? 0 : this.duration - 1;
                this.isPlaying = false;
                this.onComplete();
                if (this.loop) {
                    this.play();
                }
            } else if (stopMarker) {
                this.compTime = stopMarker.time;
                this.onStop(stopMarker);
                this.pause();
            } else {
                this.draw(this.compTime);
            }
            this.onUpdate();
        } else if (this.drawFrame) {
            this.drawFrame = false;
            this.draw(this.compTime);
            this.onUpdate();
        }
    }

    draw(time) {
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
        for (let i = 0; i < this.numLayers; i++) {
            if (time >= this.layers[i].in && time <= this.layers[i].out) {
                this.layers[i].draw(this.ctx, time);
            }
        }
    }

    preload(cb) {
        this.onloadCB = cb;
        for (let i = 0; i < this.numLayers; i++) {
            if (this.layers[i] instanceof ImageLayer) {
                this.layers[i].preload(this.onload.bind(this));
            }
        }
    }

    onload() {
        for (let i = 0; i < this.numLayers; i++) {
            if (this.layers[i] instanceof ImageLayer) {
                if (!this.layers[i].isLoaded) {
                    return;
                }
            }
        }
        this.isLoaded = true;
        if (typeof this.onloadCB === 'function') {
            this.onloadCB();
        }
    }

    reset() {
        this.pausedTime = 0;
        this.compTime = this.reversed ? this.duration : 0;
        for (let i = 0; i < this.numLayers; i++) {
            this.layers[i].reset(this.reversed);
        }
    }

    setKeyframes(time) {
        for (let i = 0; i < this.numLayers; i++) {
            this.layers[i].setKeyframes(time);
        }
    }

    destroy() {
        this.isPlaying = false;
        this.onComplete = null;
        if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        remove(this);
    }

    resize(w) {
        if (this.fluid) {
            const width = w || this.canvas.clientWidth || this.baseWidth;
            this.canvas.width = width * this.devicePixelRatio;
            this.canvas.height = width / this.ratio * this.devicePixelRatio;

            this.buffer.width = width * this.devicePixelRatio;
            this.buffer.height = width / this.ratio * this.devicePixelRatio;

            this.scale = width / this.baseWidth * this.devicePixelRatio;
            this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
            this.bufferCtx.transform(this.scale, 0, 0, this.scale, 0, 0);
            this.setKeyframes(this.compTime);
            this.drawFrame = true;
        }
    }

    setGradients(name, stops) {
        if (!this.gradients[name]) {
            console.warn(`Gradient with name: ${name} not found.`);
            return;
        }

        this.gradients[name].forEach(gradient => {
            gradient.stops = stops;
        });
    }

    get reversed() {
        return this._reversed;
    }

    set reversed(bool) {
        this._reversed = bool;
        if (this.pausedTime) {
            this.compTime = this.pausedTime;
        } else if (!this.isPlaying) {
            this.compTime = this.reversed ? this.duration : 0;
        }
        this.setKeyframes(this.compTime);
    }
}

export default Animation;
