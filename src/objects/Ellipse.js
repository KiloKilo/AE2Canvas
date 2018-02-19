import Property from '../property/Property';
import AnimatedProperty from '../property/AnimatedProperty';

class Ellipse {

    constructor(data) {
        this.closed = true;

        this.size = data.size.length > 1 ? new AnimatedProperty(data.size) : new Property(data.size);
        //optional
        if (data.position) this.position = data.position.length > 1 ? new AnimatedProperty(data.position) : new Property(data.position);
    }

    draw(ctx, time, trim) {
        const size = this.size.getValue(time);
        const position = this.position ? this.position.getValue(time) : [0, 0];

        let i;
        let j;
        const w = size[0] / 2;
        const h = size[1] / 2;
        const x = position[0] - w;
        const y = position[1] - h;
        const ow = w * .5522848;
        const oh = h * .5522848;

        const vertices = [
            [x + w + ow, y, x + w - ow, y, x + w, y],
            [x + w + w, y + h + oh, x + w + w, y + h - oh, x + w + w, y + h],
            [x + w - ow, y + h + h, x + w + ow, y + h + h, x + w, y + h + h],
            [x, y + h - oh, x, y + h + oh, x, y + h]
        ];

        if (trim) {
            let tv;
            const len = w + h;

            trim = this.getTrimValues(trim);

            for (i = 0; i < 4; i++) {
                j = i + 1;
                if (j > 3) j = 0;
                if (i > trim.startIndex && i < trim.endIndex) {
                    ctx.bezierCurveTo(vertices[i][0], vertices[i][1], vertices[j][2], vertices[j][3], vertices[j][4], vertices[j][5]);
                } else if (i === trim.startIndex && i === trim.endIndex) {
                    tv = this.trim(vertices[i], vertices[j], trim.start, trim.end, len);
                    ctx.moveTo(tv.start[4], tv.start[5]);
                    ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
                } else if (i === trim.startIndex) {
                    tv = this.trim(vertices[i], vertices[j], trim.start, 1, len);
                    ctx.moveTo(tv.start[4], tv.start[5]);
                    ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
                } else if (i === trim.endIndex) {
                    tv = this.trim(vertices[i], vertices[j], 0, trim.end, len);
                    ctx.bezierCurveTo(tv.start[0], tv.start[1], tv.end[2], tv.end[3], tv.end[4], tv.end[5]);
                }
            }
        } else {
            ctx.moveTo(vertices[0][4], vertices[0][5]);
            for (i = 0; i < 4; i++) {
                j = i + 1;
                if (j > 3) j = 0;
                ctx.bezierCurveTo(vertices[i][0], vertices[i][1], vertices[j][2], vertices[j][3], vertices[j][4], vertices[j][5]);
            }
        }
    }

    getTrimValues(trim) {
        const startIndex = Math.floor(trim.start * 4);
        const endIndex = Math.floor(trim.end * 4);
        const start = (trim.start - startIndex * 0.25) * 4;
        const end = (trim.end - endIndex * 0.25) * 4;

        return {
            startIndex,
            endIndex,
            start,
            end
        };
    }

    setKeyframes(time) {
        this.size.setKeyframes(time);
        if (this.position) this.position.setKeyframes(time);
    }

    reset(reversed) {
        this.size.reset(reversed);
        if (this.position) this.position.reset(reversed);
    }
}

export default Ellipse;