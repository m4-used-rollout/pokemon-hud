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
        abilities?: string[];
        catchRate: number;
        eggCycles: number;
        eggGroup1: string;
        eggGroup2: string;
        baseExp: number;
        genderRatio: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        growthRate: string;
        expFunction: ExpCurve.CalcExp;
        baseSpeciesId?: number;
        formNumber?: number;
        doNotFlipSprite?: boolean;
        heldItem1?: Item;
        heldItem2?: Item;
        tmMoves?: Move[];
    }
}