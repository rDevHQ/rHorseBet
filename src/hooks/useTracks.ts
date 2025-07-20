import { useState, useEffect } from 'react';

interface Track {
  id: string;
  name: string;
  sport: 'trav' | 'galopp' | 'mixed';
  firstStartTime?: string; // Add first race start time
  // Add other properties as needed
}

interface Game {
  id: string;
  tracks: string[];
  startTime: string;
  type: string;
  status: string;
  // Add other properties as needed
}

interface CalendarData {
  tracks: Track[];
  games: { [key: string]: Game[] };
}

const apiCalendarUrl = 'https://www.atg.se/services/racinginfo/v1/api/calendar/day/';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const useTracks = (date: Date) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTracks = async () => {
      setLoading(true);
      setError(null);
      try {
        const formattedDate = formatDate(date);
        const response = await fetch(apiCalendarUrl + formattedDate);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CalendarData = await response.json();

        // Enhance tracks with sport information based on available games
        const enhancedTracks = await Promise.all(data.tracks.map(async (track) => {
          // Get all games for this track from all game types
          let trackGames: any[] = [];
          Object.keys(data.games).forEach(gameType => {
            const gamesOfType = data.games[gameType].filter((g: any) => g.tracks.includes(track.id));
            trackGames.push(...gamesOfType.map((g: any) => ({ ...g, type: gameType })));
          });
          
          // Try to determine sport by checking the first Vinnare game's race data
          let sport: 'trav' | 'galopp' | 'mixed' = 'trav'; // Default to trav
          let firstStartTime: string | undefined;
          
          // First check if we have a direct galopp game type
          const hasGaloppGameType = trackGames.some(g => g.type && g.type.toLowerCase() === 'galopp');
          if (hasGaloppGameType) {
            sport = 'galopp';
          } else {
            // Try to get sport from race data
            const vinnareGame = trackGames.find(g => g.type && g.type.toLowerCase() === 'vinnare');
            if (vinnareGame) {
              try {
                const gameResponse = await fetch(`https://www.atg.se/services/racinginfo/v1/api/games/${vinnareGame.id}`);
                if (gameResponse.ok) {
                  const gameData = await gameResponse.json();
                  if (gameData.races && gameData.races.length > 0) {
                    const firstRace = gameData.races[0];
                    if (firstRace.sport) {
                      const raceSport = firstRace.sport.toLowerCase();
                      sport = (raceSport === 'galopp' || raceSport === 'gallop') ? 'galopp' : 'trav';
                    }
                    // Capture the first race's scheduled start time
                    if (firstRace.scheduledStartTime) {
                      firstStartTime = firstRace.scheduledStartTime;
                    }
                  }
                }
              } catch (error) {
                // Silently fail and keep default sport
              }
            }
          }
          
          // If we didn't get the start time from race data, try to get it from game start times
          if (!firstStartTime && trackGames.length > 0) {
            const earliestGame = trackGames.reduce((earliest, game) => {
              return new Date(game.startTime).getTime() < new Date(earliest.startTime).getTime() ? game : earliest;
            });
            firstStartTime = earliestGame.startTime;
          }
          
          return {
            ...track,
            sport,
            firstStartTime
          };
        }));

        // Sort tracks by earliest game start time, similar to old fetchData.js
        enhancedTracks.sort((a, b) => {
          const getStart = (trackId: string) => {
            let trackGames: any[] = [];
            Object.keys(data.games).forEach(gameType => {
              const gamesOfType = data.games[gameType].filter((g: any) => g.tracks.includes(trackId));
              trackGames.push(...gamesOfType);
            });
            return trackGames.length > 0 ? Math.min(...trackGames.map(g => new Date(g.startTime).getTime())) : Infinity;
          };
          return getStart(a.id) - getStart(b.id);
        });

        setTracks(enhancedTracks);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, [date]);

  return { tracks, loading, error };
};

export default useTracks;