/// <reference path="../dex.ts" />

namespace Events {

    type KnownActions = DefeatedTrainerAction;

    const trackedTrainers = [
        // Dresco Trainer House
        8, 9, 10, 11, 12, 451
    ]

    class UnboundTracker extends Tracker<KnownActions> {

        private trainerDefeats: Record<string, { id: number, classId?: number, name: string, className?: string, count: number }> = {};

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
        }

        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "Defeated Trainer":
                    if (trackedTrainers.includes(action.id))
                        this.trainerDefeats[action.name] = {
                            id: action.id,
                            classId: action.classId,
                            name: action.name,
                            className: action.name,
                            count: (this.trainerDefeats[action.name] || { count: 0 }).count + 1
                        };
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            const game_stats = state.game_stats = state.game_stats || {};
            Object.values(this.trainerDefeats).forEach(td => !!td.count && (game_stats[`Wins against ${td.name}`] = td.count));
            return state;
        }

    }
    RegisterTracker(UnboundTracker);
}