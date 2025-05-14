import { FORM_POINTS_CONFIG } from "./pointsConfig.js";
import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

/**
 * Relativ formpoängsberäkning:
 * 1. Råpoäng räknas ut för varje häst (form + bonus)
 * 2. Normaliseras mellan 0 och MAX_CATEGORY_POINTS.form beroende på hur bra hästen är jämfört med övriga
 */
export function calculateFormPoints(horseName, lastFiveStarts, last3MonthsSummary, allHorses) {
    const {
        PLACEMENT_POINTS,
        WEIGHT_FACTORS,
        THREE_MONTHS_BONUS
    } = FORM_POINTS_CONFIG;

    const maxPoints = MAX_CATEGORY_POINTS.form;

    function calculateRawFormPoints(horse) {
        const starts = horse.lastFiveStarts ?? [];
        const summary = horse.last3MonthsSummary ?? {};

        let points = starts.reduce((total, start, index) => {
            if (!start || !start.position || start.position === "N/A") return total;
            const place = parseInt(start.position, 10);
            if (isNaN(place)) return total;
            const basePoints = PLACEMENT_POINTS[place] || 0;
            const weight = WEIGHT_FACTORS[index] || 1.0;
            return total + basePoints * weight;
        }, 0);

        let wins = parseInt(summary.wins ?? 0, 10);
        let seconds = parseInt(summary.seconds ?? 0, 10);
        let thirds = parseInt(summary.thirds ?? 0, 10);
        if (isNaN(wins)) wins = 0;
        if (isNaN(seconds)) seconds = 0;
        if (isNaN(thirds)) thirds = 0;

        const bonusPoints =
            (wins * THREE_MONTHS_BONUS.WIN) +
            (seconds * THREE_MONTHS_BONUS.SECOND) +
            (thirds * THREE_MONTHS_BONUS.THIRD);

        return points + bonusPoints;
    }

    const allRawPoints = allHorses.map(h =>
        calculateRawFormPoints(h)
    );

    const rawScore = calculateRawFormPoints({
        horse: { name: horseName },
        lastFiveStarts,
        last3MonthsSummary
    });

    const min = Math.min(...allRawPoints);
    const max = Math.max(...allRawPoints);

    if (max === min) {
        // console.log(`⚖️ [${horseName}] Alla hästar har lika form – tilldelar ${Math.round(maxPoints / 2)} poäng.`);
        return Math.round(maxPoints / 2);
    }

    const normalized = ((rawScore - min) / (max - min)) * maxPoints;
    const finalScore = Math.round(normalized);

    // console.log(`📈 [${horseName}] Form: råpoäng ${rawScore.toFixed(2)}, normaliserad till ${finalScore}/${maxPoints}`);
    return finalScore;
}