interface HorseData {
    blinders?: string;
    blindersLastStart?: string;
}

interface Horse {
    horse: HorseData;
}

export function calculateEquipmentPointsGalopp(horse: Horse): { points: number; description: string } {
    let points = 0;
    let description = "";

    // Helper function to safely convert blinders to string
    const blindersToString = (blinders: any): string => {
        if (typeof blinders === 'string') {
            return blinders.toLowerCase();
        }
        if (typeof blinders === 'boolean') {
            return blinders ? 'true' : 'false';
        }
        if (blinders === null || blinders === undefined) {
            return '';
        }
        return String(blinders).toLowerCase();
    };

    const current = blindersToString(horse.horse.blinders);
    const previous = blindersToString(horse.horse.blindersLastStart);

    if (current === previous) {
        points  = 0;
        description = "Ingen utrustningsförändring: " + (current ? `(${current})` : "");
    } else {
        points = 100;
        description = ("Utrustning ändrad från: " + (previous || "Ingen") + " till: " + (current || "Ingen"));
    }

  //  console.log(`🐎 Utrustningspoäng för ${horse.horse.name}:`, points, "Beskrivning:", description);
    return { points, description };
}
