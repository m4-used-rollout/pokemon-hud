/// <reference path="romreaders/base.ts" />
/// <reference path="../../ref/runstatus.d.ts" />

namespace RomReader {

    export function AugmentState(romData: RomReaderBase, state: TPP.RunStatus) {

        function normalizeDex() {
            state.caught_list = DeDupe(state.caught_list);
            state.seen_list = DeDupe(state.seen_list);
            state.caught = state.caught || state.caught_list.length;
            state.seen = state.seen || state.seen_list.length;
        }

        function augmentItems() {
            Object.keys(state.items || {}).map(k => state.items[k]).filter(i => i && i.length)
                .forEach(itemList => itemList.filter(i => !!i).forEach(item => {
                    let romItem = romData.GetItem(item.id);
                    item.name = item.name || romItem.name;
                    item.count = romItem.isKeyItem && item.count == 1 ? null : item.count;
                    if (!item.count)
                        delete item.count;
                }));
        }

        function countBalls() {
            return Object.keys(state.items || {}).filter(k => k != "pc") //filter out PC
                .map(k => state.items[k]).filter(i => i && i.length) //map to bag pockets
                .reduce((total, pocket) => total +
                    pocket.filter(i => romData.ItemIsBall(i.id)) //filter to ball type items
                        .reduce((sum, ball) => sum + ball.count, 0), //add up the counts
                0) || (state.items && state.items.balls && state.items.balls.reduce((sum, ball) => sum + ball.count, 0)); //fall back to just counting ball pocket if available
        }

        function augmentPokemon(p: TPP.Pokemon) {
            p.name = romData.ConvertText(p.name);
            if (p.personality_value) {
                p.personality_value = p.personality_value >>> 0; //make sure pv is an unsigned 32-bit int
            }
            if (p.original_trainer) {
                p.original_trainer.name = romData.ConvertText(p.original_trainer.name);
            }
            if (p.held_item) {
                p.held_item.name = romData.GetItem(p.held_item.id).name;
            }
            doubleCheckHPIVStat(p.ivs);
            augmentPokemonMet(p);
            augmentPokemonSpeciesAndExp(p);
            augmentPokemonMoves(p);
            calculateGender(p);
            calculateShiny(p);
            calculatePokemonAbilityNatureCharacteristic(p);
            CensorEgg(p);
        }

        function augmentPartyPokemon(p: TPP.PartyPokemon) {
            if (p.status && typeof p.status !== "string") {
                let s = parseInt(p.status);
                if (s < 8)
                    p.sleep_turns = s;
                p.status = parseStatus(s);
            }
            return p;
        }

        function doubleCheckHPIVStat(stats: TPP.Stats) {
            if (stats) {
                stats.hp = typeof stats.hp === "number" ? stats.hp : (((stats.attack % 2) << 3) | ((stats.defense % 2) << 2) | ((stats.speed % 2) << 1) | (stats.special_attack % 2));
            }
        }

        function augmentPokemonMoves(p: TPP.Pokemon) {
            p.moves.filter(m => !!m).forEach(m => {
                let romMove = romData.GetMove(m.id);
                m.name = m.name || romMove.name;
                m.accuracy = m.accuracy || romMove.accuracy;
                m.base_power = m.base_power || romMove.basePower;
                m.type = m.type || romMove.type;
                if (m.name.toLowerCase() == "hidden power") {
                    m.type = romData.CalcHiddenPowerType(p.ivs);
                    m.base_power = romData.CalcHiddenPowerPower(p.ivs);
                }
                else if (m.name.toLowerCase() == "curse") {
                    if (p.species.type1.toLowerCase() == "ghost" || p.species.type2.toLowerCase() == "ghost") {
                        m.type = "Ghost";
                    }
                    else {
                        m.type = "Normal";
                    }
                }
            });
        }

        function augmentPokemonSpeciesAndExp(p: TPP.Pokemon) {
            if (!p.species.id) return;
            let romMon = romData.GetSpecies(p.species.id);
            augmentSpecies(p.species, romMon);
            if (romMon.expFunction) {
                if (!p.level) {
                    p.level = Pokemon.ExpCurve.ExpToLevel(p.experience.current, romMon.expFunction);
                }
                p.experience.next_level = p.experience.next_level || (p.level == 100 ? 0 : romMon.expFunction(p.level + 1));
                p.experience.this_level = p.experience.this_level || romMon.expFunction(p.level);
                p.experience.remaining = p.experience.next_level - p.experience.current;
            }
        }

        function augmentSpecies(s: TPP.PokemonSpecies, romMon: Pokemon.Species = null) {
            if (!s.id) return;
            romMon = romMon || romData.GetSpecies(s.id);
            s.name = s.name || romMon.name;
            s.national_dex = s.national_dex || romMon.dexNumber;
            s.type1 = s.type1 || romMon.type1;
            s.type2 = s.type2 || romMon.type2;
            s.egg_cycles = s.egg_cycles || romMon.eggCycles;
            s.gender_ratio = s.gender_ratio || romMon.genderRatio;
            s.growth_rate = s.growth_rate || romMon.growthRate;
            s.catch_rate = s.catch_rate || romMon.catchRate;
        }

        function augmentPokemonMet(p: TPP.Pokemon) {
            if (p.met) {
                if (p.met.map_id) {
                    p.met.area_name = romData.GetMap(p.met.map_id).name;
                }
                if (p.met.area_id) {
                    p.met.area_name = romData.GetAreaName(p.met.area_id);
                }
                if (typeof p.met.caught_in !== "string") {
                    p.met.caught_in = romData.GetItem(parseInt(p.met.caught_in)).name;
                }
            }
        }

        function calculateGender(p: TPP.Pokemon) {
            if (p.species.gender_ratio && typeof (p.gender) !== "string") {
                if (p.species.gender_ratio == 255) {
                    p.gender = p.gender || '';
                }
                else if (p.species.gender_ratio == 254) {
                    p.gender = p.gender || "Female";
                }
                else if (p.species.gender_ratio == 0) {
                    p.gender = p.gender || "Male";
                }
                else if (p.gender) { //Generation 3
                    p.gender = parseInt(p.gender) > p.species.gender_ratio ? "Male" : "Female";
                }
                else { //Generation 2
                    p.gender = ((p.ivs || { attack: 0 }).attack << 4) > p.species.gender_ratio ? "Male" : "Female";
                }
            }
        }

        function calculateShiny(p: TPP.Pokemon) {
            if (typeof p.shiny !== "boolean" && p.original_trainer) {
                p.shiny = ((p.original_trainer.id ^ p.original_trainer.secret) ^ (Math.floor(p.personality_value / 65536) ^ (p.personality_value % 65536))) < 8;
            }
        }

        function calculatePokemonAbilityNatureCharacteristic(p: TPP.Pokemon) {
            if (typeof p.ability === "number") {
                p.ability = romData.GetAbility(parseInt(p.ability)) || p.ability;
            }
            if (typeof p.nature === "number") {
                p.nature = romData.GetNature(parseInt(p.nature));
            }
            if (p.ivs) {
                let characteristic = romData.GetCharacteristic({
                    hp: p.ivs.hp,
                    atk: p.ivs.attack,
                    def: p.ivs.defense,
                    speed: p.ivs.speed,
                    spatk: p.ivs.special_attack,
                    spdef: p.ivs.special_defense
                }, p.personality_value);
                if (characteristic) {
                    p.characteristic = characteristic;
                }
            }
        }

        function augmentEnemyTrainer(t: TPP.EnemyTrainer) {
            let romTrainer = romData.GetTrainer(t.id, t.class_id);
            if (t.class_id) {
                t.class_name = t.class_name || romTrainer.className;
            }
            if (t.id) {
                t.name = t.name || romTrainer.name;
            }
            (t.party || []).forEach(p => augmentSpecies(p.species));
        }

        normalizeDex();
        augmentItems();
        (state.party || []).filter(p => !!p).map(augmentPartyPokemon).forEach(augmentPokemon);
        (state.pc.boxes || []).forEach(b => (b.box_contents || []).filter(p => !!p).forEach(augmentPokemon));

        state.name = romData.ConvertText(state.name);
        state.ball_count = countBalls();

        state.level_cap = state.level_cap || romData.GetCurrentLevelCap(state.badges || 0);

        if (state.wild_species) {
            augmentSpecies(state.wild_species);
        }
        if (state.enemy_trainer) {
            augmentEnemyTrainer(state.enemy_trainer);
        }
        if (state.area_id) {
            state.area_name = romData.GetAreaName(state.area_id);
        }
        if (state.map_id) {
            state.map_name = romData.GetMap(state.map_id, state.map_bank || 0).name;
        }
    }

    function CensorEgg(mon: TPP.Pokemon) {
        if (mon.is_egg) {
            //no egg spoilers
            mon.species.type1 = mon.species.type2 = mon.species.growth_rate = "???";
            mon.species.id = mon.species.national_dex = 0;
            mon.species.name = mon.name = "Egg";
            mon.moves = [];
            delete mon.ivs;
            delete (<TPP.PartyPokemon>mon).stats;
            delete mon.evs;
            delete mon.condition;
            delete mon.ability;
        }
    }

    function DeDupe(array: number[]) {
        return (array || []).filter((item, position, arr) => item && arr.indexOf(item) == position).sort((x, y) => parseInt(x.toString()) - parseInt(y.toString()));
    }

    function parseStatus(status: number) {
        if (status % 8 > 0)
            return "SLP";
        if (status & 8)
            return "PSN";
        if (status & 16)
            return "BRN";
        if (status & 32)
            return "FRZ";
        if (status & 64)
            return "PAR";
        if (status & 128)
            return "TOX";
        return null;
    }

}