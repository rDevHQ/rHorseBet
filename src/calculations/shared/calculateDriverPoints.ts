const DRIVER_POINTS = {
    CURRENT_YEAR_WEIGHT: 1.5,  // Vikt för innevarande år
    LAST_YEAR_WEIGHT: 0.5,     // Vikt för föregående år
};

const MAX_POINTS = 100;

interface DriverStatisticsYear {
    starts: number;
    earnings: string;
    placement: any;
    winPercentage: string;
}

interface DriverStatistics {
    years: { [year: string]: DriverStatisticsYear };
}

interface Driver {
    firstName: string;
    lastName: string;
    statistics?: DriverStatistics;
}

/**
 * Beräknar poäng för kusk baserat på viktad vinstprocent senaste två år.
 * Normaliserar resultatet logaritmiskt till en 1-100 skala.
 * Om alla är lika ges medelpoäng 50.
 */
export function calculateDriverPoints(driver: Driver, allDrivers: Driver[]): number {
    if (!driver || !driver.statistics || !driver.statistics.years) return 1; // Minsta poäng om data saknas

    const currentYear = new Date().getFullYear();
    const lastYear = (currentYear - 1).toString();
    const thisYear = currentYear.toString();

    const parseWinPercentage = (winPercentage: string | undefined): number => {
        if (!winPercentage) return 0;
        return parseFloat(String(winPercentage).replace("%", "").trim());
    };

    // Hästens viktade vinstprocent
    const currentWinRate = parseWinPercentage(driver.statistics.years[thisYear]?.winPercentage);
    const lastYearWinRate = parseWinPercentage(driver.statistics.years[lastYear]?.winPercentage);
    const weightedWinRate = (
        (currentWinRate * DRIVER_POINTS.CURRENT_YEAR_WEIGHT) +
        (lastYearWinRate * DRIVER_POINTS.LAST_YEAR_WEIGHT)
    );

    // Alla kuskars viktade vinstprocent
    const allWinRates = allDrivers.map(d => {
        if (!d || !d.statistics || !d.statistics.years) return 0;
        const cWin = parseWinPercentage(d.statistics.years[thisYear]?.winPercentage);
        const lWin = parseWinPercentage(d.statistics.years[lastYear]?.winPercentage);
        return (cWin * DRIVER_POINTS.CURRENT_YEAR_WEIGHT) + (lWin * DRIVER_POINTS.LAST_YEAR_WEIGHT);
    });

    // Normalisering till 1-100:
    // Logaritmisk normalisering används för att hantera stor variation i vinstprocent och
    // ge bättre spridning i poängen.
    // Om alla kuskar har samma vinstprocent ges 50 poäng som neutralvärde.
    const logWinRates = allWinRates.map(r => Math.log(r || 0.01)); // undvik log(0)
    const logMin = Math.min(...logWinRates);
    const logMax = Math.max(...logWinRates);
    const logCurrent = Math.log(weightedWinRate || 0.01);

    if (logMax === logMin) {
        return Math.round(MAX_POINTS / 2); // Alla lika → medelpoäng
    }

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const scaledPoints = normalized * MAX_POINTS;

    return Math.max(1, Math.round(scaledPoints));
}
