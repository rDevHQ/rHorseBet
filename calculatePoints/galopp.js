import { calculateBettingPercentagePoints } from "./shared/calculateBettingPercentagePoints.js";
import { calculateEarningsPerStartPoints } from "./shared/calculateEarningsPerStartPoints.js";
import { calculateTrainerPoints } from "./shared/calculateTrainerPoints.js";
import { calculateDriverPoints } from "./shared/calculateDriverPoints.js";
import { calculateHeadToHeadPoints } from "./shared/calculateHeadToHeadPoints.js";
import { calculateFormPointsGalopp } from "./galopp/calculateFormPointsGalopp.js";
import { calculateEquipmentPointsGalopp } from "./galopp/calculateEquipmentPointsGalopp.js";
import { calculateWeightAdjustedRatingPointsGalopp } from "./galopp/calculateWeightAdjustedRatingPointsGalopp.js";
import { getBettingPercentage } from "./utils/getBettingPercentage.js";
import { ML_CATEGORY_WEIGHTS } from "./galopp/pointsMLConfig.js";
import { ML_CATEGORY_WEIGHTS as UPSCORE_WEIGHTS } from "./galopp/pointsConfigUpsets.js";

export function calculatePointsForGalopp(race, gameType) {
    function parseBettingPercentage(val) {
        return Number.isFinite(val)
            ? val
            : (typeof val === "string" ? parseFloat(val.replace(",", ".")) : 0);
    }
    const horsesRaw = race.starts || race.horses || [];
    const validHorses = horsesRaw.filter(h => !h.scratched);

    const allEarningsPerStartCurrentYear = validHorses.map(h => h.horse.earningsPerStartCurrentYear ?? 0);
    const allEarningsPerStartLastTwoYears = validHorses.map(h => h.horse.earningsPerStartLastTwoYears ?? 0);
    const allTrainers = validHorses.map(h => h.trainer);
    const allDrivers = validHorses.map(h => h.driver);
    const allBettingPercentages = validHorses.map(h => {
        const pct = getBettingPercentage(h.horse, gameType);
        const odds = parseFloat(h.horse?.odds);
        return Number.isFinite(pct) && pct > 0
            ? pct
            : (Number.isFinite(odds) && odds > 0 ? 100 / odds : 0);
    });

    const horses = validHorses.map(h => {

     const bettingPercentage = getBettingPercentage(h.horse, gameType);
     const odds = parseFloat(h.horse?.odds);

     //   const bettingPoints = calculateBettingPercentagePoints(
     //       bettingPercentage,
     //       allBettingPercentages,
     //       odds
     //   );

        validHorses.forEach(h => {
            const bettingPercentage = getBettingPercentage(h.horse, gameType);
            const odds = parseFloat(h.horse?.odds);
            h.bettingPercentagePoints = calculateBettingPercentagePoints(
                bettingPercentage,
                allBettingPercentages,
                odds
            );
        });

        const earningsPerStartCurrentYearPoints = calculateEarningsPerStartPoints(h.horse.earningsPerStartCurrentYear
            , allEarningsPerStartCurrentYear);
        const earningsPerStartLastTwoYearsPoints = calculateEarningsPerStartPoints(h.horse.earningsPerStartLastTwoYears
            , allEarningsPerStartLastTwoYears);
        const driverPoints = calculateDriverPoints(h.driver, allDrivers);
        const trainerPoints = calculateTrainerPoints(h.trainer, allTrainers);
        const formPoints = calculateFormPointsGalopp(h.horse?.name, h.lastTenStarts ?? [], validHorses);
        const weightAdjustedRatingPoints = calculateWeightAdjustedRatingPointsGalopp(h, validHorses);
        const equipmentPoints = calculateEquipmentPointsGalopp(h);

        const { points: headToHeadPoints, meetings } = calculateHeadToHeadPoints(
            h.lastTenStarts ?? [],
            validHorses,
            h.horse?.name
        );

        const totalPoints =
             h.bettingPercentagePoints + driverPoints + trainerPoints + formPoints + weightAdjustedRatingPoints + equipmentPoints.points + headToHeadPoints + earningsPerStartCurrentYearPoints + earningsPerStartLastTwoYearsPoints;

        return {
            startNumber: h.startNumber,
            horseName: h.horse.name,
            driverName: h.driver?.name ?? "Okänd kusk",
            odds: h.horse.odds,
            bettingPercentage,
            bettingPercentagePoints: h.bettingPercentagePoints,
            headToHeadPoints,
            h2hMeetings: meetings,
            driverPoints,
            trainerPoints,
            formPoints,
            equipmentPoints: equipmentPoints.points,
            equipmentDescription: equipmentPoints.description,
            weightAdjustedRatingPoints,
            earningsPerStartCurrentYearPoints,
            earningsPerStartLastTwoYearsPoints,
            totalPoints,
            scratched: h.scratched,
            place: h.place ?? h.horse.place ?? null,
            lastTenStarts: h.lastTenStarts ?? [],
        };
    });

    // ML Total Points
    horses.forEach(h => {
        h.mlPoints =
            ML_CATEGORY_WEIGHTS.headToHeadPoints * h.headToHeadPoints +
            ML_CATEGORY_WEIGHTS.bettingPercentagePoints * h.bettingPercentagePoints +
            ML_CATEGORY_WEIGHTS.trainerPoints * h.trainerPoints +
            ML_CATEGORY_WEIGHTS.driverPoints * h.driverPoints +
            ML_CATEGORY_WEIGHTS.weightAdjustedRatingPoints * h.weightAdjustedRatingPoints +
            ML_CATEGORY_WEIGHTS.equipmentPoints * h.equipmentPoints +
            ML_CATEGORY_WEIGHTS.formPoints * h.formPoints +
            ML_CATEGORY_WEIGHTS.earningsPerStartCurrentYearPoints * h.earningsPerStartCurrentYearPoints +
            ML_CATEGORY_WEIGHTS.earningsPerStartLastTwoYearsPoints * h.earningsPerStartLastTwoYearsPoints;
    });

    // ML Upset Score
    horses.forEach(h => {
        h.mlUpsetScore =
            ML_CATEGORY_WEIGHTS.headToHeadPoints * h.headToHeadPoints +
            ML_CATEGORY_WEIGHTS.trainerPoints * h.trainerPoints +
            ML_CATEGORY_WEIGHTS.driverPoints * h.driverPoints +
            ML_CATEGORY_WEIGHTS.weightAdjustedRatingPoints * h.weightAdjustedRatingPoints +
            ML_CATEGORY_WEIGHTS.equipmentPoints * h.equipmentPoints +
            ML_CATEGORY_WEIGHTS.formPoints * h.formPoints +
            ML_CATEGORY_WEIGHTS.earningsPerStartCurrentYearPoints * h.earningsPerStartCurrentYearPoints +
            ML_CATEGORY_WEIGHTS.earningsPerStartLastTwoYearsPoints * h.earningsPerStartLastTwoYearsPoints;
    });

    // Procent och edge
    const totalMyPoints = horses.reduce((sum, h) => sum + h.totalPoints, 0);
    const totalMLPoints = horses.reduce((sum, h) => sum + h.mlPoints, 0);
    horses.forEach(h => {
        h.myExpectedPercentage = totalMyPoints ? Math.round((h.totalPoints / totalMyPoints) * 100) : 0;
        h.mlExpectedPercentage = totalMLPoints ? Math.round((h.mlPoints / totalMLPoints) * 100) : 0;
    });

    // Sätt folkRank baserat på bettingPercentage eller odds
    const sortedByFolk = [...horses].sort((a, b) => {
        const aPct = parseBettingPercentage(a.bettingPercentage);
        const bPct = parseBettingPercentage(b.bettingPercentage);

        if (aPct > 0 && bPct > 0) {
            return bPct - aPct;
        } else if (aPct > 0) {
            return -1;
        } else if (bPct > 0) {
            return 1;
        }

        const aOdds = Number.isFinite(parseFloat(a.odds)) ? parseFloat(a.odds) : Infinity;
        const bOdds = Number.isFinite(parseFloat(b.odds)) ? parseFloat(b.odds) : Infinity;
        return aOdds - bOdds;
    });

    sortedByFolk.forEach((h, i) => {
        h.folkRank = i + 1;
    });

    // Rankningar
    horses.sort((a, b) => b.mlPoints - a.mlPoints);
    horses.forEach((h, i) => h.mlRank = i + 1);

    horses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    return horses;
}
