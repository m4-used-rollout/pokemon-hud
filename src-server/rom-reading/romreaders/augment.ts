/// <reference path="base.ts" />
/// <reference path="../../../ref/runstatus.d.ts" />

namespace RomReader {
    export function AugmentState(romData:RomReaderBase, state:TPP.RunStatus) {
        state.name = romData.ConvertText(state.name);
        state.caught = (state.caught_list || []).length;
        state.seen = (state.seen_list || []).length;
        state.ball_count = 0;
        [state.items, state.items_ball, state.items_berry, state.items_free_space, state.items_key, state.items_medicine, state.items_tm, state.pc_items]
            .filter(i => i && i.length)
            .forEach(itemList => itemList.filter(i => !!i).forEach(item => {
                state.ball_count += romData.ItemIsBall(item.id) ? item.count : 0;
                let romItem = romData.GetItem(item.id);
                item.name = item.name || romItem.name;
                item.count = romItem.isKeyItem && item.count == 1 ? null : item.count;
                if (!item.count)
                    delete item.count;
            }));
        (state.pc.boxes || []).map(b => b.box_contents).reduce((arr: TPP.Pokemon[], val: TPP.Pokemon[]) => val, state.party || []).filter(p => !!p).forEach(p => {
            p.name = romData.ConvertText(p.name);
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
            p.species.growth_rate = p.species.growth_rate || (romMon.expFunction.name || "").replace(/([A-Z])/g, " $1").trim();
            if (!p.level) {
                p.level = Pokemon.ExpCurve.ExpToLevel(p.experience.current, romMon.expFunction);
            }
            p.experience.next_level = p.experience.next_level || p.level == 100 ? 0 : romMon.expFunction(p.level + 1);
            p.experience.this_level = p.experience.this_level || romMon.expFunction(p.level);
            p.experience.remaining = p.experience.next_level - p.experience.current;
            p.moves.filter(m => !!m).forEach(m => {
                let romMove = romData.GetMove(m.id);
                m.name = m.name || romMove.name;
                m.accuracy = m.accuracy || romMove.accuracy;
                m.base_power = m.base_power || romMove.basePower;
                m.type = m.type || romMove.type;
            });
        });
        state.area_name = romData.GetMap(state.area_id || state.map_id).name;
    }

}