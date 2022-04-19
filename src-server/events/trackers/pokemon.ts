/// <reference path="../events.ts" />
/// <reference path="../../pokemon/convert.ts" />


namespace Events {

    export type CaughtPokemonAction = { type: "Caught Pokemon", pv: number, dexNum: number, species: string, name: string, level: number, isShadow?: boolean, caughtIn?: string, otId?: string, mon: TPP.Pokemon };
    type EvolvedPokemonAction = { type: "Evolved Pokemon", pv: number, dexNum: number, species: string, name: string, level: number, mon: TPP.Pokemon };
    type RenamedPokemonAction = { type: "Renamed Pokemon", pv: number, dexNum: number, species: string, newName: string, oldName: string, mon: TPP.Pokemon };
    type MissingPokemonAction = { type: "Missing Pokemon", pv: number, dexNum: number, species: string, name: string };
    type RecoveredPokemonAction = { type: "Recovered Pokemon", pv: number, dexNum: number, species: string, name: string, level: number, mon: TPP.Pokemon };
    type PurifiedPokemonAction = { type: "Purified Pokemon", pv: number, dexNum: number, species: string, name: string, level: number, mon: TPP.Pokemon };
    type CaughtPokerusAction = { type: "Caught Pokerus", pv: number, dexNum: number, species: string, name: string, mon: TPP.Pokemon };
    type PokerusCuredAction = { type: "Cured of Pokerus", pv: number, dexNum: number, species: string, name: string, mon: TPP.Pokemon };
    type LevelUpAction = { type: "Pokemon Leveled Up", pv: number, dexNum: number, species: string, name: string, level: number, mon: TPP.Pokemon };
    type KnownActions = CaughtPokemonAction | EvolvedPokemonAction | RenamedPokemonAction | MissingPokemonAction | RecoveredPokemonAction | PurifiedPokemonAction | CaughtPokerusAction | PokerusCuredAction | LevelUpAction;

    interface KnownPokemon {
        pv: number;
        dexNums: number[];
        species: string[];
        name: string;
        status: "Fine" | "Missing";
        caught: string;
        evolved: string[];
        level: number;
        caughtAt: number;
        missingSince?: string;
        pkrs?: boolean;
        cured?: boolean;
        isShadow?: boolean;
        caughtIn?: string;
        otId?: string;
        data: TPP.Pokemon;
    }

    export const AllMons = (state: TPP.RunStatus) => [
        ...(state.party || []),
        ...(state.daycare || []),
        ...((state.pc || { boxes: [] as TPP.BoxData[] }).boxes || []).filter(b => b && b.box_number > 0).reduce((all, box) => [...all, ...(box.box_contents || [])], [] as TPP.Pokemon[])
    ].filter(p => !!p);

    const DexNum = (mon: TPP.Pokemon) => ((mon || { species: null as typeof mon.species }).species || { national_dex: null as number }).national_dex;

    export class PokemonTracker extends Tracker<KnownActions> {

        public static knownPokemon: { [key: number]: KnownPokemon } = {};
        private pokerus = new Array<CaughtPokerusAction & Timestamp>();

