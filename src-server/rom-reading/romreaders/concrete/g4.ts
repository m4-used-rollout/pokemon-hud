/// <reference path="../../config/g4.ts" />
/// <reference path="../nds.ts" />
/// <reference path="../../tools/poketext.ts" />

namespace RomReader {

    const fs = require('fs');

    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fairy", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    const bagPockets = ["Items", "Medicine", "Balls", "Tms", "Berries", "Mail", "Battle", "Key"];

    const timeThresholdHours = [4, 10, 20];

    // The original slot each of the 20 "alternate" slots is mapped to
    // swarmx2, dayx2, nightx2, pokeradarx4, GBAx10
    // NOTE: in the game data there are 6 fillers between pokeradar and GBA
    const dpptAlternateSlots = [0, 1, 2, 3, 2, 3, 4, 5, 10, 11, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9];

    const dpptAlternateSlotsItems = [undefined, undefined, undefined, undefined, undefined, undefined, 431, 431, 431, 431];
    const dpptAlternateSlotCategory = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "cartruby", "cartruby", "cartsapphire", "cartsapphire", "cartemerald", "cartemerald", "cartfirered", "cartfirered", "cartleafgreen", "cartleafgreen"];

    const encounterRatesGrass = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1];
    const encounterRatesRockSmash = [90, 10];
    const encounterRatesWater = [60, 30, 5, 4, 1];

    const emptyEncounterSet: Pokemon.EncounterSet = { grass: [], hidden_grass: [], surfing: [], fishing: [] };
    const emptyEncounters: Pokemon.Encounters = { morn: emptyEncounterSet, day: emptyEncounterSet, nite: emptyEncounterSet };


    const dpptTMDataPrefix = "D100D200D300D400", hgssTMDataPrefix = "1E003200";
    const tmCount = 92, hmCount = 8, pokemonCount = 493;

    interface Gen4Item extends Pokemon.Item {
        bagPocket: string;
    }

    export class Gen4 extends NDSReader {

        private tmHmMoves: string[];
        private config: UPRINI;

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            if (this.config.Type == "DP")
                return (runState.badges & 16) > 16; //Relic Badge (Diamond/Pearl)
            return (runState.badges & 8) == 8; //Fog Badge (HGSS) / Fen Badge (Platinum)
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            const spriteFolder = TPP.Server.getConfig().spriteFolder;
            let possibleSpriteUrls: string[] = [];
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${id}.png`);
            for (let i = 0; i < possibleSpriteUrls.length; i++) {
                if (fs.existsSync(__dirname + '/' + possibleSpriteUrls[i]))
                    return possibleSpriteUrls[i];
            }
            return './img/generic/pokemon/0.png'; //whatever
        }

        GetItemSprite(id: number) {
            return `./img/items/blackwhite/${id}.png`;
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            if (!map.encounters) return emptyEncounterSet;
            const hour = new Date().getHours();
            if (hour > timeThresholdHours[0]) {
                if (hour > timeThresholdHours[1]) {
                    if (hour > timeThresholdHours[2]) {
                        return map.encounters.nite;
                    }
                    return map.encounters.day;
                }
                return map.encounters.morn;
            }
            return map.encounters.nite;
        }

        TrainerIsRival(id: number, classId: number) {
            if (this.config.Type == "HGSS") {
                return false; //TODO: Find Silver's class id
            }
            return classId == 63; //Cedric;
        }

        constructor(basePath: string, iniFile = Gen5.FindLocalFile("./data/gen4/gen4_offsets.ini")) {
            super(basePath);

            const config = this.LoadConfig(iniFile);
            this.config = config;

            const arm9 = this.readArm9();
            const stringsNarc = this.readNARC(config.TextStrings || config.Text);
            const pokeNarc = this.readNARC(config.PokemonStats);
            const moveNarc = this.readNARC(config.MoveData);
            const itemNarc = this.readNARC(config.ItemData);
            const encounterNarc = this.readNARC(config.WildPokemon);
            const trDataNarc = this.readNARC(config.TrainerData);
            const trPokeNarc = this.readNARC(config.TrainerPokemon);
            const moveLearnNarc = this.readNARC(config.PokemonMovesets);
            const evoNarc = this.readNARC(config.PokemonEvolutions);


            // const pokegrNarc = this.readNARC(config.PokemonGraphics);
            // const badgesgrNarc = this.readNARC(config.BadgeGraphics);
            // const itemgrNarc = this.readNARC(config.ItemGraphics);

            const getStrings = (index: number) => Tools.PokeText.GetStrings(stringsNarc.files[index]).map(str => this.FixAllCaps(str));

            const moveNames = getStrings(parseInt(config.MoveNamesTextOffset));
            const pokemonNames = getStrings(parseInt(config.PokemonNamesTextOffset));
            const abilityNames = getStrings(parseInt(config.AbilityNamesTextOffset));
            const itemNames = getStrings(parseInt(config.ItemNamesTextOffset));
            const mapNames = getStrings(parseInt(config.MapNamesTextOffset));
            const trClassNames = getStrings(parseInt(config.TrainerClassesTextOffset));
            const trNames = getStrings(parseInt(config.TrainerNamesTextOffset));

            this.abilities = abilityNames;

            this.moves = moveNarc.files.map((data, i) => (<Pokemon.Move>{
                name: moveNames[i],
                id: i,
                accuracy: data[5],
                basePower: data[3],
                basePP: data[6],
                type: types[data[4]],
                category: moveCategories[data[2]]
            }));

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
                genderRatio: stats[16] & 0xFF,
                eggCycles: (stats[17] & 0xFF) - 1, //eggs hatch upon hitting 0 in gen 4, not ticking past 0.
                growthRate: expCurveNames[stats[19] & 0xFF],
                expFunction: expCurves[stats[19] & 0xFF],
                eggGroup1: eggGroups[stats[20] & 0xFF],
                eggGroup2: eggGroups[stats[21] & 0xFF],
                abilities: [abilityNames[stats[22] & 0xFF], abilityNames[stats[23] & 0xFF]],
                baseExp: stats[9] & 0xFF,
            }));

            const missingNo: Pokemon.Species = {
                name: "-----",
                id: 0,
                dexNumber: 0,
                type1: "Normal",
                type2: "Normal"
            } as Pokemon.Species;
            pokemon.unshift(missingNo);
            this.pokemon = pokemon;

            let tmHmMoves: number[] = (function GetTMHMMapping() {
                let tmhm: number[] = [];
                const tmDataPrefix = config.Type == "HGSS" ? hgssTMDataPrefix : dpptTMDataPrefix;
                let offset = arm9.indexOf(tmDataPrefix, 0, 'hex');
                offset += tmDataPrefix.length / 2; //skip the prefix
                if (offset > 0) {
                    for (let i = 0; i < tmCount + hmCount; i++) {
                        tmhm.push(arm9.readInt16LE(offset + i * 2));
                    }
                }
                return tmhm;
            })();

            const getItemPocket = (data: Buffer) => bagPockets[(data.readUInt16LE(8) & 0x3FF) >> 7] || "???";

            this.items = itemNarc.files.map((data, i) => (<Gen4Item>{
                id: i,
                name: itemNames[i],
                bagPocket: getItemPocket(data),
                isKeyItem: getItemPocket(data) == "Key",
                //data: data.toString('hex')
            }));
            itemNames.forEach((n, i) => this.items.some(i => i.name == n) || this.items.push({ id: i, name: n, isKeyItem: true }));

            this.tmHmMoves = tmHmMoves.map(n => this.moves[n] ? this.moves[n].name : n.toString());

            //Give TMs and HMs their move names TODO: Fix this
            this.items.filter(i => i.name.indexOf("TM") >= 0 || i.name.indexOf("HM") >= 0).forEach((tm, index) => tm.name += " " + (this.moves[tmHmMoves[index]] || { name: "???" }).name);

            const speciesToEncounter = (id: number, rate = 1, requiredItem = null) => (<Pokemon.EncounterMon>{ rate: rate, speciesId: id, species: this.GetSpecies(id) || missingNo, requiredItem: requiredItem && this.GetItem(requiredItem) });
            const rodExp = /.* Rod$/;

            let encounters: Pokemon.Encounters[];

            if (config.Type == "HGSS") {
                encounters = encounterNarc.files.map(data => {
                    const rates = data.slice(0, 5).map(i => i);
                    const surfMons = rates[1] ? this.CombineDuplicateEncounters(
                        this.ReadArray(data, 100, 4, 5).map((s, r) => speciesToEncounter(s.readUInt16LE(2), encounterRatesWater[r]))
                    ) : new Array<Pokemon.EncounterMon>();
                    const fishMons = new Array<Pokemon.EncounterMon>().concat(
                        ...this.items.filter(i => rodExp.test(i.name))
                            .map((rod, i) => rates[2 + i] ? this.CombineDuplicateEncounters(
                                this.ReadArray(data, 128 + (4 * 5 * i), 4, 5).map((s, r) => speciesToEncounter(s.readInt16LE(2), encounterRatesWater[r], rod.id))
                            ) : [])
                    );
                    const hiddenMons = this.CombineDuplicateEncounters(new Array<Pokemon.EncounterMon>().concat(
                        //radio encounters
                        this.ReadArray(data, 92, 2, 4).map(s => s.readUInt16LE(0)).filter(s => s > 0).map(s => speciesToEncounter(s)),
                        //rock smash (also stores level)
                        rates[2] ? this.ReadArray(data, 120, 4, 2).map((s, r) => speciesToEncounter(s.readUInt16LE(2), encounterRatesRockSmash[r])) : [],
                        //swarm
                        this.ReadArray(data, 188, 2, 4).map(s => s.readUInt16LE(0)).filter(s => s > 0).map(s => speciesToEncounter(s)),
                    ));
                    return <Pokemon.Encounters>{
                        morn: <Pokemon.EncounterSet>{
                            grass: rates[0] ? this.CombineDuplicateEncounters(this.ReadArray(data, 20, 2, 12).map((s, r) => speciesToEncounter(s.readUInt16LE(0), encounterRatesGrass[r]))) : [],
                            hidden_grass: hiddenMons,
                            surfing: surfMons,
                            fishing: fishMons
                        },
                        day: <Pokemon.EncounterSet>{
                            grass: rates[0] ? this.CombineDuplicateEncounters(this.ReadArray(data, 44, 2, 12).map((s, r) => speciesToEncounter(s.readUInt16LE(0), encounterRatesGrass[r]))) : [],
                            hidden_grass: hiddenMons,
                            surfing: surfMons,
                            fishing: fishMons
                        },
                        nite: <Pokemon.EncounterSet>{
                            grass: rates[0] ? this.CombineDuplicateEncounters(this.ReadArray(data, 68, 2, 12).map((s, r) => speciesToEncounter(s.readUInt16LE(0), encounterRatesGrass[r]))) : [],
                            hidden_grass: hiddenMons,
                            surfing: surfMons,
                            fishing: fishMons
                        }
                    };
                });

            }
            else {
                //DPPt
                const readEncountersDPPt = (data: Buffer, offset: number, rates: number[]) => this.ReadArray(data, offset, 8, rates.length).map((e, i) => (<Pokemon.EncounterMon>{
                    level: e.readUInt32LE(0),
                    speciesId: e.readUInt32LE(4),
                    rate: rates[i],
                    species: this.GetSpecies(e.readUInt32LE(4))
                }));

                const readWaterEncountersDPPt = (data: Buffer, offset: number, rates: number[], requiredItem?: Pokemon.Item) => this.ReadArray(data, offset, 8, rates.length).map((e, i) => ({
                    level: e.readUInt32LE(0) >> 8,
                    maxLevel: e.readUInt16LE(0) % 0x100,
                    speciesId: e.readUInt32LE(4),
                    rate: rates[i],
                    species: this.GetSpecies(e.readUInt32LE(4)),
                    requiredItem
                } as Pokemon.EncounterMon));

                encounters = encounterNarc.files.map(f => {
                    const encounterSet: Pokemon.Encounters = { morn: {}, day: {}, nite: {} };
                    const grassRate = f.readUInt32LE(0);
                    if (grassRate > 0) {
                        const mornGrassEncounters = readEncountersDPPt(f, 4, encounterRatesGrass);
                        const dayGrassEncounters = mornGrassEncounters.map(e => ({ ...e }));
                        const niteGrassEncounters = mornGrassEncounters.map(e => ({ ...e }));
                        const hiddenGrassEncounters = new Array<Pokemon.EncounterMon>();

                        // Time of day replacements
                        for (let i = 0; i < 4; i++) {
                            const pknum = f.readUInt32LE(108 + 4 * i);
                            if (pknum >= 1 && pknum <= pokemonCount) {
                                (i < 2 ? dayGrassEncounters : niteGrassEncounters)[dpptAlternateSlots[i + 2]].speciesId = pknum;
                                (i < 2 ? dayGrassEncounters : niteGrassEncounters)[dpptAlternateSlots[i + 2]].species = this.GetSpecies(pknum);
                            }
                        }

                        // Other conditional replacements (swarm, radar, GBA)
                        for (let i = 0; i < 20; i++) {
                            if (i >= 2 && i <= 5) {
                                // Time of day slot, handled already
                                continue;
                            }
                            const pknum = f.readUInt32LE(100 + i * 4 + (i >= 10 ? 24 : 0));
                            if (pknum >= 1 && pknum <= pokemonCount) {
                                hiddenGrassEncounters.push({
                                    ...mornGrassEncounters[dpptAlternateSlots[i]],
                                    speciesId: pknum,
                                    species: this.GetSpecies(pknum),
                                    categoryIcon: dpptAlternateSlotCategory[i],
                                    requiredItem: dpptAlternateSlotsItems[i] && this.GetItem(dpptAlternateSlotsItems[i]) || undefined
                                });
                            }
                        }
                        encounterSet.morn.grass = this.CombineDuplicateEncounters(mornGrassEncounters);
                        encounterSet.day.grass = this.CombineDuplicateEncounters(dayGrassEncounters);
                        encounterSet.nite.grass = this.CombineDuplicateEncounters(niteGrassEncounters);
                        encounterSet.morn.hidden_grass = encounterSet.day.hidden_grass = encounterSet.nite.hidden_grass = this.CombineDuplicateEncounters(hiddenGrassEncounters);
                    }

                    // surf, filler, old rod, good rod, super rod
                    const waterNeededItems = [undefined, undefined, ...this.items.filter(i => rodExp.test(i.name)).map(r => r.id)];
                    const waterEncounters = this.ReadArray(f, 204, 44, 5).map((water, i) => water.readInt32LE(0) > 0 ? readWaterEncountersDPPt(water, 4, encounterRatesWater, waterNeededItems[i] && this.GetItem(waterNeededItems[i])) : undefined);
                    encounterSet.morn.surfing = encounterSet.day.surfing = encounterSet.nite.surfing = this.CombineDuplicateEncounters(waterEncounters[0]);
                    encounterSet.morn.fishing = encounterSet.day.fishing = encounterSet.nite.fishing = this.CombineDuplicateEncounters([...(waterEncounters[2] || []), ...(waterEncounters[3] || []), ...(waterEncounters[4] || [])]);
                    return encounterSet;
                });
            }

            const numMapHeaders = this.readDataFile(config.MapTableFile).byteLength / 16;
            for (let m = 0; m < numMapHeaders; m++) {
                const baseOffset = parseInt(config.MapTableARM9Offset, 16) + m * 24;
                const mapNameIndex = (parseInt(config.MapTableNameIndexSize) == 2)
                    ? arm9.readUInt16LE(baseOffset + 18)
                    : arm9[baseOffset + 18];
                let wildSet: number;
                let wildSetReject = 0xFFFF;
                if (config.Type == "HGSS") {
                    wildSet = arm9[baseOffset];
                    wildSetReject = 0xFF;
                }
                else
                    wildSet = arm9.readUInt16LE(baseOffset + 14);
                this.maps.push(<Pokemon.Map>{
                    id: m,
                    name: mapNames[mapNameIndex],
                    encounters: wildSet != wildSetReject ? encounters[wildSet] : emptyEncounters
                });
            }


            this.areas = mapNames;

            this.trainers = trDataNarc.files.map((trData, i) => {
                const pokeType = trData[0];
                let party: { level: number, ability: string, aiLevel: number, species: Pokemon.Species, moves?: Pokemon.Move[], item?: Pokemon.Item }[]
                    = this.ReadArray(trPokeNarc.files[i], 0, 6 + (pokeType & 2 ? 2 : 0) + (pokeType & 1 ? 8 : 0) + (config.Type != 'DP' ? 2 : 0), trData[3]).map(trPoke => ({
                        aiLevel: trPoke[0],
                        ability: abilityNames[trPoke[1]],
                        level: trPoke[2],
                        species: this.GetSpecies(trPoke.readUInt16LE(4) & 0x1FF),
                        item: pokeType & 2 ? this.GetItem(trPoke.readUInt16LE(6)) : undefined,
                        moves: pokeType & 1 ? this.ReadArray(trPoke, pokeType & 2 ? 8 : 6, 2, 4).map(m => this.GetMove(m.readUInt16LE(0))) : undefined
                    }));
                return {
                    spriteId: trData[1],
                    classId: trData[1],
                    className: trClassNames[trData[1]],
                    id: i,
                    name: trNames[i],
                    party
                } as Pokemon.Trainer;
            });

            this.moveLearns = {};
            moveLearnNarc.files.forEach((file, i) => this.moveLearns[i] = this.ReadArray(file, 0, 2).map(data => (<Pokemon.MoveLearn>{
                level: (data[1] & 0xFE) >> 1,
                ...this.GetMove(data.readUInt16LE(0) & 0x1FF)
            })));


            this.evolutionMethods = [undefined,
                /* 1*/ this.EvolutionMethod.Happiness,
                /* 2*/ this.EvolutionMethod.HappinessDay,
                /* 3*/ this.EvolutionMethod.HappinessNight,
                /* 4*/ this.EvolutionMethod.Level,
                /* 5*/ this.EvolutionMethod.Trade,
                /* 6*/ this.EvolutionMethod.TradeItem,
                /* 7*/ this.EvolutionMethod.Stone,
                /* 8*/ this.EvolutionMethod.LevelAttackHigher,
                /* 9*/ this.EvolutionMethod.LevelAtkDefEqual,
                /*10*/ this.EvolutionMethod.LevelDefenseHigher,
                /*11*/ this.EvolutionMethod.LevelLowPV,
                /*12*/ this.EvolutionMethod.LevelHighPV,
                /*13*/ this.EvolutionMethod.LevelSpawnPokemon,
                /*14*/ this.EvolutionMethod.LevelIsSpawned,
                /*15*/ this.EvolutionMethod.LevelHighBeauty,
                /*16*/ this.EvolutionMethod.StoneMale,
                /*17*/ this.EvolutionMethod.StoneFemale,
                /*18*/ this.EvolutionMethod.LevelItemDay,
                /*19*/ this.EvolutionMethod.LevelItemNight,
                /*20*/ this.EvolutionMethod.LevelWithMove,
                /*21*/ this.EvolutionMethod.LevelWithOtherSpecies,
                /*22*/ this.EvolutionMethod.LevelMale,
                /*23*/ this.EvolutionMethod.LevelFemale,
                /*24*/ this.EvolutionMethod.LevelElectifiedArea,
                /*25*/ this.EvolutionMethod.LevelMossRock,
                /*26*/ this.EvolutionMethod.LevelIcyRock
            ]
            this.readEvolutions(evoNarc);

        }
    }
}