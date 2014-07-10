'use strict';

function Merge(data) {

    if (!data) return;
    this.type = data.type;
}

Merge.prototype.setCompositeOperation = function (ctx) {
    switch (this.type) {
        case 3:
            ctx.globalCompositeOperation = 'source-out';
            break;
        case 4:
            ctx.globalCompositeOperation = 'source-in';
            break;
        case 5:
            ctx.globalCompositeOperation = 'xor';
            break;
        default:
            ctx.globalCompositeOperation = 'source-over';
    }
    console.log('set composite',ctx.globalCompositeOperation );
};

module.exports = Merge;

























