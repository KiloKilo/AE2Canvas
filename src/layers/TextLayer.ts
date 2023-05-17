import BaseLayer from './BaseLayer'
import { BaseLayerProps } from './BaseLayer'

class TextLayer extends BaseLayer {
	private readonly text: string
	private readonly leading: number
	private readonly fontSize: number
	private readonly font: string
	private readonly color: string
	private readonly justification: CanvasTextAlign
	private readonly baseFont?: string

	constructor(data: BaseLayerProps, baseFont?: string) {
		super(data)
		this.text = data.text
		this.leading = data.leading
		this.fontSize = data.fontSize
		this.font = data.font
		this.color = data.color
		this.justification = data.justification
		this.baseFont = baseFont
	}

	draw(ctx: CanvasRenderingContext2D, time: number) {
		super.draw(ctx, time)

		ctx.textAlign = this.justification
		ctx.font = `${this.fontSize}px ${this.baseFont || this.font}`
		ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`
		for (let j = 0; j < this.text.length; j++) {
			ctx.fillText(this.text[j], 0, j * this.leading)
		}

		ctx.restore()
	}
}

export default TextLayer
