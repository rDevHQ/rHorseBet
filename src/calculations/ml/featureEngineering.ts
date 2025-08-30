/**
 * Advanced Feature Engineering for Horse Racing ML
 * Creates new features from existing data to improve model performance
 */

export class FeatureEngineer {
  
  /**
   * Create interaction features (combinations of existing features)
   */
  static createInteractionFeatures(horseData: any): number[] {
    const base = horseData;
    
    return [
      // Original features
      base.headToHeadPoints,
      base.bettingPercentagePoints,
      base.trainerPoints,
      base.driverPoints,
      base.weightAdjustedRatingPoints || 0,
      base.equipmentPoints,
      base.formPoints,
      base.earningsPerStartCurrentYearPoints || 0,
      base.earningsPerStartLastTwoYearsPoints || 0,
      
      // Interaction features
      base.formPoints * base.headToHeadPoints, // Form-H2H interaction
      base.trainerPoints * base.driverPoints, // Trainer-Driver combo
      base.bettingPercentagePoints * base.formPoints, // Market vs Form
      Math.sqrt(base.earningsPerStartCurrentYearPoints || 0), // Earnings transformation
      
      // Relative features (compared to field average)
      base.relativeFormPoints || 0,
      base.relativeBettingPoints || 0,
      base.relativeH2HPoints || 0,
      
      // Risk features
      base.consistencyScore || 0,
      base.upsetPotential || 0,
      base.crowdDisagreement || 0
    ];
  }
  
  /**
   * Calculate relative features (horse vs field average)
   */
  static calculateRelativeFeatures(horses: any[]): any[] {
    const avgForm = horses.reduce((sum, h) => sum + h.formPoints, 0) / horses.length;
    const avgBetting = horses.reduce((sum, h) => sum + h.bettingPercentagePoints, 0) / horses.length;
    const avgH2H = horses.reduce((sum, h) => sum + h.headToHeadPoints, 0) / horses.length;
    
    return horses.map(h => ({
      ...h,
      relativeFormPoints: h.formPoints - avgForm,
      relativeBettingPoints: h.bettingPercentagePoints - avgBetting,
      relativeH2HPoints: h.headToHeadPoints - avgH2H
    }));
  }
  
  /**
   * Calculate consistency score based on recent performance
   */
  static calculateConsistencyScore(lastTenStarts: any[]): number {
    if (!lastTenStarts || lastTenStarts.length === 0) return 0;
    
    const placements = lastTenStarts
      .filter(start => start.position && start.position !== 'N/A')
      .map(start => parseInt(start.position))
      .filter(pos => !isNaN(pos));
    
    if (placements.length === 0) return 0;
    
    // Calculate coefficient of variation (lower = more consistent)
    const mean = placements.reduce((sum, pos) => sum + pos, 0) / placements.length;
    const variance = placements.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) / placements.length;
    const stdDev = Math.sqrt(variance);
    
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    
    // Convert to consistency score (0-100, higher = more consistent)
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 50)));
  }
  
  /**
   * Calculate upset potential (how likely to outperform market expectations)
   */
  static calculateUpsetPotential(horse: any, horses: any[]): number {
    const folkRank = horse.folkRank || horses.length;
    const modelRank = horse.mlRank || horses.length;
    const totalHorses = horses.length;
    
    // If model ranks horse much higher than crowd, high upset potential
    const rankDifference = folkRank - modelRank;
    const normalizedDifference = rankDifference / totalHorses;
    
    // Scale to 0-100
    return Math.max(0, Math.min(100, 50 + (normalizedDifference * 100)));
  }
  
  /**
   * Calculate crowd disagreement (how much model disagrees with market)
   */
  static calculateCrowdDisagreement(horse: any): number {
    const marketProb = horse.bettingPercentage || 0;
    const modelProb = horse.mlExpectedPercentage || 0;
    
    // Calculate absolute difference in probability
    const disagreement = Math.abs(marketProb - modelProb);
    
    // Scale to 0-100
    return Math.min(100, disagreement);
  }
  
  /**
   * Create race-context features
   */
  static createRaceContextFeatures(race: any, horse: any): number[] {
    return [
      race.distance || 0,
      race.horses?.length || 0, // Field size
      this.getTrackTypeEncoding(race.track?.name || ''),
      this.getStartMethodEncoding(race.startMethod || ''),
      this.getTimeOfDayFactor(race.startTime || ''),
      horse.postPosition || 0, // Starting position
      race.purse || 0, // Prize money
      this.getWeatherFactor(race.weather || 'clear')
    ];
  }
  
  private static getTrackTypeEncoding(trackName: string): number {
    // Encode track characteristics as numerical values
    const trackMap: { [key: string]: number } = {
      'Solvalla': 1,
      'Åby': 2,
      'Jägersro': 3,
      'Mantorp': 4,
      'Bjerke': 5,
      // Add more tracks as needed
    };
    
    return trackMap[trackName] || 0;
  }
  
  private static getStartMethodEncoding(startMethod: string): number {
    const methodMap: { [key: string]: number } = {
      'auto': 1,
      'volte': 2,
      'line': 3
    };
    
    return methodMap[startMethod.toLowerCase()] || 0;
  }
  
  private static getTimeOfDayFactor(startTime: string): number {
    // Convert time to hour of day, which might affect performance
    const hour = new Date(startTime).getHours();
    return hour;
  }
  
  private static getWeatherFactor(weather: string): number {
    const weatherMap: { [key: string]: number } = {
      'clear': 1,
      'cloudy': 2,
      'rain': 3,
      'snow': 4
    };
    
    return weatherMap[weather.toLowerCase()] || 1;
  }
  
  /**
   * Apply polynomial features (squares and interactions)
   */
  static createPolynomialFeatures(features: number[], degree: number = 2): number[] {
    const polynomial = [...features];
    
    if (degree >= 2) {
      // Add squared terms
      features.forEach(feature => {
        polynomial.push(feature * feature);
      });
      
      // Add interaction terms
      for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
          polynomial.push(features[i] * features[j]);
        }
      }
    }
    
    return polynomial;
  }
  
  /**
   * Normalize features to 0-1 range
   */
  static normalizeFeatures(allHorseFeatures: number[][]): number[][] {
    const numFeatures = allHorseFeatures[0]?.length || 0;
    const normalized: number[][] = [];
    
    // Calculate min/max for each feature
    const mins = new Array(numFeatures).fill(Infinity);
    const maxs = new Array(numFeatures).fill(-Infinity);
    
    allHorseFeatures.forEach(horseFeatures => {
      horseFeatures.forEach((value, index) => {
        mins[index] = Math.min(mins[index], value);
        maxs[index] = Math.max(maxs[index], value);
      });
    });
    
    // Normalize each horse's features
    allHorseFeatures.forEach(horseFeatures => {
      const normalizedHorse = horseFeatures.map((value, index) => {
        const range = maxs[index] - mins[index];
        return range > 0 ? (value - mins[index]) / range : 0;
      });
      normalized.push(normalizedHorse);
    });
    
    return normalized;
  }
}
