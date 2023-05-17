import Property from '../property/Property'
import AnimatedProperty from '../property/AnimatedProperty'
import { PathProps } from './Path'

class Polystar {
	private readonly starType: number
	private readonly points: Property<number>
	private readonly innerRadius: Property<number>
	private readonly outerRadius: Property<number>
	private readonly position?: Property<[number, number]>
	private readonly rotation?: Property<number>
	private readonly innerRoundness?: Property<number>
	private readonly outerRoundness?: Property<number>

	public readonly closed = true // TODO ??

	constructor(data: PathProps) {
		this.starType = data.starType
		this.points = data.points.length > 1 ? new AnimatedProperty(data.points) : new Property(data.points)

		this.innerRadius =
			data.innerRadius.length > 1 ? new AnimatedProperty(data.innerRadius) : new Property(data.innerRadius)
		this.outerRadius =
			data.outerRadius.length > 1 ? new AnimatedProperty(data.outerRadius) : new Property(data.outerRadius)

		if (data.position) {
			this.position = data.position.length > 1 ? new AnimatedProperty(data.position) : new Property(data.position)
		}
		if (data.rotation) {
			this.rotation = data.rotation.length > 1 ? new AnimatedProperty(data.rotation) : new Property(data.rotation)
		}
		if (data.innerRoundness) {
			this.innerRoundness =
				data.innerRoundness.length > 1
					? new AnimatedProperty(data.innerRoundness)
					: new Property(data.innerRoundness)
		}
		if (data.outerRoundness) {
			this.outerRoundness =
				data.outerRoundness.length > 1
					? new AnimatedProperty(data.outerRoundness)
					: new Property(data.outerRoundness)
		}
	}

	draw(ctx: CanvasRenderingContext2D, time: number) {
		//todo add trim

		const points = this.points.getValue(time)
		const innerRadius = this.innerRadius.getValue(time)
		const outerRadius = this.outerRadius.getValue(time)
		const position = this.position ? this.position.getValue(time) : [0, 0]
		let rotation = this.rotation ? this.rotation.getValue(time) : 0
		const innerRoundness = this.innerRoundness ? this.innerRoundness.getValue(time) : 0
		const outerRoundness = this.outerRoundness ? this.outerRoundness.getValue(time) : 0

		rotation = this.deg2rad(rotation)
		const start = this.rotatePoint(0, 0, 0, 0 - outerRadius, rotation)

		ctx.save()
		ctx.beginPath()
		ctx.translate(position[0], position[1])
		ctx.moveTo(start[0], start[1])

		for (let i = 0; i < points; i++) {
			let pInner
			let pOuter
			let pOuter1Tangent
			let pOuter2Tangent
			let pInner1Tangent
			let pInner2Tangent
			let outerOffset
			let innerOffset
			let rot

			rot = (Math.PI / points) * 2

			pInner = this.rotatePoint(0, 0, 0, 0 - innerRadius, rot * (i + 1) - rot / 2 + rotation)
			pOuter = this.rotatePoint(0, 0, 0, 0 - outerRadius, rot * (i + 1) + rotation)

			//FIxME
			if (!outerOffset) outerOffset = (((start[0] + pInner[0]) * outerRoundness) / 100) * 0.5522848
			if (!innerOffset) innerOffset = (((start[0] + pInner[0]) * innerRoundness) / 100) * 0.5522848

			pOuter1Tangent = this.rotatePoint(0, 0, outerOffset, 0 - outerRadius, rot * i + rotation)
			pInner1Tangent = this.rotatePoint(
				0,
				0,
				innerOffset * -1,
				0 - innerRadius,
				rot * (i + 1) - rot / 2 + rotation
			)
			pInner2Tangent = this.rotatePoint(0, 0, innerOffset, 0 - innerRadius, rot * (i + 1) - rot / 2 + rotation)
			pOuter2Tangent = this.rotatePoint(0, 0, outerOffset * -1, 0 - outerRadius, rot * (i + 1) + rotation)

			if (this.starType === 1) {
				//star
				ctx.bezierCurveTo(
					pOuter1Tangent[0],
					pOuter1Tangent[1],
					pInner1Tangent[0],
					pInner1Tangent[1],
					pInner[0],
					pInner[1]
				)
				ctx.bezierCurveTo(
					pInner2Tangent[0],
					pInner2Tangent[1],
					pOuter2Tangent[0],
					pOuter2Tangent[1],
					pOuter[0],
					pOuter[1]
				)
			} else {
				//polygon
				ctx.bezierCurveTo(
					pOuter1Tangent[0],
					pOuter1Tangent[1],
					pOuter2Tangent[0],
					pOuter2Tangent[1],
					pOuter[0],
					pOuter[1]
				)
			}

			//debug
			//ctx.fillStyle = "black";
			//ctx.fillRect(pInner[0], pInner[1], 5, 5);
			//ctx.fillRect(pOuter[0], pOuter[1], 5, 5);
			//ctx.fillStyle = "blue";
			//ctx.fillRect(pOuter1Tangent[0], pOuter1Tangent[1], 5, 5);
			//ctx.fillStyle = "red";
			//ctx.fillRect(pInner1Tangent[0], pInner1Tangent[1], 5, 5);
			//ctx.fillStyle = "green";
			//ctx.fillRect(pInner2Tangent[0], pInner2Tangent[1], 5, 5);
			//ctx.fillStyle = "brown";
			//ctx.fillRect(pOuter2Tangent[0], pOuter2Tangent[1], 5, 5);
		}

		ctx.restore()
	}

	rotatePoint(cx: number, cy: number, x: number, y: number, radians: number) {
		const cos = Math.cos(radians)
		const sin = Math.sin(radians)
		const nx = cos * (x - cx) - sin * (y - cy) + cx
		const ny = sin * (x - cx) + cos * (y - cy) + cy
		return [nx, ny]
	}

	deg2rad(deg: number) {
		return deg * (Math.PI / 180)
	}

	setKeyframes(time: number) {
		this.points.setKeyframes(time)
		this.innerRadius.setKeyframes(time)
		this.outerRadius.setKeyframes(time)
		if (this.position) this.position.setKeyframes(time)
		if (this.rotation) this.rotation.setKeyframes(time)
		if (this.innerRoundness) this.innerRoundness.setKeyframes(time)
		if (this.outerRoundness) this.outerRoundness.setKeyframes(time)
	}

	reset(reversed: boolean) {
		this.points.reset(reversed)
		this.innerRadius.reset(reversed)
		this.outerRadius.reset(reversed)
		if (this.position) this.position.reset(reversed)
		if (this.rotation) this.rotation.reset(reversed)
		if (this.innerRoundness) this.innerRoundness.reset(reversed)
		if (this.outerRoundness) this.outerRoundness.reset(reversed)
	}
}

export default Polystar
