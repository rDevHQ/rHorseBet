// index.js
import { calculatePointsForGalopp } from './galopp.js';
import { calculatePointsForTrav } from './trav.js';

export function calculatePointsForRace(race, gameType) {
 // console.log("Sport: ", race?.sport, race);
  return race?.sport === 'gallop'
    ? calculatePointsForGalopp(race, gameType)
    : calculatePointsForTrav(race, gameType);
}