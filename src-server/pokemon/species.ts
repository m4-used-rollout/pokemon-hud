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
        expYield?: number;
        genderRatio?: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        expFunction: ExpCurve.CalcExp;
    }
}