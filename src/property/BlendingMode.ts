class BlendingMode {
	private type: GlobalCompositeOperation

	constructor(type: string) {
		this.type = type.toLowerCase().replace('_', '-') as GlobalCompositeOperation
	}

	setCompositeOperation(ctx: CanvasRenderingContext2D) {
		ctx.globalCompositeOperation = this.type
	}
}

export default BlendingMode
