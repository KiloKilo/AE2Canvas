import Stroke, { StrokeProps } from '../property/Stroke'
import Path, { PathProps } from './Path'
import Rect from './Rect'
import Ellipse from './Ellipse'
import Polystar from './Polystar'
import AnimatedPath from './AnimatedPath'
import Fill, { FillProps } from '../property/Fill'
import GradientFill, { GradientFillProps } from '../property/GradientFill'
import Transform, { TransformProps } from '../transform/Transform'
import Trim, { TrimProps, TrimValues } from '../property/Trim'
import { Gradients } from '../Animation'

type GroupProps = {
	transform: TransformProps
	shapes: PathProps[]
	groups: GroupProps[]
	trim: TrimProps
	stroke: StrokeProps
	gradientFill: GradientFillProps
	fill: FillProps
	index: number
}

class Group {
	private index: number
	private fill?: Fill | GradientFill
	private stroke?: Stroke
	private trim?: Trim
	private groups?: Group[]
	private shapes?: (Path | Rect | Ellipse | Polystar)[]
	private transform: Transform

	constructor(data: GroupProps, gradients: Gradients) {
		this.index = data.index

		if (data.fill) this.fill = new Fill(data.fill)
		if (data.gradientFill) this.fill = new GradientFill(data.gradientFill, gradients)
		if (data.stroke) this.stroke = new Stroke(data.stroke)
		if (data.trim) this.trim = new Trim(data.trim)

		this.transform = new Transform(data.transform)

		if (data.groups) {
			this.groups = data.groups.map((group) => new Group(group, gradients))
		}

		if (data.shapes) {
			this.shapes = data.shapes
				.map((shape) => {
					if (shape.type === 'path') {
						return shape.isAnimated ? new AnimatedPath(shape) : new Path(shape)
					} else if (shape.type === 'rect') {
						return new Rect(shape)
					} else if (shape.type === 'ellipse') {
						return new Ellipse(shape)
					} else if (shape.type === 'polystar') {
						return new Polystar(shape)
					}
				})
				.filter(Boolean) as (Path | Rect | Ellipse | Polystar)[]
		}
	}

	draw(
		ctx: CanvasRenderingContext2D,
		time: number,
		parentFill: Fill | GradientFill,
		parentStroke: Stroke,
		parentTrim: TrimValues
	) {
		ctx.save()

		//TODO check if color/stroke is changing over time
		const fill = this.fill || parentFill
		const stroke = this.stroke || parentStroke
		const trimValues = this.trim ? this.trim.getTrim(time) : parentTrim

		if (fill) fill.update(ctx, time)
		if (stroke) stroke.update(ctx, time)

		this.transform.update(ctx, time)

		ctx.beginPath()
		if (this.shapes) {
			this.shapes.forEach((shape) => shape.draw(ctx, time, trimValues))
			if (this.shapes[this.shapes.length - 1].closed) {
				// ctx.closePath();
			}
		}

		//TODO get order
		if (fill) ctx.fill()
		if (stroke) ctx.stroke()

		if (this.groups) this.groups.forEach((group) => group.draw(ctx, time, fill, stroke, trimValues))

		ctx.restore()
	}

	setKeyframes(time: number) {
		this.transform.setKeyframes(time)

		if (this.shapes) this.shapes.forEach((shape) => shape.setKeyframes(time))
		if (this.groups) this.groups.forEach((group) => group.setKeyframes(time))

		if (this.fill) this.fill.setKeyframes(time)
		if (this.stroke) this.stroke.setKeyframes(time)
		if (this.trim) this.trim.setKeyframes(time)
	}

	reset(reversed: boolean) {
		this.transform.reset(reversed)

		if (this.shapes) this.shapes.forEach((shape) => shape.reset(reversed))
		if (this.groups) this.groups.forEach((group) => group.reset(reversed))

		if (this.fill) this.fill.reset(reversed)
		if (this.stroke) this.stroke.reset(reversed)
		if (this.trim) this.trim.reset(reversed)
	}
}

export default Group
