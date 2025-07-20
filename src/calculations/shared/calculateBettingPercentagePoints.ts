/**
 * Calculates points based on how much a horse is bet on relative to the field.
 * The most bet-on horse always gets 100 points, the least bet-on gets 0 points.
 *
 * @param {number | null} bettingPercentage - The horse's own betting percentage
 * @param {number[]} allBettingPercentages - Array of all horses' betting percentages
 * @param {number | null} odds - The horse's odds, used as a fallback if bettingPercentage is missing or zero
 * @returns {number} Points between 0–100
 */
export function calculateBettingPercentagePoints(bettingPercentage: number | null, allBettingPercentages: number[], odds: number | null): number {
    console.log('🔍 calculateBettingPercentagePoints called with:', {
        bettingPercentage,
        allBettingPercentages: allBettingPercentages.slice().sort((a, b) => b - a),
        odds
    });

    // Use betting percentage if available, otherwise fall back to odds
    let pct = bettingPercentage;
    let usingOddsFallback = false;

    // Check if betting percentage is valid
    if (!pct || pct <= 0) {
        if (odds && odds > 0) {
            // Convert odds to implied probability percentage
            pct = 100 / odds;
            usingOddsFallback = true;
            console.log(`🔄 Using odds fallback: ${odds} -> ${pct}%`);
        } else {
            console.log('❌ No betting percentage or odds, returning 0');
            return 0; // If no data, give 0 points
        }
    } else {
        console.log(`✅ Using betting percentage: ${pct}%`);
    }

    // Find the maximum betting percentage in the race for scaling
    const maxBettingPercentage = Math.max(...allBettingPercentages);
    console.log(`📊 Max betting percentage in race: ${maxBettingPercentage}%`);
    
    // For horses using odds fallback, we need to be more careful
    if (usingOddsFallback) {
        console.log(`⚠️ Using odds-derived percentage, comparing against max: ${maxBettingPercentage}%`);
        // If the odds-derived percentage is higher than any real betting percentage,
        // it means this horse has very low odds but no betting data
        if (pct > maxBettingPercentage) {
            console.log(`🔄 Odds-derived percentage too high, capping at max betting percentage`);
            pct = maxBettingPercentage * 0.9; // Slightly lower than the max
        }
    }

    // Calculate points as a direct proportion of the maximum
    // The horse with the highest betting percentage gets 100 points
    // All others get points proportional to their percentage
    const points = Math.round((pct / maxBettingPercentage) * 100);
    
    console.log(`🎯 Final calculation: ${pct}% / ${maxBettingPercentage}% * 100 = ${points} points`);
    return Math.max(0, Math.min(100, points));
}
