/**
 * Calculates relative Head-to-Head (H2H) points for a horse based on its placements in races compared to
 * other competitors that participated in the same race.
 *
 * Points for each encounter (common race) are weighted by the opponent's betting points, giving higher
 * weight to encounters against stronger opponents according to the players' stakes.
 *
 * For a win, the points are higher the higher the opponent's betting points are.
 * For a loss, the points are inversely weighted, i.e., a loss against a weak horse gives more negative points
 * than against a strong horse.
 *
 * The sum of weighted encounter points is then normalized to a scale between 1 and 100 based on min and max points
 * in the entire starting field to create a fair comparison between horses.
 *
 * The function returns both the normalized score and a list of detailed encounter results
 * including results per encounter and weighted points.
 *
 * @param {Array} lastTenStarts - Horse's last ten starts with placements and race IDs.
 * @param {Array} allHorses - List of all horses in the race, including their starts and betting points.
 * @param {string} horseName - The name of the horse for which points are to be calculated.
 * @param {number} [unplacedValue=10] - Value used for invalid or unplaced starts (default 10).
 * @returns {Object} Object with normalized points (1-100) and list of encounters with details.
 */

interface HorseStartRecord {
    date: string;
    track: { name: string };
    raceNumber: string;
    raceId: string;
    distance: string;
    startMethod: string;
    postPosition: string;
    disqualified: boolean;
    galloped: boolean;
    position: string;
    margin: string;
    handicap: string;
    weight: string;
    blinders: string;
    firstPrize: string;
    time: string;
    odds: string;
}

interface Horse {
    startNumber: number;
    horse: { name: string; id?: string; earningsPerStartCurrentYear?: number; earningsPerStartLastTwoYears?: number; odds?: string; };
    driver?: { name: string; statistics?: any; };
    trainer?: { name: string; statistics?: any; };
    lastTenStarts?: HorseStartRecord[];
    bettingPercentagePoints?: number;
    scratched?: boolean;
    place?: number | null;
}

interface Meeting {
    opponent: string;
    raceId: string;
    selfPosition: number;
    opponentPosition: number;
    opponentBettingPoints: number;
    weightedPoints: number;
    diff: number;
    result: string;
}

export function calculateHeadToHeadPoints(
    lastTenStarts: HorseStartRecord[],
    allHorses: Horse[],
    horseName: string,
    unplacedValue: number = 10
): { points: number; meetings: Meeting[] } {
    const meetings: Meeting[] = [];

    function calculateRawH2HPoints(targetHorseLastTenStarts: HorseStartRecord[], targetHorseName: string, collectMeetings: boolean = false): number {
        let totalPoints = 0;

        targetHorseLastTenStarts?.forEach(start => {
            if (!start || start.position === "N/A") return;

            const raceId = start.raceId;
            const horseRawPosition = parseInt(start.position);
            const horsePosition = horseRawPosition === 0 ? unplacedValue : horseRawPosition;

            allHorses.forEach(opponent => {
                if (!opponent.lastTenStarts || !Array.isArray(opponent.lastTenStarts)) return;
                if (opponent.horse.name === targetHorseName) return;

                const opponentRace = opponent.lastTenStarts.find(s => s.raceId === raceId);
                if (opponentRace && opponentRace.position !== "N/A") {
                    const opponentRawPosition = parseInt(opponentRace.position);
                    const opponentPosition = opponentRawPosition === 0 ? unplacedValue : opponentRawPosition;

                    const diff = horsePosition - opponentPosition;
                    const opponentBettingPoints = opponent.bettingPercentagePoints || 1; // Avoid 0 for division

                    let weightedPoints = 0;

                    if (diff < 0) {
                        // Win against opponent: weighted by opponent's betting points (stronger opponent gives higher points)
                        weightedPoints = Math.abs(diff) * opponentBettingPoints;
                        totalPoints += weightedPoints;
                    } else if (diff > 0) {
                        // Loss against opponent: inversely weighted, i.e., loss against weak opponent gives more negative points
                        weightedPoints = -Math.abs(diff) * (100 - opponentBettingPoints);
                        totalPoints += weightedPoints;
                    }

                    if (collectMeetings) {
                        const meeting = {
                            opponent: opponent.horse.name,
                            raceId,
                            selfPosition: horsePosition,
                            opponentPosition,
                            opponentBettingPoints,
                            weightedPoints,
                            diff,
                            result: diff < 0 ? 'Win' : diff > 0 ? 'Loss' : 'Draw'
                        };
                        meetings.push(meeting);
                    }
                }
            });
        });

        return totalPoints;
    }

    // Calculate points for the current horse and collect meetings
    const horseRaw = calculateRawH2HPoints(lastTenStarts, horseName, true);

    // Calculate raw points for all other horses (without collecting meetings)
    const rawValues = allHorses
        .filter(h => h.horse?.name !== horseName)
        .map(h => calculateRawH2HPoints(h.lastTenStarts || [], h.horse.name))
        .concat(horseRaw);

    const minRaw = Math.min(...rawValues);
    const maxRaw = Math.max(...rawValues);

    if (maxRaw === minRaw) {
        return {
            points: 50,
            meetings
        };
    }

    const normalized = (horseRaw - minRaw) / (maxRaw - minRaw);
    const scaledPoints = Math.round(normalized * 99 + 1);

    return {
        points: scaledPoints,
        meetings
    };
}
