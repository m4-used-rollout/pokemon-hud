/// <reference path="../gba.ts" />

namespace RomReader {

    const typeNames = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Disease" /*Snakewood*/, "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy", "Fairy", "Fairy", "Fairy", "Fairy", "Fairy"];
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
        data?: string;
        pocket?: string | number;
        pluralName?: string; //TTH
    }

    export interface TTHMap extends Pokemon.Map {
        author?: string;
        puzzleNo?: number;
        trainers: Pokemon.Trainer[];
    }

    export class Gen3 extends GBAReader {
        public config: PGEINI;

        public puzzleList: { id: number, bank: number }[] = []; //TTH
        //public totalPuzzles = 0;
        public gfRomHeader: GFRomHeader;

        stringTerminator = 0xFF;

        constructor(romFileLocation: string, iniFileLocation: string = "pge.ini") {
            super(romFileLocation, iniFileLocation);
            const romData = this.loadROM();
            const config = this.config = this.LoadConfig(romData);
            this.types = typeNames;
            if (romFileLocation.indexOf("touhoumon.gba") >= 0) {
                this.types = touhouTypes;
                this.shouldFixCaps = false; //some of Touhoumon is already decapped
            }
            this.gfRomHeader = this.ParseGFRomHeader(romData);

            // Update INI from Rom Header
            // Doesn't exist for Ruby or Sapphire
            if (this.romHeader != 'AXVE' && this.romHeader != 'AXPE') {
                config.ItemPCOffset = this.gfRomHeader.pcItemsOffset.toString(16);
                config.ItemPocketOffset = this.gfRomHeader.bagItemsOffset.toString(16);
                config.ItemBallOffset = this.gfRomHeader.bagPokeballsOffset.toString(16);
                config.ItemBerriesOffset = this.gfRomHeader.bagBerriesOffset.toString(16);
                config.ItemTMOffset = this.gfRomHeader.bagTMHMsOffset.toString(16);
                config.ItemKeyOffset = this.gfRomHeader.bagKeyItemsOffset.toString(16);
                config.ItemPCCount = this.gfRomHeader.pcItemsCount.toString(16);
                config.ItemPocketCount = this.gfRomHeader.bagCountItems.toString(16);
                config.ItemBallCount = this.gfRomHeader.bagCountPokeballs.toString(16);
                config.ItemBerriesCount = this.gfRomHeader.bagCountBerries.toString(16);
                config.ItemTMCount = this.gfRomHeader.bagCountTMHMs.toString(16);
                config.ItemKeyCount = this.gfRomHeader.bagCountKeyItems.toString(16);

                // config.ItemCandyOffset = this.gfRomHeader.bagCandyOffset.toString(16); //TTH
                // config.ItemCandyCount = this.gfRomHeader.bagCountCandy.toString(16); // TTH

                // config.SaveBlock2Address += "+4"; // TTH
            }

            this.abilities = this.ReadAbilities(romData, config);
            this.pokemon = this.ReadPokeData(romData, config);
            this.items = this.ReadItemData(romData, config);
            this.ballIds = this.items.filter((i: Gen3Item) => i.isPokeball).map(i => i.id);

            // //Blazing Emerald
            // this.ballIds[0] = 4;
            // this.ballIds[1] = 3;
            // this.ballIds[2] = 5;
            // this.ballIds[3] = 2;
            // this.ballIds[4] = 1;

            this.moves = this.ReadMoveData(romData, config);
            this.GetTMHMNames(romData, config);
            // this.shouldFixCaps = false; // Vega/Blazing Emerald
            this.trainers = this.ReadTrainerData(romData, config);
            this.areas = this.ReadMapLabels(romData, config);
            // this.totalPuzzles = parseInt(config.PuzzleCount, 16); //TTH
            // this.puzzleList = [{ id: -1, bank: -1 },
            // ...(config.PuzzleList ?
            //     this.ReadArray(romData, parseInt(config.PuzzleList, 16), 2, this.totalPuzzles, true, data => data.readUInt16LE(0) == 0xFFFF)
            //         .map(m => ({ id: m[0], bank: m[1] }))
            //     : [])]; //TTH
            // this.totalPuzzles = this.totalPuzzles || (this.puzzleList.length - 1); //TTH
            this.maps = this.ReadMaps(romData, config);
            this.FindMapEncounters(romData, config);
            this.moveLearns = this.ReadMoveLearns(romData, config);
            if (romFileLocation.indexOf("touhoumon.gba") >= 0) {
                this.shouldFixCaps = false; //Touhoumon is already decapped
                this.maps.forEach(m => touhouJohtoMapNames.find(jm => m.id == jm.mapId && m.bank == jm.mapBank) && (m.name = touhouJohtoMapNames.find(jm => m.id == jm.mapId && m.bank == jm.mapBank).name));
            }
            this.ReadEvolutions(romData, config);
            if (config.ShinyOdds && romData.readUInt32BE(parseInt(config.ShinyOdds, 16) - 4) == 0x13405840) //if we have an address for Shiny value and it looks like it hasn't moved
                this.shinyChance = romData[parseInt(config.ShinyOdds, 16)] + 1;

            // console.log("[\n" + this.moves.map(p => JSON.stringify(p)).join(',\n') + "\n]");

            if (config.LevelCaps)
                this.ReadLevelCaps(romData, config);
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            if (runState.game == "Nameless")
                return true;
            return (runState.badges & 16) == 16; //Balance/Soul Badge
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            if (!map.encounters)
                return {};
            return map.encounters.all;
        }

        GetCurrentLevelCap(badges: number, champion?: boolean) {
            if (this.levelCaps.length < 2) {
                return this.levelCaps.map(l => l).pop() || 100;
            }
            let badgeCount = 0, i = 1;
            // Stop checking as soon as a badge is not earned (Blazing Emerald)
            while (badges & i && badgeCount < (this.levelCaps.length - 1)) {
                badgeCount++;
                i = i << 1;
            }
            if (champion && badgeCount < (this.levelCaps.length - 1))
                badgeCount++;
            return this.levelCaps[badgeCount];
        }

        private CurrentMapIn(id: number, bank: number, mapArr: number[][]) {
            return mapArr.some(m => m[0] == bank && ((m.length == 2 && m[1] == id) || m[1] <= id && m[2] >= id));
        }
        IsUnknownTrainerMap(id: number, bank: number) {
            // return false; //TTH
            switch (this.romHeader) {
                case "BPEE":
                    //return false; //Sirius
                    return this.CurrentMapIn(id, bank, [
                        [9, 2, 4],      //Slateport Battle Tent
                        [5, 1, 3],      //Fallarbor Battle Tent
                        [6, 0, 2],      //Verdanturf Battle Tent
                        [26, 4, 8],     //Battle Frontier
                        [26, 14, 55],   //Battle Frontier
                        // [26, 60, 65],   //Trainer Hill //Blazing Emerald
                        // [26, 88]        //Trainer Hill //Blazing Emerald
                    ]);
                // case "BPRE":
                //     return this.CurrentMapIn(id, bank, [
                //         [2, 1, 11]   //Trainer Tower
                //     ]);
                default:
                    return false;
            }
        }

        protected isFRLG(config: PGEINI) {
            return ['BPR', 'BPG'].indexOf(config.Header.substring(0, 3)) >= 0;
        }

        protected ReadAbilities(romData: Buffer, config: PGEINI, numAbilities = parseInt(config.NumberOfAbilities)) {
            return this.ReadArray(romData, parseInt(config.AbilityNames, 16), 13, numAbilities).map(a => this.FixAllCaps(this.ConvertText(a)));
        }

        protected ReadPokeData(romData: Buffer, config: PGEINI) {
            let pokemonNames = this.ReadArray(romData, parseInt(config.PokemonNames, 16), 11, parseInt(config.NumberOfPokemon)).map(p => this.FixAllCaps(this.ConvertText(p)));
            let dexMapping = this.ReadArray(romData, parseInt(config.NationalDexTable, 16), 2, parseInt(config.NumberOfPokemon)).map(n => n.readInt16LE(0));
            dexMapping.unshift(0);
            return this.ReadArray(romData, parseInt(config.PokemonData, 16), 28, parseInt(config.NumberOfPokemon)).map((data, i) => (<Pokemon.Species>{
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
                type1: this.types[data[6]] || data[6].toString(),
                type2: this.types[data[7]] || data[7].toString(),
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
                //abilities: [this.ReadAbilities(romData, config, data[22] + 1).pop(), this.ReadAbilities(romData, config, data[23] + 1).pop()], //Allow for ROMs with an unknown number of abilities
                //safariZoneRate: data[24],
                //dexColor: data[25] % 128,
                doNotflipSprite: !!(data[25] & 128)
            }));
        }

        protected ReadTrainerData(romData: Buffer, config: PGEINI) {
            let trainerClasses = this.ReadArray(romData, parseInt(config.TrainerClasses, 16), 13, parseInt(config.NumberOfTrainerClasses)).map(tc => this.FixAllCaps(this.ConvertText(tc)));
            return this.ReadArray(romData, parseInt(config.TrainerTable, 16), 40, parseInt(config.NumberOfTrainers)).map((data, i) => (<Pokemon.Trainer>{
                classId: data[1],
                className: trainerClasses[data[1]],
                id: i,
                name: this.FixAllCaps(this.ConvertText(data.slice(4))),
                spriteId: data[3],
                gender: data[2] & 128 ? "Female" : "Male",
            }));
        }

        protected ReadItemData(romData: Buffer, config: PGEINI) {
            const itemStructExtensionBytes = 0; //16 for TriHard Emerald and TTH2019
            return this.ReadArray(romData, parseInt(config.ItemData, 16), 44 + itemStructExtensionBytes, parseInt(config.NumberOfItems)).map((data, i) => (<Gen3Item>{
                name: this.FixAllCaps(this.ConvertText(data)),
                // name: this.ConvertText(romData.slice(this.ReadRomPtr(data, 0), 255 + this.ReadRomPtr(data, 0))), //TTH
                // pluralName: this.ConvertText(romData.slice(data.readInt32LE(4) > 0 && !data.readInt32LE(8) ? this.ReadRomPtr(data, 4) : this.ReadRomPtr(data, 0), 255 + (data.readInt32LE(4) > 0 ? this.ReadRomPtr(data, 4) : this.ReadRomPtr(data, 0)))) + (data.readInt32LE(4) || data.readInt32LE(8) ? "" : "s"), //TTH
                id: i,
                // price: data.readInt16LE(16),
                // holdEffect: data[18],
                // parameter: data[19],
                // description: this.ConvertText(romData.slice(this.ReadRomPtr(data, 20), this.ReadRomPtr(data, 20) + 255)),
                // mystery: data.readInt16LE(24),
                // isKeyItem: data.readInt16LE(24 + itemStructExtensionBytes) > 0,
                isKeyItem: data[26] == (this.isFRLG(config) ? 1 : 4) || data.readInt16LE(24 + itemStructExtensionBytes) > 0,
                // pocket: data[26],
                // type: data[27],
                // fieldUsePtr: data.readInt32LE(28),
                // battleUsage: data.readInt32LE(32),
                // battleUsagePtr: data.readInt32LE(36),
                // extraParameter: data.readInt32LE(40),
                isPokeball: data[26 + itemStructExtensionBytes] == 2, // && data.readInt32LE(40) == data[27],
                // data: data.toString("hex")
            }));
        }

        protected ReadMoveData(romData: Buffer, config: PGEINI) {
            let moveNames = this.ReadArray(romData, parseInt(config.AttackNames, 16), 13, parseInt(config.NumberOfAttacks) + 1).map(p => this.FixAllCaps(this.ConvertText(p)));
            let contestData = this.ReadArray(romData, parseInt(config.ContestMoveEffectData, 16), 4, parseInt(config.NumberOfAttacks)).map(data => ({
                effect: contestEffects[data[0]],
                appeal: new Array(Math.floor(data[1] / 10)).fill('♡').join(''),
                jamming: new Array(Math.floor(data[2] / 10)).fill('♥').join('')
                // Padding 1 byte
            }));
            let contestMoveData = this.ReadArray(romData, parseInt(config.ContestMoveData, 16), 8, parseInt(config.NumberOfAttacks) + 1).map(data => ({
                descriptionId: data[0],
                contestType: contestTypes[data[1]],
                effect: contestData[data[0]].effect,
                appeal: contestData[data[0]].appeal,
                jamming: contestData[data[0]].jamming
                // Combo Identifier	byte
                // Combos	3 bytes
                // Padding	2 bytes
            }));
            return this.ReadArray(romData, parseInt(config.AttackData, 16), 12, parseInt(config.NumberOfAttacks) + 1).map((data, i) => (<Pokemon.Move>{
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

        protected GetTMHMNames(romData: Buffer, config: PGEINI) {
            const tmHmExp = /^(T|H)M(\d+)/i;
            let moveMap = this.ReadArray(romData, parseInt(config.TMData, 16), 2, parseInt(config.TotalTMsPlusHMs)).map(m => m.readUInt16LE(0));
            let TMs = this.items.filter(i => tmHmExp.test(i.name));
            TMs.forEach(tm => {
                let tmParse = tmHmExp.exec(tm.name);
                let tmNo = parseInt(tmParse[2]) + (tmParse[1] == 'H' ? parseInt(config.TotalTMs) : 0) - 1;
                tm.name += ` ${this.GetMove(moveMap[tmNo]).name}`
            });
        }

        protected ReadMapLabels(romData: Buffer, config: PGEINI) {
            if (romData.readUInt32LE(parseInt(config.MapLabelData, 16)) < 0x8000000)
                return this.ReadArray(romData, parseInt(config.MapLabelData, 16), 8, parseInt(config.NumberOfMapLabels)).map(data => {
                    const addr = this.ReadRomPtr(data, 4);
                    return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20))).replace('ë', "Aqua"); //Sapphire
                });
            return this.ReadArray(romData, parseInt(config.MapLabelData, 16), this.isFRLG(config) ? 4 : 8, parseInt(config.NumberOfMapLabels))
                .map(ptr => {
                    const addr = this.ReadRomPtr(ptr, 0);
                    return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20)));
                });
        }

        protected ReadMaps(romData: Buffer, config: PGEINI) {
            let mapBanksPtr = /*parseInt(config.Pointer2PointersToMapBanks || "0", 16) ||*/ this.FindPtrFromPreceedingData(romData, mapBanksPtrMarker);
            const mapLabelOffset = parseInt(config.MapLabelOffset || "0", 16);
            //this.totalPuzzles = mapLabelOffset;
            return this.ReadPtrBlock(romData, mapBanksPtr)
                .map((bankPtr, b, arr) => this.ReadPtrBlock(romData, bankPtr, arr[b + 1]).map(ptr => romData.slice(ptr, ptr + 32))
                    .map((mapHeader, m) => /*(<TTHMap>{*/(<Pokemon.Map>{
                        bank: b,
                        id: m,
                        areaId: mapHeader[0x14] - mapLabelOffset,
                        areaName: this.areas[mapHeader[0x14] - mapLabelOffset],
                        name: this.areas[mapHeader[0x14] - mapLabelOffset],
                        // name: this.GetPuzzleName(romData, mapHeader.readUInt32LE(0x8) - 0x8000000) || this.areas[mapHeader[0x14] - mapLabelOffset], //TTH
                        // author: this.GetPuzzleAuthor(romData, mapHeader.readUInt32LE(0x8) - 0x8000000), //TTH
                        // trainers: this.GetPuzzleTrainers(romData, mapHeader.readUInt32LE(0x1C) - 0x8000000, config), //TTH
                        // puzzleNo: this.puzzleList.findIndex(p => p.id == m && p.bank == b), //TTH
                        encounters: {}
                    }))
                ).reduce((allMaps, currBank) => Array.prototype.concat.apply(allMaps, currBank), []);
        }

        // TrainerIsRival(id: number, classId: number) {
        //     return classId == 89; //Vega
        // }

        // //Trick or Treat House
        // protected GetPuzzleTrainers(romData: Buffer, mapTrainerTableAddr: number, config: PGEINI): Pokemon.Trainer[] {
        //     if (mapTrainerTableAddr < 0)
        //         return [];

        //     const trainerClasses = this.ReadArray(romData, parseInt(config.TrainerClasses, 16), 13, parseInt(config.NumberOfTrainerClasses)).map(tc => this.FixAllCaps(this.ConvertText(tc)));
        //     return this.ReadArray(romData, mapTrainerTableAddr, 36, 32, true, data => data.readUInt16LE(0) == 0).map((data, i) => (<Pokemon.Trainer>{
        //         classId: data[1],
        //         className: trainerClasses[data[1]],
        //         id: i + 1,
        //         name: this.FixAllCaps(this.ConvertText(data.slice(4))),
        //         spriteId: data[3],
        //         gender: data[2] & 128 ? "Female" : "Male",
        //     }));
        // }

        // //Trick or Treat House
        // protected GetPuzzleName(romData: Buffer, mapScriptPtr: number) {
        //     return this.ReadArray(romData, mapScriptPtr, 5, 0, true, data => data[0] == 0).filter(data => data[0] == 0x20).map(data => this.ConvertText(romData.slice(this.ReadRomPtr(data, 1), this.ReadRomPtr(data, 1) + 255))).shift();
        // }

        // protected GetPuzzleAuthor(romData: Buffer, mapScriptPtr: number) {
        //     return this.ReadArray(romData, mapScriptPtr, 5, 0, true, data => data[0] == 0).filter(data => data[0] == 0x21).map(data => this.ConvertText(romData.slice(this.ReadRomPtr(data, 1), this.ReadRomPtr(data, 1) + 255))).shift();
        // }

        protected ParseGFRomHeader(romData: Buffer) {
            //TODO: This doesn't exist in Ruby and Sapphire
            const headerData = romData.slice(0x100, 0x204);
            const romHeader = <GFRomHeader>{
                version: headerData.readUInt32LE(0x0),
                language: headerData.readUInt32LE(0x4),
                gameName: headerData.toString("utf8", 0x8, 0x28),
                monFrontPicsAddr: headerData.readUInt32LE(0x28),
                monBackPicsAddr: headerData.readUInt32LE(0x2C),
                monNormalPalettesAddr: headerData.readUInt32LE(0x30),
                monShinyPalettesAddr: headerData.readUInt32LE(0x34),
                monIconsAddr: headerData.readUInt32LE(0x38),
                monIconPaletteIdsAddr: headerData.readUInt32LE(0x3C),
                monIconPalettesAddr: headerData.readUInt32LE(0x40),
                monSpeciesNamesAddr: headerData.readUInt32LE(0x44),
                moveNamesAddr: headerData.readUInt32LE(0x48),
                decorationsAddr: headerData.readUInt32LE(0x4C),
                flagsOffset: headerData.readUInt32LE(0x50),
                varsOffset: headerData.readUInt32LE(0x54),
                pokedexOffset: headerData.readUInt32LE(0x58),
                seen1Offset: headerData.readUInt32LE(0x5C),
                seen2Offset: headerData.readUInt32LE(0x60),
                pokedexVar: headerData.readUInt32LE(0x64),
                pokedexFlag: headerData.readUInt32LE(0x68),
                mysteryEventFlag: headerData.readUInt32LE(0x6C),
                pokedexCount: headerData.readUInt32LE(0x70),
                playerNameLength: headerData.readUInt8(0x74),
                trainerNameLength: headerData.readUInt8(0x75),
                pokemonNameLength1: headerData.readUInt8(0x76),
                pokemonNameLength2: headerData.readUInt8(0x77),
                unk5: headerData.readUInt8(0x78),
                unk6: headerData.readUInt8(0x79),
                unk7: headerData.readUInt8(0x7A),
                unk8: headerData.readUInt8(0x7B),
                unk9: headerData.readUInt8(0x7C),
                unk10: headerData.readUInt8(0x7D),
                unk11: headerData.readUInt8(0x7E),
                unk12: headerData.readUInt8(0x7F),
                unk13: headerData.readUInt8(0x80),
                unk14: headerData.readUInt8(0x81),
                unk15: headerData.readUInt8(0x82),
                unk16: headerData.readUInt8(0x83),
                unk17: headerData.readUInt8(0x84),
                // 3 bytes padding
                saveBlock2Size: headerData.readUInt32LE(0x88),
                saveBlock1Size: headerData.readUInt32LE(0x8C),
                partyCountOffset: headerData.readUInt32LE(0x90),
                partyOffset: headerData.readUInt32LE(0x94),
                warpFlagsOffset: headerData.readUInt32LE(0x98),
                trainerIdOffset: headerData.readUInt32LE(0x9C),
                playerNameOffset: headerData.readUInt32LE(0xA0),
                playerGenderOffset: headerData.readUInt32LE(0xA4),
                frontierStatusOffset: headerData.readUInt32LE(0xA8),
                frontierStatusOffset2: headerData.readUInt32LE(0xAC),
                externalEventFlagsOffset: headerData.readUInt32LE(0xB0),
                externalEventDataOffset: headerData.readUInt32LE(0xB4),
                unk18: headerData.readUInt32LE(0xB8),
                baseStatsAddr: headerData.readUInt32LE(0xBC),
                abilityNamesAddr: headerData.readUInt32LE(0xC0),
                abilityDescriptionsAddr: headerData.readUInt32LE(0xC4),
                itemsAddr: headerData.readUInt32LE(0xC8),
                movesAddr: headerData.readUInt32LE(0xCC),
                ballGfxAddr: headerData.readUInt32LE(0xD0),
                ballPalettesAddr: headerData.readUInt32LE(0xD4),
                gcnLinkFlagsOffset: headerData.readUInt32LE(0xD8),
                gameClearFlag: headerData.readUInt32LE(0xDC),
                ribbonFlag: headerData.readUInt32LE(0xE0),
                bagCountItems: headerData.readUInt8(0xE4),
                bagCountKeyItems: headerData.readUInt8(0xE5),
                bagCountPokeballs: headerData.readUInt8(0xE6),
                bagCountTMHMs: headerData.readUInt8(0xE7),
                bagCountBerries: headerData.readUInt8(0xE8),
                pcItemsCount: headerData.readUInt8(0xE9),
                // 2 bytes padding
                pcItemsOffset: headerData.readUInt32LE(0xEC),
                giftRibbonsOffset: headerData.readUInt32LE(0xF0),
                enigmaBerryOffset: headerData.readUInt32LE(0xF4),
                enigmaBerrySize: headerData.readUInt32LE(0xF8),
                moveDescriptionsAddr: headerData.readUInt32LE(0xFC),
                unk20: headerData.readUInt32LE(0x100)
            }
            // romHeader.bagCountCandy = 50; // TTH

            // Precalc bag offsets
            romHeader.bagItemsOffset = romHeader.pcItemsOffset + romHeader.pcItemsCount * 4;
            // romHeader.bagCandyOffset = romHeader.pcItemsOffset + romHeader.pcItemsCount * 4; // TTH
            // romHeader.bagItemsOffset = romHeader.bagCandyOffset + romHeader.bagCountCandy * 4; // TTH
            romHeader.bagKeyItemsOffset = romHeader.bagItemsOffset + romHeader.bagCountItems * 4;
            romHeader.bagPokeballsOffset = romHeader.bagKeyItemsOffset + romHeader.bagCountKeyItems * 4;
            romHeader.bagTMHMsOffset = romHeader.bagPokeballsOffset + romHeader.bagCountPokeballs * 4;
            romHeader.bagBerriesOffset = romHeader.bagTMHMsOffset + romHeader.bagCountTMHMs * 4;

            return romHeader;
        }

        protected FindMapEncounters(romData: Buffer, config: PGEINI) {
            let wildPokemonPtr = this.FindPtrFromPreceedingData(romData, wildPokemonPtrMarker);
            this.ReadArray(romData, wildPokemonPtr, 20).forEach(data => {
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

        protected ReadEncounterSet(romData: Buffer, setAddr: number, encounterRates: number[], requiredItems: number[] = [], includeGroupRate = false) {
            if (setAddr <= 0)
                return [];
            let setPtr = this.ReadRomPtr(romData, setAddr + 4);
            let groupRate = romData.readInt32LE(setAddr) / 100;
            try {
                return this.CombineDuplicateEncounters(this.ReadArray(romData, setPtr, 4, encounterRates.length).map((data, i) => (<Pokemon.EncounterMon>{
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

        protected ReadMoveLearns(romData: Buffer, config: PGEINI) {
            const movelearns = {} as { [key: number]: Pokemon.MoveLearn[] };
            this.ReadPtrBlock(romData, parseInt(config.PokemonAttackTable, 16)).forEach((addr, i) => {
                movelearns[i] = this.ReadArray(romData, addr, 2).map(data => {
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

        protected ReadEvolutions(romData: Buffer, config: PGEINI) {
            this.evolutionMethods[0xFE] = this.evolutionMethods[0xFE] || this.EvolutionMethod.MegaEvo; // Nameless

            const evoCount = parseInt(config.NumberOfEvolutionsPerPokemon);
            this.ReadArray(romData, parseInt(config.PokemonEvolutions, 16), 8 * evoCount, this.pokemon.length)
                .map(evoData => this.ReadArray(evoData, 0, 8, evoCount)
                    .map(e => this.ParseEvolution(e.readUInt16LE(0), e.readInt16LE(2), e.readUInt16LE(4)))
                )
                .forEach((evos, i) => this.pokemon[i] && (this.pokemon[i].evolutions = evos.filter(e => !!e)));
        }

        // For Blazing Emerald (and any future Skeli hack possibly?)
        protected ReadLevelCaps(romData: Buffer, config: PGEINI) {
            const capAddr = parseInt(config.LevelCaps || '0', 16);
            const capCount = parseInt(config.LevelCapCount || '9', 16);
            this.levelCaps = capAddr > 0 ?
                this.ReadArray(romData, capAddr, 0xC, capCount)
                    .map(data => data[1] == 0x23 ? data[0] : data.indexOf(0x3B) >= 0 ? 100 - data[data.indexOf(0x3B) - 1] : 0)
                    .filter(l => l > 0) : [];
            this.levelCaps.push(100);
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
            /*15*/ this.EvolutionMethod.LevelHighBeauty,
            // Blazing Emerald
            /*16*/ this.EvolutionMethod.LevelWithMove,
            /*17*/ this.EvolutionMethod.LevelSpecificArea,
            /*18*/ undefined,
            /*19*/ undefined,
            /*20*/ undefined,
            /*21*/ undefined,
            /*22*/ this.EvolutionMethod.LevelMale,
            /*23*/ this.EvolutionMethod.LevelFemale, //Probably
            /*24*/ undefined,
            /*25*/ this.EvolutionMethod.LevelWithOtherSpecies,
            /*26*/ undefined,
            /*27*/ this.EvolutionMethod.StoneMale,
            /*28*/ this.EvolutionMethod.StoneFemale,
        ]

    }

    interface GFRomHeader {
        version: number;
        language: number;
        gameName: string;
        monFrontPicsAddr: number;
        monBackPicsAddr: number;
        monNormalPalettesAddr: number;
        monShinyPalettesAddr: number;
        monIconsAddr: number;
        monIconPaletteIdsAddr: number;
        monIconPalettesAddr: number;
        monSpeciesNamesAddr: number;
        moveNamesAddr: number;
        decorationsAddr: number;
        flagsOffset: number;
        varsOffset: number;
        pokedexOffset: number;
        seen1Offset: number;
        pokedexVar: number;
        pokedexFlag: number;
        mysteryEventFlag: number;
        pokedexCount: number;
        playerNameLength: number;
        trainerNameLength: number;
        pokemonNameLength1: number;
        pokemonNameLength2: number;
        unk5: number;
        unk6: number;
        unk7: number;
        unk8: number;
        unk9: number;
        unk10: number;
        unk11: number;
        unk12: number;
        unk13: number;
        unk14: number;
        unk15: number;
        unk16: number;
        unk17: number;
        saveBlock2Size: number;
        saveBlock1Size: number;
        partyCountOffset: number;
        partyOffset: number;
        warpFlagsOffset: number;
        trainerIdOffset: number;
        playerNameOffset: number;
        playerGenderOffset: number;
        frontierStatusOffset: number;
        frontierStatusOffset2: number;
        externalEventFlagsOffset: number;
        externalEventDataOffset: number;
        unk18: number;
        baseStatsAddr: number;
        abilityNamesAddr: number;
        abilityDescriptionsAddr: number;
        itemsAddr: number;
        movesAddr: number;
        ballGfxAddr: number;
        ballPalettesAddr: number;
        gcnLinkFlagsOffset: number;
        gameClearFlag: number;
        ribbonFlag: number;
        bagCountItems: number;
        bagCountKeyItems: number;
        bagCountPokeballs: number;
        bagCountTMHMs: number;
        bagCountBerries: number;
        pcItemsCount: number;
        pcItemsOffset: number;
        giftRibbonsOffset: number;
        enigmaBerryOffset: number;
        enigmaBerrySize: number;
        moveDescriptionsAddr: number;
        unk20: number;

        // Not present in ROM
        bagItemsOffset?: number;
        bagKeyItemsOffset?: number;
        bagPokeballsOffset?: number;
        bagTMHMsOffset?: number;
        bagBerriesOffset?: number;
        bagCountCandy?: number; // TTH
        bagCandyOffset?: number; // TTH
    };

}