function optimize(data) {

    if (!data) return null;

    for (var i = 0; i < data.groups.length; i++) {
        data.groups[i] = groupOptimize(data.groups[i]);
    }

    return data;

}