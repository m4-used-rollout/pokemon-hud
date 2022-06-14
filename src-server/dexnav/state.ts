/// <reference path="../pokemon/map.ts" />
/// <reference path="../main.ts" />
/// <reference path="../pokemon/convert.ts" />
/// <reference path="../../ref/runstatus.d.ts" />

namespace TPP.Server.DexNav {

    let config = getConfig();

    export interface KnownEncounter {
        speciesId: number;
        dexNum: number;
        form: number;
        rate: number;
        owned: boolean;
        categoryIcon: string;
        requiredItemId: number;
        hidden?: boolean;
    }

    export interface KnownEncounters {
        [key: string]: KnownEncounter[];
    }

    export interface WildPokemon extends Pokemon.Species {
        gender?: string;
        shiny?: boolean;
        form?: number;
        health?: number[];
        owned: boolean;
        encounterRate?: number;
        is_shadow?: boolean;
    }

    export interface GoalTrainer extends Pokemon.Trainer {
        met?: boolean;
        defeated?: boolean;
        attempts: number;
    }

    export class State {
        public PlayerName = "";
        public MapName = "";
        public MapID = 0;
        public MapBank = 0;
        public AreaID = 0;
        public AreaName = "";
        public PuzzleAuthor = "";
        public PuzzleNumber = 0;
        public PuzzleFoundScroll = false;
        public Hour = 0;
        public TotalEncounters = 0;
        public CompletedCategories = 0;
        public MoreLeftToCatch = true;
        public ShowDexNav = true;
        public TehUrn = false;
        public GlitchOut = false;
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
        public BattleKind: string = "None";
        public WildBattle: WildPokemon[] = null;
        public EnemyTrainers: TPP.EnemyTrainer[] = null;
        public EnemyParty: TPP.EnemyParty = null;
        public FriendlyParty: TPP.PartyData = null;
        public IsUnknownArea = false;
        public GoalTrainers: GoalTrainer[] = null;
        constructor(map: Pokemon.Map, encounters: Pokemon.EncounterSet, allMapEncounters: Pokemon.EncounterSet, runState: TPP.RunStatus) {
            if (!map || !runState) return;
            this.PlayerName = runState.name;
            this.MapName = map.name;
            this.MapID = runState.map_id;
            this.MapBank = runState.map_bank;
            this.AreaID = map.areaId || runState.area_id;
            this.AreaName = map.areaName || runState.area_name;
            if (config.dexNavUseAreaName) {
                this.MapName = this.AreaName || this.MapName;
            }
            this.TehUrn = this.MapID && this.MapID == config.hofMapId && (typeof config.hofMapBank !== "number" || this.MapBank == config.hofMapBank);
            if (this.TehUrn) {
                this.MapName = "Hall of Fame";
            }
            if (map['author'] && map['puzzleNo']) {
                this.PuzzleNumber = map['puzzleNo'];
                this.PuzzleAuthor = map['author'];
                this.PuzzleFoundScroll = runState.trick_house && runState.trick_house.filter(t => true).pop() != "Incomplete";
            }
            this.ShowDexNav = !!(runState.id || runState.secret);
            this.IsUnknownArea = RomData.IsUnknownTrainerMap(map.id, map.bank);
            this.PopulateKnownEncounters(encounters, runState);
            this.PopulateCompletionTotals(allMapEncounters, runState);
            this.FriendlyParty = runState.party;
            if (runState.in_battle) {
                this.BattleKind = runState.battle_kind;
                if (runState.battle_kind == "Wild") {
                    // let mon = runState.enemy_party.filter(p=>p.species && p.species.id).sort((p1,p2)=>((p2.health[0] > 0 ? 10 : 0) * (p2.shiny ? 10 : 1)) - ((p1.health[0] > 0 ? 10 : 0) * (p1.shiny ? 10 : 1))).shift();
                    this.WildBattle = runState.enemy_party.filter(p => p && p.species && p.species.id).map(mon => {
                        const wild = <WildPokemon>Pokemon.Convert.SpeciesFromRunStatus(mon.species)
                        wild.form = mon.form;
                        wild.shiny = mon.shiny;
                        wild.gender = mon.gender;
                        wild.health = mon.health;
                        if (wild && (wild.id || wild.dexNumber)) {
                            wild.owned = (runState.caught_list || []).some(p => p == wild.dexNumber);
                            wild.encounterRate = this.categories.map(k => (this.KnownEncounters[k] || []).filter(e => e.dexNum == wild.dexNumber))
                                .reduce((all, curr) => <KnownEncounter[]>Array.prototype.concat.apply(all, curr), [])
                                .reduce((total, curr) => ({ rate: total.rate + curr.rate, speciesId: curr.speciesId }), { rate: 0 }).rate;
                        }
                        return wild;
                    });
                }
                this.EnemyTrainers = runState.enemy_trainers;
                this.EnemyParty = runState.enemy_party;
                (this.EnemyTrainers || []).forEach(t => {
                    if (t && t.class_name && runState.rival_name && (t.class_name.toLowerCase() == "rival" || t.name.toLowerCase() == "rival")) {
                        t.name = runState.rival_name;
                    }
                    if (this.IsUnknownArea) {
                        t.name = t.class_name = '';
                        t.pic_id = -1;
                    }
                });
                // this.EnemyTrainers = (this.EnemyTrainers || []).filter(t => t && !(t.class_id == 0 && t.pic_id == 0));
                this.EnemyTrainers = (this.EnemyTrainers || []).filter(t => t && typeof t.class_id === "number" && typeof t.pic_id === "number");
                if (this.EnemyTrainers && this.IsUnknownArea && this.EnemyTrainers.length > 1) {
                    this.EnemyTrainers.length = 1;
                }
                if (this.EnemyParty
                    && this.EnemyParty.some(p => ((p || {}) as TPP.ShadowPokemon).is_shadow)
                    && this.EnemyParty.every(p => p && (((p as TPP.ShadowPokemon).is_shadow && !!(p.health || [][0])) || (!(p as TPP.ShadowPokemon).is_shadow && !(p.health || [])[0])))
                ) {
                    this.WildBattle = this.WildBattle || this.EnemyParty
                        .filter(p => p && p.species && (p as TPP.ShadowPokemon).is_shadow && p.health && p.health[0])
                        .map(p => Object.assign(
                            Pokemon.Convert.SpeciesFromRunStatus(p.species),
                            {
                                owned: runState.caught_list.indexOf(p.species.national_dex) >= 0,
                                gender: p.gender,
                                form: p.form,
                                shiny: p.shiny,
                                health: p.health,
                                is_shadow: (p as TPP.ShadowPokemon).is_shadow,
                                catchRate: (p as TPP.ShadowPokemon).catch_rate || p.species.catch_rate
                            } as TPP.Server.DexNav.WildPokemon, p.species
                        ));
                }
            }
            const goalTrainers = (config.goals || []).find(g => g.goalType == "Trainers") as TrainerHitListConfig;
            if (goalTrainers && goalTrainers.requiredTrainerIds) {
                this.GoalTrainers = goalTrainers.requiredTrainerIds
                    .map((id, i) => {
                        const classId = (goalTrainers.requiredTrainerClasses || [])[i];
                        const trainerEvent = (runState.events as TPP.TrainerEvent[]).find(e => e.id == id && (!classId || classId == e.class_id));
                        return Object.assign(
                            {
                                met: !!trainerEvent,
                                defeated: trainerEvent && trainerEvent.group == "Trainers Defeated",
                                attempts: trainerEvent ? trainerEvent.attempts : 0
                            } as GoalTrainer,
                            RomData.GetTrainer(id, classId)
                        );
                    });
                const requiredTrainersDefeated = this.GoalTrainers.every(t => t.defeated);
                (goalTrainers.optionalTrainerIds || []).forEach((id, i) => {
                    const classId = (goalTrainers.optionalTrainerClasses || [])[i];
                    const trainerEvent = (runState.events as TPP.TrainerEvent[]).find(e => e.id == id && (!classId || classId == e.class_id));
                    if (trainerEvent)
                        this.GoalTrainers.push(Object.assign(
                            {
                                met: true,
                                defeated: trainerEvent && trainerEvent.group == "Trainers Defeated",
                                attempts: trainerEvent ? trainerEvent.attempts : 0
                            } as GoalTrainer,
                            RomData.GetTrainer(id, classId)
                        ));
                });
                if (requiredTrainersDefeated)
                    (goalTrainers.finalTrainerIds || []).forEach((id, i) => {
                        const classId = (goalTrainers.finalTrainerClasses || [])[i];
                        const trainerEvent = (runState.events as TPP.TrainerEvent[]).find(e => e.id == id && (!classId || classId == e.class_id));
                        this.GoalTrainers.push(Object.assign(
                            {
                                met: !!trainerEvent,
                                defeated: trainerEvent && trainerEvent.group == "Trainers Defeated",
                                attempts: trainerEvent ? trainerEvent.attempts : 0
                            } as GoalTrainer,
                            RomData.GetTrainer(id, classId)
                        ));
                    });
            }
        }

