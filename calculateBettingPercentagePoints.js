export function calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages) {
    // Lägg till en fiktiv häst med 0% för att stabilisera skalan
    let bettingPercentages = [...allBettingPercentages, 0]; // Kopiera arrayen och lägg till 0%

    // Hämta min och max spelprocent
    let minBet = Math.min(...bettingPercentages); // Ska alltid vara 0
    let maxBet = Math.max(...bettingPercentages); // Högsta faktiska spelprocent

    if (maxBet === minBet) {
        console.warn("⚠️ MaxBet och MinBet är lika - alla hästar får 0 poäng.");
        return 0;
    }

    // Justerad formel för korrekt normalisering
    let bettingPoints = ((bettingPercentage - minBet) / (maxBet - minBet)) * 10;

    // Säkerställ att den mest spelade hästen får exakt 10 poäng
    if (bettingPercentage === maxBet) {
        console.log(`✅ Häst med maxBet (${maxBet}%) får exakt 10 poäng.`);
        return 10;
    }

    let roundedPoints = Math.round(bettingPoints);

    return roundedPoints;
}