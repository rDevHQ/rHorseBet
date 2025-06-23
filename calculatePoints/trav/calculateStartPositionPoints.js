import { MAX_CATEGORY_POINTS } from '../../pointsConfig.js';

/**
 * Beräknar startspårspoäng baserat på startmetod och spårnummer.
 * Poängen speglar historisk segerprocent för varje spår i Sverige,
 * och skalas enligt START_POSITION_POINTS.MAX_POINTS.
 *
 * 📊 Statistik – Autostart (auto):
 * Spår  1–3  → ~12–14% vinstchans → +100% av max
 * Spår  4–6  → ~10–12%            → +70%
 * Spår  7–8  → ~6–8%              → +40%
 * Spår    9  → ~4–6%              → +20%
 * Spår 10–12 → ~2–4%              → 0%
 * Spår 13–15 → ~1–2%              → −50%
 *
 * 📊 Statistik – Voltestart (volte):
 * Spår  1–3,5–6 → ~10–14%         → +100%
 * Spår  2       → ~8–9%           → +100%
 * Spår  4,7     → ~6–8%           → +70%
 * Spår  8–9     → ~4–6%           → +40%
 * Spår 10–12    → ~2–4%           → +10%
 * Spår 13–15    → ~1–2%           → −50%
 */

/**
 * Relativ poängsättning baserat på startspår jämfört med övriga fältet.
 * Hästen med bäst spår i fältet får 100 poäng,
 * den med sämst spår får 1 poäng.
 * Om alla har samma poäng ges 50 som neutral poäng.
 */
export function calculateStartPositionPoints(start, raceHorses, startMethod) {

function getRawScore(method, number) {
    if (method === "volte") {
        if ([1, 2, 3, 5, 6].includes(number)) return 20;
        if ([4, 7].includes(number)) return 14;
        if ([8, 9].includes(number)) return 8;
        if ([10, 11, 12].includes(number)) return 3;
        if ([13, 14, 15].includes(number)) return -5;
    } else if (method === "auto") {
        if ([1, 2, 3].includes(number)) return 20;
        if ([4, 5, 6].includes(number)) return 14;
        if ([7, 8].includes(number)) return 8;
        if (number === 9) return 5;
        if ([10, 11, 12].includes(number)) return 2;
        if ([13, 14, 15].includes(number)) return -5;
    }
    return 0;
}

    const allScores = raceHorses.map(h => getRawScore(startMethod, h.startNumber));
    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);
    const thisHorseScore = getRawScore(startMethod, start.startNumber);

    if (maxScore === minScore) {
        return 50;
    }

    const normalized = ((thisHorseScore - minScore) / (maxScore - minScore)) * 99 + 1;  // scale to 1–100
    return Math.round(normalized);
}