const EQUIPMENT_POINTS = {
    BOTH_SHOES_REMOVED: 70,
    FRONT_SHOES_REMOVED: 30,
    BACK_SHOES_REMOVED: 30,
    SWITCH_TO_YANKER: 30,
    BOTH_SHOES_ADDED: -70,
    FRONT_SHOES_ADDED: -30,
    BACK_SHOES_ADDED: -30
};

function getEquipmentRawScoreSingleHorse(horse) {
    let score = 0;
    if (horse?.shoes?.front?.changed === true && horse?.shoes?.front?.hasShoe === false &&
        horse?.shoes?.back?.changed === true && horse?.shoes?.back?.hasShoe === false) {
        score += EQUIPMENT_POINTS.BOTH_SHOES_REMOVED;
    } else {
        if (horse?.shoes?.front?.changed === true && horse?.shoes?.front?.hasShoe === false) score += EQUIPMENT_POINTS.FRONT_SHOES_REMOVED;
        if (horse?.shoes?.back?.changed === true && horse?.shoes?.back?.hasShoe === false) score += EQUIPMENT_POINTS.BACK_SHOES_REMOVED;
    }

    if (horse?.shoes?.front?.changed === true && horse?.shoes?.front?.hasShoe === true &&
        horse?.shoes?.back?.changed === true && horse?.shoes?.back?.hasShoe === true) {
        score += EQUIPMENT_POINTS.BOTH_SHOES_ADDED;
    } else {
        if (horse?.shoes?.front?.changed === true && horse?.shoes?.front?.hasShoe === true) score += EQUIPMENT_POINTS.FRONT_SHOES_ADDED;
        if (horse?.shoes?.back?.changed === true && horse?.shoes?.back?.hasShoe === true) score += EQUIPMENT_POINTS.BACK_SHOES_ADDED;
    }

    if (horse?.sulky?.type?.changed === true && horse?.sulky?.type?.text?.toLowerCase().includes("amerikansk")) {
        score += EQUIPMENT_POINTS.SWITCH_TO_YANKER;
    }

    return score;
}

function getEquipmentRawScoreFromAllHorsesEntry(h) {
    return getEquipmentRawScoreSingleHorse(h.horse);
}

/**
 * Beräknar utrustningspoäng utifrån ändringar i skor och sulky,
 * och normaliserar till 0–100 baserat på min/max bland alla hästar.
 */
export function calculateEquipmentPoints(horse, allHorses) {
 //    console.log("📋 horse snapshot:", JSON.stringify(horse, null, 2));
 //   console.log("📋 allHorses snapshot:", JSON.stringify(allHorses, null, 2));
    const rawScoreFinal = getEquipmentRawScoreSingleHorse(horse);
    const changes = [];

    // Poäng för barfotabalans
    if (
        horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false &&
        horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false
    ) {
        changes.push("Barfota fram", "Barfota bak");
    } else {
        if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false) {
            changes.push("Barfota fram");
        }
        if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false) {
            changes.push("Barfota bak");
        }
    }

    if (
        horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true &&
        horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true
    ) {
        changes.push("Skor fram", "Skor bak");
    } else {
        if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true) {
            changes.push("Skor fram");
        }
        if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true) {
            changes.push("Skor bak");
        }
    }

    // Jänkarvagn
    if (horse.sulky?.type?.changed === true &&
        horse.sulky?.type?.text?.toLowerCase().includes("amerikansk")) {
        changes.push("Jänkarvagn");
    }

    const currentHorseName = horse?.horse?.name;

    const otherRawScores = allHorses
        .filter(h => h.horse?.name !== currentHorseName)
        .map(getEquipmentRawScoreFromAllHorsesEntry);

    const allRawScores = otherRawScores.concat([rawScoreFinal]);
    const minRaw = Math.min(...allRawScores);
    const maxRaw = Math.max(...allRawScores);

    let normalized;
    if (maxRaw === minRaw) {
        normalized = 50;
    } else {
        normalized = ((rawScoreFinal - minRaw) / (maxRaw - minRaw)) * 100;
        normalized = Math.max(0, Math.min(100, normalized));
    }

    return {
        points: Math.round(normalized),
        description: changes.length ? changes.join(", ") : "Inga utrustningsändringar"
    };
}