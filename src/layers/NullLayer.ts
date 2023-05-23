import BaseLayer from './BaseLayer'

class NullLayer extends BaseLayer {
	draw(ctx: CanvasRenderingContext2D, time: number, scale: number) {
		super.draw(ctx, time, scale)
		ctx.restore()
	}
}

export default NullLayer
