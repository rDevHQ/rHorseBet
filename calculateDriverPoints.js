import { DRIVER_POINTS } from "./pointsConfig.js";
import { MAX_CATEGORY_POINTS } from './pointsConfig.js';

export function calculateDriverPoints(driver, allDrivers) {
    if (!driver || !driver.statistics || !driver.statistics.years) return 1; // Minsta poäng om data saknas

    const currentYear = new Date().getFullYear();
    const lastYear = (currentYear - 1).toString();
    const thisYear = currentYear.toString();
    const maxPoints = MAX_CATEGORY_POINTS.kusk;

    const parseWinPercentage = (winPercentage) => {
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

    // Logaritmisk normalisering
    const logWinRates = allWinRates.map(r => Math.log(r || 0.01)); // undvik log(0)
    const logMin = Math.min(...logWinRates);
    const logMax = Math.max(...logWinRates);
    const logCurrent = Math.log(weightedWinRate || 0.01);

    if (logMax === logMin) {
        return Math.round(maxPoints / 2); // Alla lika → medelpoäng
    }

    const normalized = (logCurrent - logMin) / (logMax - logMin);
    const scaledPoints = normalized * maxPoints;

    return Math.max(1, Math.round(scaledPoints));
}