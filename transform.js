export function transformRaces(races, startsData) {
    const LAST_MONTH = 30 * 24 * 60 * 60 * 1000; // Approximation of 1 month
    const now = new Date();

    return races.map(race => {
        // placeMap: vinnare och plats-poolen per race
        const placeMap = new Map();
        // Från plats-poolen
        ["first", "second", "third"].forEach((label, idx) => {
            (race.pools?.plats?.result?.winners?.[label] ?? []).forEach(w => {
                // Endast om inte redan satt som vinnare
                if (!placeMap.has(w.number)) {
                    placeMap.set(w.number, idx + 1);
                }
            });
        });

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
            horses: race.starts.map(start => {
                const horseId = start.horse.id || `${race.id}_${start.number}`;
                const place = placeMap.get(start.number) ?? null;
                const horseRecords = (startsData[horseId]?.horse?.results?.records || []);
                const years = startsData[horseId]?.horse?.statistics?.years || {};
                const currentYear = String(new Date(race.date).getFullYear());
                const lastYear = String(new Date(race.date).getFullYear() - 1);
                const statsCurrentYear = years[currentYear] || null;
                const statsLastYear = years[lastYear] || null;

                // Last Ten Starts
                const lastTenStarts = horseRecords
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 10)
                    .map(record => ({
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

                const lastTenStartsCopy = [...lastTenStarts];
                const blindersLastStart = lastTenStarts.length > 0 ? lastTenStarts[0].blinders : "Unknown";

                // Last Month Summary
                const lastMonthRecords = horseRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return now - recordDate <= LAST_MONTH;
                });

                const lastMonthSummary = lastMonthRecords.reduce((summary, record) => {
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
                const averageFirstPrize = lastMonthSummary.starts > 0
                    ? ((lastMonthSummary.totalFirstPrize / 100) / lastMonthSummary.starts).toFixed(0)
                    : "0";

                // Calculate earnings per start for the last two years
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
                    startNumber: start.number,
                    horse: {
                        name: start.horse.name,
                        place: place,
                        odds: start.pools?.vinnare?.odds
                            ? (start.pools.vinnare.odds / 100).toFixed(2)
                            : "N/A",
                        V75: typeof start.pools?.V75?.betDistribution === "number"
                            ? (start.pools.V75.betDistribution / 100).toFixed(2)
                            : "N/A",
                        V85: typeof start.pools?.V85?.betDistribution === "number"
                            ? (start.pools.V85.betDistribution / 100).toFixed(2)
                            : "N/A",
                        GS75: typeof start.pools?.GS75?.betDistribution === "number"
                            ? (start.pools.GS75.betDistribution / 100).toFixed(2)
                            : "N/A",
                        V86: typeof start.pools?.V86?.betDistribution === "number"
                            ? (start.pools.V86.betDistribution / 100).toFixed(2)
                            : "N/A",
                        V64: typeof start.pools?.V64?.betDistribution === "number"
                            ? (start.pools.V64.betDistribution / 100).toFixed(2)
                            : "N/A",
                        V65: typeof start.pools?.V65?.betDistribution === "number"
                            ? (start.pools.V65.betDistribution / 100).toFixed(2)
                            : "N/A",
                        V5: typeof start.pools?.V5?.betDistribution === "number"
                            ? (start.pools.V5.betDistribution / 100).toFixed(2)
                            : "N/A",
                        V4: typeof start.pools?.V4?.betDistribution === "number"
                            ? (start.pools.V4.betDistribution / 100).toFixed(2)
                            : "N/A",
                        V3: typeof start.pools?.V3?.betDistribution === "number"
                            ? (start.pools.V3.betDistribution / 100).toFixed(2)
                            : "N/A",
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
            })
        });
    });
};
