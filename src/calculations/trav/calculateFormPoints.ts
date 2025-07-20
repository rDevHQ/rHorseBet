const FORM_POINTS_CONFIG = {
    PLACEMENT_POINTS: {
        1: 50,
        2: 30,
        3: 20,
        4: 10,
        5: 7,
        6: 5,
        7: 3
    },
    WEIGHT_FACTORS: [2.0, 1.6, 1.3, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2],
    LAST_MONTH_BONUS: {
        WIN: 50,
        SECOND: 30,
        THIRD: 20
    },
};

interface HorseStartRecord {
    position: string;
    // Add other properties as needed
}

interface LastMonthSummary {
    wins: number;
    seconds: number;
    thirds: number;
}

interface HorseForFormCalculation {
    name: string;
    lastTenStarts: HorseStartRecord[];
    lastMonthSummary: LastMonthSummary;
}

interface AllHorseData {
    horse?: { name: string };
    lastTenStarts?: HorseStartRecord[];
    lastMonthSummary?: LastMonthSummary;
}

/**
 * Relativ formpoängsberäkning:
 * 1. Råpoäng räknas ut för varje häst (form + bonus)
 * 2. Normaliseras mellan 0 och MAX_CATEGORY_POINTS.form beroende på hur bra hästen är jämfört med övriga
 * Normalisering:
 * Råpoängen kan ha olika skalor och värdeintervall beroende på viktningen i konfigurationen.
 * Normaliseringen skalar om råpoängen till en 1–100-skala baserat på min och max i fältet,
 * vilket gör att poängen blir jämförbara och balanserade över alla hästar.
 * Detta gör det enkelt att kombinera flera poängkategorier utan att någon dominerar för mycket.
 **/

export function calculateFormPoints(horseName: string, lastTenStarts: HorseStartRecord[], lastMonthSummary: LastMonthSummary, allHorses: AllHorseData[]): number {
    const {
        PLACEMENT_POINTS,
        WEIGHT_FACTORS,
        LAST_MONTH_BONUS
    } = FORM_POINTS_CONFIG;

    function calculateRawFormPoints(horse: HorseForFormCalculation): number {
        const starts = horse.lastTenStarts ?? [];
        const summary = horse.lastMonthSummary ?? {};

        let points = starts.reduce((total, start, index) => {
            if (!start || !start.position || start.position === "N/A") return total;
            const place = parseInt(start.position, 10);
            if (isNaN(place)) return total;
            const basePoints = PLACEMENT_POINTS[place] || 0;
            const weight = WEIGHT_FACTORS[index] || 1.0;
            return total + basePoints * weight;
        }, 0);

        let wins = parseInt(String(summary.wins ?? 0), 10);
        let seconds = parseInt(String(summary.seconds ?? 0), 10);
        let thirds = parseInt(String(summary.thirds ?? 0), 10);
        if (isNaN(wins)) wins = 0;
        if (isNaN(seconds)) seconds = 0;
        if (isNaN(thirds)) thirds = 0;

        const bonusPoints =
            (wins * LAST_MONTH_BONUS.WIN) +
            (seconds * LAST_MONTH_BONUS.SECOND) +
            (thirds * LAST_MONTH_BONUS.THIRD);

        return Math.log(1 + points + bonusPoints);
    }

    const allRawPoints = allHorses.map(h =>
        calculateRawFormPoints({
            name: h.horse?.name ?? "Unknown",
            lastTenStarts: h.lastTenStarts ?? [],
            lastMonthSummary: h.lastMonthSummary ?? { wins: 0, seconds: 0, thirds: 0 }
        })
    );

    const currentHorse = allHorses.find(h => h.horse?.name === horseName);
    if (!currentHorse) {
        return 0;
    }
    const rawScore = calculateRawFormPoints({
        name: currentHorse.horse?.name ?? horseName,
        lastTenStarts: currentHorse.lastTenStarts ?? [],
        lastMonthSummary: currentHorse.lastMonthSummary ?? { wins: 0, seconds: 0, thirds: 0 }
    });

    const minRaw = Math.min(...allRawPoints);
    const maxRaw = Math.max(...allRawPoints);

    if (maxRaw === minRaw) {
        return 50;
    }

    let normalized = ((rawScore - minRaw) / (maxRaw - minRaw)) * 100;
    normalized = Math.max(1, Math.min(100, normalized));

    return Math.round(normalized);
}
