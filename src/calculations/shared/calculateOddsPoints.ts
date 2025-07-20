const MAX_CATEGORY_POINTS = {
    folket: 100
};

/**
 * Beräknar poäng baserat på odds i förhållande till fältet.
 * Lägre odds (favorit) ger högre poäng. Den lägst spelade (lägsta odds) får MAX_CATEGORY_POINTS.folket poäng.
 * Den högst spelade (högsta odds) får 0 poäng.
 *
 * @param {number} odds - Hästens egna odds
 * @param {number[]} allOdds - Array med samtliga hästars odds
 * @returns {number} Poäng mellan 0–100
 */
export function calculateOddsPoints(odds: number, allOdds: number[]): number {
    const maxPoints = MAX_CATEGORY_POINTS.folket;

    const oddsList = [...allOdds];
    const minOdds = Math.min(...oddsList);
    const maxOdds = Math.max(...oddsList);

    if (minOdds === maxOdds) {
        return 0;
    }

    const logOdds = allOdds.map(o => Math.log(o));
    const logMin = Math.min(...logOdds);
    const logMax = Math.max(...logOdds);
    const logCurrent = Math.log(odds);

    const normalized = (logMax - logCurrent) / (logMax - logMin);
    const oddsPoints = normalized * maxPoints;

    return Math.round(oddsPoints);
}
