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
            try {
                Object.keys(state.items || {}).map(k => state.items[k]).filter(i => i && i.length)
                    .forEach(itemList => itemList.filter(i => !!i).forEach(item => {
                        let romItem = romData.GetItem(item.id);
                        item.name = item.name || romItem.name;
                        item.count = romItem.isKeyItem && item.count == 1 ? null : item.count;
                        if (!item.count)
                            delete item.count;
                    }));
            }
            catch (e) {
                console.error(e);
            }
        }

        function countBalls() {
            try {
                return Object.keys(state.items || {}).filter(k => k != "pc") //filter out PC
                    .map(k => state.items[k]).filter(i => i && i.length) //map to bag pockets
                    .reduce((total, pocket) => total +
                        pocket.filter(i => romData.ItemIsBall(i.id)) //filter to ball type items
                            .reduce((sum, ball) => sum + (ball.count || 0), 0), //add up the counts
                    0) || (state.items && state.items.balls && state.items.balls.reduce((sum, ball) => sum + ball.count, 0)); //fall back to just counting ball pocket if available
            }
            catch (e) {
                console.error(e);
            }
            return 0;
        }

        function augmentPokemon(p: TPP.Pokemon) {
            try {
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
            catch (e) {
                console.error(e);
            }
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
                try {
                    let romMove = romData.GetMove(m.id);
                    m.name = m.name || romMove.name || "???";
                    m.accuracy = m.accuracy || romMove.accuracy;
                    m.base_power = m.base_power || romMove.basePower;
                    m.type = m.type || romMove.type || "???";
                    if (m.name && m.name.toLowerCase() == "hidden power") {
                        m.type = romData.CalcHiddenPowerType(p.ivs);
                        m.base_power = romData.CalcHiddenPowerPower(p.ivs);
                    }
                    else if (m.name && m.name.toLowerCase() == "curse") {
                        if ((p.species.type1 || '').toLowerCase() == "ghost" || (p.species.type2 || '').toLowerCase() == "ghost") {
                            m.type = "Ghost";
                        }
                        else {
                            m.type = "Normal";
                        }
                    }
                }
                catch (e) {
                    console.error(e);
                }
            });
        }

        function augmentPokemonSpeciesAndExp(p: TPP.Pokemon) {
            if (!p.species.id) return;
            let romMon = romData.GetSpecies(p.species.id, p.form);
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
            s.abilities = s.abilities || romMon.abilities;
            s.do_not_flip_sprite = romMon.doNotFlipSprite;
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
                    p.met.caught_in = romData.GetItem(romData.MapCaughtBallId(parseInt(p.met.caught_in))).name;
                }
            }
        }

        function calculateGender(p: TPP.Pokemon) {
            if (p.species.gender_ratio && typeof (p.gender) !== "string") {
                if (p.species.gender_ratio == 255) {
                    p.gender = '';
                }
                else if (p.species.gender_ratio == 254) {
                    p.gender = "Female";
                }
                else if (p.species.gender_ratio == 0) {
                    p.gender = "Male";
                }
                else {//if (p.gender) { //Generation 3
                    p.gender = (p.personality_value % 256) > p.species.gender_ratio ? "Male" : "Female";
                }
                // else { //Generation 2
                //     p.gender = ((p.ivs || { attack: 0 }).attack << 4) > p.species.gender_ratio ? "Male" : "Female";
                // }
            }
        }

        function calculateShiny(p: TPP.Pokemon) {
            if (typeof p.shiny !== "boolean" && p.original_trainer) {
                p.shiny = ((p.original_trainer.id ^ p.original_trainer.secret) ^ (Math.floor(p.personality_value / 65536) ^ (p.personality_value % 65536))) < 8;
            }
        }

        function calculatePokemonAbilityNatureCharacteristic(p: TPP.Pokemon) {
            if (typeof p.ability !== "string" && romData.HasAbilities) {
                let abilityId = p.personality_value % 2;
                if (typeof p.ability === "number") {
                    abilityId = p.ability;
                }
                if (p.species.abilities && p.species.abilities.length > abilityId) {
                    p.ability = p.species.abilities[abilityId];
                }
                else {
                    p.ability = romData.GetAbility(abilityId) || abilityId.toString();
                }
            }
            if (typeof p.nature !== "string" && romData.HasNatures) {
                p.nature = romData.GetNature(p.nature ? parseInt(p.nature) : (p.personality_value % 25));
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
            t.class_id = t.class_id || romTrainer.classId;
            t.class_name = t.class_name || romTrainer.className;
            if (t.id || t.id === 0) {
                t.name = (t.name || '').trim() || romTrainer.name;
            }
            t.pic_id = t.pic_id || romTrainer.spriteId;
            if (state.rival_name && t.class_name && t.class_name.toLowerCase() == "rival") {
                t.name = state.rival_name;
            }
        }

        try {
            normalizeDex();
            augmentItems();
            (state.daycare || []).filter(p => !!p).forEach(augmentPokemon);
            (state.party || []).filter(p => !!p).map(augmentPartyPokemon).forEach(augmentPokemon);
            (state.pc.boxes || []).forEach(b => (b.box_contents || []).filter(p => !!p).forEach(augmentPokemon));

            state.name = romData.ConvertText(state.name);
            state.ball_count = countBalls();

            state.level_cap = state.level_cap || romData.GetCurrentLevelCap(state.badges || 0);

            if (state.wild_species) {
                augmentSpecies(state.wild_species);
            }
            if (state.enemy_trainers) {
                state.enemy_trainers.forEach(augmentEnemyTrainer);
            }
            if (state.enemy_party) {
                state.enemy_party = state.enemy_party.filter(p => !!p);
                state.enemy_party.forEach(p => augmentSpecies(p.species));
            }
            if (state.area_id) {
                state.area_name = romData.GetAreaName(state.area_id);
            }
            if (state.map_id) {
                state.map_name = romData.GetMap(state.map_id, state.map_bank || 0).name;
            }
        }
        catch (e) {
            console.error(e);
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