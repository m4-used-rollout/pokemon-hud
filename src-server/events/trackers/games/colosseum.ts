/// <reference path="../trainers.ts" />

namespace Events {

    type ChangedMusicAction = { type: "Changed Music", id: number, cause?: ReturnType<ColosseumTracker['IdentifyMusic']> };
    type KnownActions = ChangedMusicAction | DefeatedTrainerAction;


    const mtBattleAreaLeaderIds = [227, 237, 247, 257, 267, 277, 287, 297, 307, 317];
    const mtBattleFirstTrainerId = 218;
    const mtBattleLastTrainerId = 317;

    class ColosseumTracker extends Tracker<KnownActions> {
        private currentMusicId: number;
        private evolutionIsHappening = false;
        private startedWatchingNews: number;
        private totalNewsSeconds = 0;
        private newsReportsWatched = 0;
        private defeatedMtBattleTrainers = new Array<number>();

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.music_id && (!this.currentMusicId || newState.music_id != oldState.music_id))
                dispatch({ type: "Changed Music", id: newState.music_id, cause: this.IdentifyMusic(newState.music_id) });
        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "Changed Music":
                    this.currentMusicId = action.id;
                    this.ActOnMusic(action.cause, action.timestamp);
                    return;
                case "Defeated Trainer":
                    if (mtBattleAreaLeaderIds.indexOf(action.id) >= 0
                        && this.defeatedMtBattleTrainers.indexOf(action.id) < 0)
                        this.defeatedMtBattleTrainers.push(action.id);
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            state.evolution_is_happening = this.evolutionIsHappening;
            state.game_stats = state.game_stats || {};
            state.game_stats['News Reports Watched'] = this.newsReportsWatched;
            state.game_stats['Seconds Spent Watching News'] = Math.ceil(this.totalNewsSeconds);
            state.game_stats['Mt. Battle Completion Percentage'] = Math.floor(this.defeatedMtBattleTrainers.length / mtBattleAreaLeaderIds.length * 100);

            // Add Mt. Battle Sequence Number
            (state.enemy_trainers || [])
                .filter(t => t.id >= mtBattleFirstTrainerId && t.id < mtBattleLastTrainerId)
                .forEach(t => t.sequence_number = t.id - (mtBattleFirstTrainerId - 1));

            // Fix Shady Guy's name
            (state.enemy_trainers || [])
                .filter(t => t.id == 472)
                .forEach(t => t.name = state.name);
            return state;
        }

        private IdentifyMusic(id: number) {
            switch (id) {
                case 0x1C:
                case 1133:
                    return "News";
                case 0x3D3:
                case 0x3D4:
                    return "Evolution";
            }
        }

        private ActOnMusic(cause: ReturnType<ColosseumTracker['IdentifyMusic']>, timestamp: string) {
            const time = Date.parse(timestamp);
            switch (cause) {
                case "News":
                    this.newsReportsWatched++;
                    this.startedWatchingNews = time;
                    break;
                case "Evolution":
                    this.evolutionIsHappening = true;
                    break;
            }
            if (cause != "News" && this.startedWatchingNews) {
                this.totalNewsSeconds += (time - this.startedWatchingNews) / 1000;
                this.startedWatchingNews = 0;
            }
            if (cause != "Evolution")
                this.evolutionIsHappening = false;

        }

    }
    //RegisterTracker(ColosseumTracker);
}