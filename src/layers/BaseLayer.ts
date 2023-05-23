import Path, { PathProps } from '../objects/Path'
import AnimatedPath from '../objects/AnimatedPath'
import Transform, { TransformProps } from '../transform/Transform'
import DropShadow from '../effects/DropShadow'
import BlendingMode from '../property/BlendingMode'
import Fill, { FillProps } from '../property/Fill'
import GradientFill, { GradientFillProps } from '../property/GradientFill'
import Stroke, { StrokeProps } from '../property/Stroke'
import { TrimProps, TrimValues } from '../property/Trim'
import Blur from '../effects/Blur'

export type BaseLayerProps = {
	shapes: PathProps[]
	groups: []
	trim: TrimProps
	stroke: StrokeProps
	gradientFill: GradientFillProps
	fill: FillProps
	type: LayerType
	justification: CanvasTextAlign
	color: string
	font: string
	fontSize: number
	leading: number
	text: string
	timeRemapping: []
	source: string
	sourceID: string
	name: string
	index: number
	in?: number
	out: number
	transform: TransformProps
	parent?: any
	blendMode?: string
	masks: PathProps[]
	effects?: {
		blur: { radius: [] }
		dropShadow?: any
	}
	layers?: BaseLayerProps[]
}

export type LayerType = 'base' | 'vector' | 'image' | 'text' | 'comp' | 'null'

class BaseLayer {
	private readonly blendMode?: BlendingMode
	private readonly dropShadow?: DropShadow
	private readonly blur?: Blur
	private readonly masks?: (AnimatedPath | Path)[]

	public type: LayerType = 'base'
	public name: string

	public index: number
	public in: number
	public out: number
	public transform: Transform

	public timeRemapping?: any
	public layers: BaseLayer[] = []
	public parent?: BaseLayer

	constructor(data: BaseLayerProps) {
		this.name = data.name
		this.index = data.index
		this.in = data.in || 0
		this.out = data.out
		if (data.parent) this.parent = data.parent
		if (data.blendMode) this.blendMode = new BlendingMode(data.blendMode)
		this.transform = new Transform(data.transform)

		if (data.effects?.dropShadow) {
			this.dropShadow = new DropShadow(data.effects.dropShadow)
		}
		if (data.effects?.blur) {
			this.blur = new Blur(data.effects.blur)
		}

		if (data.masks) {
			this.masks = data.masks.map((mask) => (mask.isAnimated ? new AnimatedPath(mask) : new Path(mask)))
		}
	}

	draw(
		ctx: CanvasRenderingContext2D,
		time: number,
		scale: number,
		parentFill?: Fill | GradientFill,
		parentStroke?: Stroke,
		parentTrim?: TrimValues
	) {
		ctx.save()

		if (this.parent) this.parent.setParentTransform(ctx, time)
		if (this.blendMode) this.blendMode.setCompositeOperation(ctx)

		this.transform.update(ctx, time)

		this.dropShadow?.setShadow(ctx, time)
		this.blur?.setBlur(ctx, time, scale)

		if (this.masks) {
			ctx.beginPath()
			this.masks.forEach((mask) => mask.draw(ctx, time))
			ctx.clip()
		}
	}

	setParentTransform(ctx: CanvasRenderingContext2D, time: number) {
		if (this.parent) this.parent.setParentTransform(ctx, time)
		this.transform.update(ctx, time)
	}

	setKeyframes(time: number) {
		this.transform.setKeyframes(time)
		if (this.masks) this.masks.forEach((mask) => mask.setKeyframes(time))
	}

	reset(reversed: boolean) {
		this.transform.reset(reversed)
		if (this.masks) this.masks.forEach((mask) => mask.reset(reversed))
	}
}

export default BaseLayer
