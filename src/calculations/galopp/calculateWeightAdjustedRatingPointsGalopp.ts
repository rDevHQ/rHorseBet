/**
 * Viktjusterad kapacitetsbedömning för galopp (plustal):
 * Plustal = Handicaptal − Vikt
 * Normaliseras inom startfältet.
 */

interface HorseData {
    handicap?: string | number;
    weight?: string | number;
}

interface Horse {
    handicap?: string | number;
    weight?: string | number;
    horse?: HorseData;
}

export function calculateWeightAdjustedRatingPointsGalopp(horse: Horse, allHorses: Horse[]): number {
    const maxPoints = 100;

    const getPlustal = (h: Horse) => {
        const rating = parseFloat(String(h.handicap ?? h.horse?.handicap ?? 0));
        const weight = parseFloat(String(h.weight ?? h.horse?.weight ?? "").replace(",", "."));
        return Number.isFinite(rating) && Number.isFinite(weight) ? rating - weight : null;
    };

    const allPlustal = allHorses.map(getPlustal).filter((p): p is number => p !== null);
    const thisPlustal = getPlustal(horse);

    if (thisPlustal === null || allPlustal.length === 0) {
        return 0;
    }

    const min = Math.min(...allPlustal);
    const max = Math.max(...allPlustal);
    if (max === min) {
        return Math.round(maxPoints / 2);
    }

    const normalized = (thisPlustal - min) / (max - min);
    return Math.round(normalized * maxPoints);
}
