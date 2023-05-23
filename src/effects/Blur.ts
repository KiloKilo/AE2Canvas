import Property from '../property/Property'
import AnimatedProperty from '../property/AnimatedProperty'

type FastBoxBlurProps = {
	radius: []
}

class Blur {
	private radius: Property<number>

	constructor(data: FastBoxBlurProps) {
		this.radius = data.radius.length > 1 ? new AnimatedProperty(data.radius) : new Property(data.radius)
	}

	setBlur(ctx: CanvasRenderingContext2D, time: number, scale: number) {
		const blur = this.radius.getValue(time) * scale
		ctx.filter = `blur(${blur}px)`
	}

	setKeyframes(time: number) {
		this.radius.setKeyframes(time)
	}

	reset(reversed: boolean) {
		this.radius.reset(reversed)
	}
}

export default Blur
