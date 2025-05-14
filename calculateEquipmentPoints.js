import { EQUIPMENT_POINTS, MAX_CATEGORY_POINTS } from "./pointsConfig.js";

/**
 * Beräknar utrustningspoäng utifrån ändringar i skor och sulky,
 * och justerar poängen beroende på hur vanligt förekommande ändringen är i fältet.
 */
export function calculateEquipmentPoints(horse, allHorses) {
   
    function getBaseEquipmentScore(horse) {
        let score = 0;
        if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false) {
            score += EQUIPMENT_POINTS.FIRST_TIME_BAREFOOT;
        }
        if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false) {
            score += EQUIPMENT_POINTS.FIRST_TIME_BAREFOOT;
        }
        if (
            (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true) ||
            (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true)
        ) {
            score += EQUIPMENT_POINTS.SHOES_INSTEAD_OF_BAREFOOT;
        }
        if (horse.sulky?.type?.changed === true &&
            horse.sulky?.type?.text?.toLowerCase().includes("amerikansk")) {
            score += EQUIPMENT_POINTS.SWITCH_TO_YANKER;
        }
        return score;
    }

    const baseScore = getBaseEquipmentScore(horse);
    if (baseScore === 0) {
        return { points: 0, description: "Inga utrustningsändringar" };
    }

    const allBaseScores = allHorses.map(h => getBaseEquipmentScore(h.horse ?? h));
    const min = Math.min(...allBaseScores);
    const max = Math.max(...allBaseScores);

    let finalScore;
    if (max === min) {
        finalScore = Math.round(MAX_CATEGORY_POINTS.utrustning / 2);
    } else {
        finalScore = Math.round(((baseScore - min) / (max - min)) * MAX_CATEGORY_POINTS.utrustning);
    }

    const changes = [];
    if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false) changes.push("Barfota fram");
    if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false) changes.push("Barfota bak");
    if (
        (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true) ||
        (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true)
    ) changes.push("Till skor");
    if (horse.sulky?.type?.changed === true &&
        horse.sulky?.type?.text?.toLowerCase().includes("amerikansk")) changes.push("Jänkarvagn");

    return { points: finalScore, description: changes.join(", ") || "Inga utrustningsändringar" };
}