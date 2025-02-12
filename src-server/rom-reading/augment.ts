/// <reference path="romreaders/base.ts" />
/// <reference path="../pokemon/convert.ts" />
/// <reference path="../../ref/runstatus.d.ts" />

namespace RomReader {
    const tmHmExp = /(T|H)M\d\d\s/i;

    export function AugmentState(romData: RomReaderBase, state: TPP.RunStatus) {

        function normalizeDex() {
            state.caught_list = DeDupe(state.caught_list);
            state.seen_list = DeDupe(state.seen_list);
            state.caught = state.caught_list.length;
            state.seen = state.seen_list.length;
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
                // sort Free Space alphabetically
                state.items && state.items.free_space && (state.items.free_space = state.items.free_space.sort((i1, i2) => (i1.name.replace(tmHmExp, '')).localeCompare(i2.name.replace(tmHmExp, ''))));
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
                        0)
                    || (state.items && state.items.balls && state.items.balls.reduce((sum, ball) => sum + ball.count, 0)) //fall back to just counting ball pocket if available
                    || 0; //or I guess there aren't any then
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
                ConcealEgg(p);
                romData.CalculateUnownForm(p);
                if (p.name && p.species && p.species.name && p.name.toLowerCase() == p.species.name.toLowerCase())
                    p.name = p.species.name; //use correctly-capsed version of pokemon name from rom data
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
                stats.hp = typeof stats.hp == "number" ? stats.hp : (((stats.attack % 2) << 3) | ((stats.defense % 2) << 2) | ((stats.speed % 2) << 1) | (stats.special_attack % 2));
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
                        if (m.id == 352) { //Chatty Hidden Power
                            m.type = state.chatty_power_type || "None";
                            m.base_power = state.chatty_power;
                        }
                        else {
                            m.type = romData.CalculateHiddenPowerType(p.ivs);
                            m.base_power = romData.CalculateHiddenPowerPower(p.ivs);
                        }
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
            if (!p || !p.species || !p.species.id) return;
            let romMon = romData.GetSpecies(p.species.id, p.form);
            p.species = augmentSpecies(p.species, romMon);
            if (romMon.expFunction) {
                if (!p.level) {
                    p.level = Pokemon.ExpCurve.ExpToLevel(p.experience.current, romMon.expFunction);
                }
                p.experience.next_level = p.experience.next_level || (p.level == 100 ? 0 : romMon.expFunction(p.level + 1));
                p.experience.this_level = p.experience.this_level || romMon.expFunction(p.level);
                p.experience.remaining = p.experience.next_level - p.experience.current;
            }
            if (!(p as TPP.ShadowPokemon).is_shadow)
                p.next_move = p.next_move || Pokemon.Convert.MoveLearnToRunStatus(romData.GetNextMoveLearn(p.species.id, p.form, p.level, p.moves.map(m => m.id)));

            //Conceal NextMove data
            if (p.next_move) {
                delete p.next_move.id;
                delete p.next_move.accuracy;
                delete p.next_move.base_power;
                delete p.next_move.name;
            }

            removeInvalidEvos(p);
        }

        function augmentSpecies(s: TPP.PokemonSpecies, fromRom: Pokemon.Species = null) {
            if (!s || !s.id) return s;
            let romMon = Pokemon.Convert.SpeciesToRunStatus(fromRom || romData.GetSpecies(s.id));
            return Object.assign(s, romMon, s);
        }

        function hasSpecialEvo(p: TPP.Pokemon, ...evos: string[]) {
            if (!p || !p.species || !p.species.evolutions)
                return false;
            return p.species.evolutions.some(e => e.special_condition && evos.some(c => c == e.special_condition));
        }

        function removeEvos(p: TPP.Pokemon, ...evos: string[]) {
            if (p && p.species && p.species.evolutions)
                p.species.evolutions = p.species.evolutions.filter(e => !e.special_condition || evos.every(c => c != e.special_condition));
            return p;

        }

        function removeInvalidEvos(p: TPP.Pokemon) {
            if (!p || !p.species || !p.species.evolutions)
                return p;

            // Wurmple
            if (hasSpecialEvo(p, "Low PV", "High PV")) {
                if (((p.encryption_constant || p.personality_value) >>> 16) % 10 > 4)
                    removeEvos(p, "Low PV"); // Remove Silcoon
                else
                    removeEvos(p, "High PV"); // Remove Cascoon
            }

            //Tyrogue
            const stats = (p as TPP.PartyPokemon).stats;
            if (stats && typeof stats.attack === "number" && hasSpecialEvo(p, "Attack > Defense", "Attack = Defense", "Attack < Defense")) {
                if (stats.attack > stats.defense)
                    removeEvos(p, "Attack = Defense", "Attack < Defense"); // Remove Hitmontop and Hitmonchan
                else if (stats.attack < stats.defense)
                    removeEvos(p, "Attack = Defense", "Attack > Defense"); // Remove Hitmontop and Hitmonlee
                else
                    removeEvos(p, "Attack > Defense", "Attack < Defense"); // Remove Hitmonlee and Hitmonchan
            }

            return p;
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
            romData.CalculateGender(p);
        }

