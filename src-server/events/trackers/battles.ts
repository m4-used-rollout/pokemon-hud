/// <reference path="../events.ts" />

namespace Events {

    type BattleAction = { type: "Started Battle", kind: string, wildOpponents?: string[] };
    type KnownActions = BattleAction;


    class BattleTracker extends Tracker<KnownActions> {
        private battles = 0;
        private lastBattle: string;

        private blackoutEvents: TPP.Event[] = [];

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.in_battle && !oldState.in_battle)
                dispatch({ type: "Started Battle", kind: newState.battle_kind, wildOpponents: newState.battle_kind == "Wild" ? (newState.enemy_party || []).map(e => e.name) : undefined });
        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "Started Battle":
                    this.battles++;
                    this.lastBattle = action.timestamp;
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            state.game_stats = state.game_stats || {};
            state.game_stats["Battles Fought (Total)"] = this.battles;
            return state;
        }

    }

    RegisterTracker(BattleTracker);
}