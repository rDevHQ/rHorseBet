import { calculateBettingPercentagePoints } from "../shared/calculateBettingPercentagePoints";
import { calculateOddsPoints } from "../shared/calculateOddsPoints";
import { calculateEarningsPerStartPoints } from "../shared/calculateEarningsPerStartPoints";
import { calculateTrainerPoints } from "../shared/calculateTrainerPoints";
import { calculateDriverPoints } from "../shared/calculateDriverPoints";
import { calculateHeadToHeadPoints } from "../shared/calculateHeadToHeadPoints";
import { calculateFormPointsGalopp } from "./calculateFormPointsGalopp";
import { calculateEquipmentPointsGalopp } from "./calculateEquipmentPointsGalopp";
import { calculateWeightAdjustedRatingPointsGalopp } from "./calculateWeightAdjustedRatingPointsGalopp";
import { getBettingPercentage } from "../utils/getBettingPercentage";
import { ML_CATEGORY_WEIGHTS } from "./pointsMLConfig";
import { ML_CATEGORY_WEIGHTS as UPSCORE_WEIGHTS } from "./pointsConfigUpsets";

interface HorseStartRecord {
    date: string;
    track: { name: string };
    raceNumber: string;
    raceId: string;
    distance: string;
    startMethod: string;
    postPosition: string;
    disqualified: boolean;
    galloped: boolean;
    position: string;
    margin: string | number;
    handicap: string;
    weight: string;
    blinders: string;
    firstPrize: string;
    time: string;
    odds: string;
}

interface HorseData {
    name: string;
    id?: string;
    earningsPerStartCurrentYear?: number;
    earningsPerStartLastTwoYears?: number;
    odds?: number | null;
    blinders?: string;
    blindersLastStart?: string;
    handicap?: string | number;
    weight?: string | number;
    record?: { time: { minutes: number; seconds: number; tenths: number; } };
    age?: string;
    sex?: string;
    money?: string;
    shoes?: { front: { hasShoe: boolean; changed: boolean; }; back: { hasShoe: boolean; changed: boolean; }; };
    sulky?: { type: { text: string; changed: boolean; }; };
    trainer?: { firstName: string; lastName: string; homeTrack?: { name: string; }; statistics?: any; };
    [key: string]: any; // For dynamic gameType properties like V75
}

interface DriverData {
    firstName: string;
    lastName: string;
    statistics?: any;
}

interface TrainerData {
    firstName: string;
    lastName: string;
    homeTrack?: { name: string };
    statistics?: any;
}

interface Horse {
    startNumber: number;
    horse: HorseData;
    driver: DriverData;
    trainer: TrainerData;
    lastTenStarts: HorseStartRecord[];
    scratched: boolean;
    place: number | null;
    pools?: { vinnare?: { odds: number; }; V75?: { betDistribution: number; }; V85?: { betDistribution: number; }; GS75?: { betDistribution: number; }; V86?: { betDistribution: number; }; V64?: { betDistribution: number; }; V65?: { betDistribution: number; }; V5?: { betDistribution: number; }; V4?: { betDistribution: number; }; V3?: { betDistribution: number; }; };
    weight?: number;
    handicap?: string | number;
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
    earningsPerStartCurrentYearPoints: number;
    earningsPerStartLastTwoYearsPoints: number;
    driverPoints: number;
    trainerPoints: number;
    formPoints: number;
    weightAdjustedRatingPoints: number;
    equipmentPoints: number;
    equipmentDescription: string;
    headToHeadPoints: number;
    h2hMeetings: any[]; // Define more precisely if needed
    totalPoints: number;
    mlPoints: number;
    mlUpsetScore: number;
    folkRank?: number;
    mlRank?: number;
    myExpectedPercentage?: number;
    mlExpectedPercentage?: number;
}

