import BaseLayer from './BaseLayer'

class NullLayer extends BaseLayer {
	constructor(data) {
		super(data)
	}

	draw(ctx, time) {
		super.draw(ctx, time)
		ctx.restore()
	}
}

export default NullLayer
