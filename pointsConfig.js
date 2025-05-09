export const MAX_CATEGORY_POINTS = {
    folket: 20,
    tid: 15,
    tranare: 12,
    h2h: 12,
    klass: 12,
    utrustning: 10,
    kusk: 8,
    form: 8,
    startspar: 6
};

export const FORM_POINTS_CONFIG = {
    PLACEMENT_POINTS: {
        1: 5,
        2: 3,
        3: 1
    },
    WEIGHT_FACTORS: [2.0, 1.6, 1.3, 1.0, 0.7],
    THREE_MONTHS_BONUS: {
        WIN: 5,
        SECOND: 3,
        THIRD: 1
    },
};

export const TIME_POINTS = {
    BEST_TIME_BONUS: 4,    // Maxbonus om hästen har snabbast rekord
    RECENT_RACE_BONUS: 7,  // Bonus om hästen har en färsk start (t.ex. inom 30 dagar)

    /**
     * Poäng baserat på differens från fältets snittid (i sekunder).
     * Exempel: -1.8 betyder 1.8 sekunder snabbare än snittet → hög poäng.
     * Max poäng från detta block: 12
     */
    THRESHOLDS: [
        { minDiff: -1.8, points: 12 },  // Exceptionellt snabb
        { minDiff: -1.5, points: 11 },
        { minDiff: -1.2, points: 10 },
        { minDiff: -0.9, points: 9 },
        { minDiff: -0.6, points: 8 },
        { minDiff: -0.3, points: 7 },
        { minDiff: 0.3, points: 5 },
        { minDiff: 0.6, points: 4 },
        { minDiff: 0.9, points: 3 },
        { minDiff: 1.2, points: 2 },
        { minDiff: 1.5, points: 1 },
        { minDiff: 1.8, points: 0 }
        // Mellan -0.3 och +0.3 ger 6 poäng = neutral nivå
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
    FIRST_TIME_BAREFOOT: 10,  // Barfota fram/bak för första gången på länge
    SWITCH_TO_YANKER: 8,     // Byte till jänkarvagn
    SHOES_INSTEAD_OF_BAREFOOT: -10 // Går med skor istället för barfota
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