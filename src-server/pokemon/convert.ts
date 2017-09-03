/// <reference path="species.ts" />
/// <reference path="trainer.ts" />

namespace Pokemon.Convert {
    export function SpeciesFromRunStatus(s: TPP.PokemonSpecies) {
        if (!s) return null;
        return <Species>{
            id: s.id,
            name: s.name,
            type1: s.type1,
            type2: s.type2,
            catchRate: s.catch_rate,
            eggCycles: s.egg_cycles,
            eggGroup1: s.egg_type1,
            eggGroup2: s.egg_type2,
            growthRate: s.growth_rate,
            dexNumber: s.national_dex
        }
    }

    export function EnemyTrainerFromRunStatus(t: TPP.EnemyTrainer) {
        if (!t) return null;
        return <Trainer>{
            id: t.id,
            name: t.name,
            classId: t.class_id,
            spriteId: t.class_id,
            className: t.class_name,
            gender: t.gender,
            secret: t.secret
        }
    }
}