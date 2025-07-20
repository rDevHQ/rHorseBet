const TRAINER_POINTS = {
    CURRENT_YEAR_WEIGHT: 1.5,  // Vikt för innevarande år
    LAST_YEAR_WEIGHT: 0.5,     // Vikt för föregående år
};

const MAX_POINTS = 100;

interface TrainerStatisticsYear {
    starts: number;
    earnings: string;
    placement: any;
    winPercentage: string;
}

interface TrainerStatistics {
    years: { [year: string]: TrainerStatisticsYear };
}

interface Trainer {
    firstName: string;
    lastName: string;
    homeTrack?: { name: string };
    statistics?: TrainerStatistics;
}

/**
 * Beräknar poäng för tränare baserat på viktad vinstprocent senaste två år.
 * Normaliserar resultatet logaritmiskt till en 1-100 skala.
 * Om alla är lika ges medelpoäng 50.
 */
export function calculateTrainerPoints(trainer: Trainer, allTrainers: Trainer[]): number {
    if (!trainer || !trainer.statistics || !trainer.statistics.years) return 1;

    const currentYear = new Date().getFullYear().toString();
    const lastYear = (parseInt(currentYear) - 1).toString();

    const parseWinPercentage = (winPercentage: string | undefined): number => {
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

    if (allWinRates.length === 0) return Math.round(MAX_POINTS / 2);

    // Normalisering till 1-100:
    // Logaritmisk normalisering används för att hantera stor variation i vinstprocent och
    // ge bättre spridning i poängen.
    // Om alla tränare har samma vinstprocent ges 50 poäng som neutralvärde.
    const logWinRates = allWinRates.map(r => Math.log(r || 0.01));
    const logMin = Math.min(...logWinRates);
    const logMax = Math.max(...logWinRates);
    const logCurrent = Math.log(weightedWinRate || 0.01);

    if (logMax === logMin) return Math.round(MAX_POINTS / 2);

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const scaledPoints = normalized * MAX_POINTS;

    return Math.max(1, Math.round(scaledPoints));
}
