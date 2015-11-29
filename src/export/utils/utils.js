// TODO use removeValue
function removeZValue(frames) {
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v.length > 2) {
            frames[i].v.pop();
        }
    }

    return frames;
}

function removeValues(frames, index) {
    for (var i = 0; i < frames.length; i++) {
        frames[i].v.splice(index);
    }

    return frames;
}

function roundValue(frames, prcsn) {

    var precision = prcsn || 1;

    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                frames[i].v[j] = Math.round(frames[i].v[j] * precision) / precision;
            }
        } else {
            frames[i].v = Math.round(frames[i].v * precision) / precision;
        }
    }

    return frames;
}

function divideValue(frames, divider) {
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                frames[i].v[j] = frames[i].v[j] / divider;
            }
        } else {
            frames[i].v = frames[i].v / divider;
        }
    }

    return frames;
}

function multiplyValue(frames, multiplier) {
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                frames[i].v[j] = frames[i].v[j] * multiplier;
            }
        } else {
            frames[i].v = frames[i].v * multiplier;
        }
    }

    return frames;
}

function clampValue(frames, from, to) {
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].v instanceof Array) {
            for (var j = 0; j < frames[i].v.length; j++) {
                if (frames[i].v[j] > to) frames[i].v[j] = to;
                else if (frames[i].v[j] < from) frames[i].v[j] = from;
            }
        } else {
            if (frames[i].v > to) frames[i].v = to;
            else if (frames[i].v < from) frames[i].v = from;
        }
    }

    return frames;
}

function getArcLength(path) {

    var steps = 100, //500
        t = 1 / steps,
        aX = 0,
        aY = 0,
        bX = path[0],
        bY = path[1],
        dX = 0,
        dY = 0,
        dS = 0,
        sumArc = 0,
        j = 0;

    for (var i = 0; i < steps; j = j + t) {
        aX = cubicN(j, path[0], path[2], path[4], path[6]);
        aY = cubicN(j, path[1], path[3], path[5], path[7]);
        dX = aX - bX;
        dY = aY - bY;
        dS = Math.sqrt((dX * dX) + (dY * dY));
        sumArc = sumArc + dS;
        bX = aX;
        bY = aY;
        i++;
    }

    return sumArc;
}

function cubicN(pct, a, b, c, d) {
    var t2 = pct * pct;
    var t3 = t2 * pct;
    return a + (-a * 3 + pct * (3 * a - a * pct)) * pct
        + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct
        + (c * 3 - c * 3 * pct) * t2
        + d * t3;
}

function getValueDifference(lastKey, key) {

    var x, y, z, diff;

    // multidimensional properties, e.g. fill array has 4 fields. don't need last one
    if (key.v instanceof Array && key.v.length > 2) {
        x = key.v[0] - lastKey.v[0];
        y = key.v[1] - lastKey.v[1];
        z = key.v[2] - lastKey.v[2];
        diff = Math.pow(x * x + y * y + z * z, 1 / 3);
    } else if (key.v instanceof Array && key.v.length === 2) {
        x = key.v[0] - lastKey.v[0];
        y = key.v[1] - lastKey.v[1];
        diff = Math.sqrt(x * x + y * y);
    } else {
        diff = key.v - lastKey.v;
    }

    return diff;
}

function dist2d(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function printObj(obj) {
    $.writeln('-----------------------');
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'function') {
                $.writeln(key + ': function');
            } else {
                $.writeln(key + ': ' + obj[key]);
            }
        }
    }
    $.writeln('-----------------------');
}

function reflectObj(obj) {
    var props = obj.reflect.properties;
    for (var i = 0; i < props.length; i++) {
        $.writeln(props[i].name + ': ' + f[props[i].name]);
    }
}

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

function clearConsole() {
    var bt = new BridgeTalk();
    bt.target = 'estoolkit-4.0';
    bt.body = function () {
        app.clc();
    }.toSource() + "()";
    bt.send(5);
}