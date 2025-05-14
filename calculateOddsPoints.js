import { MAX_CATEGORY_POINTS } from "./pointsConfig.js";

/**
 * Beräknar poäng baserat på odds i förhållande till fältet.
 * Lägre odds (favorit) ger högre poäng. Den lägst spelade (lägsta odds) får MAX_CATEGORY_POINTS.folket poäng.
 * Den högst spelade (högsta odds) får 0 poäng.
 *
 * @param {number} odds - Hästens egna odds
 * @param {number[]} allOdds - Array med samtliga hästars odds
 * @returns {number} Poäng mellan 0–MAX_CATEGORY_POINTS.folket
 */
export function calculateOddsPoints(odds, allOdds) {
    const maxPoints = MAX_CATEGORY_POINTS.folket;

    const oddsList = [...allOdds];
    const minOdds = Math.min(...oddsList);
    const maxOdds = Math.max(...oddsList);

    if (minOdds === maxOdds) {
        // console.warn("⚠️ Alla odds är lika – alla hästar får 0 poäng.");
        return 0;
    }

    // Invertera: lägre odds = mer poäng
    const normalized = (maxOdds - odds) / (maxOdds - minOdds);
    const oddsPoints = normalized * maxPoints;

    if (odds === minOdds) {
        // console.log(`✅ Häst med lägst odds (${minOdds}) får exakt ${maxPoints} poäng.`);
        return maxPoints;
    }

    return Math.round(oddsPoints);
}