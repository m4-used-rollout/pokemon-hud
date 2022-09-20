/// <reference path="../trainers.ts" />

namespace Events {

    type ChangedMusicAction = { type: "Changed Music", id: number, cause?: ReturnType<XDTracker['IdentifyMusic']> };
    type NewShadowMonAction = { type: "New Shadow Mon", id: number, species: string, purification: number };
    type KnownActions = ChangedMusicAction | DefeatedTrainerAction | NewShadowMonAction | CaughtPokemonAction | EvolvedPokemonAction;

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
        private knownShadowMons = new Array<number>();
        private ownedPokemon = new Array<number>(); //Handles Pokedex Caught, since the game itself may not keep track

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.music_id && (!this.currentMusicId || newState.music_id != oldState.music_id))
                dispatch({ type: "Changed Music", id: newState.music_id, cause: this.IdentifyMusic(newState.music_id) });
            ([...(newState.party || []), ...(newState.battle_party || []), ...(newState.enemy_party || []), ...((newState.pc || { boxes: new Array<TPP.BoxData>() }).boxes || []).reduce((all: TPP.BoxedPokemon[], cur) => all.concat(cur.box_contents), new Array<TPP.BoxedPokemon>())] as TPP.ShadowPokemon[])
                .filter(mon => mon.is_shadow && this.knownShadowMons.indexOf(mon.shadow_id) < 0)
                .forEach(mon => dispatch({ type: "New Shadow Mon", id: mon.shadow_id, species: (mon.species || { name: "???" }).name, purification: (mon.purification || { current: 0 }).current }));

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
                    return;
                case "New Shadow Mon":
                    this.knownShadowMons.push(action.id);
                    if ((this.romData as RomReader.GCNReader).UpdateShadowMon)
                        (this.romData as RomReader.GCNReader).UpdateShadowMon(action.id, action.purification);
                    return;
                case "Caught Pokemon":
                case "Evolved Pokemon":
                    if (this.ownedPokemon.indexOf(action.dexNum) < 0)
                        this.ownedPokemon.push(action.dexNum);
                    return;
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

            // Mix in Pokedex owned
            state.caught_list = [...state.caught_list, ...this.ownedPokemon].filter((d, i, arr) => arr.indexOf(d) == i).sort((d1, d2) => d1 - d2);
            state.caught = state.caught_list.length;
            state.seen_list = [...state.seen_list, ...this.ownedPokemon].filter((d, i, arr) => arr.indexOf(d) == i).sort((d1, d2) => d1 - d2);
            state.seen = state.seen_list.length;

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
    // RegisterTracker(XDTracker);
}