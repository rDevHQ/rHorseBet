import { FORM_POINTS_CONFIG } from "./pointsConfig.js";
import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

/**
 * Relativ formpoängsberäkning:
 * 1. Råpoäng räknas ut för varje häst (form + bonus)
 * 2. Normaliseras mellan 0 och MAX_CATEGORY_POINTS.form beroende på hur bra hästen är jämfört med övriga
 */
export function calculateFormPoints(horseName, lastTenStarts, lastMonthSummary, allHorses) {
    const {
        PLACEMENT_POINTS,
        WEIGHT_FACTORS,
        LAST_MONTH_BONUS
    } = FORM_POINTS_CONFIG;

    const maxPoints = MAX_CATEGORY_POINTS.form;

    function calculateRawFormPoints(horse) {
        const starts = horse.lastTenStarts ?? [];
        const summary = horse.lastMonthSummary ?? {};

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
            (wins * LAST_MONTH_BONUS.WIN) +
            (seconds * LAST_MONTH_BONUS.SECOND) +
            (thirds * LAST_MONTH_BONUS.THIRD);

        const total = points + bonusPoints;
        return Math.log(1 + total);
    }

    const allRawPoints = allHorses.map(h =>
        calculateRawFormPoints({
            name: h.horse?.name ?? "Okänd",
            lastTenStarts: h.lastTenStarts,
            lastMonthSummary: h.lastMonthSummary
        })
    );

    const currentHorse = allHorses.find(h => h.horse?.name === horseName);
    const rawScore = calculateRawFormPoints({
        name: currentHorse?.horse?.name ?? horseName,
        lastTenStarts: currentHorse?.lastTenStarts ?? [],
        lastMonthSummary: currentHorse?.lastMonthSummary ?? {}
    });

    const min = Math.min(...allRawPoints);
    const max = Math.max(...allRawPoints);

    if (max === min) {
        console.log(`⚖️ [${horseName}] Alla hästar har lika form – tilldelar ${Math.round(maxPoints / 2)} poäng.`);
        return Math.round(maxPoints / 2);
    }

    const normalized = ((rawScore - min) / (max - min)) * maxPoints;
    const clamped = Math.max(0, Math.min(maxPoints, normalized));
    const finalScore = Math.round(clamped);

    // Added log for poängdetaljer
    const starts = currentHorse?.lastTenStarts ?? [];
    const summary = currentHorse?.lastMonthSummary ?? {};
    let points = starts.reduce((total, start, index) => {
        if (!start || !start.position || start.position === "N/A") return total;
        const place = parseInt(start.position, 10);
        if (isNaN(place)) return total;
        const basePoints = FORM_POINTS_CONFIG.PLACEMENT_POINTS[place] || 0;
        const weight = FORM_POINTS_CONFIG.WEIGHT_FACTORS[index] || 1.0;
        return total + basePoints * weight;
    }, 0);
    let wins = parseInt(summary.wins ?? 0, 10);
    let seconds = parseInt(summary.seconds ?? 0, 10);
    let thirds = parseInt(summary.thirds ?? 0, 10);
    if (isNaN(wins)) wins = 0;
    if (isNaN(seconds)) seconds = 0;
    if (isNaN(thirds)) thirds = 0;
    const bonusPoints = (wins * FORM_POINTS_CONFIG.LAST_MONTH_BONUS.WIN) + (seconds * FORM_POINTS_CONFIG.LAST_MONTH_BONUS.SECOND) + (thirds * FORM_POINTS_CONFIG.LAST_MONTH_BONUS.THIRD);

    console.log(`📊 [${horseName}] Detaljer: poäng från starter + bonus: ${points} + ${bonusPoints} = ${points + bonusPoints}`);
    console.log(`📈 [${horseName}] Form: råpoäng ${rawScore.toFixed(2)}, normaliserad till ${finalScore}/${maxPoints}`);
    return finalScore;
}