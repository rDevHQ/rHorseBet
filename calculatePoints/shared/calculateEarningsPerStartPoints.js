/**
 * Beräknar poäng baserat på hur mycket  hästen har sprungit in i förhållande till fältet.
 * Hästen med mest intjänade pengar får alltid 100 poäng, den minst intjänade får 0 poäng.
 *
 * @param {number} earningsPerStart - Hästens egna earnings
 * @param {number[]} allEarningsPerStart - Array med samtliga hästars earnings per start
 * @returns {number} Poäng mellan 0–100
 */
export function calculateEarningsPerStartPoints(earningsPerStart, allEarningsPerStart) {
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

    return Math.round(earningsPoints.toFixed(2));
}