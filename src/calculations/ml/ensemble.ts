/**
 * Ensemble model combining multiple ML approaches
 * Uses Random Forest-like approach with feature bagging
 */

import { HorseRacingLogisticRegression } from './logisticRegression';

interface EnsembleModel {
  model: HorseRacingLogisticRegression;
  featureSubset: number[]; // Indices of features to use
  weight: number; // Weight in ensemble
}

export class HorseRacingEnsemble {
  private models: EnsembleModel[] = [];
  private numModels: number = 10;
  private featureSubsetSize: number = 6; // Use 6 out of 9 features per model

  /**
   * Creates feature subsets for diversity
   */
  private createFeatureSubsets(): number[][] {
    const allFeatures = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 9 features total
    const subsets: number[][] = [];

    for (let i = 0; i < this.numModels; i++) {
      const subset = [...allFeatures]
        .sort(() => Math.random() - 0.5)
        .slice(0, this.featureSubsetSize);
      subsets.push(subset.sort((a, b) => a - b));
    }

    return subsets;
  }

  /**
   * Bootstrap sampling for training diversity
   */
  private bootstrap(data: any[], ratio: number = 0.8): any[] {
    const sampleSize = Math.floor(data.length * ratio);
    const sample: any[] = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      sample.push(data[randomIndex]);
    }
    
    return sample;
  }

  train(trainingData: any[]): void {
    const featureSubsets = this.createFeatureSubsets();
    this.models = [];

    // Kontrollera att features inte innehåller NaN/undefined
    const hasInvalid = trainingData.some(row => row.features.some((f: number) => typeof f !== 'number' || isNaN(f)));
    if (hasInvalid) {
      console.error('Träningsdata innehåller NaN/undefined i features!', trainingData.filter(row => row.features.some((f: number) => typeof f !== 'number' || isNaN(f))));
      throw new Error('Träningsdata innehåller NaN/undefined i features!');
    }

    for (let i = 0; i < this.numModels; i++) {
      const model = new HorseRacingLogisticRegression();
      const featureSubset = featureSubsets[i];
      
      // Bootstrap sample
      const bootstrapData = this.bootstrap(trainingData);
      
      // Filter features for this model
      const filteredData = bootstrapData.map(item => ({
        ...item,
        features: featureSubset.map(idx => item.features[idx])
      }));

      // Kontrollera filteredData features
      const hasInvalidFiltered = filteredData.some(row => row.features.some((f: number) => typeof f !== 'number' || isNaN(f)));
      if (hasInvalidFiltered) {
        console.error('FilteredData innehåller NaN/undefined i features! Modell:', i, filteredData.filter(row => row.features.some((f: number) => typeof f !== 'number' || isNaN(f))));
        throw new Error('FilteredData innehåller NaN/undefined i features!');
      }

      // Train model
      model.train(filteredData);
      // Logga ut vikter för varje ensemblemodell
      console.log('Vikter för ensemblemodell', i, model.getWeights());

      // Validate model performance to set ensemble weight
      const validation = this.bootstrap(trainingData, 0.2);
      const accuracy = this.validateModel(model, validation, featureSubset);

      this.models.push({
        model,
        featureSubset,
        weight: accuracy
      });
    }

    // Normalize weights
    const totalWeight = this.models.reduce((sum, m) => sum + m.weight, 0);
    this.models.forEach(m => m.weight /= totalWeight);
  }

  private validateModel(model: HorseRacingLogisticRegression, validationData: any[], featureSubset: number[]): number {
    let correct = 0;
    let total = 0;

    // Group by race to test ranking accuracy
    const raceGroups = new Map();
    validationData.forEach(item => {
      if (!raceGroups.has(item.raceId)) {
        raceGroups.set(item.raceId, []);
      }
      raceGroups.get(item.raceId).push(item);
    });

    for (const [, horses] of raceGroups) {
      if (horses.length < 2) continue;

      // Predict probabilities for all horses in race
      const predictions = horses.map((horse: any) => {
        const filteredFeatures = featureSubset.map(idx => horse.features[idx]);
        const prob = this.predictSingle(model, filteredFeatures);
        return { horse, prob };
      });

      // Sort by prediction probability
      predictions.sort((a: any, b: any) => b.prob - a.prob);

      // Check if winner is in top predictions
      const winner = horses.find((h: any) => h.target === 1);
      if (winner) {
        const winnerRank = predictions.findIndex((p: any) => p.horse === winner) + 1;
        // Give credit for top 3 predictions (weighted)
        if (winnerRank === 1) correct += 1.0;
        else if (winnerRank === 2) correct += 0.5;
        else if (winnerRank === 3) correct += 0.25;
        total += 1;
      }
    }

    return total > 0 ? correct / total : 0;
  }

  private predictSingle(model: HorseRacingLogisticRegression, features: number[]): number {
    // This is a simplified prediction - you'd need to expose the predict method
    // For now, we'll use a simple weighted sum
    const weights = model.getWeights();
    return features[0] * weights.headToHeadPoints +
           features[1] * weights.bettingPercentagePoints +
           features[2] * weights.trainerPoints +
           features[3] * weights.driverPoints +
           features[4] * weights.weightAdjustedRatingPoints +
           weights.bias;
  }

  predict(features: number[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const ensembleModel of this.models) {
      const filteredFeatures = ensembleModel.featureSubset.map(idx => features[idx]);
      const prediction = this.predictSingle(ensembleModel.model, filteredFeatures);
      weightedSum += prediction * ensembleModel.weight;
      totalWeight += ensembleModel.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  getModelWeights(): any {
    return this.models.map(m => ({
      weight: m.weight,
      featureSubset: m.featureSubset,
      modelWeights: m.model.getWeights()
    }));
  }

  /**
   * Extract aggregated feature weights for updating pointsMLConfig.ts
   */
  getFeatureWeights(): { [key: string]: number } {
    const featureNames = [
      'headToHeadPoints',
      'bettingPercentagePoints', 
      'trainerPoints',
      'driverPoints',
      'weightAdjustedRatingPoints',
      'equipmentPoints',
      'formPoints',
      'earningsPerStartCurrentYearPoints',
      'earningsPerStartLastTwoYearsPoints'
    ];

    // Initialize weights
    const aggregatedWeights: { [key: string]: number } = {};
    featureNames.forEach(name => aggregatedWeights[name] = 0);

    // Aggregate weights from all models in ensemble
    for (const ensembleModel of this.models) {
      const modelWeights = ensembleModel.model.getWeights();
      const modelWeight = ensembleModel.weight;
      
      // Map model weights to feature names based on subset
      ensembleModel.featureSubset.forEach((originalFeatureIdx) => {
        const featureName = featureNames[originalFeatureIdx];
        // Get the actual weight value from the model weights object
        const weightValue = (modelWeights as any)[featureName] || 0;
        aggregatedWeights[featureName] += Math.abs(weightValue) * modelWeight;
      });
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(aggregatedWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      Object.keys(aggregatedWeights).forEach(key => {
        aggregatedWeights[key] /= totalWeight;
      });
    }

    return aggregatedWeights;
  }
}
