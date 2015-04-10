function getProperty(data, split) {
    if (data.numKeys < 1) {
        return getStaticProperty(data, split);
    } else {
        return getAnimatedProperty(data, split);
    }
}