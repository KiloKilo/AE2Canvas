import Property from '../property/Property'
import AnimatedProperty from '../property/AnimatedProperty'

type DropShadowProps = {
	color: []
	opacity: []
	direction: []
	distance: []
	softness: []
}

class DropShadow {
	private color: Property<[number, number, number]>
	private opacity: Property<number>
	private direction: Property<number>
	private distance: Property<number>
	private softness: Property<number>

	constructor(data: DropShadowProps) {
		this.color = data.color.length > 1 ? new AnimatedProperty(data.color) : new Property(data.color)
		this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity)
		this.direction = data.direction.length > 1 ? new AnimatedProperty(data.direction) : new Property(data.direction)
		this.distance = data.distance.length > 1 ? new AnimatedProperty(data.distance) : new Property(data.distance)
		this.softness = data.softness.length > 1 ? new AnimatedProperty(data.softness) : new Property(data.softness)
	}

	getColor(time: number) {
		const color = this.color.getValue(time)
		const opacity = this.opacity.getValue(time)
		return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${opacity})`
	}

	setShadow(ctx: CanvasRenderingContext2D, time: number) {
		const color = this.getColor(time)
		const dist = this.distance.getValue(time)
		const blur = this.softness.getValue(time)
		ctx.shadowColor = color
		ctx.shadowOffsetX = dist
		ctx.shadowOffsetY = dist
		ctx.shadowBlur = blur
	}

	setKeyframes(time: number) {
		this.color.setKeyframes(time)
		this.opacity.setKeyframes(time)
		this.direction.setKeyframes(time)
		this.distance.setKeyframes(time)
		this.softness.setKeyframes(time)
	}

	reset(reversed: boolean) {
		this.color.reset(reversed)
		this.opacity.reset(reversed)
		this.direction.reset(reversed)
		this.distance.reset(reversed)
		this.softness.reset(reversed)
	}
}

export default DropShadow
