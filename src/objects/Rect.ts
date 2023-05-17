import Property from '../property/Property'
import AnimatedProperty from '../property/AnimatedProperty'
import { TrimValues } from '../property/Trim'

type Options = {
	size: []
	roundness?: []
	position?: []
}

class Rect {
	private readonly size: Property<[number, number]>
	private readonly position?: Property<[number, number]>
	private readonly roundness?: Property<number>

	public readonly closed = true

	constructor(data: Options) {
		this.size = data.size.length > 1 ? new AnimatedProperty(data.size) : new Property(data.size)

		if (data.position) {
			this.position = data.position.length > 1 ? new AnimatedProperty(data.position) : new Property(data.position)
		}

		if (data.roundness) {
			this.roundness =
				data.roundness.length > 1 ? new AnimatedProperty(data.roundness) : new Property(data.roundness)
		}
	}

	draw(ctx: CanvasRenderingContext2D, time: number, trim: TrimValues) {
		const size = this.size.getValue(time)
		const position = this.position ? this.position.getValue(time) : [0, 0]
		let roundness = this.roundness ? this.roundness.getValue(time) : 0

		if (size[0] < 2 * roundness) roundness = size[0] / 2
		if (size[1] < 2 * roundness) roundness = size[1] / 2

		const x = position[0] - size[0] / 2
		const y = position[1] - size[1] / 2

		if (trim) {
			// let tv;
			// trim = this.getTrimValues(trim);
			//TODO add trim
		} else {
			ctx.moveTo(x + roundness, y)
			ctx.arcTo(x + size[0], y, x + size[0], y + size[1], roundness)
			ctx.arcTo(x + size[0], y + size[1], x, y + size[1], roundness)
			ctx.arcTo(x, y + size[1], x, y, roundness)
			ctx.arcTo(x, y, x + size[0], y, roundness)
		}
	}

	setKeyframes(time: number) {
		this.size.setKeyframes(time)
		if (this.position) this.position.setKeyframes(time)
		if (this.roundness) this.roundness.setKeyframes(time)
	}

	reset(reversed: boolean) {
		this.size.reset(reversed)
		if (this.position) this.position.reset(reversed)
		if (this.roundness) this.roundness.reset(reversed)
	}
}

export default Rect
