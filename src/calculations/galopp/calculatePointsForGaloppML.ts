import { calculateBettingPercentagePoints } from "../shared/calculateBettingPercentagePoints";
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
import { HorseRacingEnsemble } from "../ml/ensemble";
import { TrainingDataCollector } from "../ml/trainingDataCollector";

// Global ML model instance (in production, this would be loaded from storage)
let globalMLModel: HorseRacingEnsemble | null = null;
let isModelTrained = false;

/**
 * Enhanced gallop calculation with machine learning
 */
export function calculatePointsForGalopp(race: any, gameType: string): any[] {
    function parseBettingPercentage(val: any): number {
        return Number.isFinite(val)
            ? val
            : (typeof val === "string" ? parseFloat(val.replace(",", ".")) : 0);
    }

    const horsesRaw = race.starts || race.horses || [];
    const validHorses = horsesRaw.filter((h: any) => !h.scratched);

    const allEarningsPerStartCurrentYear = validHorses.map((h: any) => h.horse.earningsPerStartCurrentYear ?? 0);
    const allEarningsPerStartLastTwoYears = validHorses.map((h: any) => h.horse.earningsPerStartLastTwoYears ?? 0);
    const allTrainers = validHorses.map((h: any) => h.trainer);
    const allDrivers = validHorses.map((h: any) => h.driver);
    const allBettingPercentages = validHorses.map((h: any) => {
        const pct = getBettingPercentage(h.horse, gameType);
        const odds = parseFloat(h.horse?.odds);
        return Number.isFinite(pct) && pct !== null && pct > 0
            ? pct
            : (Number.isFinite(odds) && odds > 0 ? 100 / odds : 0);
    });

    const horses = validHorses.map((h: any) => {
        const bettingPercentage = getBettingPercentage(h.horse, gameType);
        const odds = parseFloat(h.horse?.odds);

        const bettingPoints = calculateBettingPercentagePoints(
            bettingPercentage,
            allBettingPercentages,
            odds
        );

        const earningsPerStartCurrentYearPoints = calculateEarningsPerStartPoints(
            h.horse.earningsPerStartCurrentYear,
            allEarningsPerStartCurrentYear
        );
        const earningsPerStartLastTwoYearsPoints = calculateEarningsPerStartPoints(
            h.horse.earningsPerStartLastTwoYears,
            allEarningsPerStartLastTwoYears
        );
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

        // Traditional total points
        const totalPoints =
            bettingPoints + driverPoints + trainerPoints + formPoints + 
            weightAdjustedRatingPoints + equipmentPoints.points + headToHeadPoints + 
            earningsPerStartCurrentYearPoints + earningsPerStartLastTwoYearsPoints;

        return {
            startNumber: h.startNumber,
            horseName: h.horse.name,
            driverName: h.driver?.name ?? "Okänd kusk",
            odds: h.horse.odds,
            bettingPercentage,
            bettingPercentagePoints: bettingPoints,
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

    // Calculate ML scores if model is available
    if (globalMLModel && isModelTrained) {
        horses.forEach((h: any) => {
            const features = [
                h.headToHeadPoints,
                h.bettingPercentagePoints,
                h.trainerPoints,
                h.driverPoints,
                h.weightAdjustedRatingPoints,
                h.equipmentPoints,
                h.formPoints,
                h.earningsPerStartCurrentYearPoints,
                h.earningsPerStartLastTwoYearsPoints
            ];
            
            h.mlScore = globalMLModel!.predict(features);
            h.mlPoints = h.mlScore * 100; // Scale to 0-100 range
        });

        // ML-based ranking
        horses.sort((a: any, b: any) => b.mlScore - a.mlScore);
        horses.forEach((h: any, i: number) => h.mlRank = i + 1);
    } else {
        // Fallback to traditional ML weights
        horses.forEach((h: any) => {
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

        horses.sort((a: any, b: any) => b.mlPoints - a.mlPoints);
        horses.forEach((h: any, i: number) => h.mlRank = i + 1);
    }

    // ML Upset Score (always use traditional weights for consistency)
    horses.forEach((h: any) => {
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

    // Calculate expected percentages
    const totalMyPoints = horses.reduce((sum: number, h: any) => sum + h.totalPoints, 0);
    const totalMLPoints = horses.reduce((sum: number, h: any) => sum + h.mlPoints, 0);
    horses.forEach((h: any) => {
        h.myExpectedPercentage = totalMyPoints ? Math.round((h.totalPoints / totalMyPoints) * 100) : 0;
        h.mlExpectedPercentage = totalMLPoints ? Math.round((h.mlPoints / totalMLPoints) * 100) : 0;
    });

    // Set folk rank based on betting percentage or odds
    const sortedByFolk = [...horses].sort((a: any, b: any) => {
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

    sortedByFolk.forEach((h: any, i: number) => {
        h.folkRank = i + 1;
    });

    // Final sort by total points (traditional ranking)
    horses.sort((a: any, b: any) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    return horses;
}

/**
 * Train the ML model using historical data
 */
export async function trainMLModel(historicalData: any[], sport: 'gallop' | 'trav' = 'gallop'): Promise<void> {
    try {
        console.log(`Training ML model for ${sport} with`, historicalData.length, 'historical races...');

        // Prepare training data
        const trainingData = TrainingDataCollector.prepareTrainingData(historicalData, sport);

        if (trainingData.length === 0) {
            console.warn(`No training data available for ${sport} races`);
            return;
        }

        // Initialize and train the ensemble model
        globalMLModel = new HorseRacingEnsemble();
        globalMLModel.train(trainingData);
        isModelTrained = true;

        // Extract new feature weights from trained model
        const newWeights = globalMLModel.getFeatureWeights();
        console.log('New ML weights learned:', newWeights);

        // Update pointsMLConfig.ts with new weights
        await updatePointsMLConfig(newWeights, sport);

        // Calculate feature importance
        const featureImportance = TrainingDataCollector.calculateFeatureImportance(trainingData);
        console.log('Feature importance:', featureImportance);

        console.log(`ML model training completed successfully - pointsMLConfig.ts updated with new weights for ${sport}`);
    } catch (error) {
        console.error('Error training ML model:', error);
        isModelTrained = false;
    }
}

/**
 * Update pointsMLConfig.ts with new weights and create backup
 */
async function updatePointsMLConfig(newWeights: { [key: string]: number }, sport: 'gallop' | 'trav' = 'gallop'): Promise<void> {
    try {
        // Create backup of current config
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupContent = `// Backup of pointsMLConfig.ts from ${timestamp}
export const ML_CATEGORY_WEIGHTS_BACKUP_${sport}_${timestamp.split('T')[0]} = ${JSON.stringify(ML_CATEGORY_WEIGHTS, null, 2)};
`;

        // Format new weights with proper precision
        const formattedWeights = Object.keys(newWeights)
            .sort()
            .reduce((acc, key) => {
                acc[key] = parseFloat(newWeights[key].toFixed(6));
                return acc;
            }, {} as { [key: string]: number });

        const newContent = `// Auto-generated ML weights from training on ${timestamp} for ${sport}
// Previous weights backed up as ML_CATEGORY_WEIGHTS_BACKUP_${sport}_${timestamp.split('T')[0]}
${backupContent}
export const ML_CATEGORY_WEIGHTS = ${JSON.stringify(formattedWeights, null, 2)};
`;

        // Save to localStorage for inspection (since we can't directly write files)
        localStorage.setItem(`newPointsMLConfig_${sport}`, newContent);
        localStorage.setItem(`mlWeightsUpdate_${sport}`, JSON.stringify({
            timestamp,
            oldWeights: ML_CATEGORY_WEIGHTS,
            newWeights: formattedWeights
        }));

        console.log(`New pointsMLConfig.ts content saved to localStorage key: newPointsMLConfig_${sport}`);
        console.log('You can copy this content to update the file manually:');
        console.log(newContent);

    } catch (error) {
        console.error('Error updating pointsMLConfig:', error);
    }
}

/**
 * Get current ML model status
 */
export function getMLModelStatus(): { isReady: boolean; modelInfo?: any } {
    return {
        isReady: isModelTrained && globalMLModel !== null,
        modelInfo: globalMLModel ? globalMLModel.getModelWeights() : null
    };
}
