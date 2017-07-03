/// <reference path="../pokemon/map.ts" />
/// <reference path="../../ref/runstatus.d.ts" />

namespace TPP.Server.DexNav {

    export interface KnownEncounter {
        speciesId: number;
        owned: boolean;
    }

    export class State {
        public MapName = "";
        public MapID = 0;
        public TotalEncounters = 0;
        public CompletedCategories = 0;
        public MoreLeftToCatch = false;
        public KnownEncounters = {
            grass: new Array<KnownEncounter>(),
            hidden_grass: new Array<KnownEncounter>(),
            surfing: new Array<KnownEncounter>(),
            hidden_surfing: new Array<KnownEncounter>(),
            fishing: new Array<KnownEncounter>(),
            hidden_fishing: new Array<KnownEncounter>()
        }
        public get HasEncounters() {
            return this.TotalEncounters > 0;
        }
        constructor(map: Pokemon.Map, runState: TPP.RunStatus) {
            if (!map || !runState) return;
            this.MapName = map.name;
            this.MapID = map.id;
            Object.keys(map.encounters || {}).forEach(k => {
                this.KnownEncounters[k] = map.encounters[k]
                    .map(s => s.id).filter((s, i, arr) => arr.indexOf(s) == i) //distinct species IDs
                    .filter(s => runState.seen_list.indexOf(s) >= 0 || runState.caught_list.indexOf(s) >= 0) //filter to seen/owned
                    .map(s => ({ speciesId: s, owned: runState.caught_list.indexOf(s) >= 0 }));
                if (map.encounters[k].filter(s=>runState.caught_list.indexOf(s.id) >= 0).length == map.encounters[k].length) { //encounters section incomplete
                    if (k.indexOf('hidden') < 0 && map.encounters[k].length > 0) {
                        this.CompletedCategories++;
                    }
                }
                else {
                    this.MoreLeftToCatch = true;
                }
            });
            if (this.CompletedCategories > 0) {
                //if any category is completed, also count any nonexistent categories as completed
                Object.keys(map.encounters || {}).filter(k=>map.encounters[k].length == 0 && k.indexOf('hidden') < 0).forEach(k=>this.CompletedCategories++);
            }

            function foldInOwned(mainList:KnownEncounter[], hiddenList:KnownEncounter[]) {
                hiddenList.forEach(e=> e.owned && mainList.filter(m=>m.speciesId == e.speciesId).length < 1 && mainList.push(e));
            }
            foldInOwned(this.KnownEncounters.grass, this.KnownEncounters.hidden_grass);
            foldInOwned(this.KnownEncounters.surfing, this.KnownEncounters.hidden_surfing);
            foldInOwned(this.KnownEncounters.fishing, this.KnownEncounters.hidden_fishing);
            delete this.KnownEncounters.hidden_grass;
            delete this.KnownEncounters.hidden_surfing;
            delete this.KnownEncounters.hidden_fishing;
            
            let fishingExp = /\brod$/i, surfExp = /^surf$/i;
            if ((Array.prototype.concat.apply([], runState.items) as TPP.Item[]).filter(i => !!i && fishingExp.test(i.name)).length == 0) {
                delete this.KnownEncounters.fishing; //have no fishing rod, delete fishing encounters
            }
            if ((runState.pc.boxes || []).map(b => b.box_contents).reduce((arr: TPP.Pokemon[], val: TPP.Pokemon[]) => val, runState.party || []).filter(p => !!p && p.moves.filter(m => !!m && surfExp.test(m.name)).length > 0).length == 0) {
                delete this.KnownEncounters.surfing; //have no Pokemon with surf, delete surfing encounters
            }
            this.TotalEncounters = Object.keys(map.encounters || {}).reduce((a, k) => a + map.encounters[k].length, 0);
        }
    }
}