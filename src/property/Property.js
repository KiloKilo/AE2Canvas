class Property {
    constructor(data) {
        this.frames = data;
    }

    getValue() {
        return this.frames[0].v;
    }

    setKeyframes(time) {
    }

    reset(reversed) {
    }
}

export default Property;