import ImageLayer from './ImageLayer'
import NullLayer from './NullLayer'
import TextLayer from './TextLayer'
import BaseLayer from './BaseLayer'
import VectorLayer from './VectorLayer'
import Property from '../property/Property'
import AnimatedProperty from '../property/AnimatedProperty'

class CompLayer extends BaseLayer {

    constructor(data, comps, baseFont, gradients, imageBasePath) {
        super(data)

        const sourceID = data.sourceID
        const layers = (comps && comps[sourceID]) ? comps[sourceID].layers : null

        if (layers) {

            this.layers = layers.map(layer => {
                switch (layer.type) {
                    case 'vector':
                        return new VectorLayer(layer, gradients)
                    case 'image':
                        return new ImageLayer(layer, imageBasePath)
                    case 'text':
                        return new TextLayer(layer, baseFont)
                    case 'comp':
                        return new CompLayer(layer, baseFont, gradients, imageBasePath)
                    case 'null':
                        return new NullLayer(layer)
                }
            })

            this.layers.forEach(layer => {
                if (layer.parent) {
                    const parentIndex = layer.parent
                    layer.parent = this.layers.find(layer => layer.index === parentIndex)
                }
            })
        }

        if (data.timeRemapping) {
            this.timeRemapping = data.timeRemapping.length > 1 ? new AnimatedProperty(data.timeRemapping) : new Property(data.timeRemapping)
        }
    }

    draw(ctx, time) {
        super.draw(ctx, time)

        if (this.layers) {
            let internalTime = time - this.in
            if (this.timeRemapping) internalTime = this.timeRemapping.getValue(internalTime)
            this.layers.forEach(layer => {
                if (internalTime >= layer.in && internalTime <= layer.out) {
                    layer.draw(ctx, internalTime)
                }
            })
        }

        ctx.restore()
    }

    setParentTransform(ctx, time) {
        super.setParentTransform(ctx, time)
        const internalTime = time - this.in
        if (this.layers) this.layers.forEach(layer => layer.setParentTransform(ctx, internalTime))
    }

    setKeyframes(time) {
        super.setKeyframes(time)
        const internalTime = time - this.in
        if (this.timeRemapping) this.timeRemapping.setKeyframes(internalTime)
        if (this.layers) this.layers.forEach(layer => layer.setKeyframes(internalTime))
    }

    reset(reversed) {
        super.reset(reversed)
        if (this.timeRemapping) this.timeRemapping.reset(reversed)
        if (this.layers) this.layers.forEach(layer => layer.reset(reversed))
    }
}

export default CompLayer

























