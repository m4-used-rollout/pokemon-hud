/// <reference path="../rom-reading/romreaders/base.ts" />
/// <reference path="../pokemon/convert.ts" />
/// <reference path="../../ref/runstatus.d.ts" />
/// <reference path="options.ts" />


namespace RamReader {

    export abstract class RamReaderBase {
        constructor(public rom: RomReader.RomReaderBase, public port: number, public hostname = "localhost") { }

        private partyInterval: NodeJS.Timer;
        private pcInterval: NodeJS.Timer;
        private trainerInterval: NodeJS.Timer;
        private battleInterval: NodeJS.Timer;

        public Read(state: TPP.RunStatus, transmitState: (state: TPP.RunStatus) => void) {
            if (this.partyInterval || this.pcInterval || this.trainerInterval)
                this.Stop();

            this.partyInterval = setInterval(() => this.ReadParty().then(party => {
                if (party) {
                    this.CurrentParty = party;
                    state.party = party.map((p, i) => p && Object.assign({}, p, this.GetBattleMon(i, false, p.personality_value, p.name, true) || {}));
                    transmitState(state);
                }
            }).catch(err => console.error(err)), 120);
            this.pcInterval = setInterval(() => this.ReadPC().then(pc => {
                if (pc) {
                    state.pc = pc;
                    transmitState(state);
                }
            }).catch(err => console.error(err)), 510);
            this.trainerInterval = setInterval(() => this.ReadTrainer().then(trainer => {
                if (Object.keys(trainer).length) {
                    Object.assign(state, trainer);
                    transmitState(state);
                }
            }).catch(err => console.error(err)), 250);
            this.battleInterval = setInterval(() => this.ReadBattle().then(battle => {
                if (battle) {
                    delete state.enemy_party;
                    delete state.enemy_trainers;
                    delete state.battle_kind;
                    Object.assign(state, battle);
                    if (battle.in_battle) {
                        battle.enemy_party.forEach((p, i) => p && Object.assign(p, this.GetBattleMon(i, true, p.personality_value, p.name, true) || {}));
                        state.enemy_party = this.ConcealEnemyParty(battle.enemy_party as TPP.PartyData);
                        state.party = this.CurrentParty.map((p, i) => p && Object.assign({}, p, this.GetBattleMon(i, false, p.personality_value, p.name, true) || {}));
                    }
                    else {
                        this.CurrentBattleMons = null;
                        this.CurrentBattleSeenPokemon = null;
                        state.party = this.CurrentParty;
                    }
                    transmitState(state);
                }
            }).catch(err => console.error(err)), 230);
        }

        public Stop() {
            clearInterval(this.partyInterval);
            clearInterval(this.pcInterval);
            clearInterval(this.trainerInterval);
            clearInterval(this.battleInterval);
        }

        public abstract ReadParty: () => Promise<TPP.PartyData>;
        public abstract ReadPC: () => Promise<TPP.CombinedPCData>;
        public ReadTrainer: () => Promise<TPP.TrainerData> = () =>
            // this.TrainerChunkReaders.reduce<Promise<TPP.TrainerData[]>>((all, curr) => all.then(results => Promise.all([...results, curr()])), Promise.resolve([{} as TPP.TrainerData])) //execute one after the other
            Promise.all(this.TrainerChunkReaders.map(f => f())) //execute simultaneously    
                .then(chunks => Object.assign({}, ...chunks) as TPP.TrainerData)
                .catch(err => {
                    console.error(err);
                    return {} as TPP.TrainerData;
                });

        public abstract ReadBattle: () => Promise<TPP.BattleStatus>;

        protected StoreCurrentBattleMons(mons: TPP.PartyPokemon[], monPartyIndexes: number[], monInEnemyParty: boolean[]) {
            this.CurrentBattleMons = {
                battleMons: mons,
                partyIndexes: monPartyIndexes,
                isEnemyMon: monInEnemyParty
            };
            this.CurrentBattleSeenPokemon = this.CurrentBattleSeenPokemon || [];
            mons.forEach((m, i) => {
                if (monInEnemyParty[i] && !this.HasBeenSeenThisBattle(m))
                    this.CurrentBattleSeenPokemon.push(m.personality_value);
            });
        }

        private HasBeenSeenThisBattle(mon: TPP.PartyPokemon) {
            if (!mon || !mon.species)
                return false;
            return (this.CurrentBattleSeenPokemon || []).some(pv => mon.personality_value == pv);
        }

