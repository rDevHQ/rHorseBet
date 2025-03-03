import { EQUIPMENT_POINTS } from "./pointsConfig.js";

export function calculateEquipmentPoints(horse) {
    let points = 0;

    // Skopoäng: Om hästen går barfota fram/bak för första gången på länge
    if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false) {
        points += EQUIPMENT_POINTS.FIRST_TIME_BAREFOOT;
    }
    if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false) {
        points += EQUIPMENT_POINTS.FIRST_TIME_BAREFOOT;
    }

    // Avdrag om hästen byter till skor istället för barfota
    if (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true) {
        points += EQUIPMENT_POINTS.SHOES_INSTEAD_OF_BAREFOOT;
    }
    if (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true) {
        points += EQUIPMENT_POINTS.SHOES_INSTEAD_OF_BAREFOOT;
    }

    // Jänkarvagn: Om hästen byter till jänkarvagn
    if (horse.sulky?.type?.changed === true && horse.sulky?.type?.text?.toLowerCase().includes("Amerikansk".toLowerCase())) {
        points += EQUIPMENT_POINTS.SWITCH_TO_YANKER;
    }

    return points;
}