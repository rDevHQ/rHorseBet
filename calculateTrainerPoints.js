import { TRAINER_POINTS } from "./pointsConfig.js";

export function calculateTrainerPoints(trainer, allTrainers) {
    if (!trainer || !trainer.statistics || !trainer.statistics.years) return 1;

    const currentYear = new Date().getFullYear().toString();
    const lastYear = (currentYear - 1).toString();

    const parseWinPercentage = (winPercentage) => {
        if (!winPercentage) return 0;
        return parseFloat(winPercentage.replace("%", "").trim());
    };

    const currentWinRate = parseWinPercentage(trainer.statistics.years[currentYear]?.winPercentage);
    const lastYearWinRate = parseWinPercentage(trainer.statistics.years[lastYear]?.winPercentage);

    const weightedWinRate = (
        (currentWinRate * TRAINER_POINTS.CURRENT_YEAR_WEIGHT) +
        (lastYearWinRate * TRAINER_POINTS.LAST_YEAR_WEIGHT)
    );

    const allWinRates = allTrainers.map(t => {
        if (!t || !t.statistics || !t.statistics.years) return 0;
        const cWin = parseWinPercentage(t.statistics.years[currentYear]?.winPercentage);
        const lWin = parseWinPercentage(t.statistics.years[lastYear]?.winPercentage);
        return (cWin * TRAINER_POINTS.CURRENT_YEAR_WEIGHT) + (lWin * TRAINER_POINTS.LAST_YEAR_WEIGHT);
    }).filter(rate => rate > 0);

    if (allWinRates.length === 0) return 3;

    const minRate = Math.min(...allWinRates);
    const maxRate = Math.max(...allWinRates);

    if (maxRate === minRate) return 3;

    return Math.round(1 + ((weightedWinRate - minRate) / (maxRate - minRate)) * 3);
}