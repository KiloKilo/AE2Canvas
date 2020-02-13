import Bezier from '../utils/Bezier'

class Path {
	constructor(data) {
		this.closed = data.closed
		this.frames = data.frames
	}

	draw(ctx, time, trim) {
		const frame = this.getValue(time)
		trim && (trim.start !== 0 || trim.end !== 1) ? this.drawTrimmed(frame, ctx, trim) : this.drawNormal(frame, ctx)
	}

	drawNormal(frame, ctx) {
		const vertices = frame.v
		const numVertices = this.closed ? vertices.length : vertices.length - 1
		let lastVertex = null
		let nextVertex = null

		for (let i = 1; i <= numVertices; i++) {
			lastVertex = vertices[i - 1]
			nextVertex = vertices[i] ? vertices[i] : vertices[0]
			if (i === 1) ctx.moveTo(lastVertex[4], lastVertex[5])
			ctx.bezierCurveTo(lastVertex[0], lastVertex[1], nextVertex[2], nextVertex[3], nextVertex[4], nextVertex[5])
		}

		if (this.closed) {
			if (!nextVertex) debugger
			ctx.bezierCurveTo(
				nextVertex[0],
				nextVertex[1],
				vertices[0][2],
				vertices[0][3],
				vertices[0][4],
				vertices[0][5]
			)
			ctx.closePath()
		}
	}

