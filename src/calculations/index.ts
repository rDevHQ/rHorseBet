import { calculatePointsForGalopp } from './galopp/calculatePointsForGalopp';
import { calculatePointsForTrav } from './trav/calculatePointsForTrav';

export function calculatePointsForRace(race: any, gameType: string) {
  return race?.sport === 'gallop'
    ? calculatePointsForGalopp(race, gameType)
    : calculatePointsForTrav(race, gameType);
}
