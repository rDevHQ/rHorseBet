import { calculateBettingPercentagePoints } from "./shared/calculateBettingPercentagePoints.js";
import { calculateOddsPoints } from "./shared/calculateOddsPoints.js";
import { calculateStartPositionPoints } from "./trav/calculateStartPositionPoints.js";
import { calculateFormPoints } from "./trav/calculateFormPoints.js";
import { calculateTimePerformanceLastTenStarts } from "./trav/calculateTimePerformanceLastTenStarts.js";
import { calculateDriverPoints } from "./shared/calculateDriverPoints.js";
import { calculateTrainerPoints } from "./shared/calculateTrainerPoints.js";
import { calculateEquipmentPoints } from "./trav/calculateEquipmentPoints.js";
import { calculateClassPoints } from "./shared/calculateClassPoints.js";
import { calculateHeadToHeadPoints } from "./shared/calculateHeadToHeadPoints.js";
import { getBettingPercentage } from "./utils/getBettingPercentage.js";
import { ML_CATEGORY_WEIGHTS } from "./trav/pointsMLConfig.js";
import { ML_CATEGORY_WEIGHTS as UPSCORE_WEIGHTS } from "./trav/pointsConfigUpsets.js";

export function calculatePointsForTrav(race, gameType) {

    function parseBettingPercentage(val) {
        return Number.isFinite(val)
            ? val
            : (typeof val === "string" ? parseFloat(val.replace(",", ".")) : 0);
    }

    const horsesRaw = race.starts || race.horses || [];
    const validHorses = horsesRaw.filter(h => !h.scratched);

    let allDrivers = validHorses.map(start => start.driver);
    let allTrainers = validHorses.map(start => start.trainer);
    let allBettingPercentages = validHorses.map(start => getBettingPercentage(start.horse, gameType));

    let horses = [];

    horsesRaw.forEach((start) => {
        const startPositionPoints = calculateStartPositionPoints(start, validHorses, race.startMethod);
        const formPoints = calculateFormPoints(
            start.horse?.name ?? "Okänd häst",
            start.lastTenStarts,
            start.lastMonthSummary ?? {},
            validHorses
        );
        const { timePerformanceLastTenStartsPoints, timePerformanceLastTenStartsTooltip } = calculateTimePerformanceLastTenStarts(
            start.lastTenStarts,
            race.distance,
            race.startMethod,
            validHorses,
            start.horse?.name ?? "Okänd häst"
        );

        const driverPoints = calculateDriverPoints(start.driver, allDrivers) || 1;
        const trainerPoints = calculateTrainerPoints(start.trainer, allTrainers) || 1;
        const equipment = calculateEquipmentPoints(start.horse, validHorses);
        const classPoints = calculateClassPoints(start, validHorses);
        // Hämta odds från start.horse.odds (satt i transform.js)
        const odds = start.horse?.odds;
        let bettingPercentage = getBettingPercentage(start.horse, gameType);

        let bettingPercentagePoints;
        if (bettingPercentage === "N/A" || bettingPercentage == null) {
            const allOdds = horsesRaw.map(s => parseFloat(s.horse.odds)).filter(o => !isNaN(o));
            const numericOdds = parseFloat(odds);
            bettingPercentagePoints = !isNaN(numericOdds)
                ? calculateOddsPoints(numericOdds, allOdds)
                : 0;
        } else {
            bettingPercentagePoints = calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages, odds);
        }

        horses.push({
            startNumber: start.startNumber,
            horseName: start.horse.name,
            driverName: start.driver?.name ?? "Okänd kusk",
            odds,
            bettingPercentage,
            scratched: start.scratched ?? false,
            place: start.place ?? start?.horse?.place ?? null,
            // lastTenStartsCopy removed; use start.lastTenStarts directly
            start,
            categoryPoints: {
                bettingPercentagePoints,
                startPositionPoints,
                formPoints,
                timePerformanceLastTenStartsPoints,
                driverPoints,
                trainerPoints,
                equipmentPoints: equipment.points,
                classPoints
            },
            categoryTooltips: {
                equipmentDescription: equipment.description,
                timePerformanceLastTenStartsTooltip
            }
        });
    });

    // No need to assign bettingPercentagePoints to validHorses; use horse.categoryPoints.bettingPercentagePoints everywhere

    horses.forEach(h => {
        const { points: headToHeadPoints, meetings } = calculateHeadToHeadPoints(
            h.start.lastTenStarts,
            validHorses,
            h.horseName ?? "Okänd häst"
        );

        h.categoryPoints.headToHeadPoints = headToHeadPoints;
        h.h2hMeetings = meetings;

        h.totalPoints = h.categoryPoints.bettingPercentagePoints + h.categoryPoints.startPositionPoints + h.categoryPoints.formPoints + h.categoryPoints.timePerformanceLastTenStartsPoints + h.categoryPoints.headToHeadPoints + h.categoryPoints.driverPoints + h.categoryPoints.trainerPoints + h.categoryPoints.equipmentPoints + h.categoryPoints.classPoints;
    });

    const totalMyPoints = horses.reduce((sum, h) => sum + h.totalPoints, 0);

    // ML Total Points
    horses.forEach(h => {
        h.mlPoints =
            ML_CATEGORY_WEIGHTS.bettingPercentagePoints * h.categoryPoints.bettingPercentagePoints +
            ML_CATEGORY_WEIGHTS.trainerPoints * h.categoryPoints.trainerPoints +
            ML_CATEGORY_WEIGHTS.headToHeadPoints * h.categoryPoints.headToHeadPoints +
            ML_CATEGORY_WEIGHTS.equipmentPoints * h.categoryPoints.equipmentPoints +
            ML_CATEGORY_WEIGHTS.driverPoints * h.categoryPoints.driverPoints +
            ML_CATEGORY_WEIGHTS.classPoints * h.categoryPoints.classPoints +
            ML_CATEGORY_WEIGHTS.formPoints * h.categoryPoints.formPoints +
            ML_CATEGORY_WEIGHTS.timePoints * h.categoryPoints.timePerformanceLastTenStartsPoints +
            ML_CATEGORY_WEIGHTS.startPositionPoints * h.categoryPoints.startPositionPoints;
    });

    // ML Upset Score
    horses.forEach(h => {
        h.mlUpsetScore =
            UPSCORE_WEIGHTS.trainerPoints * h.categoryPoints.trainerPoints +
            UPSCORE_WEIGHTS.headToHeadPoints * h.categoryPoints.headToHeadPoints +
            UPSCORE_WEIGHTS.equipmentPoints * h.categoryPoints.equipmentPoints +
            UPSCORE_WEIGHTS.driverPoints * h.categoryPoints.driverPoints +
            UPSCORE_WEIGHTS.classPoints * h.categoryPoints.classPoints +
            UPSCORE_WEIGHTS.formPoints * h.categoryPoints.formPoints +
            UPSCORE_WEIGHTS.timePoints * h.categoryPoints.timePerformanceLastTenStartsPoints +
            UPSCORE_WEIGHTS.startPositionPoints * h.categoryPoints.startPositionPoints;
    });

    // ML Percentage
    const totalMLPoints = horses.reduce((sum, h) => sum + (h.mlPoints ?? 0), 0);
    horses.forEach(h => {
        h.mlPercentage = totalMLPoints ? Math.round((h.mlPoints / totalMLPoints) * 100) : 0;
    });

    // ML Upset Percentage
    const totalUpsetScore = horses.reduce((sum, h) => sum + (h.mlUpsetScore ?? 0), 0);
    horses.forEach(h => {
        h.mlUpsetPercentage = totalUpsetScore ? Math.round((h.mlUpsetScore / totalUpsetScore) * 100) : 0;
    });

    // ML Spik Percentage
    const totalSpikScore = horses.reduce((sum, h) => sum + (h.mlSpikScore ?? 0), 0);
    horses.forEach(h => {
        h.mlSpikPercentage = totalSpikScore ? Math.round((h.mlSpikScore / totalSpikScore) * 100) : 0;
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

    // ML Rank
    horses.sort((a, b) => b.mlPoints - a.mlPoints);
    horses.forEach((h, i) => h.mlRank = i + 1);

    horses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    // ML Skräll Rank
    horses.sort((a, b) => b.mlUpsetScore - a.mlUpsetScore);
    horses.forEach((h, i) => h.mlUpsetRank = i + 1);

    horses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    return horses;
}