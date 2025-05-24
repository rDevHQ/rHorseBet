import { calculateBettingPercentagePoints } from "./calculateBettingPercentagePoints.js";
import { calculateOddsPoints } from "./calculateOddsPoints.js";
import { calculateStartPositionPoints } from "./calculateStartPositionPoints.js";
import { calculateFormPoints } from "./calculateFormPoints.js";
import { calculateTimePerformance } from "./calculateTimePerformance.js";
import { calculateDriverPoints } from "./calculateDriverPoints.js";
import { calculateTrainerPoints } from "./calculateTrainerPoints.js";
import { calculateEquipmentPoints } from "./calculateEquipmentPoints.js";
import { calculateClassPoints } from "./calculateClassPoints.js";
import { calculateHeadToHeadPoints } from "./calculateHeadToHeadPoints.js";
import { getBettingPercentage } from './getBettingPercentage.js';
import { ML_CATEGORY_WEIGHTS } from "./pointsMLConfig.js";
import { ML_CATEGORY_WEIGHTS as UPSCORE_WEIGHTS } from "./pointsConfigUpsets.js";
import { ML_CATEGORY_WEIGHTS as SPIK_WEIGHTS } from "./pointsConfigSpik.js";

export function calculatePointsForRace(race, gameType) {
    const horsesRaw = race.starts || race.horses || [];
    const validHorses = horsesRaw.filter(h => !h.scratched);

    let allDrivers = validHorses.map(start => start.driver);
    let allTrainers = validHorses.map(start => start.trainer);
    let allBettingPercentages = validHorses.map(start => getBettingPercentage(start.horse, gameType));

    let horses = [];

    horsesRaw.forEach((start, index) => {

        console.log("start:", start);
        
        const lastTenStartsCopy = start.lastTenStarts ? [...start.lastTenStarts] : [];
        const startPositionPoints = calculateStartPositionPoints(start, validHorses, race.startMethod);
        const formPoints = calculateFormPoints(
            start.horse?.name ?? "Okänd häst",
            lastTenStartsCopy,
            start.lastMonthSummary ?? {},
            validHorses
        );
        const { timePoints, timeTooltip } = calculateTimePerformance(
            lastTenStartsCopy,
            race.distance,
            race.startMethod,
            validHorses,
            start.horse?.name ?? "Okänd häst"
        );
        const { points: headToHeadPoints, meetings } = calculateHeadToHeadPoints(
            lastTenStartsCopy,
            validHorses,
            start.horse?.name ?? "Okänd häst"
        );
        const driverPoints = calculateDriverPoints(start.driver, allDrivers) || 1;
        const trainerPoints = calculateTrainerPoints(start.trainer, allTrainers) || 1;
        const equipment = calculateEquipmentPoints(start.horse);
        const classPoints = calculateClassPoints(start, validHorses);
        const odds = start.horse?.odds ?? "N/A";
        const bettingPercentage = getBettingPercentage(start.horse, gameType);
        let bettingPercentagePoints;
        if (bettingPercentage === "N/A" || bettingPercentage == null) {
            const allOdds = horsesRaw.map(s => parseFloat(s.horse.odds)).filter(o => !isNaN(o));
            const numericOdds = parseFloat(odds);
            bettingPercentagePoints = !isNaN(numericOdds)
                ? calculateOddsPoints(numericOdds, allOdds)
                : 0;
        } else {
            bettingPercentagePoints = calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages);
        }

                const totalPoints = bettingPercentagePoints + startPositionPoints + formPoints + timePoints + headToHeadPoints + driverPoints + trainerPoints + equipment.points + classPoints;

        
        horses.push({
            startNumber: start.startNumber,
            horseName: start.horse.name,
            odds,
            bettingPercentage,
            bettingPercentagePoints,
            startPositionPoints,
            formPoints,
            timePoints,
            timeTooltip,
            headToHeadPoints,
            h2hMeetings: meetings,
            driverPoints,
            trainerPoints,
            equipmentPoints: equipment.points,
            equipmentDescription: equipment.description,
            classPoints,
            totalPoints,
            scratched: start.scratched ?? false,
            place: start.place ?? start?.horse?.place ?? null,
        });
    });

    const totalMyPoints = horses.reduce((sum, h) => sum + h.totalPoints, 0);

    // ML Total Points
    horses.forEach(h => {
        h.mlTotalPoints =
            ML_CATEGORY_WEIGHTS.FolkScore * h.bettingPercentagePoints +
            ML_CATEGORY_WEIGHTS.Trainer * h.trainerPoints +
            ML_CATEGORY_WEIGHTS.HeadToHead * h.headToHeadPoints +
            ML_CATEGORY_WEIGHTS.Equipment * h.equipmentPoints +
            ML_CATEGORY_WEIGHTS.Driver * h.driverPoints +
            ML_CATEGORY_WEIGHTS.Class * h.classPoints +
            ML_CATEGORY_WEIGHTS.Form * h.formPoints +
            ML_CATEGORY_WEIGHTS.Time * h.timePoints +
            ML_CATEGORY_WEIGHTS.StartPositionScore * h.startPositionPoints;
    });

    // ML Upset Score
    horses.forEach(h => {
        h.mlUpsetScore =
            UPSCORE_WEIGHTS.FolkScore * h.bettingPercentagePoints +
            UPSCORE_WEIGHTS.Trainer * h.trainerPoints +
            UPSCORE_WEIGHTS.HeadToHead * h.headToHeadPoints +
            UPSCORE_WEIGHTS.Equipment * h.equipmentPoints +
            UPSCORE_WEIGHTS.Driver * h.driverPoints +
            UPSCORE_WEIGHTS.Class * h.classPoints +
            UPSCORE_WEIGHTS.Form * h.formPoints +
            UPSCORE_WEIGHTS.Time * h.timePoints +
            UPSCORE_WEIGHTS.StartPositionScore * h.startPositionPoints;
    });

    // ML Spik Score
    horses.forEach(h => {
        h.mlSpikScore =
            SPIK_WEIGHTS.FolkScore * h.bettingPercentagePoints +
            SPIK_WEIGHTS.Trainer * h.trainerPoints +
            SPIK_WEIGHTS.HeadToHead * h.headToHeadPoints +
            SPIK_WEIGHTS.Equipment * h.equipmentPoints +
            SPIK_WEIGHTS.Driver * h.driverPoints +
            SPIK_WEIGHTS.Class * h.classPoints +
            SPIK_WEIGHTS.Form * h.formPoints +
            SPIK_WEIGHTS.Time * h.timePoints +
            SPIK_WEIGHTS.StartPositionScore * h.startPositionPoints;
    });

    // Procent och edge
    const totalMLPoints = horses.reduce((sum, h) => sum + h.mlTotalPoints, 0);
    horses.forEach(h => {
        h.myExpectedPercentage = totalMyPoints ? Math.round((h.totalPoints / totalMyPoints) * 100) : 0;
        h.mlExpectedPercentage = totalMLPoints ? Math.round((h.mlTotalPoints / totalMLPoints) * 100) : 0;
        h.myEdgeVsMarket = h.myExpectedPercentage - Math.round(h.bettingPercentage ?? 0);
        h.mlEdgeVsMarket = h.mlExpectedPercentage - Math.round(h.bettingPercentage ?? 0);
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

    // Rankningar
    horses.sort((a, b) => b.mlTotalPoints - a.mlTotalPoints);
    horses.forEach((h, i) => h.mlRank = i + 1);

    horses.sort((a, b) => b.bettingPercentage - a.bettingPercentage);
    horses.forEach((h, i) => h.folkRank = i + 1);

    horses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    return horses;
}