        private categories = Object.keys(this.KnownEncounters);

        private PopulateKnownEncounters(encounters: Pokemon.EncounterSet, runState: TPP.RunStatus) {
            if (!encounters) return;

            // console.log(`Grass: ${(encounters.grass || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Surfing: ${(encounters.surfing || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Fishing: ${(encounters.fishing || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%) [${e.requiredItem.name}]`).join(', ')}`);
            // console.log(`Hidden: ${(encounters.hidden_grass || []).map(e => `${e.species.name} (${e.rate.toFixed(0)}%)`).join(', ')}`);

            let monIsSeen = (mon: Pokemon.EncounterMon) => (runState.seen_list || []).indexOf(mon.species.dexNumber) >= 0 || (runState.enemy_party || []).some(p => p.species.national_dex == mon.species.dexNumber);
            let monIsOwned = (mon: Pokemon.EncounterMon) => (runState.caught_list || []).indexOf(mon.species.dexNumber) >= 0;
            let userHasItem = (item: TPP.Item) => !item || !item.id || Object.keys(runState.items || {}).some(k => (runState.items[k] || []).some(i => item.id == i.id));
            this.categories.forEach(k => {
                this.KnownEncounters[k] = (encounters[k] || [])
                    .filter(s => (monIsSeen(s) || monIsOwned(s)) && userHasItem(s.requiredItem))
                    .map(s => (<KnownEncounter>{ speciesId: s.species.id, dexNum: s.species.dexNumber, form: s.form, rate: s.rate, owned: monIsOwned(s), categoryIcon: s.categoryIcon, requiredItemId: s.requiredItem && s.requiredItem.id }));
            });

            // console.log(`Known Grass: ${(this.KnownEncounters.grass || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Known Surfing: ${(this.KnownEncounters.surfing || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%)`).join(', ')}`);
            // console.log(`Known Fishing: ${(this.KnownEncounters.fishing || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%`).join(', ')}`);
            // console.log(`Known Hidden: ${(this.KnownEncounters.hidden_grass || []).map(e => `${Server.RomData.GetSpecies(e.speciesId).name} (${e.rate.toFixed(0)}%)`).join(', ')}`);

            function foldInOwned(mainList: KnownEncounter[], hiddenList: KnownEncounter[]) {
                hiddenList.forEach(e => e.owned && mainList.every(m => m.dexNum != e.dexNum) && mainList.push(e));
            }

            this.KnownEncounters.hidden_grass.concat(this.KnownEncounters.hidden_surfing || []).concat(this.KnownEncounters.hidden_fishing || []).forEach(e => e && (e.hidden = true));
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
            let monIsUncaught = (mon: Pokemon.EncounterMon) => (runState.caught_list || []).indexOf(mon.species.dexNumber) < 0;
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