export function calculatePointsForGalopp(race: Race, gameType: string): CalculatedHorse[] {
    const horsesRaw = race.starts || race.horses || [];
    const validHorses = horsesRaw.filter(h => !h.scratched);

    const allEarningsPerStartCurrentYear = validHorses.map(h => h.horse.earningsPerStartCurrentYear ?? 0);
    const allEarningsPerStartLastTwoYears = validHorses.map(h => h.horse.earningsPerStartLastTwoYears ?? 0);
    const allTrainers = validHorses.map(h => h.trainer);
    const allDrivers = validHorses.map(h => h.driver);
    const allBettingPercentages = validHorses.map(h => {
        return getBettingPercentage(h.horse, gameType);
    }).filter((pct): pct is number => {
        return typeof pct === 'number' && pct > 0;
    });

    const calculatedHorses: CalculatedHorse[] = validHorses.map(h => {
        const bettingPercentage = getBettingPercentage(h.horse, gameType);
        const odds = h.horse?.odds;

        let bettingPoints;
        if (bettingPercentage == null) {
            const allOdds = validHorses.map(horse => horse.horse.odds).filter((o): o is number => typeof o === 'number' && o > 0);
            bettingPoints = odds && typeof odds === 'number'
                ? calculateOddsPoints(odds, allOdds)
                : 0;
        } else {
            bettingPoints = calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages, typeof odds === 'number' ? odds : null);
        }

        const earningsPerStartCurrentYearPoints = calculateEarningsPerStartPoints(h.horse.earningsPerStartCurrentYear ?? 0,
            allEarningsPerStartCurrentYear);
        const earningsPerStartLastTwoYearsPoints = calculateEarningsPerStartPoints(h.horse.earningsPerStartLastTwoYears ?? 0,
            allEarningsPerStartLastTwoYears);
        const driverPoints = calculateDriverPoints(h.driver, allDrivers);
        const trainerPoints = calculateTrainerPoints(h.trainer, allTrainers);
        const formPoints = calculateFormPointsGalopp(h.horse?.name, h.lastTenStarts ?? [], validHorses);
        const weightAdjustedRatingPoints = calculateWeightAdjustedRatingPointsGalopp(h, validHorses);
        const equipmentResult = calculateEquipmentPointsGalopp(h);

        const { points: headToHeadPoints, meetings } = calculateHeadToHeadPoints(
            h.lastTenStarts ?? [],
            validHorses,
            h.horse?.name
        );

        const totalPoints =
            bettingPoints + driverPoints + trainerPoints + formPoints + weightAdjustedRatingPoints + equipmentResult.points + headToHeadPoints + earningsPerStartCurrentYearPoints + earningsPerStartLastTwoYearsPoints;

        return {
            ...h,
            bettingPercentage,
            bettingPercentagePoints: bettingPoints,
            headToHeadPoints,
            h2hMeetings: meetings,
            driverPoints,
            trainerPoints,
            formPoints,
            equipmentPoints: equipmentResult.points,
            equipmentDescription: equipmentResult.description,
            weightAdjustedRatingPoints,
            earningsPerStartCurrentYearPoints,
            earningsPerStartLastTwoYearsPoints,
            totalPoints,
            mlPoints: 0, // Will be calculated later
            mlUpsetScore: 0, // Will be calculated later
        };
    });

    // ML Total Points
    calculatedHorses.forEach(h => {
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
    calculatedHorses.forEach(h => {
        h.mlUpsetScore =
            UPSCORE_WEIGHTS.headToHeadPoints * h.headToHeadPoints +
            UPSCORE_WEIGHTS.trainerPoints * h.trainerPoints +
            UPSCORE_WEIGHTS.driverPoints * h.driverPoints +
            UPSCORE_WEIGHTS.weightAdjustedRatingPoints * h.weightAdjustedRatingPoints +
            UPSCORE_WEIGHTS.equipmentPoints * h.equipmentPoints +
            UPSCORE_WEIGHTS.formPoints * h.formPoints +
            UPSCORE_WEIGHTS.earningsPerStartCurrentYearPoints * h.earningsPerStartCurrentYearPoints +
            UPSCORE_WEIGHTS.earningsPerStartLastTwoYearsPoints * h.earningsPerStartLastTwoYearsPoints;
    });

    // Procent och edge
    const totalMyPoints = calculatedHorses.reduce((sum, h) => sum + h.totalPoints, 0);
    const totalMLPoints = calculatedHorses.reduce((sum, h) => sum + h.mlPoints, 0);
    calculatedHorses.forEach(h => {
        h.myExpectedPercentage = totalMyPoints ? Math.round((h.totalPoints / totalMyPoints) * 100) : 0;
        h.mlExpectedPercentage = totalMLPoints ? Math.round((h.mlPoints / totalMLPoints) * 100) : 0;
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

    // Rankningar
    calculatedHorses.sort((a, b) => b.mlPoints - a.mlPoints);
    calculatedHorses.forEach((h, i) => h.mlRank = i + 1);

    calculatedHorses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    return calculatedHorses;
}
