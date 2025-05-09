export function calculateHeadToHeadPoints(lastFiveStarts, allHorses, horseName) {
    let h2hPoints = 0;

    lastFiveStarts.forEach(start => {
        if (!start || start.position === "N/A") return;

        const raceId = start.raceId;
        const horsePosition = parseInt(start.position);

        allHorses.forEach(opponent => {
            if (!opponent.lastFiveStarts || !Array.isArray(opponent.lastFiveStarts)) return;
            if (opponent.horse.name === horseName) return;

            const opponentRace = opponent.lastFiveStarts.find(s => s.raceId === raceId);
            if (opponentRace && opponentRace.position !== "N/A") {
                const opponentPosition = parseInt(opponentRace.position);

                if (horsePosition === 0 && opponentPosition > 0) {
                    // Vår häst är oplacerad, motståndaren placerad
                    h2hPoints -= 3;
                    console.log(`❌ ${horseName} (oplacerad) vs ${opponent.horse.name} (${opponentPosition}) - Oplacerad: -3 poäng`);
                } else if (horsePosition > 0 && opponentPosition === 0) {
                    // Vår häst placerad, motståndaren oplacerad
                    h2hPoints += 3;
                    console.log(`🏆 ${horseName} (${horsePosition}) vs ${opponent.horse.name} (oplacerad) - Bättre placering: +3 poäng`);
                } else if (horsePosition === 0 && opponentPosition === 0) {
                    // Båda oplacerade
                    console.log(`⚖️ ${horseName} (oplacerad) vs ${opponent.horse.name} (oplacerad) - Lika: 0 poäng`);
                } else if (horsePosition > 0 && opponentPosition > 0 && horsePosition < opponentPosition) {
                    // Båda placerade, vår häst är bättre
                    h2hPoints += 3;
                    console.log(`🏆 ${horseName} (${horsePosition}) vs ${opponent.horse.name} (${opponentPosition}) - Bättre placering: +3 poäng`);
                } else if (horsePosition > 0 && opponentPosition > 0 && horsePosition > opponentPosition) {
                    // Båda placerade, motståndaren är bättre
                    h2hPoints -= 3;
                    console.log(`❌ ${horseName} (${horsePosition}) vs ${opponent.horse.name} (${opponentPosition}) - Sämre placering: -3 poäng`);
                } else if (horsePosition === opponentPosition) {
                    // Samma placering
                    console.log(`⚖️ ${horseName} (${horsePosition}) vs ${opponent.horse.name} (${opponentPosition}) - Lika placering: 0 poäng`);
                }
            }
        });
    });

    return h2hPoints;
}