        constructor(config: Config, romData: RomReader.RomReaderBase) {
            super(config, romData);
            PokemonTracker.knownPokemon = {};
        }

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            const seen = new Array<string>();
            AllMons(oldState).filter(mon => mon && mon.personality_value).forEach(mon => {
                const pv = mon.personality_value;
                const known = PokemonTracker.knownPokemon[pv]
                const dexNum = DexNum(mon);
                const species = (mon.species || { name: "???" }).name;
                const name = mon.name;
                const level = mon.level;
                const isShadow = (mon as TPP.ShadowPokemon).is_shadow;
                const caughtIn = (mon.met || {} as typeof mon.met).caught_in;
                const otId = (mon.original_trainer && mon.original_trainer.id || newState.id || "?????").toString();
                seen.push(pv.toString());
                if (!known) {
                    // this.PotentialNewCatch(dexNum, oldState); //trigger it here so it doesn't trigger on replays
                    return dispatch({ type: "Caught Pokemon", pv, dexNum, species, name, level, isShadow, caughtIn, otId, mon });
                }
                else if (known.dexNums.indexOf(dexNum) < 0) {
                    // this.PotentialNewCatch(dexNum, oldState); //trigger it here so it doesn't trigger on replays
                    dispatch({ type: "Evolved Pokemon", pv, dexNum, species, name, level, mon });
                }
                else if (known.level != mon.level)
                    dispatch({ type: "Pokemon Leveled Up", pv, dexNum, species, name, level, mon })
                else if (known.name != name)
                    dispatch({ type: "Renamed Pokemon", pv, dexNum, species, newName: name, oldName: known.name, mon });
                if (known.status == "Missing")
                    dispatch({ type: "Recovered Pokemon", pv, dexNum, species, name, level, mon });
                if (known.isShadow && !isShadow)
                    dispatch({ type: "Purified Pokemon", pv, dexNum, species, name, level, mon });
                if (mon.pokerus && mon.pokerus.infected && !known.pkrs)
                    dispatch({ type: "Caught Pokerus", pv, dexNum, species, name, mon });
                if (mon.pokerus && mon.pokerus.cured && !known.cured)
                    dispatch({ type: "Caught Pokerus", pv, dexNum, species, name, mon });
            });
            if (newState.party && newState.daycare && newState.pc && newState.pc.boxes && newState.pc.boxes.every(b => !!b)) //only alert missing pokemon when all pokemon sinks have reported in
                Object.keys(PokemonTracker.knownPokemon).filter(k => seen.indexOf(k) < 0).map(k => PokemonTracker.knownPokemon[k] as KnownPokemon)
                    .forEach(p => p.status == "Fine" && dispatch({ type: "Missing Pokemon", pv: p.pv, dexNum: p.dexNums.map(d => d).pop(), species: p.species.map(s => s).pop(), name: p.name }));
        }
        public Reducer(action: KnownActions & Timestamp): void {
            if (!action.pv || action.species == "??????????")
                return;
            const { pv, dexNum, species, level, isShadow, caughtIn, otId } = (action as CaughtPokemonAction);
            const name = (action as RenamedPokemonAction).oldName || (action as CaughtPokemonAction).name;
            const time = action.timestamp;
            const mon = PokemonTracker.knownPokemon[pv] = PokemonTracker.knownPokemon[pv] || { pv, dexNums: [dexNum], species: [species], name, caught: null, evolved: [], status: "Fine", level, caughtAt: level, isShadow, caughtIn, otId, data: (action as CaughtPokemonAction).mon };
            mon.data = (action as CaughtPokemonAction).mon || mon.data;
            mon.level = typeof (action as CaughtPokemonAction).level === "number" ? (action as CaughtPokemonAction).level : mon.level;
            switch (action.type) {
                case "Caught Pokemon":
                    mon.caught = time;
                    return;
                case "Evolved Pokemon":
                    mon.dexNums.push(dexNum);
                    mon.species.push(species);
                    mon.evolved.push(time);
                    return;
                case "Renamed Pokemon":
                    mon.name = action.newName;
                    return;
                case "Missing Pokemon":
                    mon.status = "Missing";
                    mon.missingSince = time;
                    return;
                case "Recovered Pokemon":
                    delete mon.missingSince;
                    mon.status = "Fine";
                    return;
                case "Purified Pokemon":
                    mon.isShadow = false;
                    return;
                case "Caught Pokerus":
                    mon.pkrs = true;
                    this.pokerus.push(action);
                    return;
                case "Cured of Pokerus":
                    mon.cured = true;
                    return;
                default:
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            const knowns = Object.keys(PokemonTracker.knownPokemon).map(k => PokemonTracker.knownPokemon[k] as KnownPokemon)
            // state.caught_list = knowns
            //     .reduce((dex, mon) => [...dex, ...mon.dexNums], new Array<number>())
            //     .filter((d, i, arr) => arr.indexOf(d) == i) // de-dupe
            //     .sort((d1, d2) => d1 - d2);
            // state.caught = state.caught_list.length;
            // state.seen_list = state.seen_list || state.caught_list;
            // state.caught_list.forEach(c => state.seen_list.indexOf(c) < 0 && state.seen_list.unshift(c));
            // state.seen = state.seen_list.length;
            AllMons(state).forEach(mon => {
                if (mon) {
                    const known = PokemonTracker.knownPokemon[mon.personality_value];
                    if (known) {
                        mon.met = mon.met || {} as typeof mon.met;
                        mon.met.caught = known.caught;
                        mon.met.evolved = known.evolved;
                    }
                }
            });
            const firstCaught = new Array<{ time: number, dexNum: number, species: string, otId?: string }>();
            knowns.forEach(k => k.dexNums.forEach((d, i) => firstCaught.push({ dexNum: d, species: k.species[i], time: Date.parse(i ? k.evolved[i - 1] : k.caught), otId: k.otId })));
            firstCaught.sort((c1, c2) => c1.time - c2.time)
                .filter((c, _, arr) => arr.find(f => f.dexNum == c.dexNum) == c)
                .forEach(c => state.events.push({ group: "Pokemon", name: c.species, time: new Date(c.time).toISOString(), traded: state.id && c.otId && state.id.toString() != c.otId || undefined } as TPP.Event));
            state.game_stats = state.game_stats || {};
            state.game_stats["Pokémon Caught"] = knowns.length;
            delete state.game_stats["Pokémon Caught While Fishing"];
            knowns.map(k => k.caughtIn).filter((c, i, arr) => c && arr.indexOf(c) == i)
                .forEach(ball => state.game_stats[`Pokémon Caught in a ${ball}`] = knowns.filter(k => k.caughtIn == ball).length);

            this.pokerus.forEach(pkrs => state.events.push({ group: "Caught Pokerus", name: pkrs.name, time: pkrs.timestamp }));

            // if (state.pc && state.pc.boxes) {
            //     const missingBox = state.pc.boxes.find(b => b.box_number === 0) || { box_contents: [], box_name: "The Lost", box_number: 0 };
            //     missingBox.box_contents = [];
            //     missingBox.box_contents = knowns.filter(k => k.status == "Missing" && !state.pc.boxes.some(b => b.box_contents.some(p => p.personality_value == k.pv))).map(m => ({
            //         personality_value: m.pv,
            //         name: m.name,
            //         moves: [],
            //         species: { national_dex: m.dexNums.filter(d => d).pop(), name: m.species.filter(s => s).pop() },
            //     } as any as TPP.BoxedPokemon));
            //     if (state.pc.boxes.indexOf(missingBox) < 0 && missingBox.box_contents.length > 0)
            //         state.pc.boxes.unshift(missingBox);
            // }

            return state;
        }

        // private PotentialNewCatch(dexNum: number, state: TPP.RunStatus) {
        //     if (state.caught_list.indexOf(dexNum) < 0)
        //         TPP.Server.NewCatch(dexNum);
        // }

    }
    RegisterTracker(PokemonTracker);
}