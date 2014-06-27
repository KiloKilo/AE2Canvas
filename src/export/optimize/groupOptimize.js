function groupOptimize(data) {
    if (!data) return null;

    //recursive
    if (data.groups.length) data.groups = groupOptimize(data.groups);

//    $.writeln(data.transform.opacity);

    //optimize vector trim
//    if (data.trim && data.paths) data.trim = vectorTrimOptimize(data);

    return data;

}