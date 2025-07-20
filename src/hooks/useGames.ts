import { useState, useEffect } from 'react';

interface Game {
  id: string;
  tracks: number[]; // Fix: tracks are actually numbers in the API
  startTime: string;
  type: string;
  status: string;
  raceNumber?: number | null; // Add race number for Vinnare games
  // Add other properties as needed
}

interface CalendarData {
  tracks: any[]; // Not used directly in this hook, but part of the API response
  games: { [key: string]: Game[] };
}

const apiCalendarUrl = 'https://www.atg.se/services/racinginfo/v1/api/calendar/day/';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Function to get race number for Vinnare games
const getRaceNumberFromGame = async (gameId: string): Promise<number | null> => {
  try {
    const response = await fetch(`https://www.atg.se/services/racinginfo/v1/api/games/${gameId}`);
    if (response.ok) {
      const gameData = await response.json();
      // The race number should be in the first race of the game
      if (gameData.races && gameData.races.length > 0) {
        return gameData.races[0].number;
      }
    }
  } catch (error) {
    console.warn('Could not fetch race number for game:', gameId);
  }
  return null;
};

const useGames = (date: Date, selectedTrackId: string | null) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      if (!selectedTrackId) {
        setGames([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const formattedDate = formatDate(date);
        const response = await fetch(apiCalendarUrl + formattedDate);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CalendarData = await response.json();

        const excludedTypes = ['plats', 'trio', 'komb', 'tvilling', 'vp', 'raket'];
        const gamesForTrack: Game[] = [];

        Object.keys(data.games).forEach(gameType => {
            data.games[gameType].forEach(game => {
                // Convert selectedTrackId to number for comparison
                const trackIdAsNumber = parseInt(selectedTrackId, 10);
                if (game.tracks.includes(trackIdAsNumber) && !excludedTypes.includes(gameType.toLowerCase())) {
                    gamesForTrack.push({ ...game, type: gameType });
                }
            });
        });

        // Sorting logic from old fetchData.js (simplified for now, will need getRaceNumberFromGame later)
        const vinnareGames = gamesForTrack.filter(game => game.type.toUpperCase() === "VINNARE");
        const otherGames = gamesForTrack.filter(game => game.type.toUpperCase() !== "VINNARE");

        // Fetch race numbers for Vinnare games
        const vinnareGamesWithRaceNumbers = await Promise.all(
          vinnareGames.map(async (game) => {
            const raceNumber = await getRaceNumberFromGame(game.id);
            return { ...game, raceNumber };
          })
        );

        // Sort other games by start time
        otherGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        // Sort Vinnare games by race number if available
        vinnareGamesWithRaceNumbers.sort((a, b) => {
          if (a.raceNumber && b.raceNumber) {
            return a.raceNumber - b.raceNumber;
          }
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });

        // Combine, Vinnare games first, sorted by race number
        setGames([...vinnareGamesWithRaceNumbers, ...otherGames]);

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [date, selectedTrackId]);

  return { games, loading, error };
};

export default useGames;
