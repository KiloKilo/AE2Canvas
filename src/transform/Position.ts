import Bezier from '../utils/Bezier'
import AnimatedProperty from '../property/AnimatedProperty'

class Position extends AnimatedProperty<[number, number]> {
	private motionpath?: Bezier | null

	onKeyframeChange() {
		this.setEasing()
		this.setMotionPath()
	}

	getValueAtTime(time: number): [number, number] {
		if (this.motionpath) {
			return this.motionpath.getValues(this.getElapsed(time))
		} else {
			return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time))
		}
	}

	setMotionPath() {
		if (this.lastFrame.motionpath) {
			this.motionpath = new Bezier(this.lastFrame.motionpath)
			// @ts-ignore
			// TODO fix
			this.motionpath.getLength(this.lastFrame.len)
		} else {
			this.motionpath = null
		}
	}
}

export default Position
