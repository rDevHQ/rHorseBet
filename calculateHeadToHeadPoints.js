import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

/**
 * Relativ H2H-poäng:
 * - Jämför hästens placeringar mot konkurrenterna i varje gemensamt lopp
 * - Summerar poäng per möte
 * - Skalar till 0–MAX_CATEGORY_POINTS.h2h beroende på fältets min/max
 */
export function calculateHeadToHeadPoints(lastFiveStarts, allHorses, horseName, unplacedValue = 7, maxPointsPerComparison = 5) {
    const allScores = [];

    function calculateRawH2HPoints(targetHorse, allHorses) {
        let totalPoints = 0;

        targetHorse.lastFiveStarts?.forEach(start => {
            if (!start || start.position === "N/A") return;

            const raceId = start.raceId;
            const horseRawPosition = parseInt(start.position);
            const horsePosition = horseRawPosition === 0 ? unplacedValue : horseRawPosition;

            allHorses.forEach(opponent => {
                if (!opponent.lastFiveStarts || !Array.isArray(opponent.lastFiveStarts)) return;
                if (opponent.horse.name === targetHorse.horse.name) return;

                const opponentRace = opponent.lastFiveStarts.find(s => s.raceId === raceId);
                if (opponentRace && opponentRace.position !== "N/A") {
                    const opponentRawPosition = parseInt(opponentRace.position);
                    const opponentPosition = opponentRawPosition === 0 ? unplacedValue : opponentRawPosition;

                    const diff = horsePosition - opponentPosition;

                    if (diff < 0) {
                        totalPoints += Math.min(Math.abs(diff), maxPointsPerComparison);
                    } else if (diff > 0) {
                        totalPoints -= Math.min(diff, maxPointsPerComparison);
                    }
                }
            });
        });

        return totalPoints;
    }

    // Steg 1: räkna rå H2H-poäng för alla hästar i fältet
    allHorses.forEach(h => {
        const score = calculateRawH2HPoints(h, allHorses);
        allScores.push({ name: h.horse.name, raw: score });
    });

    // Hämta aktuell hästs poäng
    const horseRaw = allScores.find(s => s.name === horseName)?.raw ?? 0;

    // Skala till 0–MAX_CATEGORY_POINTS.h2h
    const rawValues = allScores.map(s => s.raw);
    const min = Math.min(...rawValues);
    const max = Math.max(...rawValues);
    const maxPoints = MAX_CATEGORY_POINTS.h2h;

    if (min === max) {
        return Math.round(maxPoints / 2); // Alla lika
    }

    const normalized = ((horseRaw - min) / (max - min)) * maxPoints;
    return Math.round(normalized);
}