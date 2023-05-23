import { add, remove } from './core'
import Emitter from 'tiny-emitter'
import ImageLayer from './layers/ImageLayer'
import NullLayer from './layers/NullLayer'
import TextLayer from './layers/TextLayer'
import CompLayer from './layers/CompLayer'
import VectorLayer from './layers/VectorLayer'
import GradientFill from './property/GradientFill'
import BaseLayer, { BaseLayerProps } from './layers/BaseLayer'

type Marker = {
	time: number
	stop: number
	comment: string
}

type AnimationProps = {
	reversed?: boolean
	canvas?: HTMLCanvasElement
	imageBasePath?: string
	fluid?: boolean
	devicePixelRatio?: number
	loop?: boolean
	baseFont?: string

	data: {
		layers: []
		comps: { [key: string]: BaseLayerProps }
		markers: Marker[]
		height: number
		width: number
		duration: number
	}
}

export type Gradients = { [key: string]: GradientFill[] }

class Animation extends Emitter {
	private readonly gradients: Gradients
	private readonly duration: number
	private readonly baseWidth: number
	private readonly baseHeight: number
	private readonly ratio: number
	private readonly markers: Marker[]
	private readonly baseFont?: string
	private readonly loop: boolean
	private readonly devicePixelRatio: number
	private readonly fluid: boolean
	private readonly imageBasePath: string
	private readonly canvas: HTMLCanvasElement
	private readonly ctx: CanvasRenderingContext2D | null
	private readonly layers: BaseLayer[]

	private _reversed = false
	private isPaused = false
	private isPlaying = false
	private drawFrame = true

	private pausedTime = 0
	private time = 0
	private scale = 1
	private then = 0

	constructor(options: AnimationProps) {
		super()

		this.gradients = {}
		this.duration = options.data.duration
		this.baseWidth = options.data.width
		this.baseHeight = options.data.height
		this.ratio = options.data.width / options.data.height
		this.markers = options.data.markers
		this.baseFont = options.baseFont
		this.loop = options.loop || false
		this.devicePixelRatio =
			options.devicePixelRatio ||
			(typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1)
		this.fluid = options.fluid || true
		this.imageBasePath = options.imageBasePath || ''
		const comps = options.data.comps

		this.canvas = options.canvas || document.createElement('canvas')
		this.canvas.width = this.baseWidth
		this.canvas.height = this.baseHeight
		this.ctx = this.canvas.getContext('2d')

		this.layers = options.data.layers.map((layer: BaseLayerProps) => {
			switch (layer.type) {
				case 'vector':
					return new VectorLayer(layer, this.gradients)
				case 'image':
					return new ImageLayer(layer, this.imageBasePath)
				case 'text':
					return new TextLayer(layer, this.baseFont)
				case 'comp':
					return new CompLayer(layer, comps, this.baseFont, this.gradients, this.imageBasePath)
				case 'null':
				default:
					return new NullLayer(layer)
			}
		})

		this.layers.forEach((layer) => {
			layer.parent = this.layers.find((l) => l.index === layer.parentIndex)
		})

		this.reversed = options.reversed || false
		this.reset()
		this.resize()

		add(this)
	}

	play() {
		if (!this.isPlaying) {
			if (!this.isPaused) this.reset()
			this.isPaused = false
			this.pausedTime = 0
			this.isPlaying = true
		}
	}

	stop() {
		this.reset()
		this.isPlaying = false
		this.drawFrame = true
	}

	pause() {
		if (this.isPlaying) {
			this.isPaused = true
			this.pausedTime = this.time
			this.isPlaying = false
		}
	}

	gotoAndPlay(id: number | string) {
		const marker = this.getMarker(id)
		if (marker) {
			this.time = marker.time
			this.pausedTime = 0
			this.setKeyframes(this.time)
			this.isPlaying = true
		}
	}

	gotoAndStop(id: number | string) {
		const marker = this.getMarker(id)
		if (marker) {
			this.time = marker.time
			this.setKeyframes(this.time)
			this.drawFrame = true
			this.isPlaying = false
		}
	}

	getMarker(id: number | string) {
		let marker
		if (typeof id === 'number') {
			marker = this.markers[id]
		} else {
			marker = this.markers.find((marker) => marker.comment === id)
		}

		if (marker) return marker
		console.warn('Marker not found')
	}

	getLayerByName(name: string): BaseLayer | null {
		const getLayer = (name: string, layer: BaseLayer): BaseLayer | null => {
			if (name === layer.name) {
				return layer
			} else if (layer.layers) {
				for (let i = 0; i < layer.layers.length; i += 1) {
					const hit = getLayer(name, layer.layers[i])
					if (hit) {
						return hit
					}
				}
			}
			return null
		}

		return this.layers.find((layer) => getLayer(name, layer)) || null
	}

