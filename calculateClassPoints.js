import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

export function calculateClassPoints(horse, allHorses) {
    if (!horse || !horse.lastFiveStarts || !horse.last3MonthsSummary) return 0;

    const horseName = horse.horse?.name ?? "Unknown Horse";
    const maxPoints = MAX_CATEGORY_POINTS.klass;

    function getAvgPrize(h) {
        return parseFloat(h.last3MonthsSummary?.firstPrizeAverage ?? "0") || 0;
    }

    function getRecentPrize(h) {
        let total = 0;
        let weight = 0;

        h.lastFiveStarts?.forEach((start, index) => {
            if (!start || start.position === "N/A") return;
            const w = 7 - index;
            const p = parseInt(start.firstPrize) || 0;
            total += p * w;
            weight += w;
        });

        return weight > 0 ? total / weight : 0;
    }

    // Steg 1: Råklasspoäng per häst (summa av 3-månaders och viktad snitt)
    const allScores = allHorses.map(h => ({
        name: h.horse?.name,
        raw: getAvgPrize(h) + getRecentPrize(h)
    }));

    const thisHorseRaw = getAvgPrize(horse) + getRecentPrize(horse);
    const values = allScores.map(s => s.raw);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
        // console.log(`⚖️ ${horseName}: Alla hästar har samma klasspoäng – ger ${Math.round(maxPoints / 2)}`);
        return Math.round(maxPoints / 2);
    }

    const normalized = ((thisHorseRaw - min) / (max - min)) * maxPoints;
    const final = Math.round(normalized);

    // console.log(`📊 ${horseName}: Råklass ${thisHorseRaw.toFixed(1)} – normaliserad till ${final}/${maxPoints}`);
    return final;
}