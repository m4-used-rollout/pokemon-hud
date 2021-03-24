/// <reference path="../../config/g5.ts" />
/// <reference path="../nds.ts" />
/// <reference path="../../tools/pptxt.ts" />
/// <reference path="../../../../ref/upr.ini.d.ts" />


namespace RomReader {

    const config = gen5FilesOffsets;

    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    const perSeasonEncounterDataLength = 232, bw2AreaDataEntryLength = 345, bw2EncounterAreaCount = 85;
    const encountersOfEachType = [12, 12, 12, 5, 5, 5, 5];
    const grassEncounterRates = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1];
    const waterEncounterRates = [60, 30, 5, 4, 1];
    const encounterTypeNames = ["Grass/Cave", "Doubles Grass", "Shaking Spots", "Surfing", "Surfing Spots", "Fishing", "Fishing Spots"];
    const habitatClassificationOfEachType = ["grass", "grass", "hidden_grass", "surfing", "hidden_surfing", "fishing", "hidden_fishing"];
    const categoryIconOfEachType = [null, "darkgrass", null, null, "ripplewater", null, "ripplewater"];
    const requiredItemEachType = [null, null, null, null, null, 447, 447];
    const seasons = ["spring", "summer", "fall", "winter"];

    const tmDataPrefix = "87038803";
    const tmCount = 95, hmCount = 6, tmBlockOneCount = 92, tmBlockOneOffset = 328, tmBlockTwoOffset = 618;

    export class Gen5 extends NDSReader {
        ConvertText(text: string) {
            return Tools.PPTxt.PokeToText(text || "");
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            return (map.encounters || {})[seasons[new Date().getMonth() % seasons.length]] || (map.encounters || {}).all;
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            const surfExp = /\bsurf$/ig
            return runState && ((runState.items && runState.items.tms && runState.items.tms.some(t => surfExp.test(t.name))) || (runState.party && runState.party.some(p => p.moves.some(m => surfExp.test(m.name)))));
        }

        constructor(basePath: string, iniFile = Gen5.FindLocalFile("./data/gen5/gen5_offsets.ini")) {
            super(basePath);

            const config = this.LoadConfig(iniFile);

            this.shouldFixCaps = false;

            const arm9 = this.readArm9();
            const stringsNarc = this.readNARC(config.TextStrings);
            const pokeNarc = this.readNARC(config.PokemonStats);
            const moveNarc = this.readNARC(config.MoveData);
            const movesetNarc = this.readNARC(config.PokemonMovesets);
            const itemNarc = this.readNARC(config.ItemData);
            const mapNarc = this.readNARC(config.MapTableFile);
            const encounterNarc = this.readNARC(config.WildPokemon);
            const trDataNarc = this.readNARC(config.TrainerData);
            const trPokeNarc = this.readNARC(config.TrainerPokemon);
            const evoNarc = this.readNARC(config.PokemonEvolutions);
            // const pokegrNarc = this.readNARC(config.PokemonGraphics);
            // const badgesgrNarc = this.readNARC(config.BadgeGraphics);
            // const itemgrNarc = this.readNARC(config.ItemGraphics);

            function getStrings(index: number) {
                return Tools.PPTxt.GetStrings(stringsNarc.files[index]);
            }

            const moveNames = getStrings(parseInt(config.MoveNamesTextOffset));
            const pokemonNames = getStrings(parseInt(config.PokemonNamesTextOffset));
            const abilityNames = getStrings(parseInt(config.AbilityNamesTextOffset));
            const itemNames = getStrings(parseInt(config.ItemNamesTextOffset));
            const mapNames = getStrings(parseInt(config.MapNamesTextOffset));
            const trainerClassNames = getStrings(parseInt(config.TrainerClassesTextOffset)).map(tc => tc.replace(/₧₦/g, "πµ")); //PkMn
            const trainerNames = getStrings(parseInt(config.TrainerNamesTextOffset));

            this.abilities = abilityNames;

            this.moves = moveNarc.files.map((data, i) => (<Pokemon.Move>{
                name: moveNames[i],
                id: i,
                accuracy: data[4] % 255,
                basePower: data[3] % 255,
                basePP: data[5] % 255,
                type: types[data[0] % 255],
                category: moveCategories[data[2] % 255]
            }));

            this.moveLearns = movesetNarc.files.map(moveset => this.ReadArray(moveset, 0, 4).map(movelearn => Object.assign(
                {} as TPP.MoveLearn,
                this.GetMove(movelearn.readInt16LE(0)),
                { level: movelearn.readInt16LE(2) }
            )));

            let pokemon = pokeNarc.files.map((stats, i) => (<Pokemon.Species>{
                id: i,
                dexNumber: i,
                name: pokemonNames[i],
                baseStats: {
                    hp: stats[0] & 0xFF,
                    atk: stats[1] & 0xFF,
                    def: stats[2] & 0xFF,
                    speed: stats[3] & 0xFF,
                    spatk: stats[4] & 0xFF,
                    spdef: stats[5] & 0xFF
                },
                type1: types[stats[6] & 0xFF],
                type2: types[stats[7] & 0xFF],
                catchRate: stats[8] & 0xFF,
                genderRatio: stats[18] & 0xFF,
                eggCycles: (stats[19] & 0xFF) - 1, //eggs hatch upon hitting 0 in gen 5, not ticking past 0.
                growthRate: expCurveNames[stats[21] & 0xFF],
                expFunction: expCurves[stats[21] & 0xFF],
                eggGroup1: eggGroups[stats[22] & 0xFF],
                eggGroup2: eggGroups[stats[23] & 0xFF],
                abilities: [abilityNames[stats[24] & 0xFF], abilityNames[stats[25] & 0xFF], abilityNames[stats[26] & 0xFF]],
                baseExp: stats[32] & 0xFF,
            }));

            this.pokemon = pokemon;

            this.trainers = trDataNarc.files.map((t, i) => (<Pokemon.Trainer>{
                classId: t[1],
                className: trainerClassNames[t[1]],
                id: i,
                name: trainerNames[i],
                spriteId: t[1],
                data: t.toString("hex")
            }));


            const tmHmMoves: number[] = (function GetTMHMMapping() {
                let tmhm: number[] = [];
                let offset = arm9.indexOf(tmDataPrefix, 0, 'hex');
                offset += tmDataPrefix.length / 2; //skip the prefix
                if (offset > 0) {
                    for (let i = 0; i < tmCount + hmCount; i++) {
                        tmhm.push(arm9.readInt16LE(offset + i * 2));
                    }
                }
                return tmhm;
            })();

            this.items = itemNarc.files.map((data, i) => (<Pokemon.Item>{
                id: i,
                name: itemNames[i],
                isKeyItem: (data[8] & 32) > 0,
                // data: data
            }));

            //Give TMs and HMs their move names
            this.items.filter(i => i.name.indexOf("TM") >= 0 || i.name.indexOf("HM") >= 0).forEach((tm, index) => tm.name += " " + (this.moves[tmHmMoves[index]] || { name: "???" }).name);

            const encounters: { rate: number; encounters: Pokemon.Species[]; type: string; offset: number, category?: string, requiredItem?: number, season: string }[] = [];

            function readEncounters(data: Buffer, offset: number, number: number) {
                const encs = new Array<Pokemon.Species>();
                for (let i = 0; i < number; i++) {
                    let mon = pokemon[((data[offset + i * 4] & 0xFF) + ((data[offset + 1 + i * 4] & 0x03) << 8))];
                    encs.push(mon);
                }
                return encs;
            }

            function processEncounterEntry(entry: Buffer, startOffset: number, index: number, season = "all") {
                const amounts = encountersOfEachType;
                let offset = 8;
                for (let i = 0; i < 7; i++) {
                    const rate = entry[startOffset + i] & 0xFF;
                    if (rate != 0) {
                        const encs = readEncounters(entry, startOffset + offset, amounts[i]);
                        const area = {
                            rate,
                            encounters: encs,
                            type: habitatClassificationOfEachType[i],
                            category: categoryIconOfEachType[i],
                            requiredItem: requiredItemEachType[i],
                            offset: index,
                            season
                        }
                        encounters.push(area);
                    }
                    offset += amounts[i] * 4;
                }

            }

            encounterNarc.files.forEach((entry, i) => {
                if (entry.length > perSeasonEncounterDataLength) {
                    for (let s = 0; s < 4; s++) {
                        processEncounterEntry(entry, s * perSeasonEncounterDataLength, i, seasons[s]);
                    }
                }
                else {
                    processEncounterEntry(entry, 0, i);
                }
            });

            this.maps = []
            const mapHeaderData = mapNarc.files[0];
            const numMapHeaders = mapHeaderData.length / 48;
            for (let m = 0; m < numMapHeaders; m++) {
                const baseOffset = m * 48;
                const mapNameIndex = mapHeaderData[baseOffset + 26] & 0xFF;
                const map: Pokemon.Map = {
                    id: m,
                    name: mapNames[mapNameIndex],
                    encounters: null
                }

                let wildSet: number;
                if (config.Type = "BW2")
                    wildSet = mapHeaderData[baseOffset + 20] & 0xFF; //this is for BW2. For BW, wildSet is a word, not a byte
                else
                    wildSet = mapHeaderData.readInt16LE(baseOffset + 20);
                if (wildSet != 255 && wildSet != 65535) {
                    map.encounters = {};
                    encounters.filter(e => e.offset == wildSet).forEach(e => {
                        map.encounters[e.season] = map.encounters[e.season] || {
                            grass: [],
                            hidden_grass: [],
                            surfing: [],
                            hidden_surfing: [],
                            fishing: [],
                            hidden_fishing: []
                        };
                        map.encounters[e.season][e.type] = Array.prototype.concat.apply(map.encounters[e.season][e.type] || [], this.CombineDuplicateEncounters(e.encounters.map((enc, i, arr) => (<Pokemon.EncounterMon>{
                            species: enc,
                            rate: arr.length > 5 ? grassEncounterRates[i] : waterEncounterRates[i],
                            requiredItem: e.requiredItem ? this.GetItem(e.requiredItem) : null,
                            categoryIcon: e.category
                        }))));
                    });
                }
                this.maps.push(map);
            }

            // LEVEL(1, 1, 4, 4, 4),
            // STONE(2, 2, 7, 7, 8),
            // TRADE(3, 3, 5, 5, 5),
            // TRADE_ITEM(-1, 3, 6, 6, 6),
            // HAPPINESS(-1, 4, 1, 1, 1),
            // HAPPINESS_DAY(-1, 4, 2, 2, 2),
            // HAPPINESS_NIGHT(-1, 4, 3, 3, 3),
            // LEVEL_ATTACK_HIGHER(-1, 5, 8, 8, 9),
            // LEVEL_DEFENSE_HIGHER(-1, 5, 10, 10, 11),
            // LEVEL_ATK_DEF_SAME(-1, 5, 9, 9, 10),
            // LEVEL_LOW_PV(-1, -1, 11, 11, 12),
            // LEVEL_HIGH_PV(-1, -1, 12, 12, 13),
            // LEVEL_CREATE_EXTRA(-1, -1, 13, 13, 14),
            // LEVEL_IS_EXTRA(-1, -1, 14, 14, 15),
            // LEVEL_HIGH_BEAUTY(-1, -1, 15, 15, 16),
            // STONE_MALE_ONLY(-1, -1, -1, 16, 17),
            // STONE_FEMALE_ONLY(-1, -1, -1, 17, 18),
            // LEVEL_ITEM_DAY(-1, -1, -1, 18, 19),
            // LEVEL_ITEM_NIGHT(-1, -1, -1, 19, 20),
            // LEVEL_WITH_MOVE(-1, -1, -1, 20, 21),
            // LEVEL_WITH_OTHER(-1, -1, -1, 21, 22),
            // LEVEL_MALE_ONLY(-1, -1, -1, 22, 23),
            // LEVEL_FEMALE_ONLY(-1, -1, -1, 23, 24),
            // LEVEL_ELECTRIFIED_AREA(-1, -1, -1, 24, 25),
            // LEVEL_MOSS_ROCK(-1, -1, -1, 25, 26),
            // LEVEL_ICY_ROCK(-1, -1, -1, 26, 27),
            // TRADE_SPECIAL(-1, -1, -1, -1, 7),
            // NONE(-1, -1, -1, -1, -1);      

            this.evolutionMethods = [undefined,
                /* 1*/ this.EvolutionMethod.Happiness,
                /* 2*/ this.EvolutionMethod.HappinessDay,
                /* 3*/ this.EvolutionMethod.HappinessNight,
                /* 4*/ this.EvolutionMethod.Level,
                /* 5*/ this.EvolutionMethod.Trade,
                /* 6*/ this.EvolutionMethod.TradeItem,
                /* 7*/ this.EvolutionMethod.TradeForOtherSpecies,
                /* 8*/ this.EvolutionMethod.Stone,
                /* 9*/ this.EvolutionMethod.LevelAttackHigher,
                /*10*/ this.EvolutionMethod.LevelAtkDefEqual,
                /*11*/ this.EvolutionMethod.LevelDefenseHigher,
                /*12*/ this.EvolutionMethod.LevelLowPV,
                /*13*/ this.EvolutionMethod.LevelHighPV,
                /*14*/ this.EvolutionMethod.LevelSpawnPokemon,
                /*15*/ this.EvolutionMethod.LevelIsSpawned,
                /*16*/ this.EvolutionMethod.LevelHighBeauty,
                /*17*/ this.EvolutionMethod.StoneMale,
                /*18*/ this.EvolutionMethod.StoneFemale,
                /*19*/ this.EvolutionMethod.LevelItemDay,
                /*20*/ this.EvolutionMethod.LevelItemNight,
                /*21*/ this.EvolutionMethod.LevelWithMove,
                /*22*/ this.EvolutionMethod.LevelWithOtherSpecies,
                /*23*/ this.EvolutionMethod.LevelMale,
                /*24*/ this.EvolutionMethod.LevelFemale,
                /*25*/ this.EvolutionMethod.LevelElectifiedArea,
                /*26*/ this.EvolutionMethod.LevelMossRock,
                /*27*/ this.EvolutionMethod.LevelIcyRock
            ]
            this.readEvolutions(evoNarc);
        }
    }
}