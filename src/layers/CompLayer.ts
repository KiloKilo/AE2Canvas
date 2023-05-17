import ImageLayer from './ImageLayer'
import NullLayer from './NullLayer'
import TextLayer from './TextLayer'
import BaseLayer, { BaseLayerProps } from './BaseLayer'
import VectorLayer from './VectorLayer'
import Property from '../property/Property'
import AnimatedProperty from '../property/AnimatedProperty'
import { Gradients } from '../Animation'

class CompLayer extends BaseLayer {
	public readonly type = 'comp'

	constructor(
		data: BaseLayerProps,
		comps: { [key: string]: BaseLayerProps },
		baseFont: string | undefined,
		gradients: Gradients,
		imageBasePath: string
	) {
		super(data)

		const sourceID = data.sourceID
		const layers = comps && comps[sourceID] ? comps[sourceID].layers : null

		if (layers) {
			this.layers = layers
				.map((layer) => {
					switch (layer.type) {
						case 'vector':
							return new VectorLayer(layer, gradients)
						case 'image':
							return new ImageLayer(layer, imageBasePath)
						case 'text':
							return new TextLayer(layer, baseFont)
						case 'comp':
							return new CompLayer(layer, comps, baseFont, gradients, imageBasePath)
						case 'null':
							return new NullLayer(layer)
					}
				})
				.filter(Boolean) as BaseLayer[]

			this.layers.forEach((layer) => {
				if (layer.parent) {
					const parentIndex = layer.parent.index
					layer.parent = this.layers.find((layer) => layer.index === parentIndex)
				}
			})
		}

		if (data.timeRemapping) {
			this.timeRemapping =
				data.timeRemapping.length > 1
					? new AnimatedProperty(data.timeRemapping)
					: new Property(data.timeRemapping)
		}
	}

	draw(ctx: CanvasRenderingContext2D, time: number) {
		super.draw(ctx, time)

		if (this.layers) {
			let internalTime = time - this.in
			if (this.timeRemapping) internalTime = this.timeRemapping.getValue(internalTime)
			this.layers.forEach((layer) => {
				if (internalTime >= layer.in && internalTime <= layer.out) {
					layer.draw(ctx, internalTime)
				}
			})
		}

		ctx.restore()
	}

	setParentTransform(ctx: CanvasRenderingContext2D, time: number) {
		super.setParentTransform(ctx, time)
		const internalTime = time - this.in
		if (this.layers) this.layers.forEach((layer) => layer.setParentTransform(ctx, internalTime))
	}

	setKeyframes(time: number) {
		super.setKeyframes(time)
		const internalTime = time - this.in
		if (this.timeRemapping) this.timeRemapping.setKeyframes(internalTime)
		if (this.layers) this.layers.forEach((layer) => layer.setKeyframes(internalTime))
	}

	reset(reversed: boolean) {
		super.reset(reversed)
		if (this.timeRemapping) this.timeRemapping.reset(reversed)
		if (this.layers) this.layers.forEach((layer) => layer.reset(reversed))
	}
}

export default CompLayer
