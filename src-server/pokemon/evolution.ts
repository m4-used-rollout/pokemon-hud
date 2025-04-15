namespace Pokemon {
    export interface Evolution {
        level?: number;
        form?: number;
        item?: Item;
        move?: Move;
        moveType?: string;
        otherSpeciesId?: number;
        isTrade?: boolean;
        happiness?: number;
        mapId?: number;
        specialCondition?: string;
        natures?: string[];
        timeOfDay?: "Morn" | "Day" | "Night" | "MornDay" | "Dusk";
        speciesId: number;
    }
}