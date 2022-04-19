/// <reference path="../events.ts" />

namespace Events {

    type CaughtAction = { type: "First Catch", dexNum: number, species: string };
    type SeenAction = { type: "First Seen", dexNum: number, species: string };
    type KnownActions = CaughtAction | SeenAction;


    class DexTracker extends Tracker<KnownActions> {
        private firstCatches = new Array<TPP.Event>();

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.caught != oldState.caught)
                newState.caught_list.filter(n => oldState.caught_list.indexOf(n) < 0)
                    .forEach(n => dispatch({ type: "First Catch", dexNum: n, species: (this.romData.GetSpeciesByDexNumber(n) || { name: "???" }).name }));
            if (newState.seen != oldState.seen)
                newState.seen_list.filter(n => oldState.seen_list.indexOf(n) < 0)
                    .forEach(n => dispatch({ type: "First Seen", dexNum: n, species: (this.romData.GetSpeciesByDexNumber(n) || { name: "???" }).name }));

        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "First Catch":
                    if (!this.firstCatches.find(c => (c as any as CaughtAction).dexNum == action.dexNum))
                        this.firstCatches.push({ group: "First Catch", name: action.species, dexNum: action.dexNum, time: action.timestamp } as TPP.Event);
                    return;
            }
        }

        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            state.events.push(...this.firstCatches);
            return state;
        }

    }

    RegisterTracker(DexTracker);
}