        private GetBattleMon(partyIndex: number, isEnemy: boolean, personalityValue?: number, name?: string, nonFainted = false) {
            if (this.CurrentBattleMons && this.CurrentBattleMons.battleMons.length) {
                const battlerIndex = this.CurrentBattleMons.partyIndexes.map((p, i) => p == partyIndex && this.CurrentBattleMons.isEnemyMon[i] == isEnemy ? i : null).filter(i => i != null).pop();
                if (battlerIndex != null) {
                    const battler = this.CurrentBattleMons.battleMons[battlerIndex];
                    if (battler &&
                        (!personalityValue || battler.personality_value == personalityValue) &&
                        (!name || battler.name == name) &&
                        (!nonFainted || battler.health[0] > 0)
                    )
                        return battler;
                }
            }
            return null;
        }

        private IsCurrentlyBattling(pokemon: TPP.PartyPokemon, partyIndex: number, isEnemy: boolean) {
            return (this.GetBattleMon(partyIndex, isEnemy) || { personality_value: null }).personality_value == pokemon.personality_value;
        }

        private CurrentParty: TPP.PartyPokemon[];
        private CurrentBattleMons: {
            battleMons: TPP.PartyPokemon[];
            partyIndexes: number[];
            isEnemyMon: boolean[];
        };
        private CurrentBattleSeenPokemon: number[];

        protected ConcealEnemyParty(party: TPP.PartyData): TPP.EnemyParty {
            return party.map((p, i) => p && ({
                species: this.HasBeenSeenThisBattle(p) ? p.species : { id: 0, name: "???", national_dex: 0 },
                health: p.health,
                active: this.IsCurrentlyBattling(p, i, true),
                form: p.form,
                shiny: p.shiny,
                shiny_value: p.shiny_value,
                gender: p.gender,
                cp: p.cp,
                fitness: p.fitness,
                personality_value: p.personality_value,
                buffs: p.buffs,
                moves: p.moves.filter(m => m.pp < m.max_pp), //only show moves with less than max PP (because they've been used)
                name: this.HasBeenSeenThisBattle(p) ? p.name : "???"
            }));
        }

        protected abstract TrainerChunkReaders: Array<() => Promise<TPP.TrainerData>>;

        public CallEmulator<T>(path: string, callback?: (data: string) => T) {
            return new Promise<T>((resolve, reject) => {
                try {
                    require('http').get(`http://${this.hostname}:${this.port}/${path}`, response => {
                        let data = '';
                        response.on('data', chunk => data += chunk);
                        if (callback) {
                            response.on('end', () => resolve(callback(data)));
                        }
                        else {
                            response.on('end', () => resolve(data as any as T));
                        }
                    }).on('error', reject);
                }
                catch (e) {
                    reject(e);
                }
            });
        }

        public CachedEmulatorCaller<T>(path: string, callback: (data: string) => T, ignoreCharStart = -1, ignoreCharEnd = -1) {
            let lastInput: string = null;
            return () => this.CallEmulator<T>(path, data => {
                let stringData = data;
                if (ignoreCharStart >= 0 && ignoreCharEnd >= ignoreCharStart) {
                    stringData = (ignoreCharStart ? data.slice(0, ignoreCharStart) : "") + data.slice(ignoreCharEnd);
                }
                if (lastInput != stringData) {
                    try {
                        const result = callback(data);
                        if (result) {
                            lastInput = stringData;
                            return result;
                        }
                    }
                    catch (e) {
                        console.error(e);
                        return null;
                    }
                }
                return null;
            });
        }

        public WrapBytes<T>(callback: (data: Buffer) => T) {
            return (hex: string) => callback(Buffer.from(hex, "hex"));
        }

        protected Markings = ['●', '▲', '■', '♥', '★', '♦'];
        protected ParseMarkings(marks: number) {
            let marking = "";
            for (let i = 0; i < this.Markings.length; i++) {
                if (marks & i)
                    marking += this.Markings[i];
            }
            return marking;
        }

        protected abstract Decrypt(data: Buffer, key: number, checksum?: number): Buffer;

        public CalcChecksum(data: Buffer) {
            let sum = 0;
            for (let i = 0; i < data.length; i += 2) {
                sum = (sum + data.readUInt16LE(i)) % 0x10000;
            }
            return sum;
        }

