export function transformRaces(races, startsData) {
    const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000; // Approximation of 3 months
    const now = new Date();

    return races.map(race => ({
        id: race.id,
        date: race.date,
        number: race.number,
        distance: race.distance,
        startMethod: race.startMethod,
        startTime: race.startTime,
        name: race.name,
        trackName: race.track.name,
        horses: race.starts.map(start => {
            const horseId = start.horse.id || `${race.id}_${start.number}`;
            const horseRecords = (startsData[horseId]?.horse?.results?.records || []);

            console.log(`🐴 [${horseId}] horseRecords före sortering:`, JSON.stringify(horseRecords, null, 2));

            // Last Five Starts
            const lastFiveStarts = horseRecords
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map(record => ({
                    date: record.date,
                    track: record.track?.name || "Unknown",
                    raceNumber: record.race?.number || "N/A",
                    raceId: record.race?.id || "Unknown",
                    distance: record.start?.distance || "Unknown",
                    postPosition: record.start?.postPosition || "N/A",
                    position: record.place || "N/A",
                    firstPrize: (record.race.firstPrize / 100) || "N/A",
                    time: record.kmTime
                        ? `${record.kmTime.minutes}.${record.kmTime.seconds},${record.kmTime.tenths}`
                        : "N/A",
                    odds: record.odds ? (record.odds / 100).toFixed(2) : "N/A"
                }));

            console.log(`🐴 [${horseId}] lastFiveStarts efter sortering:`, JSON.stringify(lastFiveStarts, null, 2));
            
            // Last 3 Months Summary
            const last3MonthsRecords = horseRecords.filter(record => {
                const recordDate = new Date(record.date);
                return now - recordDate <= THREE_MONTHS_MS;
            });

            const last3MonthsSummary = last3MonthsRecords.reduce((summary, record) => {
                summary.starts += 1;

                // Ensure firstPrize is a valid number before adding
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

            // Calculate average first prize, handling division by zero
            const averageFirstPrize = last3MonthsSummary.starts > 0
                ? ((last3MonthsSummary.totalFirstPrize / 100) / last3MonthsSummary.starts).toFixed(0)
                : "0";

            return {
                startNumber: start.number,
                horse: {
                    name: start.horse.name,
                    odds: start.pools?.vinnare?.odds
                        ? (start.pools.vinnare.odds / 100).toFixed(2)
                        : "N/A",
                    V75: start.pools?.V75?.betDistribution
                        ? (start.pools.V75.betDistribution / 100).toFixed(2)
                        : "N/A",
                    GS75: start.pools?.GS75?.betDistribution
                        ? (start.pools.GS75.betDistribution / 100).toFixed(2)
                        : "N/A",
                    V86: start.pools?.V86?.betDistribution
                        ? (start.pools.V86.betDistribution / 100).toFixed(2)
                        : "N/A",
                    V64: start.pools?.V64?.betDistribution
                        ? (start.pools.V64.betDistribution / 100).toFixed(2)
                        : "N/A",
                    V65: start.pools?.V65?.betDistribution
                        ? (start.pools.V65.betDistribution / 100).toFixed(2)
                        : "N/A",
                    V5: start.pools?.V5?.betDistribution
                        ? (start.pools.V5.betDistribution / 100).toFixed(2)
                        : "N/A",
                    V4: start.pools?.V4?.betDistribution
                        ? (start.pools.V4.betDistribution / 100).toFixed(2)
                        : "N/A",
                    earnings: start.horse.money
                        ? `${start.horse.money}`
                        : "Unknown",
                    record: start.horse.record
                        ? `${start.horse.record.time.minutes}.${start.horse.record.time.seconds},${start.horse.record.time.tenths}`
                        : "Unknown",
                    shoes: start.horse.shoes
                        ? {
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
                        }
                        : { front: { hasShoe: false, changed: false }, back: { hasShoe: false, changed: false } },
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
                                years: Object.keys(start.driver.statistics.years).reduce((stats, year) => {
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
                                years: Object.keys(start.horse.trainer.statistics.years).reduce((stats, year) => {
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
                lastFiveStarts: lastFiveStarts,
                last3MonthsSummary: {
                    starts: last3MonthsSummary.starts,
                    firstPrizeAverage: `${averageFirstPrize}`,
                    placement: last3MonthsSummary.placement
                },
                scratch: start.scratch || false
            };
        })
    }));
};
