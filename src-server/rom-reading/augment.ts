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
            augmentPokemonMet(p);
            augmentPokemonSpeciesAndExp(p);
            augmentPokemonMoves(p);
            calculatePokemonAbilityNatureCharacteristic(p);
            calculateShiny(p);
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

        function augmentPokemonMoves(p: TPP.Pokemon) {
            p.moves.filter(m => !!m).forEach(m => {
                let romMove = romData.GetMove(m.id);
                m.name = m.name || romMove.name;
                m.accuracy = m.accuracy || romMove.accuracy;
                m.base_power = m.base_power || romMove.basePower;
                m.type = m.type || romMove.type;
            });
        }

        function augmentPokemonSpeciesAndExp(p: TPP.Pokemon) {
            let romMon = romData.GetSpecies(p.species.id);
            p.species.name = p.species.name || romMon.name;
            p.species.national_dex = p.species.national_dex || romMon.dexNumber;
            p.species.type1 = p.species.type1 || romMon.type1;
            p.species.type2 = p.species.type2 || romMon.type2;
            p.species.egg_cycles = p.species.egg_cycles || romMon.eggCycles;
            p.species.growth_rate = p.species.growth_rate || romMon.growthRate;
            if (romMon.expFunction) {
                if (!p.level) {
                    p.level = Pokemon.ExpCurve.ExpToLevel(p.experience.current, romMon.expFunction);
                }
                p.experience.next_level = p.experience.next_level || (p.level == 100 ? 0 : romMon.expFunction(p.level + 1));
                p.experience.this_level = p.experience.this_level || romMon.expFunction(p.level);
                p.experience.remaining = p.experience.next_level - p.experience.current;
            }
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

        normalizeDex();
        augmentItems();
        (state.party || []).filter(p => !!p).map(augmentPartyPokemon).forEach(augmentPokemon);
        (state.pc.boxes || []).forEach(b => (b.box_contents || []).filter(p => !!p).forEach(augmentPokemon));

        state.name = romData.ConvertText(state.name);
        state.ball_count = countBalls();

        state.level_cap = romData.GetCurrentLevelCap(state.badges || 0);

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
            mon.ability = mon.species.type1 = mon.species.type2 = mon.species.growth_rate = "???";
            mon.species.id = mon.species.national_dex = 0;
            mon.species.name = mon.name = "Egg";
            mon.moves = [];
            delete mon.ivs;
            delete (<TPP.PartyPokemon>mon).stats;
            delete mon.evs;
            delete mon.condition;
        }
    }

    function DeDupe(array: number[]) {
        return (array || []).filter((item, position, arr) => arr.indexOf(item) == position).sort((x, y) => parseInt(x.toString()) - parseInt(y.toString()));
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