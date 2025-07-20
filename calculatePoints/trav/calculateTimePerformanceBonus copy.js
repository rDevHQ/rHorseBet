import { parseKmTimeToSeconds } from "../utils/parseKmTimeToSeconds.js";
import { TIME_POINTS } from "../pointsConfig/trav/pointsConfigUpsets.js";
import { normalizeTimePoints } from "../utils/normalizeTimePoints.js";

// Separat funktion för att räkna ut bonuspoäng för tidsprestation
export function calculateTimePerformanceBonus(validStarts, allHorses, horseName, raceDistance, raceStartMethod, fieldWeightedTimes) {
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

    return {
        bonusPoints,
        bestTime,
        fieldBestTime,
        bestFieldHorse
    };
}
