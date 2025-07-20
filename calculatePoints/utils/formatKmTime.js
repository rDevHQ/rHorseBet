// Funktion för att visa kilometertid i rätt format
export function formatKmTime(timeInSeconds) {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "N/A";

    let minutes = Math.floor(timeInSeconds / 60);
    let seconds = Math.floor(timeInSeconds % 60);
    let tenths = Math.round(((timeInSeconds % 1) * 10)); // Tiondelarna direkt från sekunder

    return `${minutes}.${seconds},${tenths}`;
}