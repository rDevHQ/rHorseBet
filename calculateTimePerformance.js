import { TIME_POINTS, MAX_CATEGORY_POINTS } from "./pointsConfig.js";

// Funktion för att omvandla kilometertid från "1.14,6" till sekunder
function parseKmTimeToSeconds(kmTime) {
    if (
        !kmTime ||
        kmTime === "N/A" ||
        kmTime === "undefined.undefined,undefined" ||
        kmTime === "undefined" ||
        kmTime === "-" ||
        typeof kmTime !== "string"
    ) {
        return NaN;
    }

    const parts = kmTime.split(".");
    if (parts.length !== 2) return NaN;

    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1].replace(",", "."));

    if (isNaN(minutes) || isNaN(seconds)) return NaN;

    return minutes * 60 + seconds;
}

// Funktion för att visa kilometertid i rätt format
function formatKmTime(timeInSeconds) {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "N/A";

    let minutes = Math.floor(timeInSeconds / 60);
    let seconds = Math.floor(timeInSeconds % 60);
    let tenths = Math.round(((timeInSeconds % 1) * 10)); // Tiondelarna direkt från sekunder

    return `${minutes}.${seconds},${tenths}`;
}

// Funktion för att beräkna viktad kilometertid
function calculateWeightedKmTime(lastTenStarts, horseName) {
    if (!lastTenStarts || lastTenStarts.length === 0) {
        return null;
    }

    // Filtrera bort ogiltiga tider innan beräkning
    const validTimes = lastTenStarts
        .map(s => ({ time: s.time, seconds: parseKmTimeToSeconds(s.time) }))
        .filter(s => !isNaN(s.seconds) && s.seconds !== null);

    if (validTimes.length === 0) {
        return null;
    }

    let weightedSum = 0;
    let weightTotal = 0;

    validTimes.forEach((start, index) => {
        const weight = validTimes.length - index; // Nyare starter väger mer
        weightedSum += start.seconds * weight;
        weightTotal += weight;
    });

    const weightedKmTime = parseFloat((weightedSum / weightTotal).toFixed(1));

    return weightedKmTime;
}

