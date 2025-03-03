export function calculateFormPoints(horseName, lastFiveStarts, last3MonthsSummary) {

    // Viktfaktorer för de senaste starterna
    const weightFactors = [1.6, 1.3, 1.1, 1.0, 0.9];

    // Poäng per placering
    const placementPoints = {
        1: 3,  // 1:a plats
        2: 2,  // 2:a plats
        3: 1   // 3:e plats
    };

    // Kontrollera att `lastFiveStarts` är en giltig array
    if (!Array.isArray(lastFiveStarts) || lastFiveStarts.length === 0) {
        console.log(`⚠️ [${horseName}] Inga senaste starter tillgängliga. Formpoäng = 0`);
        return 0;
    }

    // Beräkna viktade poäng från de senaste 5 starterna
    let formPoints = lastFiveStarts.reduce((total, start, index) => {
        if (!start || !start.position || start.position === "N/A") {
            console.log(`⚠️ [${horseName}] Ignorerar start ${index + 1}, ogiltig position: ${start?.position}`);
            return total;
        }

        let place = parseInt(start.position, 10); // Säkerställ att vi har ett heltal
        if (isNaN(place)) {
            console.log(`⚠️ [${horseName}] Placering ej numerisk i start ${index + 1}: ${start.position}`);
            return total;
        }

        let basePoints = placementPoints[place] || 0; // Hämta poäng, annars 0
        let weight = weightFactors[index] || 1.0; // Hämta viktfaktor, annars 1.0
        let weightedPoints = basePoints * weight;
        return total + weightedPoints;
    }, 0);

    // Lägg till extra poäng från last3MonthsSummary
    if (last3MonthsSummary && typeof last3MonthsSummary === 'object') {
        let wins = parseInt(last3MonthsSummary.wins ?? 0, 10);
        let seconds = parseInt(last3MonthsSummary.seconds ?? 0, 10);
        let thirds = parseInt(last3MonthsSummary.thirds ?? 0, 10);

        if (isNaN(wins)) wins = 0;
        if (isNaN(seconds)) seconds = 0;
        if (isNaN(thirds)) thirds = 0;

        let extraPoints = (wins * 3) + (seconds * 2) + (thirds * 1);

        formPoints += extraPoints;

    } else {
        console.log(`⚠️ [${horseName}] Ogiltig eller saknad last3MonthsSummary.`);
    }

    // ✅ Avrunda till närmaste heltal
    const finalScore = Math.round(formPoints);

    return finalScore;
}