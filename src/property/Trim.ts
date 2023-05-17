import Property from './Property'
import AnimatedProperty from './AnimatedProperty'

export type TrimProps = {
	type: string
	start: []
	end: []
	offset: []
}

export type TrimValues = { start: number; end: number } | null

class Trim {
	private type: string
	private readonly start?: Property<number>
	private readonly end?: Property<number>
	private readonly offset?: Property<number>

	constructor(data: TrimProps) {
		this.type = data.type

		if (data.start) this.start = data.start.length > 1 ? new AnimatedProperty(data.start) : new Property(data.start)
		if (data.end) this.end = data.end.length > 1 ? new AnimatedProperty(data.end) : new Property(data.end)
		if (data.offset)
			this.offset = data.offset.length > 1 ? new AnimatedProperty(data.offset) : new Property(data.offset)
	}

	getTrim(time: number): TrimValues {
		const startValue = this.start ? this.start.getValue(time) : 0
		const endValue = this.end ? this.end.getValue(time) : 1

		let start = Math.min(startValue, endValue)
		let end = Math.max(startValue, endValue)

		if (this.offset) {
			const offset = this.offset.getValue(time) % 1
			if ((offset > 0 && offset < 1) || (offset > -1 && offset < 0)) {
				start += offset
				end += offset
				start = start > 1 ? start - 1 : start
				start = start < 0 ? 1 + start : start
				end = end > 1 ? end - 1 : end
				end = end < 0 ? 1 + end : end
			}
		}

		if (start === 0 && end === 1) {
			return null
		} else {
			return { start, end }
		}
	}

	setKeyframes(time: number) {
		if (this.start) this.start.setKeyframes(time)
		if (this.end) this.end.setKeyframes(time)
		if (this.offset) this.offset.setKeyframes(time)
	}

	reset(reversed: boolean) {
		if (this.start) this.start.reset(reversed)
		if (this.end) this.end.reset(reversed)
		if (this.offset) this.offset.reset(reversed)
	}
}

export default Trim
