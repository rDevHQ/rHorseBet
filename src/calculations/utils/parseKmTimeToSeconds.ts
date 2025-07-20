// Funktion för att omvandla kilometertid från "1.14,6" till sekunder
export function parseKmTimeToSeconds(kmTime: string): number {
    if (
        !kmTime ||
        kmTime === "N/A" ||
        kmTime === "undefined.undefined,undefined" ||
        kmTime === "undefined" ||
        kmTime === "-" ||
        typeof kmTime !== "string"
    ) {
        return NaN;
    }

    const parts = kmTime.split(".");
    if (parts.length !== 2) return NaN;

    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1].replace(",", "."));

    if (isNaN(minutes) || isNaN(seconds)) return NaN;

    return minutes * 60 + seconds;
}
