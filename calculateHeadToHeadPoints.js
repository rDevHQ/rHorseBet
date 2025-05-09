export function calculateHeadToHeadPoints(lastFiveStarts, allHorses, horseName, unplacedValue = 7, maxPointsPerComparison = 5) {
    let h2hPoints = 0;

    lastFiveStarts.forEach(start => {
        if (!start || start.position === "N/A") return;

        const raceId = start.raceId;
        const horseRawPosition = parseInt(start.position);
        const horsePosition = horseRawPosition === 0 ? unplacedValue : horseRawPosition;

        allHorses.forEach(opponent => {
            if (!opponent.lastFiveStarts || !Array.isArray(opponent.lastFiveStarts)) return;
            if (opponent.horse.name === horseName) return;

            const opponentRace = opponent.lastFiveStarts.find(s => s.raceId === raceId);
            if (opponentRace && opponentRace.position !== "N/A") {
                const opponentRawPosition = parseInt(opponentRace.position);
                const opponentPosition = opponentRawPosition === 0 ? unplacedValue : opponentRawPosition;

                const diff = horsePosition - opponentPosition;

                if (diff < 0) {
                    const points = Math.min(Math.abs(diff), maxPointsPerComparison);
                    h2hPoints += points;
                    console.log(`🏆 ${horseName} (${horseRawPosition}) vs ${opponent.horse.name} (${opponentRawPosition}) - +${points} poäng (bättre placering)`);
                } else if (diff > 0) {
                    const points = Math.min(diff, maxPointsPerComparison);
                    h2hPoints -= points;
                    console.log(`❌ ${horseName} (${horseRawPosition}) vs ${opponent.horse.name} (${opponentRawPosition}) - −${points} poäng (sämre placering)`);
                } else {
                    console.log(`⚖️ ${horseName} (${horseRawPosition}) vs ${opponent.horse.name} (${opponentRawPosition}) - Lika placering: 0 poäng`);
                }
            }
        });
    });

    return h2hPoints;
}