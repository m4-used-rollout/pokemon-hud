/// <reference path="../pokemon/map.ts" />
/// <reference path="../main.ts" />
/// <reference path="../pokemon/convert.ts" />
/// <reference path="../../ref/runstatus.d.ts" />

namespace TPP.Server.DexNav {

    let config = getConfig();

    export interface KnownEncounter {
        speciesId: number;
        rate: number;
        owned: boolean;
        requiredItemId: number;
    }

    export interface KnownEncounters {
        [key: string]: KnownEncounter[];
    }

    export interface OwnedSpecies extends Pokemon.Species {
        owned: boolean;
        encounterRate?: number;
    }

    export class State {
        public MapName = "";
        public MapID = 0;
        public MapBank = 0;
        public AreaID = 0;
        public AreaName = "";
        public Hour = 0;
        public TotalEncounters = 0;
        public CompletedCategories = 0;
        public MoreLeftToCatch = true;
        public ShowDexNav = true;
        public TehUrn = false;
        public KnownEncounters: KnownEncounters = {
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
        public WildBattle: OwnedSpecies = null;
        public EnemyTrainers: TPP.EnemyTrainer[] = null;
        public EnemyParty: TPP.EnemyParty = null;
        public IsUnknownArea = false;
        constructor(map: Pokemon.Map, encounters: Pokemon.EncounterSet, allMapEncounters: Pokemon.EncounterSet, runState: TPP.RunStatus) {
            if (!map || !runState) return;
            this.MapName = map.name;
            this.MapID = runState.map_id;
            this.MapBank = runState.map_bank;
            this.AreaID = map.areaId || runState.area_id;
            this.AreaName = map.areaName || runState.area_name;
            if (config.dexNavUseAreaName) {
                this.MapName = this.AreaName || this.MapName;
            }
            this.TehUrn = this.MapID == config.hofMapId && (typeof config.hofMapBank !== "number" || this.MapBank == config.hofMapBank);
            if (this.TehUrn) {
                this.MapName = "Hall of Fame";
            }
            this.ShowDexNav = !!(runState.id || runState.secret);
            this.IsUnknownArea = RomData.IsUnknownTrainerMap(map.id,map.bank);
            this.PopulateKnownEncounters(encounters, runState);
            this.PopulateCompletionTotals(allMapEncounters, runState);
            if (runState.in_battle) {
                this.WildBattle = <OwnedSpecies>Pokemon.Convert.SpeciesFromRunStatus(runState.wild_species);
                if (this.WildBattle && this.WildBattle.id) {
                    this.WildBattle.owned = (runState.caught_list || []).some(p => p == this.WildBattle.dexNumber);
                    this.WildBattle.encounterRate = this.categories.map(k => (this.KnownEncounters[k] || []).filter(e => e.speciesId == this.WildBattle.id))
                        .reduce((all, curr) => <KnownEncounter[]>Array.prototype.concat.apply(all, curr), [])
                        .reduce((total, curr) => ({ rate: total.rate + curr.rate, speciesId: curr.speciesId }), { rate: 0 }).rate;
                }
                this.EnemyTrainers = runState.enemy_trainers;
                this.EnemyParty = runState.enemy_party;
                (this.EnemyTrainers || []).forEach(t => {
                    if (t && t.class_name && t.class_name.toLowerCase() == "rival" && (!t.name || !t.name.trim().length)) {
                        t.name = runState.rival_name;
                    }
                    if (this.IsUnknownArea) {
                        t.name = t.class_name = '';
                        t.pic_id = -1;
                    }
                });
                if (this.EnemyTrainers && this.IsUnknownArea && this.EnemyTrainers.length > 1) {
                    this.EnemyTrainers.length = 1;
                }

            }
        }

        private categories = Object.keys(this.KnownEncounters);

        private PopulateKnownEncounters(encounters: Pokemon.EncounterSet, runState: TPP.RunStatus) {
            if (!encounters) return;

            // console.log(`Grass: ${(encounters.grass || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Surfing: ${(encounters.surfing || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Fishing: ${(encounters.fishing || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%) [${e.requiredItem.name}]`).join(', ')}`);
            // console.log(`Hidden: ${(encounters.hidden_grass || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%)`).join(', ')}`);

            let monIsSeen = (mon: Pokemon.EncounterMon) => (runState.seen_list || []).indexOf(mon.species.dexNumber) >= 0;
            let monIsOwned = (mon: Pokemon.EncounterMon) => (runState.caught_list || []).indexOf(mon.species.dexNumber) >= 0;
            let userHasItem = (item: TPP.Item) => !item || !item.id || Object.keys(runState.items || {}).some(k => (runState.items[k] || []).some(i => item.id == i.id));
            this.categories.forEach(k => {
                this.KnownEncounters[k] = (encounters[k] || [])
                    .filter(s => (monIsSeen(s) || monIsOwned(s)) && userHasItem(s.requiredItem))
                    .map(s => (<KnownEncounter>{ speciesId: s.species.id, rate: s.rate, owned: monIsOwned(s), requiredItemId: s.requiredItem.id }));
            });

            // console.log(`Known Grass: ${(this.KnownEncounters.grass || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Known Surfing: ${(this.KnownEncounters.surfing || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Known Fishing: ${(this.KnownEncounters.fishing || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%`).join(', ')}`);
            // console.log(`Known Hidden: ${(this.KnownEncounters.hidden_grass || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%)`).join(', ')}`);

            function foldInOwned(mainList: KnownEncounter[], hiddenList: KnownEncounter[]) {
                hiddenList.forEach(e => e.owned && mainList.filter(m => m.speciesId == e.speciesId).length < 1 && mainList.push(e));
            }
            foldInOwned(this.KnownEncounters.grass, this.KnownEncounters.hidden_grass);
            foldInOwned(this.KnownEncounters.surfing, this.KnownEncounters.hidden_surfing);
            foldInOwned(this.KnownEncounters.fishing, this.KnownEncounters.hidden_fishing);
            delete this.KnownEncounters.hidden_grass;
            delete this.KnownEncounters.hidden_surfing;
            delete this.KnownEncounters.hidden_fishing;

            if (!RomData.CheckIfCanFish(runState)) {
                delete this.KnownEncounters.fishing;
            }
            if (!RomData.CheckIfCanSurf(runState)) {
                delete this.KnownEncounters.surfing;
            }
        }

        private PopulateCompletionTotals(allMapEncounters: Pokemon.EncounterSet, runState: TPP.RunStatus) {
            if (!allMapEncounters) return;
            let monIsUncaught = (mon: Pokemon.EncounterMon) => (runState.caught_list || []).indexOf(mon.species.id) < 0;
            this.CompletedCategories = this.categories.filter(k => k.indexOf('hidden') < 0 //not a hidden category
                && allMapEncounters[k] //category exists
                && allMapEncounters[k].length > 0 //category has encounters
                && !allMapEncounters[k].some(monIsUncaught) //category has no uncaught species
            ).length;
            if (this.CompletedCategories > 0) {
                //if any category is completed, also count any empty/missing categories as completed
                this.CompletedCategories += this.categories.filter(k => (!allMapEncounters[k] || allMapEncounters[k].length == 0) && k.indexOf('hidden') < 0).length;
            }
            //check all categories for anything left to catch
            this.MoreLeftToCatch = this.categories.some(k => (allMapEncounters[k] || []).some(monIsUncaught));
            this.TotalEncounters = this.categories.reduce((sum, k) => sum + (allMapEncounters[k] || []).length, 0);
        }
    }
}