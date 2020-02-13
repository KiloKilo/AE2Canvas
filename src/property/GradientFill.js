import Property from './Property'
import AnimatedProperty from './AnimatedProperty'

class GradientFill {
	constructor(data, gradients) {
		if (!gradients[data.name]) gradients[data.name] = []
		gradients[data.name].push(this)

		this.stops = data.stops
		this.type = data.type
		this.startPoint =
			data.startPoint.length > 1 ? new AnimatedProperty(data.startPoint) : new Property(data.startPoint)
		this.endPoint = data.endPoint.length > 1 ? new AnimatedProperty(data.endPoint) : new Property(data.endPoint)
		if (data.opacity)
			this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity)
	}

	update(ctx, time) {
		const startPoint = this.startPoint.getValue(time)
		const endPoint = this.endPoint.getValue(time)
		let radius = 0

		if (this.type === 'radial') {
			const distX = startPoint[0] - endPoint[0]
			const distY = startPoint[1] - endPoint[1]
			radius = Math.sqrt(distX * distX + distY * distY)
		}

		const gradient =
			this.type === 'radial'
				? ctx.createRadialGradient(startPoint[0], startPoint[1], 0, startPoint[0], startPoint[1], radius)
				: ctx.createLinearGradient(startPoint[0], startPoint[1], endPoint[0], endPoint[1])

		const opacity = this.opacity ? this.opacity.getValue(time) : 1

		for (const stop of this.stops) {
			const color = stop.color
			gradient.addColorStop(stop.location, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] * opacity})`)
		}

		ctx.fillStyle = gradient
	}

	setKeyframes(time) {
		if (this.opacity) this.opacity.setKeyframes(time)
		this.startPoint.setKeyframes(time)
		this.endPoint.setKeyframes(time)
	}

	reset(reversed) {
		if (this.opacity) this.opacity.setKeyframes(reversed)
		this.startPoint.setKeyframes(reversed)
		this.endPoint.setKeyframes(reversed)
	}
}

export default GradientFill
