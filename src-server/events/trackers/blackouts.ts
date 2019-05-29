/// <reference path="../events.ts" />

namespace Events {

    export type BlackoutAction = { type: "Blackout" };
    type KnownActions = BlackoutAction;

    export const PartyIsFainted = (party: { health: number[] }[]) => !(party || []).some(p => p && p.health && p.health[0] > 0);

    class BlackoutTracker extends Tracker<KnownActions> {
        private blackouts: number;
        private lastBlackout: string;

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (PartyIsFainted(newState.party) && !PartyIsFainted(oldState.party))
                dispatch({ type: "Blackout" });
        }
        public Reducer(action: BlackoutAction & Timestamp): void {
            switch (action.type) {
                case "Blackout":
                    this.blackouts++;
                    this.lastBlackout = action.timestamp;
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            state.blackouts = this.blackouts;
            return state;
        }

    }

    RegisterTracker(BlackoutTracker);
}