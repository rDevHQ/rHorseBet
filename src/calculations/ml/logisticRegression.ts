/**
 * Logistic Regression ML Model for Horse Racing Predictions
 * Learns optimal weights for combining rating categories
 */

interface TrainingData {
  features: number[]; // [headToHead, betting%, trainer, driver, rating, equipment, form, earnings1yr, earnings2yr]
  target: number; // 1 if won, 0 if didn't win
  raceId: string;
  horseId: string;
}

interface ModelWeights {
// Galopp: 9 features
headToHeadPoints: number;
bettingPercentagePoints: number;
trainerPoints: number;
driverPoints: number;
weightAdjustedRatingPoints?: number; // Endast galopp
equipmentPoints: number;
formPoints: number;
earningsPerStartCurrentYearPoints: number;
earningsPerStartLastTwoYearsPoints: number;
bias: number;
// Trav: 11 features
timePerformancePoints?: number;
startPositionPoints?: number;
classPoints?: number;
}

export class HorseRacingLogisticRegression {
  private weights: ModelWeights;
  private sport: 'gallop' | 'trav' | undefined;
  private learningRate: number = 0.1;
  private maxIterations: number = 1000;

  constructor() {
    // sport sätts vid första train-anrop
    this.sport = undefined;
    this.weights = {
      headToHeadPoints: Math.random() * 0.02 - 0.01,
      bettingPercentagePoints: Math.random() * 0.02 - 0.01,
      trainerPoints: Math.random() * 0.02 - 0.01,
      driverPoints: Math.random() * 0.02 - 0.01,
      equipmentPoints: Math.random() * 0.02 - 0.01,
      formPoints: Math.random() * 0.02 - 0.01,
      earningsPerStartCurrentYearPoints: Math.random() * 0.02 - 0.01,
      earningsPerStartLastTwoYearsPoints: Math.random() * 0.02 - 0.01,
      bias: 0,
      // Gallop-fält
      weightAdjustedRatingPoints: Math.random() * 0.02 - 0.01,
      // Trav-fält
      timePerformancePoints: Math.random() * 0.02 - 0.01,
      startPositionPoints: Math.random() * 0.02 - 0.01,
      classPoints: Math.random() * 0.02 - 0.01
    };
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  }

  private predict(features: number[]): number {
    let z = 0;
    if (this.sport === 'trav' && features.length === 11) {
      // Trav: exakt 11 features, ingen weightAdjustedRatingPoints
      z = features[0] * this.weights.headToHeadPoints +
          features[1] * this.weights.bettingPercentagePoints +
          features[2] * this.weights.trainerPoints +
          features[3] * this.weights.driverPoints +
          features[4] * this.weights.equipmentPoints +
          features[5] * this.weights.formPoints +
          features[6] * this.weights.earningsPerStartCurrentYearPoints +
          features[7] * this.weights.earningsPerStartLastTwoYearsPoints +
          features[8] * this.weights.timePerformancePoints! +
          features[9] * this.weights.startPositionPoints! +
          features[10] * this.weights.classPoints! +
          this.weights.bias;
    } else if (this.sport === 'gallop' && features.length === 9) {
      // Galopp: exakt 9 features, ingen timePerformancePoints/startPositionPoints/classPoints
      z = features[0] * this.weights.headToHeadPoints +
          features[1] * this.weights.bettingPercentagePoints +
          features[2] * this.weights.trainerPoints +
          features[3] * this.weights.driverPoints +
              features[4] * (this.weights.weightAdjustedRatingPoints ?? 0) +
          features[5] * this.weights.equipmentPoints +
          features[6] * this.weights.formPoints +
          features[7] * this.weights.earningsPerStartCurrentYearPoints +
          features[8] * this.weights.earningsPerStartLastTwoYearsPoints +
          this.weights.bias;
    } else {
      // fallback: noll
      z = this.weights.bias;
    }
    return this.sigmoid(z);
  }

