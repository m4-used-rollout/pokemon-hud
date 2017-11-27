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
        eggGroup1: string | number;
        eggGroup2: string | number;
        baseExp: number;
        genderRatio: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        growthRate: string;
        expFunction: ExpCurve.CalcExp;
        baseSpeciesId?: number;
        formNumber?: number;
        doNotFlipSprite?: boolean;
    }
}