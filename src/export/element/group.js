﻿function getGroup(data) {

    var group = {};
    group.index = data.index;
    group.type = 'vector';

    if (data.parent) group.parent = data.parent.index;

    if (data.inPoint) group.in = Math.round(data.inPoint * 1000);
    if (data.outPoint) group.out = Math.round(data.outPoint * 1000);
    if (typeof group.in !== 'undefined' && group.in < 0) group.in = 0;

    var blendMode;

    var masks = getMask(data);
    if (masks && masks.length > 0) {
        group.masks = masks;
    }

    for (var i = 1; i <= data.numProperties; i++) {
        var prop = data.property(i);
        var matchName = prop.matchName;

        if (prop.enabled) {
            switch (matchName) {
                case 'ADBE Vector Blend Mode':
                    break;
                case 'ADBE Transform Group':
                case 'ADBE Vector Transform Group':
                    group.transform = getTransform(prop);
                    break;
                case 'ADBE Vector Materials Group':
                    break;
                case 'ADBE Root Vectors Group':
                case 'ADBE Vectors Group':
                    for (var j = 1; j <= prop.numProperties; j++) {
                        var innerProp = prop.property(j);
                        var innerMatchName = innerProp.matchName;

                        if (innerProp.enabled) {

                            switch (innerMatchName) {
                                case 'ADBE Vector Group':
                                    if (!group.groups) group.groups = [];
                                    group.groups.unshift(getGroup(innerProp));
                                    break;
                                case 'ADBE Vector Shape - Group':
                                    var path = getPath(innerProp);
                                    if (path && !group.shapes) group.shapes = [];
                                    if (path) group.shapes.unshift(path);
                                    break;
                                case 'ADBE Vector Shape - Rect':
                                    if (!group.shapes) group.shapes = [];
                                    group.shapes.unshift(getRect(innerProp));
                                    break;
                                case 'ADBE Vector Shape - Ellipse':
                                    if (!group.shapes) group.shapes = [];
                                    group.shapes.unshift(getEllipse(innerProp));
                                    break;
                                case 'ADBE Vector Shape - Star':
                                    if (!group.shapes) group.shapes = [];
                                    group.shapes.unshift(getPolystar(innerProp));
                                    break;
                                case 'ADBE Vector Graphic - Fill':
                                    if (!group.fill) group.fill = getFill(innerProp);
                                    break;
                                case 'ADBE Vector Graphic - G-Fill':
                                    if (!group.gradientFill) group.gradientFill = getGradientFill(innerProp);
                                    break;
                                case 'ADBE Vector Graphic - Stroke':
                                    if (!group.stroke) group.stroke = getStroke(innerProp);
                                    break;
                                case 'ADBE Vector Filter - Merge':
                                    var merge = getMerge(innerProp);
                                    if (merge) group.merge = merge;
                                    break;
                                case 'ADBE Vector Filter - Trim':
                                    group.trim = getVectorTrim(innerProp);
                                    break;
                            }
                        }
                    }
                    break;
            }
        }
    }

    return optimizeGroup(group);

    function optimizeGroup(group) {
        if (group.merge && group.groups) group = removeFillAndStrokeIfMerge(group);
        return group;
    }

    function removeFillAndStrokeIfMerge(group) {
        for (var i = 0; i < group.groups.length; i++) {
            if (group.groups[i].fill) delete group.groups[i].fill;
            if (group.groups[i].stroke) delete group.groups[i].stroke;
            if (group.groups[i].groups) group.groups[i] = removeFillAndStrokeIfMerge(group.groups[i]);
        }

        return group;
    }
}

