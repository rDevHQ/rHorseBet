interface HorseStartRecord {
    firstPrize: string;
    position: string;
    // Add other properties as needed
}

interface LastMonthSummary {
    firstPrizeAverage: string;
    // Add other properties as needed
}

interface Horse {
    lastTenStarts?: HorseStartRecord[];
    lastMonthSummary?: LastMonthSummary;
    // Add other properties as needed
}

export function calculateClassPoints(horse: Horse, allHorses: Horse[]): number {
    if (!horse || !horse.lastTenStarts || !horse.lastMonthSummary) return 0;

    const maxPoints = 100;

    function getLastMonthylAvgPrize(h: Horse): number {
        return parseFloat(h.lastMonthSummary?.firstPrizeAverage ?? "0") || 0;
    }

    function getWeightedLastTenPrize(h: Horse): number {
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
    const allScores = allHorses.map(h => getLastMonthylAvgPrize(h) + getWeightedLastTenPrize(h));
    const thisHorseRaw = getLastMonthylAvgPrize(horse) + getWeightedLastTenPrize(horse);

    // Normalisering till skala 1-100:
    // Råpoängen kan variera kraftigt i storlek, så vi använder logaritmisk normalisering
    // för att få en bättre spridning och balans i poängen över hästarna.
    // Om alla råpoäng är lika (logMax === logMin) så tilldelas poängen 50 som neutralvärde.
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
