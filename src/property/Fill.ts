import Property from './Property'
import AnimatedProperty from './AnimatedProperty'

export type FillProps = {
	color: []
	opacity: []
}

class Fill {
	private readonly color: Property<[number, number, number]>
	private readonly opacity?: Property<number>

	constructor(data: FillProps) {
		this.color = data.color.length > 1 ? new AnimatedProperty(data.color) : new Property(data.color)
		if (data.opacity)
			this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity)
	}

	getValue(time: number) {
		const color = this.color.getValue(time)
		const opacity = this.opacity ? this.opacity.getValue(time) : 1
		return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${opacity})`
	}

	update(ctx: CanvasRenderingContext2D, time: number) {
		ctx.fillStyle = this.getValue(time)
	}

	setKeyframes(time: number) {
		this.color.setKeyframes(time)
		if (this.opacity) this.opacity.setKeyframes(time)
	}

	reset(reversed: boolean) {
		this.color.reset(reversed)
		if (this.opacity) this.opacity.reset(reversed)
	}
}

export default Fill
