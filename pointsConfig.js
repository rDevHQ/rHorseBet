export const FORM_POINTS = {
    WIN: 5,
    SECOND: 3,
    THIRD: 2,
    FOURTH_FIFTH: 1,
    UNPLACED: 0,
    FORM_BONUS: 2,
    HIGH_PRIZE_BONUS: 2
};

export const TIME_POINTS = {
    BEST_TIME_BONUS: 3,   // Förhöjd – belöna bästa rekord mer
    RECENT_RACE_BONUS: 5, // Förhöjd – belöna formtopp

    THRESHOLDS: [
        { minDiff: -1.8, points: 6 },  // Exceptionellt snabb
        { minDiff: -1.5, points: 5 },
        { minDiff: -1.2, points: 4 },
        { minDiff: -0.9, points: 3 },
        { minDiff: -0.6, points: 2 },
        { minDiff: -0.3, points: 1 },
        { minDiff:  0.3, points: -1 },
        { minDiff:  0.6, points: -2 },
        { minDiff:  0.9, points: -3 },
        { minDiff:  1.2, points: -4 },
        { minDiff:  1.5, points: -5 },
        { minDiff:  1.8, points: -6 }
        // Allt mellan -0.3 till +0.3 får 0 poäng automatiskt (tolkas som "neutral zon")
    ]
};

export const DRIVER_POINTS = {
    CURRENT_YEAR_WEIGHT: 0.7,  // Vikt för innevarande år
    LAST_YEAR_WEIGHT: 0.3,     // Vikt för föregående år
    MAX_POINTS: 5             // Maxpoäng vid 100% vinstprocent
};

export const TRAINER_POINTS = {
    CURRENT_YEAR_WEIGHT: 0.7,  // Vikt för innevarande år
    LAST_YEAR_WEIGHT: 0.3,     // Vikt för föregående år
    MAX_POINTS: 3              // Maxpoäng vid högsta vinstprocenten i loppet
};

export const EQUIPMENT_POINTS = {
    FIRST_TIME_BAREFOOT: 1,  // Barfota fram/bak för första gången på länge
    SWITCH_TO_YANKER: 1,     // Byte till jänkarvagn
    SHOES_INSTEAD_OF_BAREFOOT: -1 // Går med skor istället för barfota
};

export const CLASS_POINTS = {
    HIGHER_THAN_FIELD: 5, // Hästen har tävlat i lopp med klart högre snittprissumma
    EQUAL_TO_FIELD: 0,     // Hästen har tävlat i lopp med likvärdig snittprissumma
    LOWER_THAN_FIELD: -5     // Hästen har tävlat i lopp med lägre snittprissumma
};
