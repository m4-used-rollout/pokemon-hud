/// <reference path="encounters.ts" />

namespace Pokemon {
    export interface Map {
        name: string;
        id: number;
        bank?: number;
        areaId?: number;
        areaName?: string;
        encounters: Encounters;
    }
}