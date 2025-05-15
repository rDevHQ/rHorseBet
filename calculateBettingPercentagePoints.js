import { MAX_CATEGORY_POINTS } from "./pointsConfig.js";

/**
 * Beräknar poäng baserat på hur mycket spelad hästen är i förhållande till fältet.
 * Den mest spelade hästen får alltid MAX_CATEGORY_POINTS.folket poäng, den minst spelade får 0 poäng.
 *
 * @param {number} bettingPercentage - Hästens egna spelprocent
 * @param {number[]} allBettingPercentages - Array med samtliga hästars spelprocent
 * @returns {number} Poäng mellan 0–MAX_CATEGORY_POINTS.folket
 */
export function calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages) {
    const maxPoints = MAX_CATEGORY_POINTS.folket;

    const bettingPercentages = [...allBettingPercentages, 0];

    const minBet = Math.min(...bettingPercentages);
    const maxBet = Math.max(...bettingPercentages);

    if (maxBet === minBet) {
        // console.warn("⚠️ MaxBet och MinBet är lika – alla hästar får 0 poäng.");
        return 0;
    }

    const logPercentages = allBettingPercentages.map(p => Math.log(p || 0.01)); // avoid log(0)
    const logMin = Math.min(...logPercentages);
    const logMax = Math.max(...logPercentages);
    const logCurrent = Math.log(bettingPercentage || 0.01);

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const bettingPoints = normalized * maxPoints;

    return Math.round(bettingPoints);
}