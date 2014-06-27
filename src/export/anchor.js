function getAnchor(data) {
    if (!data instanceof Property) return null;

    if (data.numKeys < 1) {
        return
    } else {
        return getAnimatedProperty(data, split);
    }
}