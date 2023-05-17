import BaseLayer from './BaseLayer'
import { BaseLayerProps } from './BaseLayer'

class ImageLayer extends BaseLayer {
	private readonly source: string
	private isLoaded = false
	private img?: HTMLImageElement

	constructor(data: BaseLayerProps, imageBasePath: string) {
		super(data)
		this.source = `${imageBasePath}${data.source}`
	}

	preload() {
		return new Promise<void>((resolve) => {
			this.img = new Image()
			this.img.onload = () => {
				this.isLoaded = true
				resolve()
			}
			this.img.src = this.source
		})
	}

	draw(ctx: CanvasRenderingContext2D, time: number) {
		super.draw(ctx, time)

		if (this.img) {
			ctx.drawImage(this.img, 0, 0)
		}

		ctx.restore()
	}
}

export default ImageLayer
