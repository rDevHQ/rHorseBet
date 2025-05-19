import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

/**
 * Relativ H2H-poäng:
 * - Jämför hästens placeringar mot konkurrenterna i varje gemensamt lopp
 * - Summerar poäng per möte
 * - Skalar till 0–MAX_CATEGORY_POINTS.h2h beroende på fältets min/max
 */
export function calculateHeadToHeadPoints(lastTenStarts, allHorses, horseName, unplacedValue = 7, maxPointsPerComparison = 3) {
    const allScores = [];

    function calculateRawH2HPoints(targetHorseLastTenStarts, targetHorseName) {
        const meetings = [];
        // Log raceIds and positions for the current horse
        console.log(`🔍 H2H-analys för ${targetHorseName} – antal starter: ${targetHorseLastTenStarts?.length}`);
        targetHorseLastTenStarts?.forEach(s => {
            console.log(`   ↪️ ${s.raceId} – pos: ${s.position}`);
        });
        let totalPoints = 0;

        targetHorseLastTenStarts?.forEach(start => {
            if (!start || start.position === "N/A") return;

            const raceId = start.raceId;
            const horseRawPosition = parseInt(start.position);
            const horsePosition = horseRawPosition === 0 ? unplacedValue : horseRawPosition;
            

            allHorses.forEach(opponent => {
                if (!opponent.lastTenStarts || !Array.isArray(opponent.lastTenStarts)) return;
                if (opponent.horse.name === targetHorseName) return;

                const opponentRace = opponent.lastTenStarts.find(s => s.raceId === raceId);
                if (opponentRace && opponentRace.position !== "N/A") {
                    const opponentRawPosition = parseInt(opponentRace.position);
                    const opponentPosition = opponentRawPosition === 0 ? unplacedValue : opponentRawPosition;

                    const diff = horsePosition - opponentPosition;
                    console.log(`[${targetHorseName}] vs ${opponent.horse.name} i race ${raceId}: ${horsePosition} vs ${opponentPosition}, diff = ${diff}`);

                    meetings.push({
                      opponent: opponent.horse.name,
                      raceId,
                      selfPosition: horsePosition,
                      opponentPosition,
                      result: diff < 0 ? 'Vinst' : diff > 0 ? 'Förlust' : 'Oavgjort'
                    });

                    if (diff < 0) {
                        const pts = Math.min(Math.abs(diff), maxPointsPerComparison);
                        console.log(`✅ Vann möte, +${pts} poäng`);
                        totalPoints += pts;
                    } else if (diff > 0) {
                        const pts = Math.min(diff, maxPointsPerComparison);
                        console.log(`❌ Förlorade möte, -${pts} poäng`);
                        totalPoints -= pts;
                    }
                }
            });
        });

        return { totalPoints, meetings };
    }

    const { totalPoints: horseRaw, meetings } = calculateRawH2HPoints(lastTenStarts, horseName);

    const rawValues = allHorses
      .filter(h => h.horse?.name !== horseName)
      .map(h => calculateRawH2HPoints(h.lastTenStarts, h.horse.name).totalPoints)
      .concat(horseRaw);

    const maxPoints = MAX_CATEGORY_POINTS.h2h;

    const minRaw = Math.min(...rawValues);
    const maxRaw = Math.max(...rawValues);

    if (maxRaw === minRaw) {
        // Return both points and meetings for tooltip and analysis
        return {
            points: Math.round(maxPoints / 2), // Alla lika
            meetings
        };
    }

    let finalPoints;
    const anyExtreme = rawValues.some(p => Math.abs(p) >= maxPoints);

    if (anyExtreme && maxRaw !== minRaw) {
        const normalized = ((horseRaw - minRaw) / (maxRaw - minRaw)) * (maxPoints * 2) - maxPoints;
        finalPoints = Math.round(Math.max(-maxPoints, Math.min(maxPoints, normalized)));
    } else {
        finalPoints = Math.round(Math.max(-maxPoints, Math.min(maxPoints, horseRaw)));
    }

    return {
        points: finalPoints,
        meetings
    };
}