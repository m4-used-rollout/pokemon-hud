/// <reference path="../events.ts" />

namespace Events {

    type EnteredMapAction = { type: "Entered Map", id: number, bank?: number; name: string };
    type KnownActions = EnteredMapAction;

    class AreaTracker extends Tracker<KnownActions> {
        private visitedMaps = new Array<{ id: number; bank?: number; name: string, firstVisit: string, numVisits: number }>();

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.map_id != oldState.map_id)
                dispatch({ type: "Entered Map", id: newState.map_id, name: newState.map_name, bank: newState.map_bank });
        }
        public Reducer(action: KnownActions & Timestamp): void {
            const { id, name, bank, timestamp } = action;
            switch (action.type) {
                case "Entered Map":
                    const map = this.visitedMaps.find(m => m.id == id && m.bank == bank);
                    if (!map)
                        this.visitedMaps.push({ id, name, bank, firstVisit: timestamp, numVisits: 1 });
                    else
                        map.numVisits++;
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            this.visitedMaps
                .map(m => ({ name: m.name, time: Date.parse(m.firstVisit) }))
                .sort((a1, a2) => a1.time - a2.time)
                .filter((a, _, arr) => arr.find(a2 => a2.name == a.name) == a)
                .forEach(a => state.events.push({ group: "First Visit", name: a.name, time: new Date(a.time).toISOString() }));

            // //Colosseum
            // state.game_stats = state.game_stats || {};
            // state.game_stats["Motorcycle Trips"] = (this.visitedMaps.find(m => m.id == 19) || { numVisits: 0 }).numVisits;

            // // XD
            // state.game_stats = state.game_stats || {};
            // state.game_stats["Scooter Trips"] = (this.visitedMaps.find(m => m.id == 910) || { numVisits: 0 }).numVisits;

            return state;
        }

    }

    RegisterTracker(AreaTracker);
}