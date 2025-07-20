import { calculateBettingPercentagePoints } from "../shared/calculateBettingPercentagePoints";
import { calculateOddsPoints } from "../shared/calculateOddsPoints";
import { calculateStartPositionPoints } from "./calculateStartPositionPoints";
import { calculateFormPoints } from "./calculateFormPoints";
import { calculateTimePerformanceLastTenStarts } from "./calculateTimePerformanceLastTenStarts";
import { calculateDriverPoints } from "../shared/calculateDriverPoints";
import { calculateTrainerPoints } from "../shared/calculateTrainerPoints";
import { calculateEquipmentPoints } from "./calculateEquipmentPoints";
import { calculateClassPoints } from "../shared/calculateClassPoints";
import { calculateHeadToHeadPoints } from "../shared/calculateHeadToHeadPoints";
import { getBettingPercentage } from "../utils/getBettingPercentage";
import { ML_CATEGORY_WEIGHTS } from "./pointsMLConfig";
import { ML_CATEGORY_WEIGHTS as UPSCORE_WEIGHTS } from "./pointsConfigUpsets";

interface HorseStartRecord {
    time: string;
    distance: number;
    startMethod: string;
    disqualified: boolean;
    position: string;
    firstPrize: string;
    // Add other properties as needed
}

interface LastMonthSummary {
    wins: number;
    seconds: number;
    thirds: number;
    firstPrizeAverage: string;
}

interface HorseData {
    name: string;
    odds?: number | null;
    shoes?: any; // Define more precisely if needed
    sulky?: any; // Define more precisely if needed
    [key: string]: any; // For dynamic gameType properties like V75
}

interface DriverData {
    name: string;
    statistics?: any;
}

interface TrainerData {
    name: string;
    statistics?: any;
}

interface Horse {
    startNumber: number;
    horse: HorseData;
    driver: DriverData;
    trainer: TrainerData;
    lastTenStarts: HorseStartRecord[];
    lastMonthSummary: LastMonthSummary;
    scratched: boolean;
    place: number | null;
    pools?: { vinnare?: { odds: number; }; V75?: { betDistribution: number; }; V85?: { betDistribution: number; }; GS75?: { betDistribution: number; }; V86?: { betDistribution: number; }; V64?: { betDistribution: number; }; V65?: { betDistribution: number; }; V5?: { betDistribution: number; }; V4?: { betDistribution: number; }; V3?: { betDistribution: number; }; };
}

interface Race {
    id: string;
    sport: string;
    date: string;
    number: number;
    distance: number;
    startMethod: string;
    startTime: string;
    name: string;
    trackName: string;
    horses: Horse[];
    starts: Horse[]; // Alias for horses
    pools?: { plats?: { result?: { winners?: { first?: any[]; second?: any[]; third?: any[] } } } };
}

interface CalculatedHorse extends Horse {
    bettingPercentage: number | null;
    bettingPercentagePoints: number;
    startPositionPoints: number;
    formPoints: number;
    timePerformanceLastTenStartsPoints: number;
    timePerformanceLastTenStartsTooltip: string;
    driverPoints: number;
    trainerPoints: number;
    equipmentPoints: number;
    equipmentDescription: string;
    classPoints: number;
    headToHeadPoints: number;
    h2hMeetings: any[]; // Define more precisely if needed
    totalPoints: number;
    mlPoints: number;
    mlUpsetScore: number;
    mlPercentage?: number;
    mlUpsetPercentage?: number;
    mlSpikPercentage?: number;
    folkRank?: number;
    mlRank?: number;
    mlUpsetRank?: number;
}

