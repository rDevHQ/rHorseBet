/**
 * Viktjusterad kapacitetsbedömning för galopp (plustal):
 * Plustal = Handicaptal − Vikt
 * Normaliseras inom startfältet.
 */

export function calculateWeightAdjustedRatingPointsGalopp(horse, allHorses) {
    const maxPoints = 100;

    const getPlustal = (h) => {
        const rating = parseFloat(h.handicap ?? h.horse?.handicapRating ?? 0);
        const weight = parseFloat((h.weight ?? h.horse?.weight ?? "").replace(",", "."));
        return Number.isFinite(rating) && Number.isFinite(weight) ? rating - weight : null;
    };

    const allPlustal = allHorses.map(getPlustal).filter(p => p !== null);
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