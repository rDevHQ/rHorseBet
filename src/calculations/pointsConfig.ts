export const MAX_CATEGORY_POINTS = {
    folket: 10,
    tid: 10,
    utrustning: 10,
    h2h: 10,
    tranare: 10,
    kusk: 10,
    form: 10,
    klass: 10,
    startspar: 10
};

export const FORM_POINTS_CONFIG = {
    PLACEMENT_POINTS: {
        1: 2,
        2: 1,
        3: 0.5
    },
    WEIGHT_FACTORS: [2.0, 1.6, 1.3, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2],
    LAST_MONTH_BONUS: {
        WIN: 2,
        SECOND: 1,
        THIRD: 0.5
    },
};

export const TIME_POINTS = {
    BEST_TIME_BONUS: 4,    // Maxbonus om hästen har snabbast rekord
    RECENT_RACE_BONUS: 2,  // Bonus om hästen har en färsk start (t.ex. inom 30 dagar)

    /**
     * Poäng baserat på differens från fältets snittid (i sekunder).
     * Exempel: -1.8 betyder 1.8 sekunder snabbare än snittet → hög poäng.
     * Maxpoäng: +8, Minpoäng: -8
     */
    THRESHOLDS: [
        { minDiff: -1.8, points: 8 },   // Exceptionellt snabb
        { minDiff: -1.5, points: 6 },
        { minDiff: -1.2, points: 4 },
        { minDiff: -0.9, points: 2 },
        { minDiff: -0.6, points: 1 },
        { minDiff: -0.3, points: 0 },
        { minDiff: 0.3, points: 0 },    // Neutral zon: -0.3 till +0.3 = 0 poäng
        { minDiff: 0.6, points: -1 },
        { minDiff: 0.9, points: -2 },
        { minDiff: 1.2, points: -4 },
        { minDiff: 1.5, points: -6 },
        { minDiff: 1.8, points: -8 }
        // Över 1.8 sek långsammare än snittet ger -8 poäng (via ?? -8 i koden)
    ]
};

export const DRIVER_POINTS = {
    CURRENT_YEAR_WEIGHT: 1.5,  // Vikt för innevarande år
    LAST_YEAR_WEIGHT: 0.5,     // Vikt för föregående år
};

export const TRAINER_POINTS = {
    CURRENT_YEAR_WEIGHT: 1.5,  // Vikt för innevarande år
    LAST_YEAR_WEIGHT: 0.5,     // Vikt för föregående år
};

export const EQUIPMENT_POINTS = {
    BOTH_SHOES_REMOVED: 8,  // Barfota fram/bak. Hade skor förra starten.
    FRONT_SHOES_REMOVED: 3,  // Barfota fram. Hade skor förra starten.
    BACK_SHOES_REMOVED: 3,  // Barfota bak. Hade skor förra starten.
    SWITCH_TO_YANKER: 5,     // Byte till jänkarvagn
    BOTH_SHOES_ADDED: -8, // Går med skor istället för barfota som förra starten.
    FRONT_SHOES_ADDED: -3, // Går med skor fram istället för barfota som förra starten.
    BACK_SHOES_ADDED: -3 // Går med skor bak istället för barfota som förra starten.
};

/**
 * CLASS_POINTS_CONFIG
 * ---------------------
 * Konfiguration för hur klasspoäng beräknas i calculateClassPoints.
 * Poäng ges utifrån hur mycket bättre eller sämre hästen är än fältets snitt.
 *
 * Parametrar:
 *
 * NEUTRAL_ZONE_MIN / MAX:
 *   - Definierar spannet (i procent av fältets snitt) där ingen poäng ges.
 *   - Exempel: 0.90–1.10 innebär att hästar mellan 90%–110% av snittet får 0 poäng.
 *
 * INTERVAL_SIZE:
 *   - Hur stora steg (i procentandel) som används för att beräkna poängavvikelse.
 *   - Exempel: 0.05 innebär 5% per steg.
 *
 * POINTS_PER_INTERVAL:
 *   - Hur många poäng som ges per intervall utanför neutralzonen.
 *   - Positivt om hästen överpresterar, negativt vid underprestation.
 *
 * MAX_POINTS_PER_ASPECT:
 *   - Begränsar maxpoäng per aspekt (t.ex. 3-månaderssnitt eller form).
 *   - Hindrar enskilda värden från att dominera totalpoängen.
 *
 * Exempel:
 *   - Häst är 135% av snittet ⇒ +3 intervall á 3 poäng = +9 poäng
 *   - Häst är 70% av snittet ⇒ −4 intervall á 3 poäng = −12 poäng
 */
export const CLASS_POINTS_CONFIG = {
    NEUTRAL_ZONE_MIN: 0.90,
    NEUTRAL_ZONE_MAX: 1.10,
    INTERVAL_SIZE: 0.05,
    POINTS_PER_INTERVAL: 1,
    MAX_POINTS_PER_ASPECT:12
};