  train(trainingData: TrainingData[]): ModelWeights {
    // Sätt sport baserat på första datapunkt
    if (trainingData.length > 0) {
      if ('sport' in trainingData[0] && (trainingData[0] as any).sport) {
        const s = (trainingData[0] as any).sport;
        if (s === 'trav' || s === 'trotting') {
          this.sport = 'trav';
        } else {
          this.sport = 'gallop';
        }
      } else if (trainingData[0].features.length === 11) {
        this.sport = 'trav';
      } else {
        this.sport = 'gallop';
      }
      // Nollställ och säkerställ att rätt fält finns
      if (this.sport === 'trav') {
        this.weights.weightAdjustedRatingPoints = undefined;
        if (typeof this.weights.timePerformancePoints !== 'number') this.weights.timePerformancePoints = 0;
        if (typeof this.weights.startPositionPoints !== 'number') this.weights.startPositionPoints = 0;
        if (typeof this.weights.classPoints !== 'number') this.weights.classPoints = 0;
      } else if (this.sport === 'gallop') {
        this.weights.timePerformancePoints = undefined;
        this.weights.startPositionPoints = undefined;
        this.weights.classPoints = undefined;
        if (typeof this.weights.weightAdjustedRatingPoints !== 'number') this.weights.weightAdjustedRatingPoints = 0;
      }
    }
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      let totalLoss = 0;
      // Initiera gradients utan weightAdjustedRatingPoints för trav
      const gradients: ModelWeights = {
        headToHeadPoints: 0,
        bettingPercentagePoints: 0,
        trainerPoints: 0,
        driverPoints: 0,
        equipmentPoints: 0,
        formPoints: 0,
        earningsPerStartCurrentYearPoints: 0,
        earningsPerStartLastTwoYearsPoints: 0,
        bias: 0,
        ...(this.sport === 'gallop' ? { weightAdjustedRatingPoints: 0 } : {}),
        ...(this.sport === 'trav' ? {
          timePerformancePoints: 0,
          startPositionPoints: 0,
          classPoints: 0
        } : {})
      };

      // Track min/max for features and gradients
      let minFeature = Number.POSITIVE_INFINITY;
      let maxFeature = Number.NEGATIVE_INFINITY;
      let minGradient = Number.POSITIVE_INFINITY;
      let maxGradient = Number.NEGATIVE_INFINITY;

      // Calculate gradients
      for (const data of trainingData) {
        // Fyll ut features-arrayen till rätt längd om den är för kort
        if (this.sport === 'trav') {
          if (!data.features || data.features.length < 11) {
            const padded = Array.from(data.features);
            while (padded.length < 11) padded.push(0);
            data.features = padded;
          }
          if (data.features.length !== 11 || data.features.some(f => typeof f !== 'number' || isNaN(f))) {
            console.error('NaN/undefined i features under träning (trav):', data.features);
            continue;
          }
        } else if (this.sport === 'gallop') {
          if (!data.features || data.features.length < 9) {
            const padded = Array.from(data.features);
            while (padded.length < 9) padded.push(0);
            data.features = padded;
          }
          if (data.features.length !== 9 || data.features.some(f => typeof f !== 'number' || isNaN(f))) {
            console.error('NaN/undefined i features under träning (galopp):', data.features);
            continue;
          }
        } else {
          // fallback: ignorera
          continue;
        }
        // Check for all-zero features
        if (data.features.every((f: number) => f === 0)) {
          console.warn('Alla features är noll i en datapunkt:', data);
        }
        // Track min/max feature values
        for (const f of data.features) {
          if (f < minFeature) minFeature = f;
          if (f > maxFeature) maxFeature = f;
        }
        const prediction = this.predict(data.features);
        const error = prediction - data.target;
        totalLoss += Math.pow(error, 2);

        // Update gradients
        gradients.headToHeadPoints += error * data.features[0];
        gradients.bettingPercentagePoints += error * data.features[1];
        gradients.trainerPoints += error * data.features[2];
        gradients.driverPoints += error * data.features[3];
        if (this.sport === 'trav') {
          // Endast trav-features
          gradients.equipmentPoints += error * data.features[4];
          gradients.formPoints += error * data.features[5];
          gradients.earningsPerStartCurrentYearPoints += error * data.features[6];
          gradients.earningsPerStartLastTwoYearsPoints += error * data.features[7];
          gradients.timePerformancePoints! += error * data.features[8];
          gradients.startPositionPoints! += error * data.features[9];
          gradients.classPoints! += error * data.features[10];
        } else if (this.sport === 'gallop') {
          // Endast galopp-features
          gradients.weightAdjustedRatingPoints! += error * data.features[4];
          gradients.equipmentPoints += error * data.features[5];
          gradients.formPoints += error * data.features[6];
          gradients.earningsPerStartCurrentYearPoints += error * data.features[7];
          gradients.earningsPerStartLastTwoYearsPoints += error * data.features[8];
        }
        gradients.bias += error;
      }

      // Track min/max gradient values
      for (const key of Object.keys(gradients)) {
        const g = gradients[key as keyof ModelWeights];
        if (typeof g === 'number') {
          if (g < minGradient) minGradient = g;
          if (g > maxGradient) maxGradient = g;
        }
      }

      // Kontrollera gradients innan viktuppdatering
      if (Object.values(gradients).some(g => typeof g !== 'number' || isNaN(g))) {
        console.error('NaN/undefined i gradients vid viktuppdatering:', gradients);
        break;
      }

      // Log min/max for features and gradients
      if (iteration % 100 === 0 || iteration === this.maxIterations - 1) {
        console.log(`Iteration ${iteration}: minFeature=${minFeature}, maxFeature=${maxFeature}, minGradient=${minGradient}, maxGradient=${maxGradient}`);
        console.log('Vikter:', this.weights);
      }

      // Update weights
      const n = trainingData.length;
      this.weights.headToHeadPoints -= (this.learningRate / n) * gradients.headToHeadPoints;
      this.weights.bettingPercentagePoints -= (this.learningRate / n) * gradients.bettingPercentagePoints;
      this.weights.trainerPoints -= (this.learningRate / n) * gradients.trainerPoints;
      this.weights.driverPoints -= (this.learningRate / n) * gradients.driverPoints;
      if (this.sport === 'gallop') {
        this.weights.weightAdjustedRatingPoints! -= (this.learningRate / n) * gradients.weightAdjustedRatingPoints!;
      }
      this.weights.equipmentPoints -= (this.learningRate / n) * gradients.equipmentPoints;
      this.weights.formPoints -= (this.learningRate / n) * gradients.formPoints;
      this.weights.earningsPerStartCurrentYearPoints -= (this.learningRate / n) * gradients.earningsPerStartCurrentYearPoints;
      this.weights.earningsPerStartLastTwoYearsPoints -= (this.learningRate / n) * gradients.earningsPerStartLastTwoYearsPoints;
      this.weights.bias -= (this.learningRate / n) * gradients.bias;
      if (this.sport === 'trav') {
        this.weights.timePerformancePoints! -= (this.learningRate / n) * gradients.timePerformancePoints!;
        this.weights.startPositionPoints! -= (this.learningRate / n) * gradients.startPositionPoints!;
        this.weights.classPoints! -= (this.learningRate / n) * gradients.classPoints!;
      }

      // Early stopping if converged
      if (iteration > 0 && Math.abs(totalLoss) < 0.001) {
        break;
      }
    }

