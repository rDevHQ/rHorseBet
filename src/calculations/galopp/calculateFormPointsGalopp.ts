/**
 * Beräknar formpoäng för galopp:
 * - baserat på placering, marginal till vinnare och odds
 * - normaliseras inom fältet
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
    margin: string | number;
    handicap: string;
    weight: string;
    blinders: string;
    firstPrize: string;
    time: string;
    odds: string;
}

interface Horse {
    startNumber: number;
    horse: { name: string; id?: string; };
    driver?: { name: string; statistics?: any; };
    trainer?: { name: string; statistics?: any; };
    lastTenStarts?: HorseStartRecord[];
    bettingPercentagePoints?: number;
    scratched?: boolean;
    place?: number | null;
}

export function calculateFormPointsGalopp(horseName: string, lastTenStarts: HorseStartRecord[], allHorses: Horse[]): number {
    const maxPoints = 100;

    function calculateRawPoints(start: HorseStartRecord): number {
        let points = 0;

        // Placering: 1:a=2p, 2:a=1p, 3:a=0.5p
        const place = parseInt(start.position, 10);
        if (!isNaN(place)) {
            if (place === 1) points += 2;
            else if (place === 2) points += 1;
            else if (place === 3) points += 0.5;
        }

        // Margin – ju närmare vinnaren desto bättre
        const margin = start.margin;
        if (typeof margin === "number") {
            if (margin < 1) points += 1;       // inom 1 längd
            else if (margin < 2) points += 0.5;
        } else if (typeof margin === "string") {
            if (["huv", "hals", "nos"].includes(margin.toLowerCase())) {
                points += 1.2; // extremt liten marginal
            }
        }

        // Odds – låg odds = favorit, hög odds = outsider
        const odds = parseFloat(start.odds);
        if (!isNaN(odds)) {
            if (odds <= 3) points += 1.5;     // favorit vann
            else if (odds <= 7) points += 1;  // lågoddare
            else if (odds > 15 && place <= 3) points += 2; // outsider som placerar sig
        }

        return points;
    }

    const horse = allHorses.find(h => h.horse?.name === horseName);
    const starts = horse?.lastTenStarts ?? lastTenStarts ?? [];
    const rawScore = starts.reduce((sum, start) => sum + calculateRawPoints(start), 0);

    const allScores = allHorses.map(h => {
        const starts = h.lastTenStarts ?? [];
        return starts.reduce((sum, s) => sum + calculateRawPoints(s), 0);
    });

    const min = Math.min(...allScores);
    const max = Math.max(...allScores);

    if (max === min) return Math.round(maxPoints / 2);

    const normalized = ((rawScore - min) / (max - min)) * maxPoints;
    return Math.round(Math.min(maxPoints, Math.max(0, normalized)));
}
