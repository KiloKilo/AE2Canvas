const root = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;

export const requestAnimationFrame = root.requestAnimationFrame ||
    (function (fn) {
        return root.setTimeout(fn, 16);
    });

export const cancelAnimationFrame = root.cancelAnimationFrame ||
    (function (id) {
        return root.clearTimeout(id);
    });