/**
 * Historical Race Data Collector
 * Fetches and processes historical race data from ATG API for ML training
 */

import { calculatePointsForRace } from '../index';
import type { HistoricalRaceData, HistoricalHorseData } from './trainingDataCollector';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface CollectionProgress {
  totalDays: number;
  processedDays: number;
  totalRaces: number;
  processedRaces: number;
  errors: string[];
}

export class HistoricalDataCollector {
  private apiCalendarUrl = 'https://www.atg.se/services/racinginfo/v1/api/calendar/day/';
  private gameApiBaseUrl = 'https://www.atg.se/services/racinginfo/v1/api/games/';
  private raceApiBaseUrl = 'https://www.atg.se/services/racinginfo/v1/api/races/';
  
  /**
   * Collect historical race data for a date range
   */
  async collectHistoricalData(
    dateRange: DateRange,
    gameTypes: string[] = ['V75', 'V86', 'V4', 'VINNARE'],
    sports: ('gallop' | 'trav')[] = ['gallop', 'trav'],
    progressCallback?: (progress: CollectionProgress) => void
  ): Promise<HistoricalRaceData[]> {
    
    const dates = this.getDateRange(dateRange.startDate, dateRange.endDate);
    const allRaces: HistoricalRaceData[] = [];
    const errors: string[] = [];
    
    const progress: CollectionProgress = {
      totalDays: dates.length,
      processedDays: 0,
      totalRaces: 0,
      processedRaces: 0,
      errors: []
    };

    console.log(`Starting historical data collection for ${dates.length} days...`);
    
    for (const date of dates) {
      try {
        console.log(`Processing date: ${date}`);
        
        // Get calendar for this date
        const calendar = await this.fetchCalendarData(date);
        if (!calendar || !calendar.games) {
          console.warn(`No games found for ${date}`);
          continue;
        }

        // Process each game type
        for (const gameType of gameTypes) {
          const games = calendar.games[gameType] || [];
          
          for (const game of games) {
            try {
              // Get game details
              const gameData = await this.fetchGameData(game.id);
              if (!gameData || !gameData.races) continue;

              // Filter races by sport and country
              const relevantRaces = gameData.races.filter((race: any) => {
                const isSwedish = race.track?.countryCode === 'SE';
                const isRidsport = race.track?.id === 47; // Exclude ridsport
                
                // More flexible sport matching for trav/harness racing
                const sportLower = race.sport?.toLowerCase() || '';
                const sportMatch = sports.some(sport => {
                  if (sport === 'trav') {
                    // ATG uses 'trot' for trav racing
                    return sportLower === 'trot' || 
                           sportLower.includes('trav') || 
                           sportLower.includes('harness') || 
                           sportLower.includes('trott') ||
                           sportLower === 'standardbred';
                  } else if (sport === 'gallop') {
                    // ATG uses 'galopp' with double-p for gallop
                    return sportLower === 'galopp' ||
                           sportLower.includes('gallop') || 
                           sportLower.includes('thoroughbred') ||
                           sportLower.includes('flat');
                  }
                  return false;
                });
                
                console.log(`Race ${race.id}: Swedish=${isSwedish}, Sport="${race.sport}", SportLower="${sportLower}", Match=${sportMatch}, Ridsport=${isRidsport}`);
                
                return isSwedish && !isRidsport && sportMatch;
              });

              progress.totalRaces += relevantRaces.length;

              // Process each race
              for (const race of relevantRaces) {
                try {
                  const historicalRace = await this.processRace(race, gameType);
                  if (historicalRace && historicalRace.horses.length > 0) {
                    allRaces.push(historicalRace);
                  }
                  progress.processedRaces++;
                } catch (error) {
                  const errorMsg = `Error processing race ${race.id}: ${error}`;
                  errors.push(errorMsg);
                  console.error(errorMsg);
                }
              }
            } catch (error) {
              const errorMsg = `Error processing game ${game.id}: ${error}`;
              errors.push(errorMsg);
              console.error(errorMsg);
            }
          }
        }
        
        progress.processedDays++;
        progress.errors = errors;
        
        if (progressCallback) {
          progressCallback({ ...progress });
        }
        
        // Add delay to be respectful to the API
        await this.delay(100);
        
      } catch (error) {
        const errorMsg = `Error processing date ${date}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`Collection complete: ${allRaces.length} races collected with ${errors.length} errors`);
    return allRaces;
  }

  /**
   * Process a single race to extract historical data
   */
  private async processRace(race: any, gameType: string): Promise<HistoricalRaceData | null> {
    try {
      console.log(`Processing race ${race.id}, status: ${race.status}`);
      
      // Only process completed races that have results
      if (race.status !== 'results') {
        console.log(`Skipping race ${race.id} - status is ${race.status}, not 'results'`);
        return null;
      }

      // Check if race has pools with results (this is where the winner data is)
      if (!race.pools || !race.pools.vinnare?.result) {
        console.log(`Skipping race ${race.id} - no pool results available`);
        return null;
      }

      // Get detailed start data for all horses
      const startsData = await this.fetchStartsData([race]);
      
      // Transform race data using simplified transformation
      const transformedRace = this.transformSingleRace(race, startsData);
      if (!transformedRace) return null;
      
      // Calculate points for all horses
      const calculatedHorses = calculatePointsForRace(transformedRace, gameType);

      // Convert to historical data format with proper results
      const horses: HistoricalHorseData[] = calculatedHorses.map((horse: any) => {
        // Get actual race result for this horse
        const raceResult = this.getRaceResult(race, horse.startNumber);
        if (this.getSportType(race.sport) === 'trav') {
          // Trav: Endast 11 features
          return {
            startNumber: horse.startNumber,
            horseName: horse.horseName,
            place: raceResult.place,
            won: raceResult.place === 1,
            headToHeadPoints: horse.headToHeadPoints || 0,
            bettingPercentagePoints: horse.bettingPercentagePoints || 0,
            trainerPoints: horse.trainerPoints || 0,
            driverPoints: horse.driverPoints || 0,
            equipmentPoints: horse.equipmentPoints || 0,
            formPoints: horse.formPoints || 0,
            earningsPerStartCurrentYearPoints: horse.earningsPerStartCurrentYearPoints || 0,
            earningsPerStartLastTwoYearsPoints: horse.earningsPerStartLastTwoYearsPoints || 0,
            timePerformancePoints: horse.timePerformanceLastTenStartsPoints || 0,
            startPositionPoints: horse.startPositionPoints || 0,
            classPoints: horse.classPoints || 0,
            folkRank: horse.folkRank || 99,
            bettingPercentage: this.getBettingPercentageForHorse(race, horse.startNumber),
            odds: this.getOddsForHorse(race, horse.startNumber)
          };
        } else {
          // Galopp: Endast 9 features
          return {
            startNumber: horse.startNumber,
            horseName: horse.horseName,
            place: raceResult.place,
            won: raceResult.place === 1,
            headToHeadPoints: horse.headToHeadPoints || 0,
            bettingPercentagePoints: horse.bettingPercentagePoints || 0,
            trainerPoints: horse.trainerPoints || 0,
            driverPoints: horse.driverPoints || 0,
            weightAdjustedRatingPoints: horse.weightAdjustedRatingPoints || 0,
            equipmentPoints: horse.equipmentPoints || 0,
            formPoints: horse.formPoints || 0,
            earningsPerStartCurrentYearPoints: horse.earningsPerStartCurrentYearPoints || 0,
            earningsPerStartLastTwoYearsPoints: horse.earningsPerStartLastTwoYearsPoints || 0,
            folkRank: horse.folkRank || 99,
            bettingPercentage: this.getBettingPercentageForHorse(race, horse.startNumber),
            odds: this.getOddsForHorse(race, horse.startNumber)
          };
        }
      });

      return {
        raceId: race.id,
        sport: this.getSportType(race.sport),
        horses: horses.filter(h => h.place > 0 && h.place < 99) // Only include horses that finished properly (place 1-20, exclude scratched/disqualified)
      };
      
    } catch (error) {
      console.error(`Error processing race ${race.id}:`, error);
      return null;
    }
  }

  /**
   * Determine sport type using same logic as the main app
   */
  private getSportType(sport: string | undefined): 'gallop' | 'trav' {
    const sportLower = sport?.toLowerCase() || '';
    // ATG uses 'galopp' for gallop and 'trot' for trav
    if (sportLower === 'galopp' || sportLower === 'gallop') {
      return 'gallop';
    } else if (sportLower === 'trot' || sportLower === 'trav') {
      return 'trav';
    }
    // Default fallback - assume trav if unknown
    return 'trav';
  }

  /**
   * Get the actual race result (finishing position) for a horse
   */
  private getRaceResult(race: any, startNumber: number): { place: number } {
    // Method 1: Check individual start result first (most reliable)
    const start = race.starts?.find((s: any) => s.number === startNumber);
    if (start?.result?.place !== undefined) {
      const place = start.result.place;
      
      // Handle special cases
      if (place === 0) {
        console.log(`Horse ${startNumber} finished but got no official placement (place=0) - finished too low to be ranked`);
        return { place: 99 }; // Finished but unranked
      }
      
      if (place > 0) {
        console.log(`Using start result for horse ${startNumber}: place ${place}`);
        return { place: place };
      }
    }
    
    // Handle disqualified/scratched horses (undefined place)
    if (start?.result?.place === undefined) {
      console.log(`Horse ${startNumber} was disqualified or scratched (place=undefined)`);
      return { place: 99 }; // Disqualified/scratched
    }
    
    // Method 2: Check pool results (V86, vinnare, etc.)
    const pools = race.pools || {};
    
    // Check vinnare pool first (most reliable for winners)
    const vinnarePool = pools.vinnare;
    if (vinnarePool?.result?.winners) {
      const winners = vinnarePool.result.winners;
      
      // Special case: Dead heat (dött lopp) - multiple winners on same place
      // If there are multiple winners in vinnare pool, they all tied for 1st place
      const isDeadHeat = winners.length > 1;
      
      if (isDeadHeat) {
        console.log(`Dead heat detected in race ${race.id}: ${winners.length} horses tied for 1st place - ${winners.map((w: any) => w.number).join(', ')}`);
      }
      
      for (let i = 0; i < winners.length; i++) {
        if (winners[i].number === startNumber) {
          // In a dead heat, all horses in vinnare pool get 1st place
          return { place: isDeadHeat ? 1 : i + 1 };
        }
      }
    }
    
    // Check plats pool for place results
    const platsPool = pools.plats;
    if (platsPool?.result?.winners) {
      // Handle both array and object formats for plats
      if (Array.isArray(platsPool.result.winners)) {
        const winners = platsPool.result.winners;
        for (let i = 0; i < winners.length; i++) {
          if (winners[i].number === startNumber) {
            return { place: i + 1 };
          }
        }
      } else {
        // Handle object format like { first: [...], second: [...], third: [...] }
        const winners = platsPool.result.winners;
        if (winners.first?.some((w: any) => w.number === startNumber)) {
          return { place: 1 };
        }
        if (winners.second?.some((w: any) => w.number === startNumber)) {
          return { place: 2 };
        }
        if (winners.third?.some((w: any) => w.number === startNumber)) {
          return { place: 3 };
        }
      }
    }
    
    // Check other pool types
    for (const poolType of ['V86', 'V75', 'V4']) {
      const pool = pools[poolType];
      if (pool?.result?.winners) {
        const winners = pool.result.winners;
        for (let i = 0; i < winners.length; i++) {
          if (winners[i].number === startNumber) {
            return { place: i + 1 };
          }
        }
      }
    }
    
    // Method 3: Check race results object (fallback)
    const results = race.results || {};
    if (results.order && Array.isArray(results.order)) {
      const position = results.order.findIndex((num: number) => num === startNumber);
      if (position >= 0) {
        return { place: position + 1 };
      }
    }
    
    return { place: 99 }; // Did not finish or unknown
  }

  /**
   * Get betting percentage for a specific horse
   */
  private getBettingPercentageForHorse(race: any, startNumber: number): number {
    const start = race.starts?.find((s: any) => s.number === startNumber);
    if (!start) return 0;
    
    // Get odds first (we know this works from the test)
    const odds = this.getOddsForHorse(race, startNumber);
    
    // Calculate betting percentage from odds
    // Formula: Betting % = (1 / odds) * 100
    if (odds > 0 && odds < 99) {
      const percentage = (1 / odds) * 100;
      return Math.round(percentage * 100) / 100; // Round to 2 decimal places
    }
    
    // Fallback: Check pools for betting distribution (if available)
    const pools = start.pools || race.pools || {};
    
    for (const poolType of ['V86', 'V75', 'V4', 'vinnare']) {
      const pool = pools[poolType];
      if (pool?.betDistribution) {
        return pool.betDistribution;
      }
      if (pool?.distribution) {
        return pool.distribution;
      }
    }
    
    return 0;
  }

  /**
   * Get odds for a specific horse
   */
  private getOddsForHorse(race: any, startNumber: number): number {
    const start = race.starts?.find((s: any) => s.number === startNumber);
    if (!start) return 99.0;
    
    // Check different pool types for odds
    const pools = start.pools || {};
    
    for (const poolType of ['vinnare', 'V75', 'V86', 'V4']) {
      const pool = pools[poolType];
      if (pool?.odds) {
        const odds = parseFloat(pool.odds);
        if (odds > 0) {
          return odds / 100; // Convert from öre to kronor
        }
      }
    }
    
    // Check horse odds directly
    if (start.horse?.odds) {
      const odds = parseFloat(start.horse.odds);
      if (odds > 0) {
        return odds / 100;
      }
    }
    
    return 99.0; // Default high odds
  }

  /**
   * Simplified race transformation for historical data
   */
  private transformSingleRace(race: any, startsData: any): any {
    const LAST_MONTH = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();

    // Create place map from race results - prioritize start.result.place
    const placeMap = new Map();
    
    // First priority: Check individual start results (most reliable sport results)
    race.starts?.forEach((start: any) => {
      if (start.result?.place !== undefined) {
        const place = start.result.place;
        
        // Handle special cases
        if (place === 0) {
          // Horse finished but got no official placement (too low to be ranked)
          placeMap.set(start.number, 99);
          console.log(`Horse ${start.number} finished but unranked (place=0)`);
        } else if (place > 0) {
          placeMap.set(start.number, place);
          console.log(`Using start result for horse ${start.number}: place ${place}`);
        }
      } else {
        // Horse was disqualified or scratched (place=undefined)
        placeMap.set(start.number, 99);
        console.log(`Horse ${start.number} was disqualified/scratched (place=undefined)`);
      }
    });
    
    // Secondary: Check vinnare pool for winners (only if not already in placeMap)
    const vinnarePool = race.pools?.vinnare;
    if (vinnarePool?.result?.winners) {
      const winners = vinnarePool.result.winners;
      
      // Special case: Dead heat (dött lopp) - multiple winners on same place
      // If there are multiple winners in vinnare pool, they all tied for 1st place
      const isDeadHeat = winners.length > 1;
      
      if (isDeadHeat) {
        console.log(`Dead heat detected in race ${race.id}: ${winners.length} horses tied for 1st place - ${winners.map((w: any) => w.number).join(', ')}`);
      }
      
      for (let i = 0; i < winners.length; i++) {
        const horseNumber = winners[i].number;
        if (!placeMap.has(horseNumber)) {
          // In a dead heat, all horses in vinnare pool get 1st place
          placeMap.set(horseNumber, isDeadHeat ? 1 : i + 1);
        }
      }
    }
    
    // Tertiary: Check plats pool for additional places (only if not already in placeMap)
    const platsPool = race.pools?.plats;
    if (platsPool?.result?.winners) {
      console.log(`Plats pool winners type: ${typeof platsPool.result.winners}`);
      
      // Handle both array and object formats for plats
      if (Array.isArray(platsPool.result.winners)) {
        const winners = platsPool.result.winners;
        for (let i = 0; i < winners.length; i++) {
          const horseNumber = winners[i].number;
          if (!placeMap.has(horseNumber)) {
            placeMap.set(horseNumber, i + 1);
          }
        }
      } else {
        // Handle object format like { first: [...], second: [...], third: [...] }
        const winners = platsPool.result.winners;
        if (winners.first) {
          winners.first.forEach((w: any) => {
            if (!placeMap.has(w.number)) {
              placeMap.set(w.number, 1);
            }
          });
        }
        if (winners.second) {
          winners.second.forEach((w: any) => {
            if (!placeMap.has(w.number)) {
              placeMap.set(w.number, 2);
            }
          });
        }
        if (winners.third) {
          winners.third.forEach((w: any) => {
            if (!placeMap.has(w.number)) {
              placeMap.set(w.number, 3);
            }
          });
        }
      }
    }

    const transformedRace = {
      id: race.id,
      sport: race.sport,
      date: race.date,
      number: race.number,
      distance: race.distance,
      startMethod: race.startMethod,
      startTime: race.startTime,
      name: race.name,
      trackName: race.track.name,
      // Add starts alias for compatibility
      starts: race.starts.map((start: any) => {
        const horseId = start.horse.id || `${race.id}_${start.number}`;
        const place = placeMap.get(start.number) ?? null;
        const horseRecords = (startsData[horseId]?.horse?.results?.records || []);
        
        // Process last ten starts with more complete data
        const lastTenStarts = horseRecords
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
          .map((record: any) => ({
            date: record.date,
            track: record.track?.name || "Unknown",
            raceNumber: record.race?.number || "N/A",
            raceId: record.race?.id || "Unknown",
            distance: record.race?.distance || 0,
            startMethod: record.race?.startMethod || "Unknown",
            postPosition: record.start?.postPosition || record.start?.number || 0,
            position: record.place || "N/A",
            margin: record.margin || "N/A",
            disqualified: record.disqualified || false,
            galloped: record.galloped || false,
            odds: record.odds ? (record.odds / 100).toFixed(2) : "N/A",
            time: record.kmTime 
              ? `${record.kmTime.minutes}.${record.kmTime.seconds},${record.kmTime.tenths}`
              : "N/A",
            firstPrize: record.race?.firstPrize ? (record.race.firstPrize / 100) : 0,
            weight: record.start?.weight || 0,
            handicap: record.start?.handicap || 0
          }));

        // Process last month summary
        const lastMonthRecords = horseRecords.filter((record: any) => {
          const recordDate = new Date(record.date);
          return now.getTime() - recordDate.getTime() <= LAST_MONTH;
        });

        const lastMonthSummary = lastMonthRecords.reduce((summary: any, record: any) => {
          summary.starts += 1;
          const place = parseInt(record.place, 10);
          if (place === 1) summary.placement["1"] += 1;
          else if (place === 2) summary.placement["2"] += 1;
          else if (place === 3) summary.placement["3"] += 1;
          return summary;
        }, {
          starts: 0,
          placement: { "1": 0, "2": 0, "3": 0 }
        });

        // Get betting percentage and odds for this horse
        const bettingPercentage = this.getBettingPercentageForHorse(race, start.number);
        const odds = this.getOddsForHorse(race, start.number);
        
        // Extract data from startsData if available
        const startData = startsData[horseId];
        const horse = startData?.horse || {};
        const statistics = horse.statistics || {};
        const years = statistics.years || {};
        const currentYear = new Date(race.date).getFullYear().toString();
        const lastYear = (new Date(race.date).getFullYear() - 1).toString();
        const twoYearsAgo = (new Date(race.date).getFullYear() - 2).toString();
        
        // Debug: Log data availability
        if (start.number === 1) {
          console.log(`Race ${race.id} - Start data available:`, {
            hasStartData: !!startData,
            hasHorse: !!horse,
            hasStatistics: !!statistics,
            hasYears: !!years,
            yearKeys: Object.keys(years),
            currentYear,
            currentYearStats: years[currentYear]
          });
        }
        
        // Calculate earnings per start
        const currentYearStats = years[currentYear] || {};
        const lastYearStats = years[lastYear] || {};
        const twoYearsAgoStats = years[twoYearsAgo] || {};
        
        const earningsPerStartCurrentYear = currentYearStats.starts > 0 
          ? (currentYearStats.earnings || 0) / currentYearStats.starts 
          : 0;
          
        const earningsPerStartLastYear = lastYearStats.starts > 0 
          ? (lastYearStats.earnings || 0) / lastYearStats.starts 
          : 0;
          
        const lastTwoYearsEarnings = (lastYearStats.earnings || 0) + (twoYearsAgoStats.earnings || 0);
        const lastTwoYearsStarts = (lastYearStats.starts || 0) + (twoYearsAgoStats.starts || 0);
        const earningsPerStartLastTwoYears = lastTwoYearsStarts > 0 
          ? lastTwoYearsEarnings / lastTwoYearsStarts 
          : 0;

        return {
          startNumber: start.number,
          postPosition: start.number, // Add postPosition for calculateStartPositionPoints
          horse: {
            name: start.horse.name,
            place: place,
            odds: odds,
            // Add betting percentage fields that getBettingPercentage() expects
            V75: bettingPercentage || null,
            V86: bettingPercentage || null,
            V65: bettingPercentage || null,
            V64: bettingPercentage || null,
            V4: bettingPercentage || null,
            earningsPerStartCurrentYear: earningsPerStartCurrentYear,
            earningsPerStartLastYear: earningsPerStartLastYear,
            earningsPerStartLastTwoYears: earningsPerStartLastTwoYears,
            // Add additional horse data for galopp calculations
            weight: start.weight || 0,
            handicap: start.horse?.handicap || 0,
            age: horse.age || 0,
            // Add equipment data
            blinders: start.horse?.blinders || false,
            shoes: start.horse?.shoes || {},
            sulky: start.horse?.sulky || {}
          },
          driver: start.driver ? {
            name: `${start.driver.firstName} ${start.driver.lastName}`,
            statistics: start.driver.statistics || {}
          } : { name: "Unknown", statistics: {} },
          trainer: start.horse.trainer ? {
            name: `${start.horse.trainer.firstName} ${start.horse.trainer.lastName}`,
            statistics: start.horse.trainer.statistics || {}
          } : { name: "Unknown", statistics: {} },
          lastTenStarts: lastTenStarts,
          lastMonthSummary: {
            starts: lastMonthSummary.starts,
            firstPrizeAverage: lastMonthSummary.starts > 0 
              ? (lastMonthRecords.reduce((sum: number, r: any) => sum + (parseInt(r.race?.firstPrize) || 0), 0) / lastMonthSummary.starts).toString()
              : "0",
            wins: lastMonthSummary.placement["1"],
            seconds: lastMonthSummary.placement["2"],
            thirds: lastMonthSummary.placement["3"]
          },
          scratched: start.scratched || false
        };
      })
    };

    // Add horses alias for backward compatibility
    (transformedRace as any).horses = transformedRace.starts;

    return transformedRace;
  }

  /**
   * Fetch calendar data for a specific date
   */
  private async fetchCalendarData(date: string): Promise<any> {
    const url = `${this.apiCalendarUrl}${date}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar for ${date}: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Fetch game data
   */
  private async fetchGameData(gameId: string): Promise<any> {
    const url = `${this.gameApiBaseUrl}${gameId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch game ${gameId}: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Fetch detailed starts data for races
   */
  private async fetchStartsData(races: any[]): Promise<any> {
    const startsData: any = {};

    for (const race of races) {
      for (const start of race.starts || []) {
        const horseId = start.horse.id || `${race.id}_${start.number}`;
        const raceId = race.id;
        const startNumber = start.number;
        const startApiUrl = `${this.raceApiBaseUrl}${raceId}/start/${startNumber}`;

        try {
          const response = await fetch(startApiUrl);
          if (response.ok) {
            const startData = await response.json();
            startsData[horseId] = startData;
          }
        } catch (error) {
          console.warn(`Failed to fetch start data for horse ${horseId}:`, error);
        }
        
        // Small delay between requests
        await this.delay(50);
      }
    }

    return startsData;
  }

  /**
   * Generate array of dates between start and end
   */
  private getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save collected data to localStorage or file
   */
  static saveToStorage(data: HistoricalRaceData[], key: string = 'historicalRaceData'): void {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      localStorage.setItem(key, jsonData);
      console.log(`Saved ${data.length} races to localStorage key: ${key}`);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load data from localStorage
   */
  static loadFromStorage(key: string = 'historicalRaceData'): HistoricalRaceData[] {
    try {
      const jsonData = localStorage.getItem(key);
      if (jsonData) {
        const data = JSON.parse(jsonData);
        console.log(`Loaded ${data.length} races from localStorage key: ${key}`);
        return data;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return [];
  }

  /**
   * Export data as downloadable JSON file
   */
  static exportToFile(data: HistoricalRaceData[], filename: string = 'historical_race_data.json'): void {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log(`Exported ${data.length} races to ${filename}`);
  }

  /**
   * Quick collection for recent data (last 30 days)
   */
  static async collectRecentData(days: number = 30): Promise<HistoricalRaceData[]> {
    const collector = new HistoricalDataCollector();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dateRange: DateRange = {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10)
    };

    return await collector.collectHistoricalData(dateRange);
  }
}
