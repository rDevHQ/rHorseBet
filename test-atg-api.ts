/**
 * Test script to examine ATG API response structure
 * Use this to debug what data is actually available in race responses
 */

async function testATGAPI() {
  console.log('🔍 Testing ATG API structure...');
  
  // Test calendar endpoint
  const calendarDate = '2025-06-25';
  const calendarUrl = `https://www.atg.se/services/racinginfo/v1/api/calendar/day/${calendarDate}`;
  
  try {
    console.log('📅 Fetching calendar for', calendarDate);
    const calendarResponse = await fetch(calendarUrl);
    const calendarData = await calendarResponse.json();
    
    console.log('Calendar games available:', Object.keys(calendarData.games || {}));
    
    // Get first available game (try V86, V75, V4)
    const gameTypes = ['V86', 'V75', 'V4'];
    let selectedGame = null;
    let selectedGameType = '';
    
    for (const gameType of gameTypes) {
      const games = calendarData.games?.[gameType] || [];
      if (games.length > 0) {
        selectedGame = games[0];
        selectedGameType = gameType;
        break;
      }
    }
    
    if (selectedGame) {
      const gameId = selectedGame.id;
      console.log(`🎮 Testing game: ${gameId} (${selectedGameType})`);
      
      // Fetch game data
      const gameUrl = `https://www.atg.se/services/racinginfo/v1/api/games/${gameId}`;
      const gameResponse = await fetch(gameUrl);
      const gameData = await gameResponse.json();
      
      console.log('Game races count:', gameData.races?.length);
      
      // Examine first few races
      if (gameData.races && gameData.races.length > 0) {
        console.log('🏇 Examining race structures...');
        
        for (let i = 0; i < Math.min(3, gameData.races.length); i++) {
          const race = gameData.races[i];
          console.log(`\n--- Race ${i + 1}: ${race.id} ---`);
          console.log('Status:', race.status);
          console.log('Sport:', race.sport);
          console.log('Track:', race.track?.name, '(Country:', race.track?.countryCode + ')');
          console.log('Has results:', !!race.results);
          console.log('Has pools:', !!race.pools);
          console.log('Starts count:', race.starts?.length);
          
          // Check race status values
          console.log('All race object keys:', Object.keys(race));
          
          if (race.results) {
            console.log('Results structure:', Object.keys(race.results));
            if (race.results.order) {
              console.log('Results order:', race.results.order);
            }
          }
          
          if (race.pools) {
            console.log('Pools available:', Object.keys(race.pools));
            
            // Check vinnare pool specifically
            const vinnarePool = race.pools.vinnare;
            if (vinnarePool) {
              console.log('Vinnare pool keys:', Object.keys(vinnarePool));
              if (vinnarePool.result) {
                console.log('Vinnare result:', vinnarePool.result);
                if (vinnarePool.result.winners) {
                  console.log('Vinnare winners array:', vinnarePool.result.winners);
                  console.log('Winner numbers:', vinnarePool.result.winners.map((w: any) => w.number));
                }
              }
            }
            
            // Check plats pool too
            const platsPool = race.pools.plats;
            if (platsPool?.result?.winners) {
              console.log('Plats pool structure:', Object.keys(platsPool.result));
              console.log('Plats winners type:', typeof platsPool.result.winners);
              console.log('Plats winners:', platsPool.result.winners);
              
              // Handle both array and object formats
              if (Array.isArray(platsPool.result.winners)) {
                console.log('Plats winners (array):', platsPool.result.winners.map((w: any) => w.number));
              } else {
                console.log('Plats winners (object):', platsPool.result.winners);
              }
            }
          }
          
          // Examine first start in detail
          if (race.starts && race.starts.length > 0) {
            const start = race.starts[0];
            console.log(`🐎 Start example - Horse ${start.number}: ${start.horse?.name}`);
            console.log('Start keys:', Object.keys(start));
            console.log('Scratched:', start.scratched);
            
            if (start.pools) {
              console.log('Start pools available:', Object.keys(start.pools));
              if (start.pools.vinnare) {
                console.log('Start vinnare odds:', start.pools.vinnare.odds);
                console.log('Start vinnare keys:', Object.keys(start.pools.vinnare));
              }
            }
            
            if (start.horse) {
              console.log('Horse keys:', Object.keys(start.horse));
              console.log('Horse odds:', start.horse.odds);
            }
            
            // Check start result structure
            if (start.result) {
              console.log('🏁 Start result found!');
              console.log('Start result keys:', Object.keys(start.result));
              console.log('Start result place:', start.result.place);
              console.log('Start result:', start.result);
            } else {
              console.log('❌ No start.result found');
            }
            
            // Check more starts for result data
            console.log(`\n🔍 Checking all starts for result data in race ${race.id}:`);
            const finishedHorses: Array<{number: number, place: number}> = [];
            const disqualifiedHorses: number[] = [];
            const unrankedHorses: number[] = [];
            
            race.starts.forEach((s: any) => {
              if (s.result) {
                const place = s.result.place;
                const info = `Start ${s.number}: place=${place}, result keys=${Object.keys(s.result)}`;
                console.log(`  ${info}`);
                
                if (place === undefined) {
                  disqualifiedHorses.push(s.number);
                } else if (place === 0) {
                  unrankedHorses.push(s.number);
                } else if (place > 0) {
                  finishedHorses.push({ number: s.number, place: place });
                }
              } else {
                console.log(`  Start ${s.number}: NO RESULT DATA`);
              }
            });
            
            console.log(`\n📊 Race ${race.id} Summary:`);
            console.log(`  🏆 Finished with official placement: ${finishedHorses.length} horses`);
            console.log(`  📍 Finished but unranked (place=0): ${unrankedHorses.length} horses`);
            console.log(`  ❌ Disqualified/Scratched (place=undefined): ${disqualifiedHorses.length} horses`);
            
            if (finishedHorses.length > 0) {
              const sortedFinishers = finishedHorses.sort((a, b) => a.place - b.place);
              console.log(`  🏁 Official finishing order: ${sortedFinishers.map(h => `${h.number}(${h.place})`).join(', ')}`);
            }
          }
        }
      }
    } else {
      console.log('❌ No games found in any of the tested game types');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testATGAPI = testATGAPI;
}

export { testATGAPI };
