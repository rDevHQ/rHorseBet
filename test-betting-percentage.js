// Quick test to verify betting percentage functionality
import { getBettingPercentage } from './src/calculations/utils/getBettingPercentage.js';
import { calculateBettingPercentagePoints } from './src/calculations/shared/calculateBettingPercentagePoints.js';

// Test horse data with numeric betting percentages
const testHorse1 = {
  V75: 15.5,
  V86: null,
  odds: 3.2
};

const testHorse2 = {
  V75: 8.2,
  V86: null,
  odds: 5.1
};

const testHorse3 = {
  V75: null,
  V86: null,
  odds: 12.3
};

console.log('Testing getBettingPercentage:');
console.log('Horse 1 V75:', getBettingPercentage(testHorse1, 'V75'));
console.log('Horse 2 V75:', getBettingPercentage(testHorse2, 'V75'));
console.log('Horse 3 V75:', getBettingPercentage(testHorse3, 'V75'));

console.log('\nTesting calculateBettingPercentagePoints:');
const allPercentages = [15.5, 8.2, 5.0]; // Sample race percentages

console.log('Horse 1 points:', calculateBettingPercentagePoints(15.5, allPercentages, 3.2));
console.log('Horse 2 points:', calculateBettingPercentagePoints(8.2, allPercentages, 5.1));
console.log('Horse 3 points (null, fallback to odds):', calculateBettingPercentagePoints(null, allPercentages, 12.3));
