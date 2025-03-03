export function calculateHeadToHeadPoints(lastFiveStarts, allHorses, horseName) {
    let h2hPoints = 0;

    lastFiveStarts.forEach(start => {
        if (!start || start.position === "N/A") return; // Hoppa över ogiltiga starter

        const raceId = start.raceId;
        const horsePosition = parseInt(start.position);

        allHorses.forEach(opponent => {
            if (!opponent.lastFiveStarts || !Array.isArray(opponent.lastFiveStarts)) return; // Säkerställ att opponent har en giltig array
            if (opponent.horse.name === horseName) return; // Hoppa över sig själv

            const opponentRace = opponent.lastFiveStarts.find(s => s.raceId === raceId);
            if (opponentRace && opponentRace.position !== "N/A") {
                const opponentPosition = parseInt(opponentRace.position);
                
                let resultText = "";
                if (horsePosition < opponentPosition) {
                    h2hPoints += 3; // Bättre placering än motståndaren
                } else if (horsePosition > opponentPosition) {
                    h2hPoints -= 3; // Sämre placering än motståndaren
                } else {
                    h2hPoints += 0; // Samma placering som motståndaren
                }
            }
        });
    });

    return h2hPoints;
}