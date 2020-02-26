namespace Pokemon {
    export interface Evolution {
        level?: number;
        item?: Item;
        isTrade?: boolean;
        happiness?: number;
        mapId?: number;
        specialCondition?: string;
        timeOfDay?: "Morn" | "Day" | "Night" | "MornDay";
        speciesId: number;
    }
}