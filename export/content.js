function getContent(data) {
    if (!data) return null;

    var content = {};
    content.groups = [];

    for (var i = 1; i <= data.numProperties; i++) {
        var prop = data.property(i);
        var matchName = prop.matchName;

        if (matchName === 'ADBE Vector Group') {
            content.groups.push(getGroup(prop));
        } 
    }

    return content;
}