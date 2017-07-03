/// <reference path="base.ts" />
/// <reference path="../../../ref/runstatus.d.ts" />

namespace RomReader {
    export function AugmentState(romData: RomReaderBase, state: TPP.RunStatus) {
        state.name = romData.ConvertText(state.name);
        state.caught_list = (state.caught_list || []).filter((item, position, arr) => arr.indexOf(item) == position).sort((x, y) => parseInt(x.toString()) - parseInt(y.toString()));
        state.seen_list = (state.seen_list || []).filter((item, position, arr) => arr.indexOf(item) == position).sort((x, y) => parseInt(x.toString()) - parseInt(y.toString()));
        state.caught = state.caught || state.caught_list.length;
        state.seen = state.seen || state.seen_list.length;
        state.ball_count = 0;
        Object.keys(state.items || {}).map(k => state.items[k]).filter(i => i && i.length)
            .forEach(itemList => itemList.filter(i => !!i).forEach(item => {
                state.ball_count += romData.ItemIsBall(item.id) ? item.count : 0;
                let romItem = romData.GetItem(item.id);
                item.name = item.name || romItem.name;
                item.count = romItem.isKeyItem && item.count == 1 ? null : item.count;
                if (!item.count)
                    delete item.count;
            }));
        if (state.items && state.items.balls && !state.ball_count) {
            state.ball_count = state.items.balls.reduce<number>((sum, i) => i.count + sum, 0);
        }

        function augmentPokemon(p: TPP.Pokemon) {
            p.name = romData.ConvertText(p.name);
            if (p.personality_value) {
                p.personality_value = p.personality_value >>> 0; //make sure pv is an unsigned 32-bit int
            }
            if (p.original_trainer) {
                p.original_trainer.name = romData.ConvertText(p.original_trainer.name);
            }
            if (p.met) {
                p.met.area_name = romData.GetMap(p.met.area_id || p.met.map_id).name;
                if (typeof p.met.caught_in !== "string") {
                    p.met.caught_in = romData.GetItem(parseInt(p.met.caught_in)).name;
                }
            }
            if (p.held_item) {
                p.held_item.name = romData.GetItem(p.held_item.id).name;
            }
            let romMon = romData.GetSpecies(p.species.id);
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
            p.species.name = p.species.name || romMon.name;
            p.species.national_dex = p.species.national_dex || romMon.dexNumber;
            p.species.type1 = p.species.type1 || romMon.type1;
            p.species.type2 = p.species.type2 || romMon.type2;
            p.species.egg_cycles = p.species.egg_cycles || romMon.eggCycles;
            p.species.growth_rate = p.species.growth_rate || romMon.growth_rate;
            if (typeof p.shiny !== "boolean" && p.original_trainer) {
                p.shiny = ((p.original_trainer.id ^ p.original_trainer.secret) ^ (Math.floor(p.personality_value / 65536) ^ (p.personality_value % 65536))) < 8;
            }
            if (!p.level) {
                p.level = Pokemon.ExpCurve.ExpToLevel(p.experience.current, romMon.expFunction);
            }
            p.experience.next_level = p.experience.next_level || (p.level == 100 ? 0 : romMon.expFunction(p.level + 1));
            p.experience.this_level = p.experience.this_level || romMon.expFunction(p.level);
            p.experience.remaining = p.experience.next_level - p.experience.current;
            p.moves.filter(m => !!m).forEach(m => {
                let romMove = romData.GetMove(m.id);
                m.name = m.name || romMove.name;
                m.accuracy = m.accuracy || romMove.accuracy;
                m.base_power = m.base_power || romMove.basePower;
                m.type = m.type || romMove.type;
            });
            if (p.is_egg) {
                //no egg spoilers
                p.ability = p.species.type1 = p.species.type2 = p.species.growth_rate = "???";
                p.species.id = p.species.national_dex = 0;
                p.species.name = p.name = "Egg";
                p.moves = [];
                delete p.ivs;
                delete (<TPP.PartyPokemon>p).stats;
                delete p.evs;
                delete p.condition;
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

        (state.party || []).filter(p => !!p).map(augmentPartyPokemon).forEach(augmentPokemon);
        (state.pc.boxes || []).forEach(b => (b.box_contents || []).filter(p => !!p).forEach(augmentPokemon));

        state.area_name = romData.GetMap(state.area_id || state.map_id).name;
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