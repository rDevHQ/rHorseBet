// Gränser enligt svensk travsport (kan justeras vid behov)
export const DISTANCE_CATEGORIES = {
    short: { min: 1000, max: 1999 },
    medium: { min: 2000, max: 2500 },
    long: { min: 2501, max: 4000 }
};

export function getDistanceCategory(distance) {
    if (distance >= DISTANCE_CATEGORIES.short.min && distance <= DISTANCE_CATEGORIES.short.max) return 'short';
    if (distance >= DISTANCE_CATEGORIES.medium.min && distance <= DISTANCE_CATEGORIES.medium.max) return 'medium';
    if (distance >= DISTANCE_CATEGORIES.long.min && distance <= DISTANCE_CATEGORIES.long.max) return 'long';
    return 'unknown';
}