    // Log final weights
    console.log('Slutgiltiga vikter efter träning:', this.weights);
    if (this.sport === 'trav') {
      // Returnera ENDAST trav-fälten
      return {
        headToHeadPoints: this.weights.headToHeadPoints,
        bettingPercentagePoints: this.weights.bettingPercentagePoints,
        trainerPoints: this.weights.trainerPoints,
        driverPoints: this.weights.driverPoints,
        equipmentPoints: this.weights.equipmentPoints,
        formPoints: this.weights.formPoints,
        earningsPerStartCurrentYearPoints: this.weights.earningsPerStartCurrentYearPoints,
        earningsPerStartLastTwoYearsPoints: this.weights.earningsPerStartLastTwoYearsPoints,
        timePerformancePoints: this.weights.timePerformancePoints ?? 0,
        startPositionPoints: this.weights.startPositionPoints ?? 0,
        classPoints: this.weights.classPoints ?? 0,
        bias: this.weights.bias
      };
    } else if (this.sport === 'gallop') {
      // Returnera ENDAST galopp-fälten
      return {
        headToHeadPoints: this.weights.headToHeadPoints,
        bettingPercentagePoints: this.weights.bettingPercentagePoints,
        trainerPoints: this.weights.trainerPoints,
        driverPoints: this.weights.driverPoints,
        weightAdjustedRatingPoints: this.weights.weightAdjustedRatingPoints ?? 0,
        equipmentPoints: this.weights.equipmentPoints,
        formPoints: this.weights.formPoints,
        earningsPerStartCurrentYearPoints: this.weights.earningsPerStartCurrentYearPoints,
        earningsPerStartLastTwoYearsPoints: this.weights.earningsPerStartLastTwoYearsPoints,
        bias: this.weights.bias
      };
    }
    // fallback: returnera tomma vikter
    return {
      headToHeadPoints: 0,
      bettingPercentagePoints: 0,
      trainerPoints: 0,
      driverPoints: 0,
      equipmentPoints: 0,
      formPoints: 0,
      earningsPerStartCurrentYearPoints: 0,
      earningsPerStartLastTwoYearsPoints: 0,
      bias: 0
    };
  }

  getWeights(): ModelWeights {
    return { ...this.weights };
  }

  setWeights(weights: ModelWeights): void {
    this.weights = { ...weights };
  }
}
