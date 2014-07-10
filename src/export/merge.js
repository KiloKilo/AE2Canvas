function getMerge(data) {

    var merge = {};
    merge.index = data.propertyIndex;
    merge.type = data.property('ADBE Vector Merge Type').value;

    return merge;
}