// Separat funktion för att normalisera tidspoäng
export function normalizeTimePoints(adjustedTime, allTimes) {
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    let normalized = maxTime === minTime ? 0.5 : (maxTime - adjustedTime) / (maxTime - minTime);
    normalized = Math.max(0, Math.min(1, normalized));
    return Math.round(normalized * 99 + 1);
}
