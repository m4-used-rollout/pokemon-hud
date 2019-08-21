/// <reference path="../trainers.ts" />

namespace Events {

    type ChangedMusicAction = { type: "Changed Music", id: number, cause?: ReturnType<XDTracker['IdentifyMusic']> };
    type KnownActions = ChangedMusicAction | DefeatedTrainerAction;

    const mtBtlTrainerExp = /^N(\d\d\d)$/;

    function GetMtBtlTrainerNumber(trainerString: string) {
        const result = mtBtlTrainerExp.exec(trainerString);
        if (result)
            return parseInt(result[1]);
        return 0;
    }

    class XDTracker extends Tracker<KnownActions> {
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
                    const mtBtlTrainerNum = GetMtBtlTrainerNumber(action.trainerString);
                    if (mtBtlTrainerNum > 0 && mtBtlTrainerNum % 10 == 0
                        && this.defeatedMtBattleTrainers.indexOf(mtBtlTrainerNum) < 0)
                        this.defeatedMtBattleTrainers.push(mtBtlTrainerNum);
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            state.evolution_is_happening = this.evolutionIsHappening;
            state.game_stats = state.game_stats || {};
            state.game_stats['News Reports Watched'] = this.newsReportsWatched;
            state.game_stats['Seconds Spent Watching News'] = Math.ceil(this.totalNewsSeconds);
            //state.game_stats['Mt. Battle Completion Percentage'] = Math.floor(this.defeatedMtBattleTrainers.length / 10 * 100);

            // Add Mt. Battle Sequence Number
            (state.enemy_trainers || [])
                .forEach(t => t.sequence_number = GetMtBtlTrainerNumber(t.trainer_string));

            return state;
        }

        private IdentifyMusic(id: number) {
            switch (id) {
                case 0x366:
                    return "News";
                case 0x3D0:
                case 0x3D1:
                    return "Evolution";
            }
        }

        private ActOnMusic(cause: ReturnType<XDTracker['IdentifyMusic']>, timestamp: string) {
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
    //RegisterTracker(XDTracker);
}