	checkStopMarkers(from: number, to: number) {
		return this.markers.find((marker) => marker.stop && marker.time > from && marker.time < to)
	}

	preload() {
		const promises: Promise<void>[] = []
		const preloadLayer = (layers: BaseLayer[], promises: Promise<void>[]) => {
			layers.forEach((layer) => {
				if (layer instanceof ImageLayer) {
					promises.push(layer.preload())
				} else if (layer instanceof CompLayer) {
					preloadLayer(layer.layers, promises)
				}
			})
		}

		preloadLayer(this.layers, promises)
		return Promise.all(promises).catch((error) => console.error(error))
	}

	reset() {
		this.pausedTime = 0
		this.time = this.reversed ? this.duration : 0
		this.layers.forEach((layer) => layer.reset(this.reversed))
	}

	setKeyframes(time: number) {
		this.layers.forEach((layer) => layer.setKeyframes(time))
	}

	destroy() {
		this.isPlaying = false
		if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas)
		remove(this)
	}

	resize(w?: number) {
		if (this.fluid) {
			const width = w || this.canvas.clientWidth || this.baseWidth
			this.canvas.width = width * this.devicePixelRatio
			this.canvas.height = (width / this.ratio) * this.devicePixelRatio

			this.scale = (width / this.baseWidth) * this.devicePixelRatio
			this.ctx?.transform(this.scale, 0, 0, this.scale, 0, 0)
			this.setKeyframes(this.time)
			this.drawFrame = true
		}
	}

	setGradients(name: string, stops: any) {
		if (!this.gradients[name]) {
			console.warn(`Gradient with name: ${name} not found.`)
			return
		}

		this.gradients[name].forEach((gradient) => {
			gradient.stops = stops
		})
	}

	getSpriteSheet(fps = 25, width = 50, maxWidth = 4096) {
		const ratio = width / this.baseWidth
		const height = this.baseHeight * ratio
		const numFrames = Math.floor((this.duration / 1000) * fps)
		const buffer = document.createElement('canvas')
		const ctx = buffer.getContext('2d')

		const rowsX = Math.floor(maxWidth / width)
		const rowsY = Math.ceil(numFrames / rowsX)

		let indexX = 0
		let indexY = 0

		buffer.width = rowsX * width
		buffer.height = rowsY * height

		this.resize(width)

		for (let i = 0; i < numFrames; i++) {
			const step = i / numFrames
			const time = step * this.duration
			this.setKeyframes(time)
			this.draw(time)

			const x = indexX * width
			const y = indexY * height

			if (indexX + 1 >= rowsX) {
				indexX = 0
				indexY++
			} else {
				indexX++
			}

			ctx?.drawImage(this.canvas, x, y, width, height)
		}

		return {
			frames: numFrames,
			canvas: buffer,
			offsetX: width,
			offsetY: height,
			rowsX,
			rowsY,
		}
	}

	draw(time: number) {
		if (!this.ctx) return

		this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight)

		this.layers.forEach((layer) => {
			if (this.ctx && time >= layer.in && time <= layer.out) {
				layer.draw(this.ctx, time, this.scale)
			}
		})
	}

	update(time: number) {
		if (!this.then) this.then = time

		const delta = time - this.then
		this.then = time

		if (this.isPlaying) {
			this.time = this.reversed ? this.time - delta : this.time + delta

			const stopMarker = this.checkStopMarkers(this.time - delta, this.time)

			if (this.time > this.duration || (this.reversed && this.time < 0)) {
				this.time = this.reversed ? 0 : this.duration - 1
				this.isPlaying = false
				this.emit('complete')
				if (this.loop) {
					this.play()
				}
			} else if (stopMarker) {
				this.time = stopMarker.time
				this.pause()
				this.emit('stop', stopMarker)
			} else {
				this.draw(this.time)
			}
			this.emit('update')
		} else if (this.drawFrame) {
			this.drawFrame = false
			this.draw(this.time)
			this.emit('update')
		}
	}

	set step(step) {
		this.isPlaying = false
		this.time = step * this.duration
		this.pausedTime = this.time
		this.setKeyframes(this.time)
		this.drawFrame = true
	}

	get step() {
		return this.time / this.duration
	}

	get reversed() {
		return this._reversed
	}

	set reversed(bool) {
		this._reversed = bool
		if (this.pausedTime) {
			this.time = this.pausedTime
		} else if (!this.isPlaying) {
			this.time = this.reversed ? this.duration : 0
		}
		this.setKeyframes(this.time)
	}
}

export default Animation
