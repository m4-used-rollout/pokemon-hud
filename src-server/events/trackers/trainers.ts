/// <reference path="./blackouts.ts" />

namespace Events {

    export type ChallengedTrainerAction = { type: "Challenged Trainer"; id: number; classId?: number; name: string; trainerString?: string };
    export type DefeatedTrainerAction = { type: "Defeated Trainer"; id: number; classId?: number; name: string; trainerString?: string };

    type KnownActions = BlackoutAction | ChallengedTrainerAction | DefeatedTrainerAction;

    type EncounteredTrainer = { id: number, classId?: number, name: string, trainerString?: string; endeavors: Endeavor[] };
    type Endeavor = { challenged: string; attempts: number; defeated?: string; }

    function LastTry(trainer: EncounteredTrainer) {
        return trainer.endeavors.map(e => e).pop();
    }

    class TrainerTracker extends Tracker<KnownActions> {

        private encounteredTrainers = new Array<EncounteredTrainer>();
        private currentTrainer: EncounteredTrainer;
        private trainerDebounce = false;

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.in_battle
                && newState.battle_kind == "Trainer"
                && newState.enemy_trainers
                && newState.enemy_trainers.length > 0
                && !PartyIsFainted(newState.battle_party)
                && !PartyIsFainted(newState.enemy_party)
            )
                newState.enemy_trainers
                    .filter(t => !this.currentTrainer || t.id != this.currentTrainer.id)
                    .forEach(t => dispatch({ type: "Challenged Trainer", id: t.id, classId: t.class_id, trainerString: t.trainer_string, name: `${t.class_name || ""} ${t.name}`.trim() }));
            else if (PartyIsFainted(newState.enemy_party)
                && !PartyIsFainted(oldState.enemy_party)
            ) {
                // if (newState.enemy_trainers && newState.enemy_trainers.length)
                //     newState.enemy_trainers.forEach(t => dispatch({ type: "Defeated Trainer", id: t.id, name: `${t.class_name || ""} ${t.name}`.trim() }));
                //else
                if (this.currentTrainer)
                    dispatch({ type: "Defeated Trainer", id: this.currentTrainer.id, classId: this.currentTrainer.classId, name: this.currentTrainer.name, trainerString: this.currentTrainer.trainerString });
            }
        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "Challenged Trainer":
                    if (this.trainerDebounce) return;
                    if (this.currentTrainer) { //erroneous challenge?
                        let lastTry = LastTry(this.currentTrainer);
                        if (lastTry && !lastTry.defeated) {
                            lastTry.attempts--;
                            if (lastTry.attempts <= 0) {
                                this.currentTrainer.endeavors.pop();
                            }
                        }
                    }
                    this.currentTrainer = this.encounteredTrainers.filter(t => t.id == action.id).pop();
                    if (!this.currentTrainer)
                        this.encounteredTrainers.push(this.currentTrainer = { id: action.id, classId: action.classId, name: action.name, endeavors: [] });
                    let lastTry = LastTry(this.currentTrainer);
                    if (!lastTry || lastTry.defeated)
                        this.currentTrainer.endeavors.push(lastTry = { challenged: action.timestamp, attempts: 0 });
                    lastTry.attempts++;
                    return;
                case "Defeated Trainer":
                    if (this.trainerDebounce) return;
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
                    this.trainerDebounce = true;
                    return;
            }
            this.trainerDebounce = false;
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            const defeated = this.encounteredTrainers.filter(t => t.endeavors.some(e => !!e.defeated));
            state.game_stats = state.game_stats || {};
            state.game_stats["Trainer Battles Won"] = defeated.reduce((sum, t) => t.endeavors.filter(e => !!e.defeated).length + sum, 0);


            const goalTrainerIds = new Array<number>();
            const goalTrainerClasses = new Array<number>();

            function isGoalTrainer(id: number, classId: number) {
                if (!goalTrainerIds.length)
                    return true;
                if (!goalTrainerClasses.length)
                    return goalTrainerIds.indexOf(id) >= 0;
                return goalTrainerIds.indexOf(id) >= 0 && goalTrainerIds.indexOf(id) == goalTrainerClasses.indexOf(classId);
            }

            const trainerGoals = (this.config.goals || []).find(g => g.goalType == "Trainers") as TrainerHitListConfig;
            if (trainerGoals) {
                goalTrainerIds.push(
                    ...(trainerGoals.requiredTrainerIds || []),
                    ...(trainerGoals.finalTrainerIds || []),
                    ...(trainerGoals.optionalTrainerIds || []),
                    ...(trainerGoals.extraTrackedTrainerIds || [])
                );
                goalTrainerClasses.push(
                    ...(trainerGoals.requiredTrainerClasses || []),
                    ...(trainerGoals.finalTrainerClasses || []),
                    ...(trainerGoals.optionalTrainerClasses || []),
                    ...(trainerGoals.extraTrackedTrainerClasses || [])
                );
            }

            this.encounteredTrainers
                .filter(t => isGoalTrainer(t.id, t.classId))
                .forEach(t => t.endeavors
                    .forEach(e => state.events.push({ group: e.defeated ? "Trainers Defeated" : "Trainers Undefeated", id: t.id, class_id: t.classId, name: t.name, time: e.defeated || e.challenged, attempts: e.attempts } as TPP.TrainerEvent))
                );
            return state;
        }
    }

    RegisterTracker(TrainerTracker);
}