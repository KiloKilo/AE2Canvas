function getMerge(data) {

    var merge = {};

    merge.type = data.property('ADBE Vector Merge Type').value;

    return merge;
}