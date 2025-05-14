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

    const normalized = (bettingPercentage - minBet) / (maxBet - minBet);
    const bettingPoints = normalized * maxPoints;

    if (bettingPercentage === maxBet) {
        // console.log(`✅ Häst med maxBet (${maxBet}%) får exakt ${maxPoints} poäng.`);
        return maxPoints;
    }

    return Math.round(bettingPoints);
}