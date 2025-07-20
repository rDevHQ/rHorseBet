import { useState, useEffect } from 'react';

interface Race {
  id: string;
  number: number;
  starts: any[];
  pools?: { plats?: { result?: { winners?: { first?: any[]; second?: any[]; third?: any[] } } } };
  sport: string;
  date: string;
  distance: number;
  startMethod: string;
  startTime: string;
  name: string;
  track: { name: string };
}

interface GameDetails {
  races: Race[];
  // Add other properties as needed
}

const gameApiBaseUrl = 'https://www.atg.se/services/racinginfo/v1/api/games/';

const useGameDetails = (gameId: string | null) => {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!gameId) {
        setGameDetails(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const apiUrl = gameApiBaseUrl + gameId;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GameDetails = await response.json();

        // Fetch race numbers for Vinnare games if needed (similar to getRaceNumberFromGame)
        // This part can be optimized if the API provides race numbers directly in the game details
        // For now, assuming it's part of the game details or can be derived.

        setGameDetails(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [gameId]);

  return { gameDetails, loading, error };
};

export default useGameDetails;
