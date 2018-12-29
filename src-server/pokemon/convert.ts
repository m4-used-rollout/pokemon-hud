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

    export function EnemyTrainerToRunStatus(t:Trainer) {
        if (!t) return null;
        return <TPP.EnemyTrainer> {
            id: t.id,
            class_id: t.classId,
            class_name: t.className,
            name: t.name,
            gender: t.gender,
            pic_id: t.spriteId
        };
    }

    export function StatsToRunStatus(stats: Stats) {
        return {
            attack: stats.atk,
            defense: stats.def,
            hp: stats.hp,
            special_attack: stats.spatk,
            special_defense: stats.spdef,
            speed: stats.speed
        } as TPP.Stats;
    }

    export interface StatSpeciesWithExp extends TPP.PokemonSpecies {
        expFunction?: ExpCurve.CalcExp; //won't serialize
    }
    export function SpeciesToRunStatus(species: Species) {
        return {
            abilities: species.abilities,
            base_stats: StatsToRunStatus(species.baseStats),
            catch_rate: species.catchRate,
            do_not_flip_sprite: species.doNotFlipSprite,
            egg_cycles: species.eggCycles,
            egg_type1: species.eggGroup1,
            egg_type2: species.eggGroup2,
            gender_ratio: species.genderRatio,
            growth_rate: species.growthRate,
            id: species.id,
            name: species.name,
            national_dex: species.dexNumber,
            type1: species.type1,
            type2: species.type2,
            expFunction: species.expFunction,
            held_items: [species.heldItem1, species.heldItem2].filter(i=>!!i).map(i=>ItemToRunStatus(i)),
            tm_moves: (species.tmMoves || []).filter(m=>!!m).map(m=>MoveToRunStatus(m))
        } as StatSpeciesWithExp;
    }

    export function MoveToRunStatus(move: Move, pp = 0, ppUp = 0, maxPP = 0) {
        return {
            accuracy: move.accuracy,
            base_power: move.basePower,
            id: move.id,
            pp: pp,
            pp_up: ppUp,
            max_pp: maxPP || (move.basePP + Math.floor(ppUp * move.basePP * 0.2)),
            name: move.name,
            type: move.type,
            contest: move.contestData
        } as TPP.Move;
    }

    
    export function MoveLearnToRunStatus(move: MoveLearn, pp = 0, ppUp = 0, maxPP = 0) {
        return move && {
            accuracy: move.accuracy,
            base_power: move.basePower,
            id: move.id,
            name: move.name,
            type: move.type,
            level: move.level
        } as TPP.MoveLearn;
    }

    export function ItemToRunStatus(item: Item, count = 0) {
        return {
            count: count,
            id: item.id,
            name: item.name
        } as TPP.Item;
    }
}