	drawTrimmed(frame, ctx, trim) {
		if (trim.start === trim.end) return

		const vertices = frame.v
		const numVertices = this.closed ? vertices.length : vertices.length - 1

		let nextVertex
		let lastVertex

		const { start, end, endIndex, startIndex, looped } = this.getTrimValues(trim, frame)

		if (looped && this.closed) {
			let index = startIndex
			let firstRound = true

			for (let i = 1; i <= numVertices + 1; i++) {
				lastVertex = vertices[index]
				nextVertex = vertices[index + 1] ? vertices[index + 1] : vertices[0]
				const length = frame.len[index]

				if (index === startIndex && firstRound) {
					firstRound = false
					const tv = this.trim(lastVertex, nextVertex, start, 1, length)
					ctx.moveTo(tv.start[4], tv.start[5])
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index === startIndex && index === endIndex) {
					const tv = this.trim(lastVertex, nextVertex, 0, end, length)
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index === endIndex) {
					const tv = this.trim(lastVertex, nextVertex, 0, end, length)
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index < endIndex || index > startIndex) {
					ctx.bezierCurveTo(
						lastVertex[0],
						lastVertex[1],
						nextVertex[2],
						nextVertex[3],
						nextVertex[4],
						nextVertex[5]
					)
				}

				index + 1 < numVertices ? index++ : (index = 0)
			}
		} else if (looped && !this.closed) {
			for (let i = 1; i <= numVertices; i++) {
				const index = i - 1
				lastVertex = vertices[index]
				nextVertex = vertices[index + 1] ? vertices[index + 1] : vertices[0]
				const length = frame.len[index]

				if (index === startIndex && index === endIndex) {
					const tv1 = this.trim(lastVertex, nextVertex, 0, end, length)
					ctx.bezierCurveTo(tv1.start[0], tv1.start[1], tv1.end[2], tv1.end[3], tv1.end[4], tv1.end[5])

					const tv2 = this.trim(lastVertex, nextVertex, start, 1, length)
					ctx.moveTo(tv2.start[4], tv2.start[5])
					ctx.bezierCurveTo(tv2.start[0], tv2.start[1], tv2.end[2], tv2.end[3], tv2.end[4], tv2.end[5])
				} else if (index === startIndex) {
					const tv = this.trim(lastVertex, nextVertex, start, 1, length)
					ctx.moveTo(tv.start[4], tv.start[5])
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index === endIndex) {
					const tv = this.trim(lastVertex, nextVertex, 0, end, length)
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index < endIndex || index > startIndex) {
					ctx.bezierCurveTo(
						lastVertex[0],
						lastVertex[1],
						nextVertex[2],
						nextVertex[3],
						nextVertex[4],
						nextVertex[5]
					)
				}
			}
		} else {
			for (let i = 1; i <= numVertices; i++) {
				const index = i - 1
				lastVertex = vertices[i - 1]
				nextVertex = vertices[i] ? vertices[i] : vertices[0]
				if (index === startIndex && index === endIndex) {
					const tv = this.trim(lastVertex, nextVertex, start, end, length)
					ctx.moveTo(tv.start[4], tv.start[5])
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index === startIndex) {
					const tv = this.trim(lastVertex, nextVertex, start, 1, length)
					ctx.moveTo(tv.start[4], tv.start[5])
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index === endIndex) {
					const tv = this.trim(lastVertex, nextVertex, 0, end, length)
					ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5])
				} else if (index > startIndex && index < endIndex) {
					ctx.bezierCurveTo(
						lastVertex[0],
						lastVertex[1],
						nextVertex[2],
						nextVertex[3],
						nextVertex[4],
						nextVertex[5]
					)
				}
			}
		}
	}

	getValue() {
		return this.frames[0]
	}

	getTrimValues(trim, frame) {
		const actualTrim = {
			startIndex: 0,
			endIndex: 0,
			start: 0,
			end: 0,
			looped: false,
		}

		if (trim.start === 0 && trim.end === 1) {
			return null
		}

		const totalLen = this.sumArray(frame.len)
		let trimStartAtLength = totalLen * trim.start

		for (let i = 0; i < frame.len.length; i++) {
			if (trimStartAtLength === 0 || trimStartAtLength < frame.len[i]) {
				actualTrim.startIndex = i
				actualTrim.start = trimStartAtLength / frame.len[i]
				break
			}
			trimStartAtLength -= frame.len[i]
		}

		let trimEndAtLength = totalLen * trim.end

		if (trim.end === 1) {
			actualTrim.endIndex = frame.len.length
			actualTrim.end = 1
			return actualTrim
		}

		for (let i = 0; i < frame.len.length; i++) {
			if (trimEndAtLength === 0 || trimEndAtLength < frame.len[i]) {
				actualTrim.endIndex = i
				actualTrim.end = trimEndAtLength / frame.len[i]
				break
			}
			trimEndAtLength -= frame.len[i]
		}

		actualTrim.looped =
			actualTrim.startIndex > actualTrim.endIndex ||
			(actualTrim.startIndex === actualTrim.endIndex && actualTrim.start >= actualTrim.end)

		return actualTrim
	}

	trim(lastVertex, nextVertex, from, to, len) {
		const values = {
			start: lastVertex,
			end: nextVertex,
		}

		if (from === 0 && to === 1) {
			return values
		}

		if (
			this.isStraight(
				lastVertex[4],
				lastVertex[5],
				lastVertex[0],
				lastVertex[1],
				nextVertex[2],
				nextVertex[3],
				nextVertex[4],
				nextVertex[5]
			)
		) {
			values.start = [
				this.lerp(lastVertex[0], nextVertex[0], from),
				this.lerp(lastVertex[1], nextVertex[1], from),
				this.lerp(lastVertex[2], nextVertex[2], from),
				this.lerp(lastVertex[3], nextVertex[3], from),
				this.lerp(lastVertex[4], nextVertex[4], from),
				this.lerp(lastVertex[5], nextVertex[5], from),
			]

			values.end = [
				this.lerp(lastVertex[0], nextVertex[0], to),
				this.lerp(lastVertex[1], nextVertex[1], to),
				this.lerp(lastVertex[2], nextVertex[2], to),
				this.lerp(lastVertex[3], nextVertex[3], to),
				this.lerp(lastVertex[4], nextVertex[4], to),
				this.lerp(lastVertex[5], nextVertex[5], to),
			]

			return values
		} else {
			this.bezier = new Bezier([
				lastVertex[4],
				lastVertex[5],
				lastVertex[0],
				lastVertex[1],
				nextVertex[2],
				nextVertex[3],
				nextVertex[4],
				nextVertex[5],
			])
			this.bezier.getLength(len)
			from = this.bezier.map(from)
			to = this.bezier.map(to)
			to = (to - from) / (1 - from)

			let e1 = [this.lerp(lastVertex[4], lastVertex[0], from), this.lerp(lastVertex[5], lastVertex[1], from)]
			let f1 = [this.lerp(lastVertex[0], nextVertex[2], from), this.lerp(lastVertex[1], nextVertex[3], from)]
			let g1 = [this.lerp(nextVertex[2], nextVertex[4], from), this.lerp(nextVertex[3], nextVertex[5], from)]
			let h1 = [this.lerp(e1[0], f1[0], from), this.lerp(e1[1], f1[1], from)]
			let j1 = [this.lerp(f1[0], g1[0], from), this.lerp(f1[1], g1[1], from)]
			let k1 = [this.lerp(h1[0], j1[0], from), this.lerp(h1[1], j1[1], from)]

			let startVertex = [j1[0], j1[1], h1[0], h1[1], k1[0], k1[1]]
			let endVertex = [nextVertex[0], nextVertex[1], g1[0], g1[1], nextVertex[4], nextVertex[5]]

			let e2 = [this.lerp(startVertex[4], startVertex[0], to), this.lerp(startVertex[5], startVertex[1], to)]
			let f2 = [this.lerp(startVertex[0], endVertex[2], to), this.lerp(startVertex[1], endVertex[3], to)]
			let g2 = [this.lerp(endVertex[2], endVertex[4], to), this.lerp(endVertex[3], endVertex[5], to)]

			let h2 = [this.lerp(e2[0], f2[0], to), this.lerp(e2[1], f2[1], to)]
			let j2 = [this.lerp(f2[0], g2[0], to), this.lerp(f2[1], g2[1], to)]
			let k2 = [this.lerp(h2[0], j2[0], to), this.lerp(h2[1], j2[1], to)]

			values.start = [e2[0], e2[1], startVertex[2], startVertex[3], startVertex[4], startVertex[5]]
			values.end = [j2[0], j2[1], h2[0], h2[1], k2[0], k2[1]]

			return values
		}
	}

	lerp(a, b, t) {
		const s = 1 - t
		return a * s + b * t
	}

	sumArray(arr) {
		function add(a, b) {
			return a + b
		}

		return arr.reduce(add)
	}

	isStraight(startX, startY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY) {
		return startX === ctrl1X && startY === ctrl1Y && endX === ctrl2X && endY === ctrl2Y
	}

	setKeyframes(time) {}

	reset(reversed) {}
}

export default Path
