class BlendingMode {
	constructor(type) {
		this.type = type.toLowerCase().replace('_', '-')
	}

	setCompositeOperation(ctx) {
		ctx.globalCompositeOperation = this.type
	}
}

export default BlendingMode
