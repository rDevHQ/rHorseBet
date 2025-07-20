/**
 * Calculates points based on how much a horse has earned per start relative to the field.
 * The horse with the most earnings per start always gets 100 points, the least gets 0 points.
 *
 * @param {number} earningsPerStart - The horse's own earnings per start
 * @param {number[]} allEarningsPerStart - Array of all horses' earnings per start
 * @returns {number} Points between 0–100
 */
export function calculateEarningsPerStartPoints(earningsPerStart: number, allEarningsPerStart: number[]): number {
    const maxPoints = 100;

    const combined = allEarningsPerStart.concat([earningsPerStart]);
    const minEarnings = Math.min(...combined);
    const maxEarnings = Math.max(...combined);

    if (maxEarnings === minEarnings) {
        return 0;
    }

    const logPercentages = combined.map(p => Math.log(p < 0.01 ? 0.01 : p));
    const logMin = Math.min(...logPercentages);
    const logMax = Math.max(...logPercentages);
    const logCurrent = Math.log(earningsPerStart < 0.01 ? 0.01 : earningsPerStart);

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const earningsPoints = normalized * maxPoints;

    return Math.round(earningsPoints);
}