export function calculatePointsForTrav(race: Race, gameType: string): CalculatedHorse[] {

    const horsesRaw = race.starts || race.horses || [];
    const validHorses = horsesRaw.filter(h => !h.scratched);

    let allDrivers = validHorses.map(start => start.driver);
    let allTrainers = validHorses.map(start => start.trainer);
    let allBettingPercentages = validHorses.map(start => {
        return getBettingPercentage(start.horse, gameType);
    }).filter((pct): pct is number => {
        return typeof pct === 'number' && pct > 0;
    });

    let calculatedHorses: CalculatedHorse[] = [];

    horsesRaw.forEach((start) => {
        const startPositionPoints = calculateStartPositionPoints(start, validHorses, race.startMethod);
        const formPoints = calculateFormPoints(
            start.horse?.name ?? "Okänd häst",
            start.lastTenStarts,
            start.lastMonthSummary ?? { wins: 0, seconds: 0, thirds: 0, firstPrizeAverage: "0" },
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
        let bettingPercentage = getBettingPercentage(start.horse, gameType);
        const odds = start.horse?.odds;

        let bettingPercentagePoints;
        if (bettingPercentage == null) {
            const allOdds = horsesRaw.map(s => s.horse.odds).filter((o): o is number => typeof o === 'number' && o > 0);
            bettingPercentagePoints = odds && typeof odds === 'number'
                ? calculateOddsPoints(odds, allOdds)
                : 0;
        } else {
            bettingPercentagePoints = calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages, typeof odds === 'number' ? odds : null);
        }

        calculatedHorses.push({
            ...start,
            bettingPercentage,
            bettingPercentagePoints,
            startPositionPoints,
            formPoints,
            timePerformanceLastTenStartsPoints,
            timePerformanceLastTenStartsTooltip,
            driverPoints,
            trainerPoints,
            equipmentPoints: equipment.points,
            equipmentDescription: equipment.description,
            classPoints,
            headToHeadPoints: 0, // Will be calculated after all horses are processed
            h2hMeetings: [], // Will be populated after all horses are processed
            totalPoints: 0, // Will be calculated after all horses are processed
            mlPoints: 0, // Will be calculated later
            mlUpsetScore: 0, // Will be calculated later
        });
    });

    calculatedHorses.forEach(h => {
        const { points: headToHeadPoints, meetings } = calculateHeadToHeadPoints(
            h.lastTenStarts,
            calculatedHorses,
            h.horse.name ?? "Okänd häst"
        );

        h.headToHeadPoints = headToHeadPoints;
        h.h2hMeetings = meetings;

        h.totalPoints = h.bettingPercentagePoints + h.startPositionPoints + h.formPoints + h.timePerformanceLastTenStartsPoints + h.headToHeadPoints + h.driverPoints + h.trainerPoints + h.equipmentPoints + h.classPoints;
    });

    const totalMyPoints = calculatedHorses.reduce((sum, h) => sum + h.totalPoints, 0);

    // ML Total Points
    calculatedHorses.forEach(h => {
        h.mlPoints =
            ML_CATEGORY_WEIGHTS.bettingPercentagePoints * h.bettingPercentagePoints +
            ML_CATEGORY_WEIGHTS.trainerPoints * h.trainerPoints +
            ML_CATEGORY_WEIGHTS.headToHeadPoints * h.headToHeadPoints +
            ML_CATEGORY_WEIGHTS.equipmentPoints * h.equipmentPoints +
            ML_CATEGORY_WEIGHTS.driverPoints * h.driverPoints +
            ML_CATEGORY_WEIGHTS.classPoints * h.classPoints +
            ML_CATEGORY_WEIGHTS.formPoints * h.formPoints +
            ML_CATEGORY_WEIGHTS.timePoints * h.timePerformanceLastTenStartsPoints +
            ML_CATEGORY_WEIGHTS.startPositionPoints * h.startPositionPoints;
    });

    // ML Upset Score
    calculatedHorses.forEach(h => {
        h.mlUpsetScore =
            UPSCORE_WEIGHTS.trainerPoints * h.trainerPoints +
            UPSCORE_WEIGHTS.headToHeadPoints * h.headToHeadPoints +
            UPSCORE_WEIGHTS.equipmentPoints * h.equipmentPoints +
            UPSCORE_WEIGHTS.driverPoints * h.driverPoints +
            UPSCORE_WEIGHTS.classPoints * h.classPoints +
            UPSCORE_WEIGHTS.formPoints * h.formPoints +
            UPSCORE_WEIGHTS.timePoints * h.timePerformanceLastTenStartsPoints +
            UPSCORE_WEIGHTS.startPositionPoints * h.startPositionPoints;
    });

    // ML Percentage
    const totalMLPoints = calculatedHorses.reduce((sum, h) => sum + (h.mlPoints ?? 0), 0);
    calculatedHorses.forEach(h => {
        h.mlPercentage = totalMLPoints ? Math.round((h.mlPoints / totalMLPoints) * 100) : 0;
    });

    // ML Upset Percentage
    const totalUpsetScore = calculatedHorses.reduce((sum, h) => sum + (h.mlUpsetScore ?? 0), 0);
    calculatedHorses.forEach(h => {
        h.mlUpsetPercentage = totalUpsetScore ? Math.round((h.mlUpsetScore / totalUpsetScore) * 100) : 0;
    });

    // ML Spik Percentage (assuming mlSpikScore is calculated elsewhere or is 0 for now)
    const totalSpikScore = calculatedHorses.reduce((sum, h) => sum + (h.mlSpikScore ?? 0), 0);
    calculatedHorses.forEach(h => {
        h.mlSpikPercentage = totalSpikScore ? Math.round((h.mlSpikScore / totalSpikScore) * 100) : 0;
    });

    // Sätt folkRank baserat på bettingPercentage eller odds
    const sortedByFolk = [...calculatedHorses].sort((a, b) => {
        const aPct = typeof a.bettingPercentage === "number" ? a.bettingPercentage : 0;
        const bPct = typeof b.bettingPercentage === "number" ? b.bettingPercentage : 0;

        if (aPct > 0 && bPct > 0) {
            return bPct - aPct;
        } else if (aPct > 0) {
            return -1;
        } else if (bPct > 0) {
            return 1;
        }

        const aOdds = typeof a.horse.odds === 'number' ? a.horse.odds : Infinity;
        const bOdds = typeof b.horse.odds === 'number' ? b.horse.odds : Infinity;
        return aOdds - bOdds;
    });

    sortedByFolk.forEach((h, i) => {
        h.folkRank = i + 1;
    });

    // ML Rank
    calculatedHorses.sort((a, b) => b.mlPoints - a.mlPoints);
    calculatedHorses.forEach((h, i) => h.mlRank = i + 1);

    calculatedHorses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    // ML Skräll Rank
    calculatedHorses.sort((a, b) => b.mlUpsetScore - a.mlUpsetScore);
    calculatedHorses.forEach((h, i) => h.mlUpsetRank = i + 1);

    calculatedHorses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    return calculatedHorses;
}
