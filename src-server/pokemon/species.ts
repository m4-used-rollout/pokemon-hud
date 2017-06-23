/// <reference path="expcurve.ts" />
/// <reference path="stats.ts" />

namespace Pokemon {
    export interface Species {
        id: number;
        name: string;
        dexNumber: number;
        type1: string;
        type2: string;
        baseStats: Stats;
        abilities: string[];
        catchRate: number;
        eggCycles: number;
        eggGroup1: number;
        eggGroup2: number;
        baseExp: number;
        genderRatio: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        growth_rate: string;
        expFunction: ExpCurve.CalcExp;
    }
}