/**
 * Beräknar poäng baserat på hur mycket spelad hästen är i förhållande till fältet.
 * Den mest spelade hästen får alltid 100 poäng, den minst spelade får 0 poäng.
 *
 * @param {number} bettingPercentage - Hästens egna spelprocent
 * @param {number[]} allBettingPercentages - Array med samtliga hästars spelprocent
 * @param {number|null} odds - Hästens odds, används som fallback om bettingPercentage saknas eller är noll
 * @returns {number} Poäng mellan 0–100
 */
export function calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages, odds = null) {
    const maxPoints = 100;

    if ((!Number.isFinite(bettingPercentage) || bettingPercentage === 0) && Number.isFinite(odds) && odds > 0) {
        bettingPercentage = 100 / odds;
    }

    const combined = allBettingPercentages.concat([bettingPercentage]);
    const minBet = Math.min(...combined);
    const maxBet = Math.max(...combined);

    if (maxBet === minBet) {
        // console.warn("⚠️ MaxBet och MinBet är lika – alla hästar får 0 poäng.");
        return 0;
    }

    const logPercentages = combined.map(p => Math.log(p < 0.01 ? 0.01 : p));
    const logMin = Math.min(...logPercentages);
    const logMax = Math.max(...logPercentages);
    const logCurrent = Math.log(bettingPercentage < 0.01 ? 0.01 : bettingPercentage);

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const bettingPoints = normalized * maxPoints;

    return Math.round(bettingPoints);
}