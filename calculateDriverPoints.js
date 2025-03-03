import { DRIVER_POINTS } from "./pointsConfig.js";

export function calculateDriverPoints(driver, allDrivers) {
    if (!driver || !driver.statistics || !driver.statistics.years) return 1; // Minsta poäng om data saknas

    const currentYear = new Date().getFullYear();
    const lastYear = (currentYear - 1).toString();
    const thisYear = currentYear.toString();

    const parseWinPercentage = (winPercentage) => {
        if (!winPercentage) return 0;
        return parseFloat(winPercentage.replace("%", "").trim()); // Ta bort % och konvertera till tal
    };

    // Beräkna viktad vinstprocent för kusken
    const currentWinRate = parseWinPercentage(driver.statistics.years[thisYear]?.winPercentage);
    const lastYearWinRate = parseWinPercentage(driver.statistics.years[lastYear]?.winPercentage);
    const weightedWinRate = (
        (currentWinRate * DRIVER_POINTS.CURRENT_YEAR_WEIGHT) +
        (lastYearWinRate * DRIVER_POINTS.LAST_YEAR_WEIGHT)
    );

    // Hämta alla kuskars viktade vinstprocent i loppet
    const allWinRates = allDrivers.map(d => {
        if (!d || !d.statistics || !d.statistics.years) return 0;
        const cWin = parseWinPercentage(d.statistics.years[thisYear]?.winPercentage);
        const lWin = parseWinPercentage(d.statistics.years[lastYear]?.winPercentage);
        return (cWin * DRIVER_POINTS.CURRENT_YEAR_WEIGHT) + (lWin * DRIVER_POINTS.LAST_YEAR_WEIGHT);
    });

    // Normalisera poängen till skala 1-10
    const minRate = Math.min(...allWinRates);
    const maxRate = Math.max(...allWinRates);
    if (maxRate === minRate) return 5; // Om alla har samma vinstprocent, ge medelvärde

    return Math.round(1 + ((weightedWinRate - minRate) / (maxRate - minRate)) * 5); // Skala 1-5
}