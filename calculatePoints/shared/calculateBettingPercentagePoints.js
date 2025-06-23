/**
 * Beräknar poäng baserat på hur mycket spelad hästen är i förhållande till fältet.
 * Den mest spelade hästen får alltid 100 poäng, den minst spelade får 0 poäng.
 *
 * @param {number} bettingPercentage - Hästens egna spelprocent
 * @param {number[]} allBettingPercentages - Array med samtliga hästars spelprocent
 * @param {number|null} odds - Hästens odds, används som fallback om bettingPercentage saknas eller är noll
 * @returns {number} Poäng mellan 0–100
 */
export function calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages, odds) {
    const maxPoints = 100;

    // Konvertera till tal om det är en sträng
    let pct = typeof bettingPercentage === "string"
        ? parseFloat(bettingPercentage.replace(",", "."))
        : bettingPercentage;

    // Kontrollera om det är ett giltigt tal
    if (!Number.isFinite(pct) || pct <= 0) {
        pct = (Number.isFinite(odds) && odds > 0) ? 100 / odds : 0;
    }

    console.log(`Betting Percentage After: ${pct}, Odds: ${odds}`);

    const combined = allBettingPercentages.concat([pct]);
    const minBet = Math.min(...combined);
    const maxBet = Math.max(...combined);

    if (maxBet === minBet) {
        // console.warn("⚠️ MaxBet och MinBet är lika – alla hästar får 0 poäng.");
        return 0;
    }

    const logPercentages = combined.map(p => Math.log(p < 0.01 ? 0.01 : p));
    const logMin = Math.min(...logPercentages);
    const logMax = Math.max(...logPercentages);
    const logCurrent = Math.log(pct < 0.01 ? 0.01 : pct);

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const bettingPoints = normalized * maxPoints;

  //  console.log(`Betting Points: ${bettingPoints}, Normalized: ${normalized}, Log Current: ${logCurrent}, Log Min: ${logMin}, Log Max: ${logMax}`);
    return Math.round(bettingPoints);
}
