export function calculateClassPoints(horse, allHorses) {
    if (!horse || !horse.lastFiveStarts || !horse.last3MonthsSummary) return 0;

    const horseName = horse.horse?.name ?? "Unknown Horse";
    let horseAvgPrize = parseFloat(horse.last3MonthsSummary?.firstPrizeAverage ?? "0");

    if (isNaN(horseAvgPrize) || horseAvgPrize <= 0) horseAvgPrize = 0;

    const fieldPrizes = allHorses.map(h => parseFloat(h.last3MonthsSummary?.firstPrizeAverage ?? "0")).filter(value => value > 0);
    const fieldAvg = fieldPrizes.length > 0 ? fieldPrizes.reduce((sum, value) => sum + value, 0) / fieldPrizes.length : 1;

    let weightedPrizeMoney = 0;
    let totalWeight = 0;

    horse.lastFiveStarts.forEach((start, index) => {
        if (!start || start.position === "N/A") return;

        const weight = 7 - index; // More recent races weigh more
        totalWeight += weight;

        let firstPrize = parseInt(start.firstPrize) || 0;
        weightedPrizeMoney += firstPrize * weight;

    });

    const horseRecentPrize = totalWeight > 0 ? weightedPrizeMoney / totalWeight : 0;

    const fieldRecentPrizes = allHorses.flatMap(h => h.lastFiveStarts.map(s => parseInt(s.firstPrize) || 0)).filter(p => p > 0);
    const fieldRecentAvg = fieldRecentPrizes.length > 0 ? fieldRecentPrizes.reduce((sum, val) => sum + val, 0) / fieldRecentPrizes.length : 1;

    let classPoints = 0;
    if (horseAvgPrize > fieldAvg * 1.25) classPoints += 5;
    else if (horseAvgPrize >= fieldAvg * 0.8) classPoints += 3;
    else classPoints += 1;

    if (horseRecentPrize > fieldRecentAvg * 1.25) classPoints += 5;
    else if (horseRecentPrize >= fieldRecentAvg * 0.8) classPoints += 3;
    else classPoints += 1;

    return classPoints;
}