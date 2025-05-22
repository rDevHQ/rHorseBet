import { TRAINER_POINTS } from "./pointsConfig.js";
import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

export function calculateTrainerPoints(trainer, allTrainers) {
    if (!trainer || !trainer.statistics || !trainer.statistics.years) return 1;

    const currentYear = new Date().getFullYear().toString();
    const lastYear = (parseInt(currentYear) - 1).toString();
    const maxPoints = MAX_CATEGORY_POINTS.tranare;
    
    const parseWinPercentage = (winPercentage) => {
        if (!winPercentage) return 0;
        return parseFloat(winPercentage.replace("%", "").trim());
    };

    // Tränarens viktade vinstprocent
    const currentWinRate = parseWinPercentage(trainer.statistics.years[currentYear]?.winPercentage);
    const lastYearWinRate = parseWinPercentage(trainer.statistics.years[lastYear]?.winPercentage);

    const weightedWinRate = (
        (currentWinRate * TRAINER_POINTS.CURRENT_YEAR_WEIGHT) +
        (lastYearWinRate * TRAINER_POINTS.LAST_YEAR_WEIGHT)
    );

    // Alla tränarnas viktade vinstprocent
    const allWinRates = allTrainers.map(t => {
        if (!t || !t.statistics || !t.statistics.years) return 0;
        const cWin = parseWinPercentage(t.statistics.years[currentYear]?.winPercentage);
        const lWin = parseWinPercentage(t.statistics.years[lastYear]?.winPercentage);
        return (cWin * TRAINER_POINTS.CURRENT_YEAR_WEIGHT) + (lWin * TRAINER_POINTS.LAST_YEAR_WEIGHT);
    }).filter(rate => rate > 0);

    if (allWinRates.length === 0) return Math.round(maxPoints / 2);

    // Logaritmisk normalisering
    const logWinRates = allWinRates.map(r => Math.log(r || 0.01));
    const logMin = Math.min(...logWinRates);
    const logMax = Math.max(...logWinRates);
    const logCurrent = Math.log(weightedWinRate || 0.01);

    if (logMax === logMin) return Math.round(maxPoints / 2);

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const scaledPoints = normalized * maxPoints;

    return Math.max(1, Math.round(scaledPoints)); 
}