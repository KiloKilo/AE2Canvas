import Bezier from '../utils/Bezier'
import AnimatedProperty from '../property/AnimatedProperty'

class Position extends AnimatedProperty {
	onKeyframeChange() {
		this.setEasing()
		this.setMotionPath()
	}

	getValueAtTime(time) {
		if (this.motionpath) {
			return this.motionpath.getValues(this.getElapsed(time))
		} else {
			return this.lerp(this.lastFrame.v, this.nextFrame.v, this.getElapsed(time))
		}
	}

	setMotionPath() {
		if (this.lastFrame.motionpath) {
			this.motionpath = new Bezier(this.lastFrame.motionpath)
			this.motionpath.getLength(this.lastFrame.len)
		} else {
			this.motionpath = null
		}
	}
}

export default Position
