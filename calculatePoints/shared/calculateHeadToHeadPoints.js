/**
 * Beräknar relativ Head-to-Head (H2H) poäng för en häst baserat på dess placeringar i lopp jämfört med
 * övriga konkurrenter som deltagit i samma lopp.
 *
 * Poängen för varje möte (gemensamt lopp) viktas med motståndarens bettingpoäng, vilket ger högre
 * vikt åt möten mot starkare motståndare enligt spelarnas insatser.
 *
 * Vid vinst ger poängen högre värde ju högre motståndarens bettingpoäng är.
 * Vid förlust viktas poängen inverterat, dvs en förlust mot en svag häst ger större minuspoäng
 * än mot en stark häst.
 *
 * Summan av viktade mötespoäng normaliseras sedan till en skala mellan 1 och 100 baserat på min- och maxpoäng
 * i hela startfältet för att skapa en rättvis jämförelse mellan hästar.
 *
 * Funktionen returnerar både den normaliserade poängen och en lista med detaljerade mötesresultat
 * inklusive resultat per möte och viktad poäng.
 *
 * @param {Array} lastTenStarts - Hästens senaste starter med placeringar och lopp-ID.
 * @param {Array} allHorses - Lista med alla hästar i loppet, inklusive deras starter och bettingpoäng.
 * @param {string} horseName - Namnet på hästen som poängen ska beräknas för.
 * @param {number} [unplacedValue=10] - Värde som används för ogiltiga eller oplacerade starter (default 10).
 * @returns {Object} Objekt med normaliserad poäng (1-100) och lista över möten med detaljer.
 */
export function calculateHeadToHeadPoints(lastTenStarts, allHorses, horseName, unplacedValue = 10) {
    const meetings = [];

    function calculateRawH2HPoints(targetHorseLastTenStarts, targetHorseName, collectMeetings = false) {
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
                    const opponentBettingPoints = opponent.bettingPercentagePoints || 1; // Undvik 0 vid division

                    let weightedPoints = 0;

                    if (diff < 0) {
                        // Vinst mot motståndare: viktas med motståndarens bettingpoäng (starkare motstånd ger högre poäng)
                        weightedPoints = Math.abs(diff) * opponentBettingPoints;
                        totalPoints += weightedPoints;
                    } else if (diff > 0) {
                        // Förlust mot motståndare: viktas inverterat, dvs förlust mot svag motståndare ger större minuspoäng
                        weightedPoints = -Math.abs(diff) * (100 - opponentBettingPoints);
                        totalPoints += weightedPoints;
                    }

                    if (collectMeetings) {
                        const meeting = {
                            opponent: opponent.horse.name,
                            raceId,
                            selfPosition: horsePosition,
                            opponentPosition,
                            opponentBettingPoints,
                            weightedPoints,
                            diff,
                            result: diff < 0 ? 'Vinst' : diff > 0 ? 'Förlust' : 'Oavgjort'
                        };
                        meetings.push(meeting);

                    //    console.log(`🐴 ${targetHorseName} Meeting: ${meeting.opponent}, ${meeting.result}, Diff: ${meeting.diff}, BP: ${meeting.opponentBettingPoints}, Total: ${meeting.weightedPoints} `);
                    }
                }
            });
        });

        return totalPoints;
    }

    // Beräkna poängen för aktuell häst och samla möten
    const horseRaw = calculateRawH2HPoints(lastTenStarts, horseName, true);

    // Beräkna råpoäng för alla andra hästar (utan att samla möten)
    const rawValues = allHorses
        .filter(h => h.horse?.name !== horseName)
        .map(h => calculateRawH2HPoints(h.lastTenStarts, h.horse.name))
        .concat(horseRaw);

    const minRaw = Math.min(...rawValues);
    const maxRaw = Math.max(...rawValues);

    if (maxRaw === minRaw) {
        return {
            points: 50,
            meetings
        };
    }

    const normalized = (horseRaw - minRaw) / (maxRaw - minRaw);
    const scaledPoints = Math.round(normalized * 99 + 1);

    return {
        points: scaledPoints,
        meetings
    };
}