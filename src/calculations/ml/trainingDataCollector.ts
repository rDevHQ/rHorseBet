/**
 * Training Data Collection for Machine Learning Models
 * Converts historical race data into ML-ready format
 */

export interface HistoricalRaceData {
  raceId: string;
  sport: 'gallop' | 'trav';
  horses: HistoricalHorseData[];
}

export interface HistoricalHorseData {
  startNumber: number;
  horseName: string;
  place: number; // 1 = winner, 2 = second, etc., 99 = didn't place
  won?: boolean; // True if horse won the race
  headToHeadPoints: number;
  bettingPercentagePoints: number;
  trainerPoints: number;
  driverPoints: number;
  weightAdjustedRatingPoints?: number; // Gallop only
  equipmentPoints: number;
  formPoints: number;
  earningsPerStartCurrentYearPoints?: number; // Gallop only
  earningsPerStartLastTwoYearsPoints?: number; // Gallop only
  timePerformancePoints?: number; // Trav only
  startPositionPoints?: number; // Trav only
  classPoints?: number; // Trav only
  folkRank: number; // Crowd ranking
  bettingPercentage: number;
  odds: number;
}

export class TrainingDataCollector {
  
  /**
   * Convert historical races to ML training format
   */
  static prepareTrainingData(historicalRaces: HistoricalRaceData[], sport: 'gallop' | 'trav'): any[] {
    const trainingData: any[] = [];

    for (const race of historicalRaces) {
      if (race.sport !== sport) continue;

      for (const horse of race.horses) {
        const features = this.extractFeatures(horse, sport);
        const target = horse.place === 1 ? 1 : 0; // Binary: won or didn't win

        trainingData.push({
          raceId: race.raceId,
          horseId: horse.horseName,
          features,
          target,
          folkRank: horse.folkRank,
          actualPlace: horse.place,
          bettingPercentage: horse.bettingPercentage
        });
      }
    }

    return trainingData;
  }

  /**
   * Extract feature vector for ML model
   */
  private static extractFeatures(horse: HistoricalHorseData, sport: 'gallop' | 'trav'): number[] {
    if (sport === 'gallop') {
      return [
        horse.headToHeadPoints,
        horse.bettingPercentagePoints,
        horse.trainerPoints,
        horse.driverPoints,
        horse.weightAdjustedRatingPoints || 0,
        horse.equipmentPoints,
        horse.formPoints,
        horse.earningsPerStartCurrentYearPoints || 0,
        horse.earningsPerStartLastTwoYearsPoints || 0
      ];
    } else {
      return [
        horse.headToHeadPoints,
        horse.bettingPercentagePoints,
        horse.trainerPoints,
        horse.driverPoints,
        horse.timePerformancePoints || 0,
        horse.equipmentPoints,
        horse.formPoints,
        horse.startPositionPoints || 0,
        horse.classPoints || 0
      ];
    }
  }

  /**
   * Evaluate model performance against crowd
   */
  static evaluateAgainstCrowd(predictions: any[], actualResults: any[]): {
    modelAccuracy: number;
    crowdAccuracy: number;
    improvement: number;
  } {
    let modelCorrect = 0;
    let crowdCorrect = 0;
    let totalRaces = 0;

    // Group by race
    const raceGroups = new Map();
    predictions.forEach((pred, idx) => {
      const actual = actualResults[idx];
      if (!raceGroups.has(pred.raceId)) {
        raceGroups.set(pred.raceId, { predictions: [], actuals: [] });
      }
      raceGroups.get(pred.raceId).predictions.push(pred);
      raceGroups.get(pred.raceId).actuals.push(actual);
    });

    for (const [, raceData] of raceGroups) {
      const { predictions: racePreds, actuals: raceActuals } = raceData;
      
      // Find model's top pick
      const modelTopPick = racePreds.reduce((best: any, current: any) => 
        current.modelScore > best.modelScore ? current : best
      );

      // Find crowd's top pick (lowest folk rank or highest betting percentage)
      const crowdTopPick = racePreds.reduce((best: any, current: any) => 
        current.folkRank < best.folkRank ? current : best
      );

      // Find actual winner
      const winner = raceActuals.find((h: any) => h.place === 1);

      if (winner) {
        if (modelTopPick.horseId === winner.horseId) modelCorrect++;
        if (crowdTopPick.horseId === winner.horseId) crowdCorrect++;
        totalRaces++;
      }
    }

    const modelAccuracy = totalRaces > 0 ? modelCorrect / totalRaces : 0;
    const crowdAccuracy = totalRaces > 0 ? crowdCorrect / totalRaces : 0;
    const improvement = modelAccuracy - crowdAccuracy;

    return {
      modelAccuracy,
      crowdAccuracy,
      improvement
    };
  }

  /**
   * Create cross-validation folds for training
   */
  static createCrossValidationFolds(data: any[], numFolds: number = 5): any[][] {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const folds: any[][] = [];
    const foldSize = Math.floor(data.length / numFolds);

    for (let i = 0; i < numFolds; i++) {
      const start = i * foldSize;
      const end = i === numFolds - 1 ? data.length : (i + 1) * foldSize;
      folds.push(shuffled.slice(start, end));
    }

    return folds;
  }

  /**
   * Calculate feature importance using correlation with winning
   */
  static calculateFeatureImportance(trainingData: any[]): { [featureName: string]: number } {
    const featureNames = [
      'headToHeadPoints',
      'bettingPercentagePoints', 
      'trainerPoints',
      'driverPoints',
      'ratingPoints',
      'equipmentPoints',
      'formPoints',
      'earningsPoints1',
      'earningsPoints2'
    ];

    const correlations: { [key: string]: number } = {};

    for (let i = 0; i < featureNames.length; i++) {
      const featureName = featureNames[i];
      const featureValues = trainingData.map(d => d.features[i]);
      const targets = trainingData.map(d => d.target);
      
      correlations[featureName] = this.calculateCorrelation(featureValues, targets);
    }

    return correlations;
  }

  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}
