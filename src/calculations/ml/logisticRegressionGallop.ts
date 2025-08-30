/**
 * Logistic Regression ML Model for Horse Racing Predictions (Gallop)
 * Endast galopp: 9 features
 */

interface TrainingDataGallop {
  features: number[]; // 9 features
  target: number;
  raceId: string;
  horseId: string;
}

interface ModelWeightsGallop {
  headToHeadPoints: number;
  bettingPercentagePoints: number;
  trainerPoints: number;
  driverPoints: number;
  weightAdjustedRatingPoints: number;
  equipmentPoints: number;
  formPoints: number;
  earningsPerStartCurrentYearPoints: number;
  earningsPerStartLastTwoYearsPoints: number;
  bias: number;
}

export class HorseRacingLogisticRegressionGallop {
  private weights: ModelWeightsGallop;
  private learningRate: number = 0.1;
  private maxIterations: number = 1000;

  constructor() {
    this.weights = {
      headToHeadPoints: Math.random() * 0.02 - 0.01,
      bettingPercentagePoints: Math.random() * 0.02 - 0.01,
      trainerPoints: Math.random() * 0.02 - 0.01,
      driverPoints: Math.random() * 0.02 - 0.01,
      weightAdjustedRatingPoints: Math.random() * 0.02 - 0.01,
      equipmentPoints: Math.random() * 0.02 - 0.01,
      formPoints: Math.random() * 0.02 - 0.01,
      earningsPerStartCurrentYearPoints: Math.random() * 0.02 - 0.01,
      earningsPerStartLastTwoYearsPoints: Math.random() * 0.02 - 0.01,
      bias: 0
    };
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  }

  private predict(features: number[]): number {
    let z =
      features[0] * this.weights.headToHeadPoints +
      features[1] * this.weights.bettingPercentagePoints +
      features[2] * this.weights.trainerPoints +
      features[3] * this.weights.driverPoints +
      features[4] * this.weights.weightAdjustedRatingPoints +
      features[5] * this.weights.equipmentPoints +
      features[6] * this.weights.formPoints +
      features[7] * this.weights.earningsPerStartCurrentYearPoints +
      features[8] * this.weights.earningsPerStartLastTwoYearsPoints +
      this.weights.bias;
    return this.sigmoid(z);
  }

  train(trainingData: TrainingDataGallop[]): ModelWeightsGallop {
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      let totalLoss = 0;
      const gradients: ModelWeightsGallop = {
        headToHeadPoints: 0,
        bettingPercentagePoints: 0,
        trainerPoints: 0,
        driverPoints: 0,
        weightAdjustedRatingPoints: 0,
        equipmentPoints: 0,
        formPoints: 0,
        earningsPerStartCurrentYearPoints: 0,
        earningsPerStartLastTwoYearsPoints: 0,
        bias: 0
      };
      for (const data of trainingData) {
        if (!data.features || data.features.length !== 9) continue;
        const prediction = this.predict(data.features);
        const error = prediction - data.target;
        totalLoss += Math.pow(error, 2);
        gradients.headToHeadPoints += error * data.features[0];
        gradients.bettingPercentagePoints += error * data.features[1];
        gradients.trainerPoints += error * data.features[2];
        gradients.driverPoints += error * data.features[3];
        gradients.weightAdjustedRatingPoints += error * data.features[4];
        gradients.equipmentPoints += error * data.features[5];
        gradients.formPoints += error * data.features[6];
        gradients.earningsPerStartCurrentYearPoints += error * data.features[7];
        gradients.earningsPerStartLastTwoYearsPoints += error * data.features[8];
        gradients.bias += error;
      }
      const n = trainingData.length;
      this.weights.headToHeadPoints -= (this.learningRate / n) * gradients.headToHeadPoints;
      this.weights.bettingPercentagePoints -= (this.learningRate / n) * gradients.bettingPercentagePoints;
      this.weights.trainerPoints -= (this.learningRate / n) * gradients.trainerPoints;
      this.weights.driverPoints -= (this.learningRate / n) * gradients.driverPoints;
      this.weights.weightAdjustedRatingPoints -= (this.learningRate / n) * gradients.weightAdjustedRatingPoints;
      this.weights.equipmentPoints -= (this.learningRate / n) * gradients.equipmentPoints;
      this.weights.formPoints -= (this.learningRate / n) * gradients.formPoints;
      this.weights.earningsPerStartCurrentYearPoints -= (this.learningRate / n) * gradients.earningsPerStartCurrentYearPoints;
      this.weights.earningsPerStartLastTwoYearsPoints -= (this.learningRate / n) * gradients.earningsPerStartLastTwoYearsPoints;
      this.weights.bias -= (this.learningRate / n) * gradients.bias;
      if (iteration > 0 && Math.abs(totalLoss) < 0.001) break;
    }
    return { ...this.weights };
  }

  getWeights(): ModelWeightsGallop {
    return { ...this.weights };
  }

  setWeights(weights: ModelWeightsGallop): void {
    this.weights = { ...weights };
  }
}
