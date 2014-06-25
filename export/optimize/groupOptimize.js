function groupOptimize(data) {
    if (!data) return null;

    //recursive
    if (data.groups) data.groups = groupOptimize(data.groups);

    //optimize vector trim
    if (data.trim && data.paths) data.trim = vectorTrimOptimize(data);

    return data;

}