export function calculateTimePerformance(lastTenStarts, raceDistance, raceStartMethod, allHorses, horseName) {
    // 1. Filtrera ut endast de starter som har samma distans, startmetod och INTE är diskade
    const validStarts = lastTenStarts.filter(
        start =>
            start.distance === raceDistance &&
            start.startMethod === raceStartMethod &&
            !start.disqualified
    );

    if (validStarts.length === 0) {
        // Om hästen inte har några starter på rätt distans, ge 0 poäng och en enkel tooltip
        return {
            timePoints: 0,
            timeTooltip: "Inga giltiga starter på denna distans/startmetod.",
            weightedAvgKmTime: null,
            validStartsCount: 0,
            fieldAvgTime: null,
            bonusPoints: 0,
            bestFieldTime: null,
            bestFieldHorse: null
        };
    }

    // 2. Beräkna hästens viktade kilometertid för rätt distans
    const weightedAvgKmTime = calculateWeightedKmTime(validStarts, horseName);

    // 3. Beräkna fältets (alla andra hästars) viktade kilometertider för rätt distans
    const fieldWeightedTimes = allHorses
        .filter(h => h.horse.name !== horseName)
        .map(h => {
            const horseValidStarts = h.lastTenStarts.filter(
                s =>
                    s.distance === raceDistance &&
                    String(s.startMethod).toLowerCase().trim() === String(raceStartMethod).toLowerCase().trim() &&
                    !s.disqualified
            );
            return calculateWeightedKmTime(horseValidStarts, h.horse?.name ?? "Okänd häst");
        })
        .filter(time => time !== null && !isNaN(time)); // Ta bort ogiltiga tider

    // 4. Beräkna fältets genomsnittliga viktade kilometertid
    const fieldAvgTime = fieldWeightedTimes.length > 0
        ? parseFloat((fieldWeightedTimes.reduce((sum, time) => sum + time, 0) / fieldWeightedTimes.length).toFixed(1))
        : null;

    if (weightedAvgKmTime === null || fieldWeightedTimes.length === 0) {
        return {
            timePoints: 0,
            timeTooltip: "Inga giltiga tider på denna distans/startmetod.",
            weightedAvgKmTime: null,
            validStartsCount: validStarts.length,
            fieldAvgTime: null,
            bonusPoints: 0,
            bestFieldTime: null,
            bestFieldHorse: null
        };
    }

    // Logaritmisk normalisering (lägre tid = bättre)
    const allTimes = [weightedAvgKmTime, ...fieldWeightedTimes];
    const logTimes = allTimes.map(t => Math.log(t || 0.01));
    const logMin = Math.min(...logTimes); // snabbast
    const logMax = Math.max(...logTimes); // långsammast
    const logCurrent = Math.log(weightedAvgKmTime || 0.01);

    let normalized = 1 - ((logCurrent - logMin) / (logMax - logMin)); // snabbast får 1, långsammast får 0
    normalized = Math.max(0, Math.min(1, normalized)); // clamp

    const maxPoints = MAX_CATEGORY_POINTS.tid;
    let timePoints = Math.round(normalized * maxPoints);

    // 7. Bonuspoäng om hästen har bästa rekord eller bästa senaste prestation
    let bonusPoints = 0;

    // Hitta hästens bästa tid på distansen
    const bestTime = Math.min(...validStarts.map(s => parseKmTimeToSeconds(s.time)).filter(time => !isNaN(time)), 500);

    // Hitta fältets bästa tid och vilken häst som har den (exkludera aktuell häst)
    const fieldBestTimes = allHorses
        .filter(h => h.horse.name !== horseName)
        .flatMap(h =>
            h.lastTenStarts.filter(
                s =>
                    s.distance === raceDistance &&
                    String(s.startMethod).toLowerCase().trim() === String(raceStartMethod).toLowerCase().trim() &&
                    !s.disqualified
            ).map(s => ({
                time: parseKmTimeToSeconds(s.time),
                horse: h.horse?.name ?? "Okänd häst"
            }))
        )
        .filter(obj => !isNaN(obj.time));

    const fieldBestTimeObj = fieldBestTimes.length > 0
        ? fieldBestTimes.reduce((best, curr) => curr.time < best.time ? curr : best)
        : { time: 500, horse: null };

    const fieldBestTime = fieldBestTimeObj.time;
    const bestFieldHorse = fieldBestTimeObj.horse;

    // Bonus om hästen har bästa rekord
    if (bestTime < fieldBestTime) {
        bonusPoints += TIME_POINTS.BEST_TIME_BONUS;
    }

    // Bonus om hästen har bästa senaste prestation (senaste start)
    const horseLatestTime = parseKmTimeToSeconds(validStarts[0].time);
    const fieldBestWeightedAvg = Math.min(...fieldWeightedTimes);

    if (horseLatestTime < fieldBestWeightedAvg) {
        bonusPoints += TIME_POINTS.RECENT_RACE_BONUS;
    }

    // Summera poäng och bonus, men begränsa inte med MAX_CATEGORY_POINTS.tid eftersom bonusen är utanför
    let totalTimePoints = timePoints + bonusPoints;

    // Om denna häst har giltig tid men får 0 poäng, och det finns minst en häst utan giltig tid, ge minst 1 poäng
    const horsesWithoutValidTime = allHorses.filter(h =>
        !h.lastTenStarts.some(s => s.distance === raceDistance && String(s.startMethod).toLowerCase().trim() === String(raceStartMethod).toLowerCase().trim())
    );

    if (timePoints === 0 && weightedAvgKmTime !== null && horsesWithoutValidTime.length > 0) {
        totalTimePoints = 1 + bonusPoints;
    }

    // Bygg tooltip-sträng
    const tooltip = `
Viktad km-tid: ${formatKmTime(weightedAvgKmTime)} (${weightedAvgKmTime ?? "N/A"} sek)
Antal giltiga starter: ${validStarts.length}
Fältets snitt: ${formatKmTime(fieldAvgTime)} (${fieldAvgTime ?? "N/A"} sek)
Poäng (logaritmisk): ${timePoints}
Bästa tid: ${formatKmTime(bestTime)} (${bestTime ?? "N/A"} sek)
Bästa tid i fältet (exkl ${horseName}): ${formatKmTime(fieldBestTime)} (${bestFieldHorse ?? "N/A"})
Bonuspoäng: ${bonusPoints}
Total tidspoäng: ${totalTimePoints}
`.trim();

    return {
        timePoints: totalTimePoints,
        timeTooltip: tooltip
    };
}