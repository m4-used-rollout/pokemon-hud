namespace Pokemon {
    export interface Evolution {
        level?: number;
        item?: Item;
        isTrade?: boolean;
        happiness?: number;
        mapId?: number;
        timeOfDay?: "Morn" | "Day" | "Night";
        speciesId: number;
    }
}