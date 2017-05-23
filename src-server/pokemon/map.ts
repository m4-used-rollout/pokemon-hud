/// <reference path="species.ts" />

namespace Pokemon {
    export interface Map {
        name: string;
        id: number;
        encounters: {
            grass: Species[];
            surfing: Species[];
            fishing: Species[];
        }
    }
}