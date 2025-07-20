import { getDistanceCategory } from "../utils/distanceCategory.js";
import { normalizeTimePoints } from "../utils/normalizeTimePoints.js";
import { parseKmTimeToSeconds } from "../utils/parseKmTimeToSeconds.js";
import { formatKmTime } from "../utils/formatKmTime.js";

// Funktion för att beräkna viktad kilometertid
function calculateWeightedKmTime(lastTenStarts, horseName) {
    if (!lastTenStarts || lastTenStarts.length === 0) {
        return null;
    }

    const WEIGHT_FACTORS = [2.0, 1.6, 1.3, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2];

    // Behåll alla index, men sätt ogiltiga tider till 0
    const validTimes = lastTenStarts
        .map(s => {
            const seconds = parseKmTimeToSeconds(s.time);
            return { time: s.time, seconds: (!isNaN(seconds) && seconds !== null) ? seconds : 0 };
        });

    if (validTimes.length === 0) {
        return null;
    }

    let weightedSum = 0;
    let weightTotal = 0;

    validTimes.forEach((start, index) => {
        // Sätt vikten till 0 om tiden är 0 (ogiltig), annars använd viktfaktorn
        const weight = (start.seconds > 0 ? (WEIGHT_FACTORS[index] || 1.0) : 0);
        weightedSum += start.seconds * weight;
        weightTotal += weight;

        //        console.log(`Horse: ${horseName} Index: ${index}, Seconds: ${start.seconds}, Weight: ${weight}, Weighted Sum: ${weightedSum}`);
    });

    const weightedKmTime = parseFloat((weightedSum / weightTotal).toFixed(1));

    //    console.log(`Weighted Km Time for ${horseName}: ${weightedKmTime} seconds (Sum: ${weightedSum}, Total Weight: ${weightTotal})`);
    return weightedKmTime;
}

export function calculateTimePerformanceLastTenStarts(lastTenStarts, raceDistance, raceStartMethod, allHorses, horseName) {

 //   console.log(`-----------------------------------------------------`);

    // 1. Behåll alla index, men sätt ogiltiga starter till ett objekt med time: "0" (jämför distanskategori)
    const raceCategory = getDistanceCategory(raceDistance);

    //    console.log(`Calculating time performance for ${horseName} on distance ${raceCategory} with start method ${raceStartMethod}`);

    // Kontrollera om startens distanskategori och startmetod matchar loppets
    const validStarts = lastTenStarts.map(start => {
        const startCategory = getDistanceCategory(start.distance);

        //       console.log(`Start: ${start.distance} (${startCategory}), Method: ${start.startMethod}, Disqualified: ${start.disqualified}`);
        if (
            startCategory === raceCategory &&
            start.startMethod === raceStartMethod &&
            !start.disqualified
        ) {
            return start;
        } else {
            // Sätt ogiltiga starter till ett "tomt" objekt men behåll index
            return { ...start, time: "0" };
        }
    });

    // Kolla om ALLA starter är ogiltiga (dvs alla har time: "0")
    const allInvalid = validStarts.every(s => s.time === "0");
    if (validStarts.length === 0 || allInvalid) {
        // Om hästen inte har några starter på rätt distans, ge 0 poäng och en enkel tooltip
        return {
            timePoints: 0,
            timeTooltip: "Inga giltiga starter på denna distans/startmetod."
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
                    getDistanceCategory(s.distance) === raceCategory &&
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
            timePerformanceLastTenStartsPoints: 0,
            timePerformanceLastTenStartsTooltip: "Inga giltiga tider på denna distans/startmetod."
        };
    }

    // Samla alla giltiga tider (inklusive aktuell häst)
    const allTimes = [...fieldWeightedTimes, weightedAvgKmTime];

    // Normalisera tidspoäng separat
    const timePoints = normalizeTimePoints(weightedAvgKmTime, allTimes);

    // Bygg tooltip-sträng
    const tooltip = `
Viktad km-tid: ${formatKmTime(weightedAvgKmTime)} (${weightedAvgKmTime ?? "N/A"} sek)
Fältets viktade snitt (exklusive ${horseName}): ${formatKmTime(fieldAvgTime)} (${fieldAvgTime ?? "N/A"} sek)
Total tidspoäng: ${timePoints}
`.trim();

//    console.log(`Time performance for ${horseName}:`, { tooltip });

    return {
        timePerformanceLastTenStartsPoints: timePoints,
        timePerformanceLastTenStartsTooltip: tooltip
    };
}