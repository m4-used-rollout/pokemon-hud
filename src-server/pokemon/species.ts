/// <reference path="expcurve.ts" />

namespace Pokemon {
    export interface Species {
        id: number;
        name: string;
        dexNumber: number;
        type1: string;
        type2: string;
        baseStats: {
            hp: number;
            atk: number;
            def: number;
            spatk: number;
            spdef: number;
        }
        abilities: string[];
        catchRate: number;
        expYield?: number;
        genderRatio?: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        expFunction: ExpCurve.CalcExp;
    }
}