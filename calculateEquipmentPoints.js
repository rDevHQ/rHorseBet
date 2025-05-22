import { EQUIPMENT_POINTS, MAX_CATEGORY_POINTS } from "./pointsConfig.js";

/**
 * Beräknar utrustningspoäng utifrån ändringar i skor och sulky,
 */
export function calculateEquipmentPoints(horse) {
   
    function getBaseEquipmentScore(horse) {
        let score = 0;
        
        // Beräkna poäng för om skor har tagits bort
        if (
            horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false &&
            horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false
        ) {
            score += EQUIPMENT_POINTS.BOTH_SHOES_REMOVED;
        } else if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false) {
            score += EQUIPMENT_POINTS.FRONT_SHOES_REMOVED;
        } else if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false) {
            score += EQUIPMENT_POINTS.BACK_SHOES_REMOVED;
        }

        // Beräkna poäng för om skor har tagits på
        if (
            horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true &&
            horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true
        ) {
            score += EQUIPMENT_POINTS.BOTH_SHOES_ADDED;
        } else if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true) {
            score += EQUIPMENT_POINTS.FRONT_SHOES_ADDED;
        } else if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true) {
            score += EQUIPMENT_POINTS.BACK_SHOES_ADDED;
        }

        // Beräkna poäng för byte till jänkarvagn
        if (horse.sulky?.type?.changed === true &&
            horse.sulky?.type?.text?.toLowerCase().includes("amerikansk")) {
            score += EQUIPMENT_POINTS.SWITCH_TO_YANKER;
        }
        return score;
    }

    const score = getBaseEquipmentScore(horse);
    if (score === 0) {
        return { points: 0, description: "Inga utrustningsändringar" };
    }

    const changes = [];
    if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false) changes.push("Barfota fram");
    if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false) changes.push("Barfota bak");
    if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true) changes.push("Skor fram");
    if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true) changes.push("Skor bak");

    if (horse.sulky?.type?.changed === true &&
        horse.sulky?.type?.text?.toLowerCase().includes("amerikansk")) changes.push("Jänkarvagn");

    return { points: score, description: changes.join(", ") || "Inga utrustningsändringar" };
}