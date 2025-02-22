export function transformRaces(races) {
    return races.map(race => ({
        id: race.id,
        name: race.name,
        number: race.number,
        distance: race.distance,
        startMethod: race.startMethod,
        startTime: race.startTime,
        trackName: race.track.name,
        horses: race.starts.map(start => ({
            startNumber: start.number,
            horse: {
                name: start.horse.name,
                odds: start.pools?.vinnare?.odds
                    ? (start.pools.vinnare.odds / 100).toFixed(2)
                    : "N/A",
                V75: start.pools?.V75?.betDistribution
                    ? (start.pools.V75.betDistribution / 100).toFixed(2) + " %"
                    : "N/A",
                GS75: start.pools?.GS75?.betDistribution
                    ? (start.pools.GS75.betDistribution / 100).toFixed(2) + " %"
                    : "N/A",
                V4: start.pools?.V4?.betDistribution
                    ? (start.pools.V4.betDistribution / 100).toFixed(2) + " %"
                    : "N/A",
                earnings: start.horse.money
                    ? `${(start.horse.money / 100).toFixed(0)} kr`
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
                        type: start.horse.sulky.type
                            ? {
                                changed: start.horse.sulky.type.changed || false
                            }
                            : { changed: false }
                    }
                    : { reported: false, type: { code: "Unknown", text: "Unknown", engText: "Unknown", changed: false }, colour: { code: "Unknown", text: "Unknown", engText: "Unknown", changed: false } },
                statistics: start.horse.statistics
                    ? {
                        years: Object.keys(start.horse.statistics.years).reduce((stats, year) => {
                            stats[year] = {
                                starts: start.horse.statistics.years[year].starts,
                                earnings: `${(start.horse.statistics.years[year].earnings / 100).toFixed(0)} kr`,
                                placement: start.horse.statistics.years[year].placement,
                                records: start.horse.statistics.years[year].records || []
                            };
                            return stats;
                        }, {}),
                        life: {
                            starts: start.horse.statistics.life.starts,
                            earnings: `${(start.horse.statistics.life.earnings / 100).toFixed(0)} kr`,
                            placement: start.horse.statistics.life.placement,
                            records: start.horse.statistics.life.records || [],
                            winPercentage: (start.horse.statistics.life.winPercentage / 100).toFixed(2) + " %",
                            placePercentage: (start.horse.statistics.life.placePercentage / 100).toFixed(2) + " %",
                            earningsPerStart: `${(start.horse.statistics.life.earningsPerStart / 100).toFixed(0)} kr`,
                            startPoints: start.horse.statistics.life.startPoints
                        },
                        lastFiveStarts: {
                            averageOdds: (start.horse.statistics.lastFiveStarts.averageOdds / 100).toFixed(2) || "N/A"
                        }
                    }
                    : {}
            },
            driver: start.driver
                ? {
                    name: `${start.driver.firstName} ${start.driver.lastName}`,
                    statistics: start.driver.statistics
                        ? {
                            years: Object.keys(start.driver.statistics.years).reduce((stats, year) => {
                                stats[year] = {
                                    starts: start.driver.statistics.years[year].starts,
                                    earnings: `${(start.driver.statistics.years[year].earnings / 100).toFixed(0)} kr`,
                                    placement: start.driver.statistics.years[year].placement,
                                    winPercentage: (start.driver.statistics.years[year].winPercentage / 100).toFixed(2) + " %"
                                };
                                return stats;
                            }, {})
                        }
                        : {}  // Fix: Ensures statistics is an empty object if missing
                }
                : { name: "Unknown", record: "N/A", statistics: {} },
            trainer: start.horse.trainer
                ? {
                    name: `${start.horse.trainer.firstName} ${start.horse.trainer.lastName}`,
                    homeTrack: start.horse.trainer.homeTrack ? start.horse.trainer.homeTrack.name : "Unknown",
                    statistics: start.horse.trainer.statistics
                        ? {
                            years: Object.keys(start.horse.trainer.statistics.years).reduce((stats, year) => {
                                stats[year] = {
                                    starts: start.horse.trainer.statistics.years[year].starts,
                                    earnings: `${(start.horse.trainer.statistics.years[year].earnings / 100).toFixed(0)} kr`,
                                    placement: start.horse.trainer.statistics.years[year].placement,
                                    winPercentage: (start.horse.trainer.statistics.years[year].winPercentage / 100).toFixed(2) + " %"
                                };
                                return stats;
                            }, {})
                        }
                        : {}  // Fix: Ensures statistics is an empty object if missing
                }
                : { name: "Unknown", license: "Unknown" },
            scratch: start.scratch || false
        }))
    }));

};