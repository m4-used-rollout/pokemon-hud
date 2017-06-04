/// <reference path="species.ts" />

namespace Pokemon {
    export interface Map {
        name: string;
        id: number;
        encounters: {
            grass: Species[];
            hidden_grass?: Species[];
            surfing: Species[];
            hidden_surfing?: Species[];
            fishing: Species[];
            hidden_fishing?: Species[];
        }
    }
}