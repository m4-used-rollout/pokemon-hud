/// <reference path="../gba.ts" />

namespace RomReader {

    const typeNames = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
    const contestTypes = ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'];
    const contestEffects = ['The appeal effect of this move is constant.', 'Prevents the user from being startled.', 'Startles the previous appealer.', 'Startles all previous appealers.', 'Affects appealers other than startling them.', 'Appeal effect may change.', 'The appeal order changes for the next round.'];

    const grassEncounterRates = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1];
    const rockSmashEncounterRates = [60, 30, 5, 4, 1];
    const surfEncounterRates = [60, 30, 5, 4, 1];
    const fishingEncounterRates = [70, 30, 60, 20, 20, 40, 30, 15, 10, 5];
    const fishingRequiredRods = [262, 262, 263, 263, 263, 264, 264, 264, 264, 264]

    const wildPokemonPtrMarker = '0348048009E00000FFFF0000';
    const mapBanksPtrMarker = '80180068890B091808687047';

    const touhouTypes = ["Illusion", "Dark", "Flying", "Miasma", "Earth", "Beast", "Dream", "Ghost", "Steel", "???", "Fire", "Water", "Native", "Wind", "Reason", "Ice", "Faith", "Heart"];
    const touhouJohtoMapNames = [{ mapBank: 47, mapId: 7, name: "Mt. Silver Gate" }, { mapBank: 47, mapId: 8, name: "Route 26" }, { mapBank: 47, mapId: 9, name: "Route 27" },
    { mapBank: 47, mapId: 10, name: "Cherrygrove City" }, { mapBank: 47, mapId: 11, name: "Route 30" }, { mapBank: 47, mapId: 12, name: "Route 31" }, { mapBank: 47, mapId: 13, name: "Violet City" },
    { mapBank: 47, mapId: 14, name: "Route 32" }, { mapBank: 47, mapId: 15, name: "Azalea Town" }, { mapBank: 47, mapId: 16, name: "Route 34" }, { mapBank: 47, mapId: 17, name: "Goldenrod City" },
    { mapBank: 47, mapId: 18, name: "Route 35" }, { mapBank: 47, mapId: 19, name: "Route 37" }, { mapBank: 47, mapId: 20, name: "Ecruteak City" }, { mapBank: 47, mapId: 21, name: "Route 38" },
    { mapBank: 47, mapId: 22, name: "Route 39" }, { mapBank: 47, mapId: 23, name: "Olivine City" }, { mapBank: 47, mapId: 24, name: "Route 40" }, { mapBank: 47, mapId: 25, name: "Route 41" },
    { mapBank: 47, mapId: 26, name: "Cianwood City" }, { mapBank: 47, mapId: 27, name: "Route 42" }, { mapBank: 47, mapId: 28, name: "Mahogany Town" }, { mapBank: 47, mapId: 29, name: "Route 43" },
    { mapBank: 47, mapId: 30, name: "Lake of Rage" }, { mapBank: 47, mapId: 31, name: "Route 44" }, { mapBank: 47, mapId: 32, name: "Route 45" }, { mapBank: 47, mapId: 33, name: "Route 46" },
    { mapBank: 47, mapId: 34, name: "Route 28" }, { mapBank: 47, mapId: 35, name: "Blackthorn City" }, { mapBank: 47, mapId: 36, name: "Tohjo Falls" }, { mapBank: 47, mapId: 37, name: "Dark Cave" },
    { mapBank: 47, mapId: 38, name: "Union Cave" }, { mapBank: 47, mapId: 39, name: "Ilex Forest" }, { mapBank: 47, mapId: 40, name: "National Park" }, { mapBank: 47, mapId: 41, name: "Whirl Islands" },
    { mapBank: 47, mapId: 42, name: "Whirl Islands" }, { mapBank: 47, mapId: 43, name: "Mt. Mortar" }, { mapBank: 47, mapId: 44, name: "Mt. Mortar" }, { mapBank: 47, mapId: 45, name: "Mt. Mortar" },
    { mapBank: 47, mapId: 46, name: "Ice Path" }, { mapBank: 47, mapId: 47, name: "Ice Path" }, { mapBank: 47, mapId: 48, name: "Dragon's Den" }, { mapBank: 47, mapId: 49, name: "Mt. Silver" },
    { mapBank: 47, mapId: 50, name: "Mt. Silver" }, { mapBank: 47, mapId: 51, name: "Mt. Silver" }, { mapBank: 47, mapId: 52, name: "The Underground" }, { mapBank: 47, mapId: 53, name: "The Underground" },
    { mapBank: 47, mapId: 54, name: "Slowpoke Well" }, { mapBank: 47, mapId: 55, name: "Rocket Hideout" }, { mapBank: 47, mapId: 56, name: "Rocket Hideout" }, { mapBank: 47, mapId: 57, name: "Radio Tower" },
    { mapBank: 47, mapId: 58, name: "The Underground" }, { mapBank: 47, mapId: 59, name: "Route 29" }, { mapBank: 47, mapId: 60, name: "New Bark Town" }, { mapBank: 47, mapId: 61, name: "Route 34" },
    { mapBank: 47, mapId: 62, name: "Sprout Tower" }, { mapBank: 47, mapId: 63, name: "Burned Tower" }, { mapBank: 47, mapId: 64, name: "Burned Tower" }, { mapBank: 47, mapId: 68, name: "Ecruteak City" },
    { mapBank: 47, mapId: 69, name: "Bellchime Trail" }, { mapBank: 47, mapId: 70, name: "Tin Tower" }, { mapBank: 47, mapId: 71, name: "Tin Tower" }, { mapBank: 47, mapId: 72, name: "Tin Tower" },
    { mapBank: 47, mapId: 73, name: "Goldenrod City" }, { mapBank: 47, mapId: 74, name: "Ruins of Alph" }, { mapBank: 47, mapId: 80, name: "The Underground" },
    { mapBank: 45, mapId: 0, name: "Goldenrod City" }, { mapBank: 45, mapId: 1, name: "Goldenrod City" }, { mapBank: 45, mapId: 2, name: "Goldenrod City" }, { mapBank: 45, mapId: 3, name: "Goldenrod City" },
    { mapBank: 45, mapId: 4, name: "Goldenrod City" }, { mapBank: 45, mapId: 6, name: "Cherrygrove City" }, { mapBank: 45, mapId: 7, name: "Violet City" }, { mapBank: 45, mapId: 8, name: "Azalea Town" },
    { mapBank: 45, mapId: 9, name: "Ecruteak City" }, { mapBank: 45, mapId: 10, name: "Olivine City" }, { mapBank: 45, mapId: 11, name: "Cianwood City" }, { mapBank: 45, mapId: 12, name: "Mahogany Town" },
    { mapBank: 45, mapId: 13, name: "Blackthorn City" }, { mapBank: 45, mapId: 14, name: "The Underground" }, { mapBank: 45, mapId: 15, name: "Goldenrod City" }, { mapBank: 45, mapId: 16, name: "Goldenrod City" },
    { mapBank: 46, mapId: 0, name: "Violet City" }, { mapBank: 46, mapId: 1, name: "Azalea Town" }, { mapBank: 46, mapId: 2, name: "Goldenrod City" }, { mapBank: 46, mapId: 3, name: "Ecruteak City" },
    { mapBank: 46, mapId: 4, name: "Olivine City" }, { mapBank: 46, mapId: 5, name: "Cianwood City" }, { mapBank: 46, mapId: 6, name: "Mahogany Town" }, { mapBank: 46, mapId: 7, name: "Blackthorn City" },
    { mapBank: 44, mapId: 0, name: "Cherrygrove City" }, { mapBank: 44, mapId: 1, name: "Violet City" }, { mapBank: 44, mapId: 2, name: "Azalea Town" }, { mapBank: 44, mapId: 3, name: "Goldenrod City" },
    { mapBank: 44, mapId: 4, name: "Ecruteak City" }, { mapBank: 44, mapId: 5, name: "Olivine City" }, { mapBank: 44, mapId: 6, name: "CIanwood City" }, { mapBank: 44, mapId: 7, name: "Mahogany Town" },
    { mapBank: 44, mapId: 8, name: "Blackthorn City" }, { mapBank: 44, mapId: 9, name: "Route 32" }, { mapBank: 44, mapId: 10, name: "Route 28" }, { mapBank: 44, mapId: 11, name: "Lotus Land" },

    ];

    interface Gen3Item extends Pokemon.Item {
        isPokeball: boolean;
        //isCandy: boolean; //TTH
    }

    // export interface TTHMap extends Pokemon.Map {
    //     author?: string;
    //     puzzleNo?: number;
    //     trainers: Pokemon.Trainer[];
    // }

    export class Gen3 extends GBAReader {
        public config: PGEINI;

        private puzzleList: { id: number, bank: number }[]; //TTH

        constructor(romFileLocation: string, iniFileLocation: string = "pge.ini") {
            super(romFileLocation, iniFileLocation);
            const romData = this.loadROM();
            const config = this.config = this.LoadConfig(romData);
            this.types = typeNames;
            if (romFileLocation.indexOf("touhoumon.gba") >= 0) {
                this.types = touhouTypes;
                this.shouldFixCaps = false; //some of Touhoumon is already decapped
            }
            this.abilities = this.ReadAbilities(romData, config);
            this.pokemon = this.ReadPokeData(romData, config);
            this.items = this.ReadItemData(romData, config);
            this.ballIds = this.items.filter((i: Gen3Item) => i.isPokeball).map(i => i.id);
            this.moves = this.ReadMoveData(romData, config);
            this.GetTMHMNames(romData, config);
            this.shouldFixCaps = true;
            this.trainers = this.ReadTrainerData(romData, config);
            this.areas = this.ReadMapLabels(romData, config);
            this.puzzleList = [{ id: -1, bank: -1 },
            ...(config.PuzzleList ?
                this.ReadStridedData(romData, parseInt(config.PuzzleList, 16), 2, parseInt(config.PuzzleCount, 16), true, data => data.readUInt16LE(0) == 0xFFFF)
                    .map(m => ({ id: m[0], bank: m[1] }))
                : [])]; //TTH
            this.maps = this.ReadMaps(romData, config);
            this.FindMapEncounters(romData, config);
            this.moveLearns = this.ReadMoveLearns(romData, config);
            if (romFileLocation.indexOf("touhoumon.gba") >= 0) {
                this.shouldFixCaps = false; //Touhoumon is already decapped
                this.maps.forEach(m => touhouJohtoMapNames.find(jm => m.id == jm.mapId && m.bank == jm.mapBank) && (m.name = touhouJohtoMapNames.find(jm => m.id == jm.mapId && m.bank == jm.mapBank).name));
            }
            this.ReadEvolutions(romData, config);

            // console.log("[\n" + this.moves.map(p => JSON.stringify(p)).join(',\n') + "\n]");
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 16) == 16; //Balance/Soul Badge
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            if (!map.encounters)
                return {};
            return map.encounters.all;
        }

        private CurrentMapIn(id: number, bank: number, mapArr: number[][]) {
            return mapArr.some(m => m[0] == bank && ((m.length == 2 && m[1] == id) || m[1] <= id && m[2] >= id));
        }
        IsUnknownTrainerMap(id: number, bank: number) {
            //return false; //TTH
            switch (this.romHeader) {
                case "BPEE":
                    return false; //Sirius
                    return this.CurrentMapIn(id, bank, [
                        [9, 2, 4],      //Slateport Battle Tent
                        [5, 1, 3],      //Fallarbor Battle Tent
                        [6, 0, 2],      //Verdanturf Battle Tent
                        [26, 4, 8],     //Battle Frontier
                        [26, 14, 55],   //Battle Frontier
                        [26, 60, 65],   //Trainer Hill
                        [26, 88]        //Trainer Hill
                    ]);
                case "BPRE":
                    return this.CurrentMapIn(id, bank, [
                        [2, 1, 11]   //Trainer Tower
                    ]);
                default:
                    return false;
            }
        }

        private isFRLG(config: PGEINI) {
            return ['BPR', 'BPG'].indexOf(config.Header.substring(0, 3)) >= 0;
        }

        private ReadAbilities(romData: Buffer, config: PGEINI) {
            return this.ReadStridedData(romData, parseInt(config.AbilityNames, 16), 13, parseInt(config.NumberOfAbilities)).map(a => this.FixAllCaps(this.ConvertText(a)));
        }

        private ReadPokeData(romData: Buffer, config: PGEINI) {
            let pokemonNames = this.ReadStridedData(romData, parseInt(config.PokemonNames, 16), 11, parseInt(config.NumberOfPokemon)).map(p => this.FixAllCaps(this.ConvertText(p)));
            let dexMapping = this.ReadStridedData(romData, parseInt(config.NationalDexTable, 16), 2, parseInt(config.NumberOfPokemon)).map(n => n.readInt16LE(0));
            dexMapping.unshift(0);
            return this.ReadStridedData(romData, parseInt(config.PokemonData, 16), 28, parseInt(config.NumberOfPokemon)).map((data, i) => (<Pokemon.Species>{
                name: pokemonNames[i],
                id: i,
                dexNumber: dexMapping[i],
                baseStats: {
                    hp: data[0],
                    atk: data[1],
                    def: data[2],
                    speed: data[3],
                    spatk: data[4],
                    spdef: data[5]
                },
                type1: this.types[data[6]],
                type2: this.types[data[7]],
                catchRate: data[8],
                baseExp: data[9],
                //effortYield: data.readInt16LE(10),
                //item1: data.readInt16LE(12),
                //item2: data.readInt16LE(14),
                genderRatio: data[16],
                eggCycles: data[17],
                //baseFriendship: data[18],
                growthRate: expCurveNames[data[19]],
                expFunction: expCurves[data[19]],
                eggGroup1: eggGroups[data[20]],
                eggGroup2: eggGroups[data[21]],
                abilities: [this.abilities[data[22]], this.abilities[data[23]]],
                //safariZoneRate: data[24],
                //dexColor: data[25] % 128,
                doNotflipSprite: !!(data[25] & 128)
            }));
        }

        private ReadTrainerData(romData: Buffer, config: PGEINI) {
            let trainerClasses = this.ReadStridedData(romData, parseInt(config.TrainerClasses, 16), 13, parseInt(config.NumberOfTrainerClasses)).map(tc => this.FixAllCaps(this.ConvertText(tc)));
            return this.ReadStridedData(romData, parseInt(config.TrainerTable, 16), 40, parseInt(config.NumberOfTrainers)).map((data, i) => (<Pokemon.Trainer>{
                classId: data[1],
                className: trainerClasses[data[1]],
                id: i,
                name: this.FixAllCaps(this.ConvertText(data.slice(4))),
                spriteId: data[3],
                gender: data[2] & 128 ? "Female" : "Male",
            }));
        }

        private ReadItemData(romData: Buffer, config: PGEINI) {
            const itemStructExtensionBytes = 0; // 16 for TriHard Emerald and TTH
            return this.ReadStridedData(romData, parseInt(config.ItemData, 16), 44 + itemStructExtensionBytes, parseInt(config.NumberOfItems)).map((data, i) => (<Gen3Item>{
                name: this.FixAllCaps(this.ConvertText(data)),
                id: i,
                // price: data.readInt16LE(16),
                // holdEffect: data[18],
                // parameter: data[19],
                // description: this.ConvertText(romData.slice(this.readRomPtr(data, 20), this.readRomPtr(data, 20) + 255)),
                // mystery: data.readInt16LE(24),
                isKeyItem: data.readInt16LE(24 + itemStructExtensionBytes) > 0,
                // pocket: data[26],
                // type: data[27],
                // fieldUsePtr: data.readInt32LE(28),
                // battleUsage: data.readInt32LE(32),
                // battleUsagePtr: data.readInt32LE(36),
                // extraParameter: data.readInt32LE(40),
                isPokeball: data.readInt32LE(32 + itemStructExtensionBytes) == 2 && data.readInt32LE(40) == data[27]
            }));
        }

        private ReadMoveData(romData: Buffer, config: PGEINI) {
            let moveNames = this.ReadStridedData(romData, parseInt(config.AttackNames, 16), 13, parseInt(config.NumberOfAttacks) + 1).map(p => this.FixAllCaps(this.ConvertText(p)));
            let contestData = this.ReadStridedData(romData, parseInt(config.ContestMoveEffectData, 16), 4, parseInt(config.NumberOfAttacks)).map(data => ({
                effect: contestEffects[data[0]],
                appeal: new Array(Math.floor(data[1] / 10)).fill('♡').join(''),
                jamming: new Array(Math.floor(data[2] / 10)).fill('♥').join('')
                // Padding 1 byte
            }));
            let contestMoveData = this.ReadStridedData(romData, parseInt(config.ContestMoveData, 16), 8, parseInt(config.NumberOfAttacks) + 1).map(data => ({
                descriptionId: data[0],
                contestType: contestTypes[data[1]],
                effect: contestData[data[0]].effect,
                appeal: contestData[data[0]].appeal,
                jamming: contestData[data[0]].jamming
                // Combo Identifier	byte
                // Combos	3 bytes
                // Padding	2 bytes
            }));
            return this.ReadStridedData(romData, parseInt(config.AttackData, 16), 12, parseInt(config.NumberOfAttacks) + 1).map((data, i) => (<Pokemon.Move>{
                id: i,
                name: moveNames[i],
                // effect: data[0],
                basePower: data[1],
                type: this.types[data[2]],
                accuracy: data[3],
                basePP: data[4],
                // effectAccuracy: data[5],
                // affectsWhom: data[6],
                priority: data.readInt8(7),
                // flags: {
                //     makesContact: !!(data[8] & 1),
                //     affectedByProtect: !!(data[8] & 2),
                //     affectedByMagicCoat: !!(data[8] & 4),
                //     affectedBySnatch: !!(data[8] & 8),
                //     usedByMirrorMove: !!(data[8] & 16),
                //     affectedByKingsRock: !!(data[8] & 32)
                // }
                //3 bytes padding
                contestData: contestMoveData[i] ? {
                    type: contestMoveData[i].contestType,
                    effect: contestMoveData[i].effect,
                    appeal: contestMoveData[i].appeal,
                    jamming: contestMoveData[i].jamming
                } : null
            }));
        }

        private GetTMHMNames(romData: Buffer, config: PGEINI) {
            const tmHmExp = /^(T|H)M(\d+)/i;
            let moveMap = this.ReadStridedData(romData, parseInt(config.TMData, 16), 2, parseInt(config.TotalTMsPlusHMs)).map(m => m.readUInt16LE(0));
            let TMs = this.items.filter(i => tmHmExp.test(i.name));
            TMs.forEach(tm => {
                let tmParse = tmHmExp.exec(tm.name);
                let tmNo = parseInt(tmParse[2]) + (tmParse[1] == 'H' ? parseInt(config.TotalTMs) : 0) - 1;
                tm.name += ` ${this.GetMove(moveMap[tmNo]).name}`
            });
        }

        private ReadMapLabels(romData: Buffer, config: PGEINI) {
            if (romData.readUInt32LE(parseInt(config.MapLabelData, 16)) < 0x8000000)
                return this.ReadStridedData(romData, parseInt(config.MapLabelData, 16), 8, parseInt(config.NumberOfMapLabels)).map(data => {
                    const addr = this.ReadRomPtr(data, 4);
                    return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20))).replace('ë', "Aqua"); //Sapphire
                });
            return this.ReadStridedData(romData, parseInt(config.MapLabelData, 16), this.isFRLG(config) ? 4 : 8, parseInt(config.NumberOfMapLabels))
                .map(ptr => {
                    const addr = this.ReadRomPtr(ptr, 0);
                    return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20)));
                });
        }

        private ReadMaps(romData: Buffer, config: PGEINI) {
            let mapBanksPtr = /*parseInt(config.Pointer2PointersToMapBanks || "0", 16) ||*/ this.FindPtrFromPreceedingData(romData, mapBanksPtrMarker);
            const mapLabelOffset = parseInt(config.MapLabelOffset || "0", 16);
            return this.ReadPtrBlock(romData, mapBanksPtr)
                .map((bankPtr, b, arr) => this.ReadPtrBlock(romData, bankPtr, arr[b + 1]).map(ptr => romData.slice(ptr, ptr + 32))
                    .map((mapHeader, m) => (<Pokemon.Map>{//(<TTHMap>{
                        bank: b,
                        id: m,
                        areaId: mapHeader[0x14] - mapLabelOffset,
                        areaName: this.areas[mapHeader[0x14] - mapLabelOffset],
                        name: this.areas[mapHeader[0x14] - mapLabelOffset],
                        // name: this.GetPuzzleName(romData, mapHeader.readUInt32LE(0x8) - 0x8000000) || this.areas[mapHeader[0x14] - mapLabelOffset],
                        // author: this.GetPuzzleAuthor(romData, mapHeader.readUInt32LE(0x8) - 0x8000000), //TTH
                        // trainers: this.GetPuzzleTrainers(romData, mapHeader.readUInt32LE(0x1C) - 0x8000000, config), //TTH
                        // puzzleNo: this.puzzleList.findIndex(p => p.id == m && p.bank == b), //TTH
                        encounters: {}
                    }))
                ).reduce((allMaps, currBank) => Array.prototype.concat.apply(allMaps, currBank), []);
        }

        //Trick or Treat House
        private GetPuzzleTrainers(romData: Buffer, mapTrainerTableAddr: number, config: PGEINI): Pokemon.Trainer[] {
            if (mapTrainerTableAddr < 0)
                return [];

            const trainerClasses = this.ReadStridedData(romData, parseInt(config.TrainerClasses, 16), 13, parseInt(config.NumberOfTrainerClasses)).map(tc => this.FixAllCaps(this.ConvertText(tc)));
            return this.ReadStridedData(romData, mapTrainerTableAddr, 36, 32, true, data => data.readUInt16LE(0) == 0).map((data, i) => (<Pokemon.Trainer>{
                classId: data[1],
                className: trainerClasses[data[1]],
                id: i + 1,
                name: this.FixAllCaps(this.ConvertText(data.slice(4))),
                spriteId: data[3],
                gender: data[2] & 128 ? "Female" : "Male",
            }));
        }

        //Trick or Treat House
        private GetPuzzleName(romData: Buffer, mapScriptPtr: number) {
            return this.ReadStridedData(romData, mapScriptPtr, 5, 0, true, data => data[0] == 0).filter(data => data[0] == 20).map(data => this.ConvertText(romData.slice(data.readUInt32LE(1) - 0x8000000))).pop();
        }

        private GetPuzzleAuthor(romData: Buffer, mapScriptPtr: number) {
            return this.ReadStridedData(romData, mapScriptPtr, 5, 0, true, data => data[0] == 0).filter(data => data[0] == 21).map(data => this.ConvertText(romData.slice(data.readUInt32LE(1) - 0x8000000))).pop();
        }

        private FindMapEncounters(romData: Buffer, config: PGEINI) {
            let wildPokemonPtr = this.FindPtrFromPreceedingData(romData, wildPokemonPtrMarker);
            this.ReadStridedData(romData, wildPokemonPtr, 20).forEach(data => {
                let mapBank = data[0], mapId = data[1];
                if (mapBank == 0xFF && mapId == 0xFF)
                    return;
                let map = this.GetMap(mapId, mapBank);
                let rockSmashExp = /[[TH]M\d+ Rock Smash/i
                let rockSmashTmId = (this.items.filter(i => rockSmashExp.test(i.name)).shift() || { id: 0 }).id;
                map.encounters = {
                    all: {
                        grass: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 4), grassEncounterRates),
                        surfing: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 8), surfEncounterRates),
                        hidden_grass: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 12), rockSmashEncounterRates, rockSmashEncounterRates.map(e => rockSmashTmId), true),
                        fishing: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 16), fishingEncounterRates, fishingRequiredRods, true),
                    }
                };
            });
        }

        private ReadEncounterSet(romData: Buffer, setAddr: number, encounterRates: number[], requiredItems: number[] = [], includeGroupRate = false) {
            if (setAddr <= 0)
                return [];
            let setPtr = this.ReadRomPtr(romData, setAddr + 4);
            let groupRate = romData.readInt32LE(setAddr) / 100;
            try {
                return this.CombineDuplicateEncounters(this.ReadStridedData(romData, setPtr, 4, encounterRates.length).map((data, i) => (<Pokemon.EncounterMon>{
                    species: this.GetSpecies(data.readInt16LE(2)),
                    rate: encounterRates[i] * (includeGroupRate ? groupRate : 1),
                    requiredItem: this.GetItem(requiredItems[i])
                })));
            }
            catch (e) {
                console.error(`Could not read encounter set at ${setAddr.toString(16)}->${setPtr.toString(16)}: ${e}`);
                return [];
            }
        }

        private ReadMoveLearns(romData: Buffer, config: PGEINI) {
            const movelearns = {} as { [key: number]: Pokemon.MoveLearn[] };
            this.ReadPtrBlock(romData, parseInt(config.PokemonAttackTable, 16)).forEach((addr, i) => {
                movelearns[i] = this.ReadStridedData(romData, addr, 2).map(data => {
                    const raw = data.readUInt16LE(0);
                    const move = this.GetMove(raw % 0x200);
                    return {
                        level: raw >> 9,
                        id: move.id,
                        accuracy: move.accuracy,
                        basePower: move.basePower,
                        basePP: move.basePP,
                        contestData: move.contestData,
                        name: move.name,
                        type: move.type
                    } as Pokemon.MoveLearn;
                });
            });
            return movelearns;
        }

        private ReadEvolutions(romData: Buffer, config: PGEINI) {
            const evoCount = parseInt(config.NumberOfEvolutionsPerPokemon);
            this.ReadStridedData(romData, parseInt(config.PokemonEvolutions, 16), 8 * evoCount, this.pokemon.length)
                .map(evoData=> this.ReadStridedData(evoData, 0, 8, evoCount)
                    .map(e=>this.ParseEvolution(e.readUInt16LE(0), e.readInt16LE(2), e.readUInt16LE(4)))
                )
                .forEach((evos, i)=>this.pokemon[i] && (this.pokemon[i].evolutions = evos.filter(e=>!!e)));
        }

        evolutionMethods = [undefined,
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
            /*15*/ this.EvolutionMethod.LevelHighBeauty
        ]

    }

}