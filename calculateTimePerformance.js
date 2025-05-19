import { TIME_POINTS, MAX_CATEGORY_POINTS } from "./pointsConfig.js";

// Funktion för att omvandla kilometertid från "1.14,6" till sekunder
function parseKmTimeToSeconds(kmTime) {
    if (!kmTime || kmTime === "N/A") return NaN;

    const parts = kmTime.split(".");
    if (parts.length !== 2) return NaN;

    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1].replace(",", ".")); // Hanterar både 1.14,7 och 1.14.7

    if (isNaN(minutes) || isNaN(seconds)) return NaN;

    const totalSeconds = minutes * 60 + seconds; // KORREKT BERÄKNING
    return totalSeconds;
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

export function calculateTimePerformance(lastTenStarts, raceDistance, allHorses, horseName) {
    // Filtrera endast starter som har samma distans som det aktuella loppet
    const validStarts = lastTenStarts.filter(start => start.distance === raceDistance);

    if (validStarts.length === 0) {
        return 0;
    }

    const weightedAvgKmTime = calculateWeightedKmTime(validStarts, horseName);

    // Beräkna fältets viktade kilometertid (snitt av varje hästs viktade tid från starter på samma distans)
    const fieldWeightedTimes = allHorses
        .filter(h => h.horse.name !== horseName) // Tar bort den aktuella hästen
        .map(h => {
            const horseValidStarts = h.lastTenStarts.filter(s => s.distance === raceDistance);
            return calculateWeightedKmTime(horseValidStarts, h.horse?.name ?? "Okänd häst");
        })
        .filter(time => time !== null && !isNaN(time));

    const fieldAvgTime = fieldWeightedTimes.length > 0
        ? parseFloat((fieldWeightedTimes.reduce((sum, time) => sum + time, 0) / fieldWeightedTimes.length).toFixed(1))
        : null;

    if (weightedAvgKmTime === null || fieldAvgTime === null) return 0;

    // Beräkna tidsdifferens
    const timeDifference = weightedAvgKmTime - fieldAvgTime;

    // Hitta rätt poäng baserat på trösklar
    let timePoints = [...TIME_POINTS.THRESHOLDS]
        .sort((a, b) => a.minDiff - b.minDiff)
        .find(threshold => timeDifference <= threshold.minDiff)?.points ?? 0;

    // Bonuspoäng
    let bonusPoints = 0;
    const bestTime = Math.min(...validStarts.map(s => parseKmTimeToSeconds(s.time)).filter(time => !isNaN(time)), 500);

    const fieldBestTimes = allHorses.flatMap(h =>
        h.lastTenStarts.filter(s => s.distance === raceDistance).map(s => parseKmTimeToSeconds(s.time))
    ).filter(time => !isNaN(time));

    const fieldBestTime = fieldBestTimes.length > 0 ? Math.min(...fieldBestTimes) : 500;

    if (bestTime < fieldBestTime) {
        bonusPoints += TIME_POINTS.BEST_TIME_BONUS;
    }

    const horseLatestTime = parseKmTimeToSeconds(validStarts[0].time);
    const fieldBestWeightedAvg = Math.min(...fieldWeightedTimes);

    if (horseLatestTime < fieldBestWeightedAvg) {
        bonusPoints += TIME_POINTS.RECENT_RACE_BONUS;
    }

    // Begränsa till maxpoäng för kategori 'tid'
    const totalTimePoints = Math.min(timePoints + bonusPoints, MAX_CATEGORY_POINTS.tid);

    return totalTimePoints;
}