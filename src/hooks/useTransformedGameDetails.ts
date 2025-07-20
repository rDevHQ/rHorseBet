import { useState, useEffect } from 'react';
import useGameDetails from './useGameDetails';

interface TransformedRace {
  id: string;
  sport: string;
  date: string;
  number: number;
  distance: number;
  startMethod: string;
  startTime: string;
  name: string;
  trackName: string;
  horses: any[]; // Use any[] for now since CalculatedHorse type is defined in different files
}

interface RawRace {
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

// This function is a direct translation of the old transformRaces function
import { calculatePointsForRace } from '../calculations';

const transformRaces = (races: RawRace[], startsData: any, gameType: string): TransformedRace[] => {
  const LAST_MONTH = 30 * 24 * 60 * 60 * 1000; // Approximation of 1 month
  const now = new Date();

  return races.map(race => {
    const placeMap = new Map();
    const winners = race.pools?.plats?.result?.winners;
    if (winners) {
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

    // Prepare raw horse data for calculatePointsForRace
    const rawHorsesForCalculation = race.starts.map((start: any) => {
      const horseId = start.horse.id || `${race.id}_${start.number}`;
      const place = placeMap.get(start.number) ?? null;
      const horseRecords = (startsData[horseId]?.horse?.results?.records || []);
      const years = startsData[horseId]?.horse?.statistics?.years || {};
      const currentYear = String(new Date(race.date).getFullYear());
      const lastYear = String(new Date(race.date).getFullYear() - 1);
      const statsCurrentYear = years[currentYear] || null;
      const statsLastYear = years[lastYear] || null;

      const lastTenStarts = horseRecords
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map((record: any) => ({
          date: record.date,
          track: record.track?.name || "Unknown",
          raceNumber: record.race?.number || "N/A",
          raceId: record.race?.id || "Unknown",
          distance: record.start?.distance || "Unknown",
          startMethod: record.race?.startMethod || "Unknown",
          postPosition: record.start?.postPosition || "N/A",
          disqualified: record.disqualified || false,
          galloped: record.galloped || false,
          position: record.place || "N/A",
          margin: record.margin || "N/A",
          handicap: record.handicap || "N/A",
          weight: record.start?.weight ? (record.start?.weight / 1000).toFixed(1) : "N/A",
          blinders: record.start?.horse?.blinders || "N/A",
          firstPrize: (record.race.firstPrize / 100) || "N/A",
          time: record.kmTime
            ? `${record.kmTime.minutes}.${record.kmTime.seconds},${record.kmTime.tenths}`
            : "N/A",
          odds: record.odds ? (record.odds / 100).toFixed(2) : "N/A"
        }));

      const blindersLastStart = lastTenStarts.length > 0 ? lastTenStarts[0].blinders : "Unknown";

      const lastMonthRecords = horseRecords.filter((record: any) => {
        const recordDate = new Date(record.date);
        return now.getTime() - recordDate.getTime() <= LAST_MONTH;
      });

      const lastMonthSummary = lastMonthRecords.reduce((summary: any, record: any) => {
        summary.starts += 1;

        const firstPrize = (record.race?.firstPrize / 100).toFixed(0) ? parseInt(record.race.firstPrize, 10) : 0;
        summary.totalFirstPrize += firstPrize;

        const place = parseInt(record.place, 10);
        if (place === 1) summary.placement["1"] += 1;
        else if (place === 2) summary.placement["2"] += 1;
        else if (place === 3) summary.placement["3"] += 1;
        return summary;
      }, {
        starts: 0,
        totalFirstPrize: 0,
        placement: { "1": 0, "2": 0, "3": 0 }
      });

      const averageFirstPrize = lastMonthSummary.starts > 0
        ? ((lastMonthSummary.totalFirstPrize / 100) / lastMonthSummary.starts).toFixed(0)
        : "0";

      const earningsPerStartLastYear = (
        statsLastYear &&
        typeof statsLastYear.earnings === "number" &&
        typeof statsLastYear.starts === "number" &&
        statsLastYear.starts > 0
      )
        ? ((statsLastYear.earnings / 100) / statsLastYear.starts).toFixed(0)
        : "0";
      const earningsPerStartCurrentYear = (
        statsCurrentYear &&
        typeof statsCurrentYear.earnings === "number" &&
        typeof statsCurrentYear.starts === "number" &&
        statsCurrentYear.starts > 0
      )
        ? ((statsCurrentYear.earnings / 100) / statsCurrentYear.starts).toFixed(0)
        : "0";

      const earningsPerStartLastTwoYears = (Number(earningsPerStartCurrentYear) + Number(earningsPerStartLastYear)).toFixed(0);

      return {
        ...start, // Keep original start properties
        startNumber: start.number, // Ensure startNumber is present
        horse: {
          ...start.horse, // Keep original horse properties
          name: start.horse.name,
          place: place,
          odds: start.pools?.vinnare?.odds
            ? Number((start.pools.vinnare.odds / 100).toFixed(2))
            : null,
          V75: typeof start.pools?.V75?.betDistribution === "number"
            ? Number((start.pools.V75.betDistribution / 100).toFixed(2))
            : null,
          V85: typeof start.pools?.V85?.betDistribution === "number"
            ? Number((start.pools.V85.betDistribution / 100).toFixed(2))
            : null,
          GS75: typeof start.pools?.GS75?.betDistribution === "number"
            ? Number((start.pools.GS75.betDistribution / 100).toFixed(2))
            : null,
          V86: typeof start.pools?.V86?.betDistribution === "number"
            ? Number((start.pools.V86.betDistribution / 100).toFixed(2))
            : null,
          V64: typeof start.pools?.V64?.betDistribution === "number"
            ? Number((start.pools.V64.betDistribution / 100).toFixed(2))
            : null,
          V65: typeof start.pools?.V65?.betDistribution === "number"
            ? Number((start.pools.V65.betDistribution / 100).toFixed(2))
            : null,
          V5: typeof start.pools?.V5?.betDistribution === "number"
            ? Number((start.pools.V5.betDistribution / 100).toFixed(2))
            : null,
          V4: typeof start.pools?.V4?.betDistribution === "number"
            ? Number((start.pools.V4.betDistribution / 100).toFixed(2))
            : null,
          V3: typeof start.pools?.V3?.betDistribution === "number"
            ? Number((start.pools.V3.betDistribution / 100).toFixed(2))
            : null,
          earnings: start.horse.money
            ? `${start.horse.money}`
            : "Unknown",
          earningsPerStartCurrentYear: earningsPerStartCurrentYear,
          earningsPerStartLastYear: earningsPerStartLastYear,
          earningsPerStartLastTwoYears: earningsPerStartLastTwoYears,
          record: start.horse.record
            ? `${start.horse.record.time.minutes}.${start.horse.record.time.seconds},${start.horse.record.time.tenths}`
            : "Unknown",
          age: start.horse.age || "Unknown",
          sex: start.horse.sex || "Unknown",
          weight: start.weight ? (start.weight / 1000).toFixed(1) : "N/A",
          handicap: start.horse.handicap,
          blinders: start.horse.blinders || "N/A",
          blindersLastStart: blindersLastStart,
          shoes: start.horse.shoes ? {
            front: start.horse.shoes.front
              ? {
                  hasShoe: start.horse.shoes.front.hasShoe || false,
                  changed: start.horse.shoes.front.changed || false
                }
              : { hasShoe: false, changed: false },
            back: start.horse.shoes.back
              ? {
                  hasShoe: start.horse.shoes.back.hasShoe || false,
                  changed: start.horse.shoes.back.changed || false
                }
              : { hasShoe: false, changed: false }
          } : {
            front: { hasShoe: false, changed: false },
            back: { hasShoe: false, changed: false }
          },
          sulky: start.horse.sulky
            ? {
              type: {
                text: start.horse.sulky.type?.text ?? "Unknown",
                changed: start.horse.sulky.type?.changed ?? false
              }
            }
            : {
              type: {
                text: "Unknown",
                changed: false
              }
            }
        },
        driver: start.driver
          ? {
            name: `${start.driver.firstName} ${start.driver.lastName}`,
            statistics: start.driver.statistics
              ? {
                years: Object.keys(start.driver.statistics.years).reduce((stats: any, year: string) => {
                  stats[year] = {
                    starts: start.driver.statistics.years[year].starts,
                    earnings: `${(start.driver.statistics.years[year].earnings / 100).toFixed(0)}`,
                    placement: start.driver.statistics.years[year].placement,
                    winPercentage: (start.driver.statistics.years[year].winPercentage / 100).toFixed(2) + "%"
                  };
                  return stats;
                }, {})
              }
              : {}
          }
          : { name: "Unknown", statistics: {} },
        trainer: start.horse.trainer
          ? {
            name: `${start.horse.trainer.firstName} ${start.horse.trainer.lastName}`,
            homeTrack: start.horse.trainer.homeTrack?.name || "Unknown",
            statistics: start.horse.trainer.statistics
              ? {
                years: Object.keys(start.horse.trainer.statistics.years).reduce((stats: any, year: string) => {
                  stats[year] = {
                    starts: start.horse.trainer.statistics.years[year].starts,
                    earnings: `${(start.horse.trainer.statistics.years[year].earnings / 100).toFixed(0)}`,
                    placement: start.horse.trainer.statistics.years[year].placement,
                    winPercentage: (start.horse.trainer.statistics.years[year].winPercentage / 100).toFixed(2) + "%"
                  };
                  return stats;
                }, {})
              }
              : {}
          }
          : { name: "Unknown", homeTrack: "Unknown", statistics: {} },
        lastTenStarts: lastTenStarts,
        lastMonthSummary: {
          starts: lastMonthSummary.starts,
          firstPrizeAverage: `${averageFirstPrize}`,
          wins: lastMonthSummary.placement["1"],
          seconds: lastMonthSummary.placement["2"],
          thirds: lastMonthSummary.placement["3"]
        },
        scratched: start.scratched || false
      };
    });

    // Calculate points for the race's horses
    const calculatedHorses = calculatePointsForRace({ ...race, starts: rawHorsesForCalculation }, gameType);

    return ({
      id: race.id,
      sport: race.sport,
      date: race.date,
      number: race.number,
      distance: race.distance,
      startMethod: race.startMethod,
      startTime: race.startTime,
      name: race.name,
      trackName: race.track.name,
      horses: calculatedHorses, // Use the calculated horses
    });
  });
};

const useTransformedGameDetails = (gameId: string | null, gameType: string) => {
  const { gameDetails, loading, error } = useGameDetails(gameId);
  const [transformedRaces, setTransformedRaces] = useState<TransformedRace[] | null>(null);
  const [transforming, setTransforming] = useState<boolean>(false);
  const [transformError, setTransformError] = useState<string | null>(null);

  useEffect(() => {
    const processTransformation = async () => {
      if (!gameDetails || loading || error) {
        setTransformedRaces(null);
        return;
      }

      setTransforming(true);
      setTransformError(null);
      try {
        const startsData: any = {}; // This will hold the detailed start data

        // Fetch detailed start data for each horse in each race
        for (const race of gameDetails.races) {
          for (const start of race.starts) {
            const horseId = start.horse.id || `${race.id}_${start.number}`;
            const raceId = race.id;
            const startNumber = start.number;
            const startApiUrl = `https://www.atg.se/services/racinginfo/v1/api/races/${raceId}/start/${startNumber}`;

            try {
              const startResponse = await fetch(startApiUrl);
              if (startResponse.ok) {
                const startData = await startResponse.json();
                startsData[horseId] = startData;
              }
            } catch (e: any) {
              console.error(`Error fetching start data for horse ID ${horseId}:`, e);
              // Continue even if one start data fetch fails
            }
          }
        }

        const transformed = transformRaces(gameDetails.races, startsData, gameType);
        setTransformedRaces(transformed);
      } catch (e: any) {
        setTransformError(e.message);
      } finally {
        setTransforming(false);
      }
    };

    processTransformation();
  }, [gameDetails, loading, error]);

  return { transformedRaces, loading: loading || transforming, error: error || transformError };
};

export default useTransformedGameDetails;
