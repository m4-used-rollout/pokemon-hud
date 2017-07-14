/// <reference path="species.ts" />

namespace Pokemon {
    export interface EncounterMon {
        species: Pokemon.Species;
        rate: number;
        requiredItem?: Pokemon.Item;
    }
    export interface EncounterSet {
        [key: string]: EncounterMon[];
        grass?: EncounterMon[];
        hidden_grass?: EncounterMon[];
        surfing?: EncounterMon[];
        hidden_surfing?: EncounterMon[];
        fishing?: EncounterMon[];
        hidden_fishing?: EncounterMon[];
    }

    export interface Encounters {
        [key: string]: EncounterSet;
    }
}