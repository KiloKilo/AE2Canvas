import Animation from './Animation'

const _animations: Animation[] = []
let _animationsLength = 0

let _autoPlay = false
let _rafId: number

const update = (time: number) => {
	if (_autoPlay) {
		_rafId = requestAnimationFrame(update)
	}
	time = time !== undefined ? time : performance.now()

	for (let i = 0; i < _animationsLength; i++) {
		_animations[i].update(time)
	}
}

const autoPlay = (auto: boolean) => {
	_autoPlay = auto
	_autoPlay ? (_rafId = requestAnimationFrame(update)) : cancelAnimationFrame(_rafId)
}

function add(tween: any) {
	_animations.push(tween)
	_animationsLength = _animations.length
}

function remove(tween: any) {
	const i = _animations.indexOf(tween)
	if (i > -1) {
		_animations.splice(i, 1)
		_animationsLength = _animations.length
	}
}

export { update, autoPlay, add, remove }
