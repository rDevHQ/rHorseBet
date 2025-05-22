import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

export function calculateClassPoints(horse, allHorses) {
    if (!horse || !horse.lastTenStarts || !horse.lastMonthSummary) return 0;

    const maxPoints = MAX_CATEGORY_POINTS.klass;

    function getLastMonthyAvgPrize(h) {
        return parseFloat(h.lastMonthSummary?.firstPrizeAverage ?? "0") || 0;
    }

    function getWeightedLastTenPrize(h) {
        let total = 0;
        let weight = 0;

        h.lastTenStarts?.forEach((start, index) => {
            if (!start || start.position === "N/A") return;
            const w = 10 - index; // Senaste starten får vikt 10, näst senaste 9, ... äldsta får 1
            const p = parseInt(start.firstPrize) || 0;
            total += p * w;
            weight += w;
        });

        return weight > 0 ? total / weight : 0;
    }

    // Råklasspoäng per häst (summa av senaste månaden och viktad snitt)
    const allScores = allHorses.map(h => getLastMonthyAvgPrize(h) + getWeightedLastTenPrize(h));
    const thisHorseRaw = getLastMonthyAvgPrize(horse) + getWeightedLastTenPrize(horse);

    // Logaritmisk normalisering
    const logScores = allScores.map(s => Math.log(s || 0.01)); // undvik log(0)
    const logMin = Math.min(...logScores);
    const logMax = Math.max(...logScores);
    const logCurrent = Math.log(thisHorseRaw || 0.01);

    if (logMax === logMin) {
        return Math.round(maxPoints / 2);
    }

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const final = Math.round(normalized * maxPoints);

    return final;
}