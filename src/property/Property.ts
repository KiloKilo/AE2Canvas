export interface Frame<T> {
	easeIn?: [number, number]
	easeOut?: [number, number]
	t: number
	v: T
	len: number[]
	motionpath?: [number, number, number, number, number, number, number, number]
}

class Property<T> {
	public frames: Frame<T>[]

	constructor(data: Frame<T>[]) {
		this.frames = data
	}

	getValue(time: number): T {
		return this.frames[0].v
	}

	setKeyframes(time: number) {}

	reset(reversed: boolean) {}
}

export default Property
