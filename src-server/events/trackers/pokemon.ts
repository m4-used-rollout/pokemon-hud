/// <reference path="../events.ts" />

namespace Events {

    type CaughtPokemonAction = { type: "Caught Pokemon", pv: number, dexNum: number, species: string, name: string, isShadow?: boolean; caughtIn?: string; };
    type EvolvedPokemonAction = { type: "Evolved Pokemon", pv: number, dexNum: number, species: string, name: string };
    type RenamedPokemonAction = { type: "Renamed Pokemon", pv: number, dexNum: number, species: string, newName: string, oldName: string };
    type MissingPokemonAction = { type: "Missing Pokemon", pv: number, dexNum: number, species: string, name: string };
    type RecoveredPokemonAction = { type: "Recovered Pokemon", pv: number, dexNum: number, species: string, name: string };
    type PurifiedPokemonAction = { type: "Purified Pokemon", pv: number, dexNum: number, species: string, name: string };
    type KnownActions = CaughtPokemonAction | EvolvedPokemonAction | RenamedPokemonAction | MissingPokemonAction | RecoveredPokemonAction | PurifiedPokemonAction;

    type KnownPokemon = { pv: number; dexNums: number[]; species: string[]; name: string; status: "Fine" | "Missing"; caught: string; evolved: string[]; isShadow?: boolean; caughtIn?: string; }

    export const AllMons = (state: TPP.RunStatus) => [
        ...(state.party || []),
        ...(state.daycare || []),
        ...((state.pc || { boxes: [] as TPP.BoxData[] }).boxes || []).reduce((all, box) => [...all, ...(box.box_contents || [])], [] as TPP.Pokemon[])
    ].filter(p => !!p);

    const DexNum = (mon: TPP.Pokemon) => ((mon || { species: null as typeof mon.species }).species || { national_dex: null as number }).national_dex;

    class PokemonTracker extends Tracker<KnownActions> {

        private knownPokemon: { [key: number]: KnownPokemon } = {};

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            const seen = new Array<string>();
            AllMons(oldState).forEach(mon => {
                const pv = mon.personality_value;
                const known = this.knownPokemon[pv]
                const dexNum = DexNum(mon);
                const species = (mon.species || { name: "???" }).name;
                const name = mon.name;
                const isShadow = (mon as TPP.ShadowPokemon).is_shadow;
                const caughtIn = (mon.met || {} as typeof mon.met).caught_in;
                seen.push(pv.toString());
                if (!known) {
                    this.PotentialNewCatch(dexNum); //trigger it here so it doesn't trigger on replays
                    return dispatch({ type: "Caught Pokemon", pv, dexNum, species, name, isShadow, caughtIn });
                }
                else if (known.dexNums.indexOf(dexNum) < 0)
                    dispatch({ type: "Evolved Pokemon", pv, dexNum, species, name });
                else if (known.name != name)
                    dispatch({ type: "Renamed Pokemon", pv, dexNum, species, newName: name, oldName: known.name });
                if (known.status == "Missing")
                    dispatch({ type: "Recovered Pokemon", pv, dexNum, species, name });
                if (known.isShadow && !isShadow)
                    dispatch({ type: "Purified Pokemon", pv, dexNum, species, name });
            });
            if (newState.party && newState.daycare && newState.pc && newState.pc.boxes && newState.pc.boxes.every(b => !!b)) //only alert missing pokemon when all pokemon sinks have reported in
                Object.keys(this.knownPokemon).filter(k => seen.indexOf(k) < 0).map(k => this.knownPokemon[k] as KnownPokemon)
                    .forEach(p => p.status == "Fine" && dispatch({ type: "Missing Pokemon", pv: p.pv, dexNum: p.dexNums.map(d => d).pop(), species: p.species.map(s => s).pop(), name: p.name }));
        }
        public Reducer(action: KnownActions & Timestamp): void {
            if (!action.pv)
                return;
            const { pv, dexNum, species, isShadow, caughtIn } = (action as CaughtPokemonAction);
            const name = (action as RenamedPokemonAction).oldName || (action as CaughtPokemonAction).name;
            const time = action.timestamp;
            const mon = this.knownPokemon[pv] = this.knownPokemon[pv] || { pv, dexNums: [dexNum], species: [species], name, caught: null, evolved: [], status: "Fine", isShadow, caughtIn };
            switch (action.type) {
                case "Caught Pokemon":
                    mon.caught = time;
                    break;
                case "Evolved Pokemon":
                    mon.dexNums.push(dexNum);
                    mon.species.push(species);
                    mon.evolved.push(time);
                    break;
                case "Renamed Pokemon":
                    mon.name = action.newName;
                    break;
                case "Missing Pokemon":
                    mon.status = "Missing";
                    break;
                case "Recovered Pokemon":
                    mon.status = "Fine";
                    break;
                case "Purified Pokemon":
                    mon.isShadow = false;
                default:
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            const knowns = Object.keys(this.knownPokemon).map(k => this.knownPokemon[k] as KnownPokemon)
            state.caught_list = knowns
                .reduce((dex, mon) => [...dex, ...mon.dexNums], new Array<number>())
                .filter((d, i, arr) => arr.indexOf(d) == i) // de-dupe
                .sort((d1, d2) => d1 - d2);
            state.caught = state.caught_list.length;
            state.seen_list = state.seen_list || state.caught_list;
            state.caught_list.forEach(c => state.seen_list.indexOf(c) < 0 && state.seen_list.unshift(c));
            state.seen = state.seen_list.length;
            AllMons(state).forEach(mon => {
                if (mon) {
                    const known = this.knownPokemon[mon.personality_value];
                    if (known) {
                        mon.met = mon.met || {} as typeof mon.met;
                        mon.met.caught = known.caught;
                        mon.met.evolved = known.evolved;
                    }
                }
            });
            const firstCaught = new Array<{ time: number, dexNum: number, species: string }>();
            knowns.forEach(k => k.dexNums.forEach((d, i) => firstCaught.push({ dexNum: d, species: k.species[i], time: Date.parse(i ? k.evolved[i - 1] : k.caught) })));
            firstCaught.sort((c1, c2) => c1.time - c2.time)
                .filter((c, _, arr) => arr.find(f => f.dexNum == c.dexNum) == c)
                .forEach(c => state.events.push({ group: "Pokemon", name: c.species, time: new Date(c.time).toISOString() }));
            state.game_stats = state.game_stats || {};
            state.game_stats["Pokémon Caught"] = knowns.length;
            knowns.map(k => k.caughtIn).filter((c, i, arr) => c && arr.indexOf(c) == i)
                .forEach(ball => state.game_stats[`Pokémon Caught in a ${ball}`] = knowns.filter(k => k.caughtIn == ball).length);
            return state;
        }

        private caught = new Array<number>();
        private PotentialNewCatch(dexNum: number) {
            if (this.caught.indexOf(dexNum) < 0)
                TPP.Server.NewCatch(dexNum);
            this.caught.push(dexNum);
        }

    }
    RegisterTracker(PokemonTracker);
}