        function calculateShiny(p: TPP.Pokemon) {
            romData.CalculateShiny(p);
        }

        function calculatePokemonAbilityNatureCharacteristic(p: TPP.Pokemon) {
            if (typeof p.ability !== "string" && romData.HasAbilities) {
                let abilityId = p.personality_value % 2;
                if (typeof p.ability === "number") {
                    abilityId = p.ability;
                }
                // if p.species.abilities && p.species.abilities.length > abilityId) { //gen 3 only
                //     p.ability = p.species.abilities[abilityId];
                // }
                // else {
                p.ability = romData.GetAbility(abilityId) || abilityId.toString();
                // }
            }
            if (typeof p.nature !== "string" && romData.HasNatures) {
                p.nature = romData.GetNature(typeof p.nature === "number" ? parseInt(p.nature) : (p.personality_value % 25));
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
            t.pic_id = typeof t.pic_id === "number" ? t.pic_id : romTrainer.spriteId;
            // if (state.rival_name && t.class_name && (t.class_name.toLowerCase() == "rival" || romData.TrainerIsRival(t.id, t.class_id))) {
            //     t.name = state.rival_name;
            // } //removed for Chatty Crystal
        }

        // AugmentState
        try {
            normalizeDex();
            augmentItems();
            (state.daycare = (state.daycare || []).filter(p => !!p)).forEach(augmentPokemon);
            (state.party = (state.party || []).filter(p => !!p).map(augmentPartyPokemon)).forEach(augmentPokemon);
            (state.battle_party && (state.battle_party = (state.battle_party || []).filter(p => !!p).map(augmentPartyPokemon)).forEach(augmentPokemon));
            (state.pc.boxes || []).forEach(b => (b.box_contents = (b.box_contents || []).filter(p => !!p)).forEach(augmentPokemon));

            if (typeof state.pikachu_happiness === "number")
                ([...(state.daycare || []), ...(state.party || []), ...(state.battle_party || []), ...((state.pc || {} as TPP.CombinedPCData).boxes || []).reduce((all, b) => [...all, ...b.box_contents], new Array<TPP.Pokemon>())] as TPP.Pokemon[])
                    .filter(p => p && p.original_trainer && p.original_trainer.name == state.name && p.original_trainer.id == state.id && p.species && p.species.id && ((romData.GetSpeciesById(p.species.id) || { name: "" }).name || "").toLowerCase() == "pikachu")
                    // .filter(p => p && p.original_trainer && p.original_trainer.name == state.name && p.original_trainer.id == state.id && p.species && p.species.id && ((romData.GetSpeciesById(p.species.id) || { name: "" }).name || "").toLowerCase() == "cramorant") // Cramorant
                    .forEach(p => p.friendship = state.pikachu_happiness);

            state.name = romData.ConvertText(state.name);
            state.ball_count = countBalls();

            state.level_cap = state.level_cap || romData.GetCurrentLevelCap(state.badges || 0);

            if (state.enemy_trainers) {
                state.enemy_trainers.forEach(augmentEnemyTrainer);
            }
            if (state.enemy_party) {
                state.enemy_party = state.enemy_party.filter(p => !!p);
                state.enemy_party.forEach(p => {
                    // Comment out for randomizers to not leak info
                    let romMon = romData.GetSpecies(p.species.id, p.form);
                    p.species = augmentSpecies(p.species, romMon);

                    //Conceal types for randomizer
                    // if (!state.caught_list.includes(p.species.national_dex)) {
                    //     p.species.type1 = "???";
                    //     p.species.type2 = "???";
                    // }

                    removeInvalidEvos(p as any as TPP.Pokemon);
                    romData.CalculateUnownForm(p);
                });
            }
            if (state.area_id) {
                state.area_name = romData.GetAreaName(state.area_id);
            }
            if (typeof (state.map_id) === "number") {
                state.map_name = romData.GetMap(state.map_id, state.map_bank).name;
            }
            if (state.party && state.party.some(p => !!p && !!p.fitness)) {
                state.party_fitness = state.party_fitness || state.party.reduce((sum, mon) => sum + mon.fitness, 0);
            }
            if (state.last_caught_pokemon && state.last_caught_pokemon.species && state.last_caught_pokemon.species.id) {
                augmentPokemon(state.last_caught_pokemon);
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    function ConcealEgg(mon: TPP.Pokemon) {
        if (mon.is_egg) {
            //no egg spoilers
            mon.species.name = mon.name = "Egg";
            mon.species.type1 = mon.species.type2 = mon.species.growth_rate = "???";
            mon.species.id = mon.species.national_dex = mon.species.catch_rate = mon.species.gender_ratio = 0;
            mon.species.held_items = mon.species.evolutions = mon.species.abilities = mon.moves = [];
            delete mon.gender;
            delete mon.ivs;
            delete (<TPP.PartyPokemon>mon).stats;
            delete mon.evs;
            delete mon.condition;
            delete mon.ability;
            delete mon.next_move;
            delete mon.species.base_stats;
            delete mon.species.egg_type1;
            delete mon.species.egg_type2;
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