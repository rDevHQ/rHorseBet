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
    BEST_TIME_BONUS: 1,   // Hästens bästa tid snabbare än alla andra hästars bästa tid (+3 poäng)
    RECENT_RACE_BONUS: 1, // Hästens senaste start snabbare än alla andra hästars viktade snitt (+3 poäng)
    THRESHOLDS: [
        { minDiff: -1.5, points: 4 },  // Minst 1.5 sek/km snabbare än snittet → 10 poäng
        { minDiff: -1.0, points: 3 },   // Minst 1.0 sek/km snabbare än snittet → 7 poäng
        { minDiff: -0.5, points: 2 },   // Minst 0.5 sek/km snabbare än snittet → 5 poäng
        { minDiff: -0.2, points: 1 },   // Minst 0.2 sek/km snabbare än snittet → 2 poäng
        { minDiff: 0.2, points: 0 },    // Mellan -0.2 och +0.2 sek/km → 0 poäng (medelsnitt)
        { minDiff: 0.5, points: -2 },   // Minst 0.5 sek/km långsammare än snittet → -2 poäng
        { minDiff: 1.0, points: -3 },   // Minst 1.0 sek/km långsammare än snittet → -3 poäng
        { minDiff: 1.5, points: -4 }   // Minst 1.5 sek/km långsammare än snittet → -5 poäng
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
