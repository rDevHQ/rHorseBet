/**
 * Logistic Regression ML Model for Horse Racing Predictions (Trav)
 * Endast trav: 11 features
 */

interface TrainingDataTrav {
  features: number[]; // 11 features
  target: number;
  raceId: string;
  horseId: string;
}

interface ModelWeightsTrav {
  headToHeadPoints: number;
  bettingPercentagePoints: number;
  trainerPoints: number;
  driverPoints: number;
  equipmentPoints: number;
  formPoints: number;
  earningsPerStartCurrentYearPoints: number;
  earningsPerStartLastTwoYearsPoints: number;
  timePerformancePoints: number;
  startPositionPoints: number;
  classPoints: number;
  bias: number;
}

export class HorseRacingLogisticRegressionTrav {
  private weights: ModelWeightsTrav;
  private learningRate: number = 0.1;
  private maxIterations: number = 1000;

  constructor() {
    this.weights = {
      headToHeadPoints: Math.random() * 0.02 - 0.01,
      bettingPercentagePoints: Math.random() * 0.02 - 0.01,
      trainerPoints: Math.random() * 0.02 - 0.01,
      driverPoints: Math.random() * 0.02 - 0.01,
      equipmentPoints: Math.random() * 0.02 - 0.01,
      formPoints: Math.random() * 0.02 - 0.01,
      earningsPerStartCurrentYearPoints: Math.random() * 0.02 - 0.01,
      earningsPerStartLastTwoYearsPoints: Math.random() * 0.02 - 0.01,
      timePerformancePoints: Math.random() * 0.02 - 0.01,
      startPositionPoints: Math.random() * 0.02 - 0.01,
      classPoints: Math.random() * 0.02 - 0.01,
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
      features[4] * this.weights.equipmentPoints +
      features[5] * this.weights.formPoints +
      features[6] * this.weights.earningsPerStartCurrentYearPoints +
      features[7] * this.weights.earningsPerStartLastTwoYearsPoints +
      features[8] * this.weights.timePerformancePoints +
      features[9] * this.weights.startPositionPoints +
      features[10] * this.weights.classPoints +
      this.weights.bias;
    return this.sigmoid(z);
  }

  train(trainingData: TrainingDataTrav[]): ModelWeightsTrav {
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      let totalLoss = 0;
      const gradients: ModelWeightsTrav = {
        headToHeadPoints: 0,
        bettingPercentagePoints: 0,
        trainerPoints: 0,
        driverPoints: 0,
        equipmentPoints: 0,
        formPoints: 0,
        earningsPerStartCurrentYearPoints: 0,
        earningsPerStartLastTwoYearsPoints: 0,
        timePerformancePoints: 0,
        startPositionPoints: 0,
        classPoints: 0,
        bias: 0
      };
      for (const data of trainingData) {
        if (!data.features || data.features.length !== 11) continue;
        const prediction = this.predict(data.features);
        const error = prediction - data.target;
        totalLoss += Math.pow(error, 2);
        gradients.headToHeadPoints += error * data.features[0];
        gradients.bettingPercentagePoints += error * data.features[1];
        gradients.trainerPoints += error * data.features[2];
        gradients.driverPoints += error * data.features[3];
        gradients.equipmentPoints += error * data.features[4];
        gradients.formPoints += error * data.features[5];
        gradients.earningsPerStartCurrentYearPoints += error * data.features[6];
        gradients.earningsPerStartLastTwoYearsPoints += error * data.features[7];
        gradients.timePerformancePoints += error * data.features[8];
        gradients.startPositionPoints += error * data.features[9];
        gradients.classPoints += error * data.features[10];
        gradients.bias += error;
      }
      const n = trainingData.length;
      this.weights.headToHeadPoints -= (this.learningRate / n) * gradients.headToHeadPoints;
      this.weights.bettingPercentagePoints -= (this.learningRate / n) * gradients.bettingPercentagePoints;
      this.weights.trainerPoints -= (this.learningRate / n) * gradients.trainerPoints;
      this.weights.driverPoints -= (this.learningRate / n) * gradients.driverPoints;
      this.weights.equipmentPoints -= (this.learningRate / n) * gradients.equipmentPoints;
      this.weights.formPoints -= (this.learningRate / n) * gradients.formPoints;
      this.weights.earningsPerStartCurrentYearPoints -= (this.learningRate / n) * gradients.earningsPerStartCurrentYearPoints;
      this.weights.earningsPerStartLastTwoYearsPoints -= (this.learningRate / n) * gradients.earningsPerStartLastTwoYearsPoints;
      this.weights.timePerformancePoints -= (this.learningRate / n) * gradients.timePerformancePoints;
      this.weights.startPositionPoints -= (this.learningRate / n) * gradients.startPositionPoints;
      this.weights.classPoints -= (this.learningRate / n) * gradients.classPoints;
      this.weights.bias -= (this.learningRate / n) * gradients.bias;
      if (iteration > 0 && Math.abs(totalLoss) < 0.001) break;
    }
    return { ...this.weights };
  }

  getWeights(): ModelWeightsTrav {
    return { ...this.weights };
  }

  setWeights(weights: ModelWeightsTrav): void {
    this.weights = { ...weights };
  }
}
