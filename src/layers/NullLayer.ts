import BaseLayer from './BaseLayer'

class NullLayer extends BaseLayer {
	draw(ctx: CanvasRenderingContext2D, time: number) {
		super.draw(ctx, time)
		ctx.restore()
	}
}

export default NullLayer
