import Path, { type PathProps, Vertex } from './Path'
import BezierEasing from '../utils/BezierEasing'
import { Frame } from '../property/Property'

class AnimatedPath extends Path {
	private frameCount: number

	private nextFrame: Frame<Vertex[]>
	private lastFrame: Frame<Vertex[]>
	private easing?: any | null
	private finished = false
	private started = false
	private pointer = 0
	private verticesCount: number

	constructor(data: PathProps) {
		super(data)
		this.frameCount = this.frames.length
		this.verticesCount = this.frames[0].v?.length

		//todo check
		this.nextFrame = this.frames[1]
		this.lastFrame = this.frames[0]
	}

	getValue(time: number): Omit<Frame<Vertex[]>, 't'> {
		if (this.finished && time >= this.nextFrame.t) {
			return this.nextFrame
		} else if (!this.started && time <= this.lastFrame.t) {
			return this.lastFrame
		} else {
			this.started = true
			this.finished = false
			if (time > this.nextFrame.t) {
				if (this.pointer + 1 === this.frameCount) {
					this.finished = true
				} else {
					this.pointer++
					this.lastFrame = this.frames[this.pointer - 1]
					this.nextFrame = this.frames[this.pointer]
					this.onKeyframeChange()
				}
			} else if (time < this.lastFrame.t) {
				if (this.pointer < 2) {
					this.started = false
				} else {
					this.pointer--
					this.lastFrame = this.frames[this.pointer - 1]
					this.nextFrame = this.frames[this.pointer]
					this.onKeyframeChange()
				}
			}
			return this.getValueAtTime(time)
		}
	}

	setKeyframes(time: number) {
		if (time < this.frames[0].t) {
			this.pointer = 1
			this.nextFrame = this.frames[this.pointer]
			this.lastFrame = this.frames[this.pointer - 1]
			this.onKeyframeChange()
			return
		}

		if (time > this.frames[this.frameCount - 1].t) {
			this.pointer = this.frameCount - 1
			this.nextFrame = this.frames[this.pointer]
			this.lastFrame = this.frames[this.pointer - 1]
			this.onKeyframeChange()
			return
		}

		for (let i = 1; i < this.frameCount; i++) {
			if (time >= this.frames[i - 1].t && time <= this.frames[i].t) {
				this.pointer = i
				this.lastFrame = this.frames[i - 1]
				this.nextFrame = this.frames[i]
				this.onKeyframeChange()
				return
			}
		}
	}

	onKeyframeChange() {
		this.setEasing()
	}

	lerp(a: number, b: number, t: number) {
		return a + t * (b - a)
	}

	setEasing() {
		if (this.lastFrame.easeOut && this.nextFrame.easeIn) {
			this.easing = new (BezierEasing as any)(
				this.lastFrame.easeOut[0],
				this.lastFrame.easeOut[1],
				this.nextFrame.easeIn[0],
				this.nextFrame.easeIn[1]
			)
		} else {
			this.easing = null
		}
	}

	getValueAtTime(time: number): Omit<Frame<Vertex[]>, 't'> {
		const delta = time - this.lastFrame.t
		const duration = this.nextFrame.t - this.lastFrame.t
		let elapsed = delta / duration
		if (elapsed > 1) elapsed = 1
		else if (elapsed < 0) elapsed = 0
		else if (this.easing) elapsed = this.easing(elapsed)
		const actualVertices: Vertex[] = []
		const actualLengths = []

		for (let i = 0; i < this.verticesCount; i++) {
			const cp1x = this.lerp(this.lastFrame.v[i][0], this.nextFrame.v[i][0], elapsed)
			const cp1y = this.lerp(this.lastFrame.v[i][1], this.nextFrame.v[i][1], elapsed)
			const cp2x = this.lerp(this.lastFrame.v[i][2], this.nextFrame.v[i][2], elapsed)
			const cp2y = this.lerp(this.lastFrame.v[i][3], this.nextFrame.v[i][3], elapsed)
			const x = this.lerp(this.lastFrame.v[i][4], this.nextFrame.v[i][4], elapsed)
			const y = this.lerp(this.lastFrame.v[i][5], this.nextFrame.v[i][5], elapsed)

			actualVertices.push([cp1x, cp1y, cp2x, cp2y, x, y])
		}

		for (let j = 0; j < this.verticesCount - 1; j++) {
			actualLengths.push(this.lerp(this.lastFrame.len[j], this.nextFrame.len[j], elapsed))
		}

		return {
			v: actualVertices,
			len: actualLengths,
		}
	}

	reset(reversed: boolean) {
		this.finished = false
		this.started = false
		this.pointer = reversed ? this.frameCount - 1 : 1
		this.nextFrame = this.frames[this.pointer]
		this.lastFrame = this.frames[this.pointer - 1]
		this.onKeyframeChange()
	}
}

export default AnimatedPath
