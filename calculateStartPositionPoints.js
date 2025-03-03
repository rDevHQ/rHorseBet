export function calculateStartPositionPoints(startMethod, startNumber) {
    if (startMethod === "volte") {
        if ([1, 3, 5, 6, 7].includes(startNumber)) return 3;
        if ([2, 4].includes(startNumber)) return 2;
        if (startNumber >= 8 && startNumber <= 9) return 1;
        if (startNumber >= 10 && startNumber <= 12) return 0;
        if (startNumber >= 13 && startNumber <= 15) return -1;
    } else if (startMethod === "auto") {
        if (startNumber >= 1 && startNumber <= 3) return 3;
        if (startNumber >= 4 && startNumber <= 6) return 2;
        if (startNumber >= 7 && startNumber <= 9) return 1;
        if (startNumber >= 10 && startNumber <= 12) return 0;
        if (startNumber >= 13 && startNumber <= 15) return -1;
    }
    return 0;
}
