import Property from '../property/Property'
import AnimatedProperty from '../property/AnimatedProperty'
import Position from './Position'

class Transform {
	constructor(data) {
		if (data.position) {
			if (data.position.length > 1) {
				this.position = new Position(data.position)
			} else {
				this.position = new Property(data.position)
			}
		}

		if (data.positionX)
			this.positionX =
				data.positionX.length > 1 ? new AnimatedProperty(data.positionX) : new Property(data.positionX)
		if (data.positionY)
			this.positionY =
				data.positionY.length > 1 ? new AnimatedProperty(data.positionY) : new Property(data.positionY)
		if (data.anchor)
			this.anchor = data.anchor.length > 1 ? new AnimatedProperty(data.anchor) : new Property(data.anchor)
		if (data.scaleX)
			this.scaleX = data.scaleX.length > 1 ? new AnimatedProperty(data.scaleX) : new Property(data.scaleX)
		if (data.scaleY)
			this.scaleY = data.scaleY.length > 1 ? new AnimatedProperty(data.scaleY) : new Property(data.scaleY)
		if (data.skew) this.skew = data.skew.length > 1 ? new AnimatedProperty(data.skew) : new Property(data.skew)
		if (data.skewAxis)
			this.skewAxis = data.skewAxis.length > 1 ? new AnimatedProperty(data.skewAxis) : new Property(data.skewAxis)
		if (data.rotation)
			this.rotation = data.rotation.length > 1 ? new AnimatedProperty(data.rotation) : new Property(data.rotation)
		if (data.opacity)
			this.opacity = data.opacity.length > 1 ? new AnimatedProperty(data.opacity) : new Property(data.opacity)
	}

	update(ctx, time) {
		let positionX // FIXME wrong transparency if nested
		let positionY
		const anchor = this.anchor ? this.anchor.getValue(time) : [0, 0]
		const rotation = this.rotation ? this.deg2rad(this.rotation.getValue(time)) : 0
		const skew = this.skew ? this.deg2rad(this.skew.getValue(time)) : 0
		const skewAxis = this.skewAxis ? this.deg2rad(this.skewAxis.getValue(time)) : 0
		const scaleX = this.scaleX ? this.scaleX.getValue(time) : 1
		const scaleY = this.scaleY ? this.scaleY.getValue(time) : 1
		const opacity = this.opacity ? this.opacity.getValue(time) * ctx.globalAlpha : ctx.globalAlpha

		if (this.position) {
			const position = this.position.getValue(time, ctx)
			positionX = position[0]
			positionY = position[1]
		} else {
			positionX = this.positionX ? this.positionX.getValue(time) : 0
			positionY = this.positionY ? this.positionY.getValue(time) : 0
		}

		// console.log(ctx, positionX, positionY, anchor, rotation, skew, skewAxis, scaleX, scaleY, opacity);

		//order very very important :)
		ctx.transform(1, 0, 0, 1, positionX - anchor[0], positionY - anchor[1])
		this.setRotation(ctx, rotation, anchor[0], anchor[1])
		this.setSkew(ctx, skew, skewAxis, anchor[0], anchor[1])
		this.setScale(ctx, scaleX, scaleY, anchor[0], anchor[1])
		ctx.globalAlpha = opacity
	}

	setRotation(ctx, rad, x, y) {
		const c = Math.cos(rad)
		const s = Math.sin(rad)
		const dx = x - c * x + s * y
		const dy = y - s * x - c * y
		ctx.transform(c, s, -s, c, dx, dy)
	}

	setScale(ctx, sx, sy, x, y) {
		ctx.transform(sx, 0, 0, sy, -x * sx + x, -y * sy + y)
	}

	setSkew(ctx, skew, axis, x, y) {
		const t = Math.tan(-skew)
		this.setRotation(ctx, -axis, x, y)
		ctx.transform(1, 0, t, 1, -y * t, 0)
		this.setRotation(ctx, axis, x, y)
	}

	deg2rad(deg) {
		return deg * (Math.PI / 180)
	}

	setKeyframes(time) {
		if (this.anchor) this.anchor.setKeyframes(time)
		if (this.rotation) this.rotation.setKeyframes(time)
		if (this.skew) this.skew.setKeyframes(time)
		if (this.skewAxis) this.skewAxis.setKeyframes(time)
		if (this.position) this.position.setKeyframes(time)
		if (this.positionX) this.positionX.setKeyframes(time)
		if (this.positionY) this.positionY.setKeyframes(time)
		if (this.scaleX) this.scaleX.setKeyframes(time)
		if (this.scaleY) this.scaleY.setKeyframes(time)
		if (this.opacity) this.opacity.setKeyframes(time)
	}

	reset(reversed) {
		if (this.anchor) this.anchor.reset(reversed)
		if (this.rotation) this.rotation.reset(reversed)
		if (this.skew) this.skew.reset(reversed)
		if (this.skewAxis) this.skewAxis.reset(reversed)
		if (this.position) this.position.reset(reversed)
		if (this.positionX) this.positionX.reset(reversed)
		if (this.positionY) this.positionY.reset(reversed)
		if (this.scaleX) this.scaleX.reset(reversed)
		if (this.scaleY) this.scaleY.reset(reversed)
		if (this.opacity) this.opacity.reset(reversed)
	}
}

export default Transform
