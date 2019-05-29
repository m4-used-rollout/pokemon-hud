/// <reference path="./blackouts.ts" />

namespace Events {

    type ChallengedTrainerAction = { type: "Challenged Trainer", id: number, name: string };
    type DefeatedTrainerAction = { type: "Defeated Trainer", id: number, name: string };

    type KnownActions = BlackoutAction | ChallengedTrainerAction | DefeatedTrainerAction;

    type EncounteredTrainer = { id: number, name: string, endeavors: Endeavor[] };
    type Endeavor = { challenged: string; attempts: number; defeated?: string; }

    function LastTry(trainer: EncounteredTrainer) {
        return trainer.endeavors.map(e => e).pop();
    }

    class TrainerTracker extends Tracker<KnownActions> {

        private encounteredTrainers = new Array<EncounteredTrainer>();
        private currentTrainer: EncounteredTrainer;

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.in_battle
                && !oldState.in_battle
                && newState.battle_kind == "Trainer"
                && newState.enemy_trainers
                && newState.enemy_trainers.length > 0
                && !PartyIsFainted(newState.enemy_party)
            )
                newState.enemy_trainers.forEach(t => dispatch({ type: "Challenged Trainer", id: t.id, name: `${t.class_name || ""} ${t.name}`.trim() }));
            else if (PartyIsFainted(newState.enemy_party)
                && !PartyIsFainted(oldState.enemy_party)
            ) {
                if (newState.enemy_trainers && newState.enemy_trainers.length)
                    newState.enemy_trainers.forEach(t => dispatch({ type: "Defeated Trainer", id: t.id, name: `${t.class_name || ""} ${t.name}`.trim() }));
                else if (this.currentTrainer)
                    dispatch({ type: "Defeated Trainer", id: this.currentTrainer.id, name: this.currentTrainer.name });
            }
        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "Challenged Trainer":
                    this.currentTrainer = this.encounteredTrainers.filter(t => t.id == action.id).pop();
                    if (!this.currentTrainer)
                        this.encounteredTrainers.push(this.currentTrainer = { id: action.id, name: action.name, endeavors: [] });
                    let lastTry = LastTry(this.currentTrainer);
                    if (!lastTry || lastTry.defeated)
                        this.currentTrainer.endeavors.push(lastTry = { challenged: action.timestamp, attempts: 0 });
                    lastTry.attempts++;
                    return;
                case "Defeated Trainer":
                    if (!this.currentTrainer || this.currentTrainer.id != action.id)
                        this.currentTrainer = this.encounteredTrainers.filter(t => t.id == action.id).pop() || this.currentTrainer;
                    if (this.currentTrainer) {
                        let lastTry = LastTry(this.currentTrainer);
                        if (!lastTry)
                            this.currentTrainer.endeavors.push(lastTry = { challenged: null, attempts: null, defeated: null });
                        lastTry.defeated = action.timestamp;
                    }
                //Fallthrough
                case "Blackout":
                    this.currentTrainer = null;
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            const defeated = this.encounteredTrainers.filter(t => t.endeavors.some(e => !!e.defeated));
            state.battles_won = defeated.reduce((sum, t) => t.endeavors.filter(e => !!e.defeated).length + sum, 0);
            defeated.forEach(t => t.endeavors.filter(e => !!e.defeated).forEach(e => state.events.push({ group: "Trainers", name: t.name, time: e.defeated, attempts: e.attempts })));
            return state;
        }
    }

    RegisterTracker(TrainerTracker);
}