        protected Descramble(data: Buffer, key: number) {
            if (!data)
                return null;
            const order = this.DataScrambleOrders[key % this.DataScrambleOrders.length];
            const sectionBytes = data.length / order.length;
            const descrambled = {} as { [key: string]: Buffer };
            for (let i = 0; i < order.length; i++) {
                descrambled[order[i]] = data.slice(sectionBytes * i, sectionBytes * (i + 1));
            }
            return descrambled as { A: Buffer, B: Buffer, C: Buffer, D: Buffer };
        }

        protected DataScrambleOrders = ["ABCD", "ABDC", "ACBD", "ACDB", "ADBC", "ADCB", "BACD", "BADC", "BCAD", "BCDA", "BDAC", "BDCA", "CABD", "CADB", "CBAD", "CBDA", "CDAB", "CDBA", "DABC", "DACB", "DBAC", "DBCA", "DCAB", "DCBA"];

        protected ParseStatus(status: number) {
            if (status % 8 > 0)
                return "SLP";
            if (status & 8)
                return "PSN";
            if (status & 16)
                return "BRN";
            if (status & 32)
                return "FRZ";
            if (status & 64)
                return "PAR";
            if (status & 128)
                return "TOX";
            return null;
        }

        protected ParsePokerus(pokerus: number) {
            const pkrs = {
                infected: pokerus > 0,
                days_left: pokerus % 16,
                strain: pokerus >>> 4,
                cured: false
            }
            pkrs.cured = pkrs.infected && !pkrs.days_left;
            return pkrs;
        }

        protected ParseGender(gender: number) {
            if (gender == 0) return "Male";
            if (gender == 1) return "Female";
            return null;
        }

        protected ParseRibbon(ribbonVal: number, ribbonName: string) {
            if (ribbonVal)
                return `${ribbonName} Ribbon ${this.RibbonRanks[ribbonVal]}`.trim();
            return null;
        }

        protected RibbonRanks = [null, "", "Super", "Hyper", "Master"];

        protected ParseHoennRibbons(ribbonVal) {
            return [
                this.ParseRibbon(ribbonVal % 8, "Cool"),
                this.ParseRibbon((ribbonVal >>> 3) % 8, "Beauty"),
                this.ParseRibbon((ribbonVal >>> 6) % 8, "Cute"),
                this.ParseRibbon((ribbonVal >>> 9) % 8, "Smart"),
                this.ParseRibbon((ribbonVal >>> 12) % 8, "Tough"),
                this.ParseRibbon((ribbonVal >>> 15) % 2, "Champion"),
                this.ParseRibbon((ribbonVal >>> 16) % 2, "Winning"),
                this.ParseRibbon((ribbonVal >>> 17) % 2, "Victory"),
                this.ParseRibbon((ribbonVal >>> 18) % 2, "Artist"),
                this.ParseRibbon((ribbonVal >>> 19) % 2, "Effort"),
                this.ParseRibbon((ribbonVal >>> 20) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >>> 21) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >>> 22) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >>> 23) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >>> 24) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >>> 25) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >>> 26) % 2, "Gift"),
            ].filter(r => !!r);
        }

        protected abstract OptionsSpec: OptionsSpec;

        public ParseOptions = (rawOptions: number) => ParseOptions(rawOptions, this.OptionsSpec);

        public GetSetFlags(flagBytes: Buffer, flagCount = flagBytes.length * 8, offset = 0) {
            return this.rom.GetSetFlags(flagBytes, flagCount, offset);
        }

        protected CalculateShiny(pokemon: TPP.Pokemon) {
            pokemon.shiny_value = ((pokemon.original_trainer.id ^ pokemon.original_trainer.secret) ^ (Math.floor(pokemon.personality_value / 65536) ^ (pokemon.personality_value % 65536)))
            return pokemon.shiny = pokemon.shiny_value < this.rom.ShinyThreshold();
        }

        protected CalculateLevelFromExp(current: number, expFunction: Pokemon.ExpCurve.CalcExp) {
            return Pokemon.ExpCurve.ExpToLevel(current, expFunction);
        }

        protected CalculateExpVals(current: number, level: number, expFunction: Pokemon.ExpCurve.CalcExp) {
            const next_level = expFunction(level + 1);
            const this_level = expFunction(level);
            return { current, next_level, this_level, remaining: next_level - current };
        }

    }
}