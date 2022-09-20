/// <reference path="../dex.ts" />

namespace Events {

    type KnownActions = CaughtAction | SeenAction;


    class TriHardTracker extends Tracker<KnownActions> {
        private seenPokemon = new Array<number>(); //Handles Pokedex Seen, since the game itself may not keep track
        private ownedPokemon = new Array<number>(); //Handles Pokedex Caught, since the game itself may not keep track

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "First Catch":
                    if (this.ownedPokemon.indexOf(action.dexNum) < 0)
                        this.ownedPokemon.push(action.dexNum);
                    return;
                case "First Seen":
                    if (this.seenPokemon.indexOf(action.dexNum) < 0)
                        this.seenPokemon.push(action.dexNum);
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            // Mix in Pokedex owned/seen
            state.caught_list = [...state.caught_list, ...this.ownedPokemon].filter((d, i, arr) => arr.indexOf(d) == i).sort((d1, d2) => d1 - d2);
            state.caught = state.caught_list.length;
            state.seen_list = [...state.seen_list, ...this.seenPokemon, ...this.ownedPokemon].filter((d, i, arr) => arr.indexOf(d) == i).sort((d1, d2) => d1 - d2);
            state.seen = state.seen_list.length;

            return state;
        }

    }
    //RegisterTracker(TriHardTracker);
}