import { add, remove } from './core'
import Emitter from 'tiny-emitter'
import ImageLayer from './layers/ImageLayer';
import NullLayer from './layers/NullLayer';
import TextLayer from './layers/TextLayer';
import CompLayer from './layers/CompLayer';
import VectorLayer from './layers/VectorLayer';

class Animation extends Emitter {

    constructor(options) {
        super();

        this.gradients = {};
        this.pausedTime = 0;
        this.duration = options.data.duration;
        this.baseWidth = options.data.width;
        this.baseHeight = options.data.height;
        this.ratio = options.data.width / options.data.height;
        this.markers = options.data.markers;
        this.baseFont = options.baseFont;
        this.loop = options.loop || false;
        this.devicePixelRatio = options.devicePixelRatio || (window && window.devicePixelRatio ? window.devicePixelRatio : 1);
        this.fluid = options.fluid || true;
        this.imageBasePath = options.imageBasePath || '';

        this.isPaused = false;
        this.isPlaying = false;
        this.drawFrame = true;

        this.canvas = options.canvas || document.createElement('canvas');
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        this.ctx = this.canvas.getContext('2d');

        this.layers = options.data.layers.map(layer => {
            switch (layer.type) {
                case 'vector':
                    return new VectorLayer(layer, this.gradients);
                case 'image':
                    return new ImageLayer(layer, this.imageBasePath);
                case 'text':
                    return new TextLayer(layer, this.baseFont);
                case 'comp':
                    return new CompLayer(layer, this.baseFont, this.gradients, this.imageBasePath);
                case 'null':
                    return new NullLayer(layer);
            }
        });

        this.layers.forEach(layer => {
            if (layer.parent) {
                const parentIndex = layer.parent;
                layer.parent = this.layers.find(layer => layer.index === parentIndex)
            }
        });

        this.reversed = options.reversed || false;
        this.reset(this.reversed);
        this.resize();

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
            this.compTime = marker.time;
            this.setKeyframes(this.compTime);
            this.drawFrame = true;
            this.isPlaying = false;
        }
    }

    getMarker(id) {
        let marker;
        if (typeof id === 'number') {
            marker = this.markers[id];
        } else if (typeof id === 'string') {
            marker = this.markers.find(marker => marker.comment === id);
        }

        if (marker) return marker;
        console.warn('Marker not found');
    }

    checkStopMarkers(from, to) {
        return this.markers.find(marker => marker.stop && marker.time > from && marker.time < to);
    }

    set step(step) {
        this.isPlaying = false;
        this.compTime = step * this.duration;
        this.pausedTime = this.compTime;
        this.setKeyframes(this.compTime);
        this.drawFrame = true;
    }

    get step() {
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
                this.emit('complete');
                if (this.loop) {
                    this.play();
                }
            } else if (stopMarker) {
                this.compTime = stopMarker.time;
                this.pause();
                this.emit('stop', stopMarker);
            } else {
                this.draw(this.compTime);
            }
            this.emit('update');
        } else if (this.drawFrame) {
            this.drawFrame = false;
            this.draw(this.compTime);
            this.emit('update');
        }
    }

    draw(time) {
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

        this.layers.forEach(layer => {
            if (time >= layer.in && time <= layer.out) {
                layer.draw(this.ctx, time);
            }
        });
    }

    preload() {
        const promises = this.layers.filter(layer => layer instanceof ImageLayer).map(layer => new layer.preload());
        return Promise.all(promises).catch(error => console.error(error));
    }

    reset() {
        this.pausedTime = 0;
        this.compTime = this.reversed ? this.duration : 0;
        this.layers.forEach(layer => layer.reset(this.reversed));
    }

    setKeyframes(time) {
        this.layers.forEach(layer => layer.setKeyframes(time));
    }

    destroy() {
        this.isPlaying = false;
        if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        remove(this);
    }

    resize(w) {
        if (this.fluid) {
            const width = w || this.canvas.clientWidth || this.baseWidth;
            this.canvas.width = width * this.devicePixelRatio;
            this.canvas.height = width / this.ratio * this.devicePixelRatio;

            this.scale = width / this.baseWidth * this.devicePixelRatio;
            this.ctx.transform(this.scale, 0, 0, this.scale, 0, 0);
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
