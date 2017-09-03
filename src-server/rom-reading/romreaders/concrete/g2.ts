/// <reference path="../../config/g2.ts" />
/// <reference path="../../tools/lz-gsc.ts" />
/// <reference path="../gb.ts" />

namespace RomReader {

    const config = gen2Offsets;

    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "", "", "", "", "", "", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Ground", "Fairy", "Plant", "Humanshape", "Water 3", "Mineral", "Indeterminate", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
    const bagPockets = ["???", "Item", "Key Item", "Ball", "TM/HM"];

    const grassEncounterRates = [30, 30, 20, 10, 5, 4, 1];
    const surfEncounterRates = [60, 30, 10];
    const encounterTimesOfDay = ['morning', 'day', 'night'];
    const fishingRods = ['oldRod', 'goodRod', 'superRod'];
    const fishingRodIds = { oldRod: 58, goodRod: 59, superRod: 61 };

    const tmCount = 50, hmCount = 7, itemCount = 256, dexCount = 256, moveCount = 251, mapBanks = 26, trainerClasses = 67;

    interface ClearFix { [key: number]: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } };
    const pokeSpriteClearFix: ClearFix = {};
    pokeSpriteClearFix[5] = { start: [[16, 37], [41, 23]] }; //Charmeleon
    pokeSpriteClearFix[6] = { start: [[36, 27], [37, 28], [38, 29], [39, 30]] }; //Charizard
    pokeSpriteClearFix[15] = { start: [[11, 30]] }; //Beedrill
    pokeSpriteClearFix[26] = { start: [[37, 22], [39, 22]] }; //Raichu
    pokeSpriteClearFix[34] = { start: [[13, 12]] }; //Nidoking
    pokeSpriteClearFix[52] = { start: [[35, 35]] }; //Meowth
    pokeSpriteClearFix[56] = { start: [[18, 18], [37, 18], [39, 31], [16, 25]] }; //Mankey
    pokeSpriteClearFix[57] = { start: [[15, 15]] }; //Primeape
    pokeSpriteClearFix[58] = { stop: [[22, 9]] }; //Growlithe
    pokeSpriteClearFix[65] = { start: [[42, 15]] }; //Alakazam
    pokeSpriteClearFix[69] = { start: [[31, 31], [31, 27], [32, 28], [33, 30]] }; //Bellsprout
    pokeSpriteClearFix[71] = { start: [[37, 5], [38, 6]] }; //Victreebel
    pokeSpriteClearFix[73] = { start: [[37, 41], [38, 42], [37, 48], [45, 43], [46, 44]] }; //Tentacruel
    pokeSpriteClearFix[78] = { start: [[39, 10]] }; //Rapidash
    pokeSpriteClearFix[81] = { start: [[19, 33], [20, 32], [24, 34]] }; //Magnemite
    pokeSpriteClearFix[82] = { start: [[23, 29], [24, 28], [25, 27], [33, 27]] }; //Magneton
    pokeSpriteClearFix[84] = { start: [[33, 35], [34, 36]] }; //Doduo
    pokeSpriteClearFix[85] = { start: [[19, 15], [20, 14], [26, 17]] }; //Dodrio
    pokeSpriteClearFix[86] = { start: [[22, 19]] }; //Seel
    pokeSpriteClearFix[92] = { clearDiagonal: true }; //Gastly
    pokeSpriteClearFix[93] = { start: [[14, 35], [39, 39]] }; //Haunter
    pokeSpriteClearFix[99] = { start: [[36, 19], [37, 20], [35, 27], [8, 39]] }; //Kingler
    pokeSpriteClearFix[104] = { start: [[24, 26]] }; //Cubone
    pokeSpriteClearFix[107] = { start: [[27, 37]] }; //Hitmonchan
    pokeSpriteClearFix[116] = { start: [[25, 34], [24, 35]] }; //Horsea
    pokeSpriteClearFix[118] = { start: [[23, 44]], stop: [[23, 46]] }; //Goldeen
    pokeSpriteClearFix[125] = { start: [[13, 23], [42, 23], [42, 30], [31, 42]] }; //Electabuzz
    pokeSpriteClearFix[126] = { start: [[42, 18]] }; //Magmar
    pokeSpriteClearFix[141] = { start: [[22, 30], [42, 30]] }; //Kabutops
    pokeSpriteClearFix[144] = { start: [[16, 45], [17, 46], [40, 11], [40, 27], [45, 23], [49, 11]] }; //Articuno
    pokeSpriteClearFix[148] = { start: [[38, 34]] }; //Dragonair
    pokeSpriteClearFix[149] = { start: [[17, 8], [17, 12], [17, 22], [31, 5], [32, 6]] }; //Dragonite
    pokeSpriteClearFix[150] = { start: [[13, 33], [14, 32], [24, 32], [35, 17]] }; //Mewtwo
    pokeSpriteClearFix[165] = { start: [[14, 41], [15, 42]], stop: [[14, 20]] }; //Ledyba
    pokeSpriteClearFix[166] = { start: [[16, 25], [17, 26], [15, 30], [31, 39], [18, 43]] }; //Ledian
    pokeSpriteClearFix[167] = { start: [[12, 33], [13, 32]] }; //Spinarak
    pokeSpriteClearFix[168] = { start: [[11, 34], [12, 30], [44, 25]] }; //Ariados
    pokeSpriteClearFix[183] = { start: [[44, 44]] }; //Marill
    pokeSpriteClearFix[185] = { start: [[21, 24], [36, 24]] }; //Sudowoodo
    pokeSpriteClearFix[190] = { start: [[15, 33], [16, 34], [26, 34]] }; //Aipom
    pokeSpriteClearFix[191] = { start: [[30, 21], [31, 20], [33, 21]] }; //Sunkern
    pokeSpriteClearFix[198] = { start: [[11, 16], [8, 25], [12, 34], [21, 29], [22, 30], [21, 27], [22, 26], [43, 33], [45, 46], [45, 15]] }; //Murkrow
    pokeSpriteClearFix[200] = { start: [[32, 17], [19, 36], [22, 36], [23, 37], [31, 44]] }; //Misdreavus
    pokeSpriteClearFix[203] = { start: [[32, 42]] }; //Girafarig
    pokeSpriteClearFix[207] = { start: [[35, 37]] }; //Gligar
    pokeSpriteClearFix[212] = { start: [[42, 42], [43, 43], [44, 44], [34, 30], [7, 37]] }; //Scizor
    pokeSpriteClearFix[228] = { start: [[18, 35], [20, 41], [21, 40], [22, 39]] }; //Houndour
    pokeSpriteClearFix[229] = { start: [[34, 43], [35, 42]] }; //Houndoom
    pokeSpriteClearFix[234] = { start: [[9, 13], [40, 41]] }; //Stantler
    pokeSpriteClearFix[235] = { start: [[21, 25], [21, 41], [12, 29]] }; //Smeargle
    pokeSpriteClearFix[236] = { start: [[39, 29]] }; //Tyrogue
    pokeSpriteClearFix[239] = { start: [[39, 38], [40, 37]] }; //Elekid
    pokeSpriteClearFix[242] = { start: [[9, 31]], stop: [[14, 46]] }; //Blissey

    const unownSpriteClearFix: ClearFix = {};
    unownSpriteClearFix[0] = { start: [[28, 38]] }; //A
    unownSpriteClearFix[1] = { start: [[28, 38]] }; //B
    unownSpriteClearFix[2] = { start: [[25, 20]] }; //C
    unownSpriteClearFix[5] = { start: [[38, 27]] }; //F
    unownSpriteClearFix[6] = { start: [[27, 17]] }; //G
    unownSpriteClearFix[14] = { start: [[25, 25]] }; //O
    unownSpriteClearFix[20] = { start: [[29, 42], [34, 42]] }; //U
    unownSpriteClearFix[21] = { start: [[24, 24]] }; //V

    const trainerSpriteClearFix: ClearFix = {};
    trainerSpriteClearFix[2] = { start: [[22, 32], [32, 32], [33, 35], [33, 40]] }; //Bugsy
    trainerSpriteClearFix[3] = { start: [[33, 30]] }; //Morty
    trainerSpriteClearFix[7] = { start: [[27, 17]] }; //Clair
    trainerSpriteClearFix[9] = { start: [[28, 52]] }; //Pokemon Prof
    trainerSpriteClearFix[12] = { start: [[36, 36], [36, 36]] }; //Bruno
    trainerSpriteClearFix[14] = { start: [[22, 32], [22, 40]] }; //Koga
    trainerSpriteClearFix[16] = { start: [[28, 44]] }; //Brock
    trainerSpriteClearFix[22] = { start: [[32, 37], [33, 39], [35, 42], [40, 41], [32, 46], [33, 48]] }; //Schoolboy
    trainerSpriteClearFix[23] = { start: [[33, 35], [44, 44], [42, 36]], stop: [[39, 54], [17, 53], [17, 20], [20, 14], [21, 11], [22, 9], [23, 8]], clearDiagonal: true }; //Bird Keeper
    trainerSpriteClearFix[24] = { start: [[16, 14]] }; //Lass
    trainerSpriteClearFix[26] = { start: [[40, 28], [41, 27]] }; //Cooltrainer F
    trainerSpriteClearFix[27] = { start: [[32, 36]] }; //Beauty
    trainerSpriteClearFix[31] = { start: [[26, 18], [34, 40]] }; //Gentleman
    trainerSpriteClearFix[32] = { start: [[24, 26], [33, 29]] }; //Skier
    trainerSpriteClearFix[33] = { start: [[17, 25], [18, 24]] }; //Teacher
    trainerSpriteClearFix[35] = { start: [[33, 25], [38, 45]] }; //Bug Catcher
    trainerSpriteClearFix[36] = { start: [[12, 17], [14, 18], [16, 19], [17, 20], [19, 21], [20, 22], [22, 23], [24, 24], [25, 25], [26, 26]] }; //Fisher
    trainerSpriteClearFix[37] = { start: [[33, 13]] }; //Swimmer M
    trainerSpriteClearFix[39] = { start: [[40, 17], [41, 18], [42, 19]] }; //Sailor
    trainerSpriteClearFix[42] = { start: [[26, 40], [38, 23], [36, 17]] }; //Guitarist
    trainerSpriteClearFix[43] = { stop: [[30, 46]] }; //Hiker
    trainerSpriteClearFix[44] = { start: [[43, 34], [47, 34]] }; //Biker
    trainerSpriteClearFix[46] = { start: [[39, 35]] }; //Burglar
    trainerSpriteClearFix[47] = { start: [[14, 32], [21, 29], [22, 31]] }; //Firebreather
    trainerSpriteClearFix[50] = { start: [[27, 45]] }; //Rocket Executive
    trainerSpriteClearFix[58] = { start: [[19, 39], [20, 38]] }; //Pokefan
    trainerSpriteClearFix[60] = { start: [[8, 29], [10, 35], [22, 37], [23, 38], [42, 37], [27, 23]] }; //Twins
    trainerSpriteClearFix[62] = { start: [[18, 23], [19, 22], [35, 29], [36, 28], [28, 43]] }; //Azure (TPP Red replacement for Pyrite)
    trainerSpriteClearFix[63] = { start: [[19, 21], [20, 20]] }; //Blue
    trainerSpriteClearFix[64] = { stop: [[19, 33], [19, 34], [20, 34]] }; //Officer

    interface Gen2Item extends Pokemon.Item {
        price: number;
        pocket: string;
    }

    interface Gen2Map extends Pokemon.Map {
        fishingGroup: number;
    }

    export class Gen2 extends GBReader {
        private timeOfDay = new Array<string>(24);

        constructor(romFileLocation: string) {
            super(romFileLocation, config.charmap);
            this.natures = [];

            let romData = this.loadROM();
            this.CalculateTimesOfDay(romData);
            this.pokemon = this.ReadPokeData(romData);
            this.pokemonSprites = this.ReadPokemonSprites(romData);
            this.trainers = this.ReadTrainerData(romData);
            this.trainerSprites = this.ReadTrainerSprites(romData);
            this.frameBorders = this.ReadFrameBorders(romData);
            this.items = this.ReadItemData(romData);
            this.ballIds = this.items.filter((i: Gen2Item) => i.pocket == "Ball").map(i => i.id);
            this.moves = this.ReadMoveData(romData);
            this.areas = this.ReadAreaNames(romData);
            this.maps = this.ReadMaps(romData);
            this.FindMapEncounters(romData);
            this.FindFishingEncounters(romData);
            this.GetTMHMNames(romData);
            this.levelCaps = this.ReadPyriteLevelCaps(romData);
        }

        public GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            if (!map) return {};
            let time = this.timeOfDay[(state.time || { h: 9 }).h] || "morning";
            return (map.encounters || {})[time];
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 8) == 8; //Fog Badge
        }

        public CalcHiddenPowerType(stats: TPP.Stats) {
            const types = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark'];
            return types[4 * (stats.attack % 4) + (stats.defense % 4)];
        }

        public CalcHiddenPowerPower(stats: TPP.Stats) {
            return Math.floor((5 * ((stats.special_attack >> 3) + ((stats.speed >> 3) << 1) + ((stats.defense >> 3) << 2) + ((stats.attack >> 3) << 3)) + (stats.special_defense % 4)) / 2) + 31;
        }

        private ReadPyriteLevelCaps(romData: Buffer) {
            return this.ReadStridedData(romData, 0x3fef, 1, 17).map(l => l[0]).filter(l => l > 0);
        }

        private FindFishingEncounters(romData: Buffer) {
            let switchFish = this.ReadStridedData(romData, config.TimeFishGroups, 4, 255, true).map(fish => ({ day: fish[0], night: fish[2] }));
            // switchFish.unshift({ day: 0, night: 0 });
            const fishBank = this.LinearAddrToROMBank(config.FishingWildsOffset).bank, fishEncounterGroupsStartAddr = this.ROMBankAddrToLinear(fishBank, romData.readUInt16LE(config.FishingWildsOffset + 1));
            let fishEncounterGroups = this.ReadStridedData(romData.slice(config.FishingWildsOffset, fishEncounterGroupsStartAddr), 0, 7).map((header, i, arr) => {
                let nibbleRate = header[0] / 255;
                let fishEncs = Array<{ id: number; rate: number; level: number, rodType: string; }>();
                let processFishEncs = (addr: number, nextAddr: number, rodType: string) => {
                    this.ReadStridedData(romData.slice(addr, nextAddr < addr ? addr + 255 : nextAddr), 0, 3, 4)
                        .map(enc => ({ rate: Math.round(enc[0] * 100 / 255), id: enc[1], level: enc[2], rodType: rodType }))
                        .reverse().map((enc, i, arr) => {
                            enc.rate -= (arr[i + 1] || { rate: 0 }).rate; //fishing rate is progressive, needs to be calculated based on previous encounters
                            enc.rate = Math.round(nibbleRate * enc.rate); //also make fishing encounters take into account how likely it is to get a nibble at all
                            return enc;
                        }).reverse().forEach(e => fishEncs.push(e));
                }
                let oldRod = this.ROMBankAddrToLinear(fishBank, header.readUInt16LE(1)),
                    goodRod = this.ROMBankAddrToLinear(fishBank, header.readUInt16LE(3)),
                    superRod = this.ROMBankAddrToLinear(fishBank, header.readUInt16LE(5)),
                    next = (arr[i + 1] ? this.ROMBankAddrToLinear(fishBank, arr[i + 1].readUInt16LE(1)) : null);
                processFishEncs(oldRod, goodRod, "oldRod");
                processFishEncs(goodRod, superRod, "goodRod");
                processFishEncs(superRod, next, "superRod");
                return fishEncs;
            });
            fishEncounterGroups.unshift([]); //group 0
            this.maps.forEach((map: Gen2Map) => {
                //every map has a fishing group.
                //only give a map fishing encounters if it has surfing encounters
                if (!map.encounters || !map.encounters['day'] || !map.encounters['day'].surfing) return;
                map.encounters.fishing = {};
                encounterTimesOfDay.forEach(time => {
                    map.encounters[time].fishing = fishingRods.map(rod => (fishEncounterGroups[map.fishingGroup] || []).filter(fish => rod == fish.rodType).map(fish => (<Pokemon.EncounterMon>{
                        species: this.GetSpecies(fish.id || (switchFish[fish.level] || {})[time == 'night' ? time : 'day']),
                        rate: fish.rate,
                        requiredItem: this.GetItem(fishingRodIds[fish.rodType])
                    }))).reduce((allFish, theseFish) => Array.prototype.concat.apply(allFish, this.CombineDuplicateEncounters(theseFish)), []);
                });
            });
        }

        private FindMapEncounters(romData: Buffer) {
            const grassBytes = 47;
            const surfBytes = 9;
            let grassGroups = this.ReadStridedData(romData, config.WildPokemonOffset, grassBytes);
            let surfGroups = this.ReadStridedData(romData, config.WildPokemonOffset + (grassGroups.length * grassBytes) + 1, surfBytes);
            grassGroups = Array.prototype.concat.apply(grassGroups, this.ReadStridedData(romData, config.WildPokemonOffset + (grassGroups.length * grassBytes) + (surfGroups.length * surfBytes) + 2, grassBytes)); //Kanto
            surfGroups = Array.prototype.concat.apply(surfGroups, this.ReadStridedData(romData, config.WildPokemonOffset + (grassGroups.length * grassBytes) + (surfGroups.length * surfBytes) + 3, surfBytes)); //Kanto
            let prepMap = (id: number, bank: number) => {
                let map = this.GetMap(id, bank);
                map.encounters = map.encounters || {};
                encounterTimesOfDay.forEach(time => map.encounters[time] = map.encounters[time] || {});
                return map;
            }
            grassGroups.forEach(data => {
                let map = prepMap(data[1], data[0]);
                if (!map) return;
                encounterTimesOfDay.forEach((time, t) => {
                    let areaRate = data[2 + t];
                    map.encounters[time].grass = this.CombineDuplicateEncounters(
                        grassEncounterRates.map((rate, r) => (<Pokemon.EncounterMon>{
                            species: this.GetSpecies(data[3 + encounterTimesOfDay.length + (t * grassEncounterRates.length * 2) + (r * 2)]),
                            rate: rate
                        }))
                    );
                });
            });
            surfGroups.forEach(data => {
                let map = prepMap(data[1], data[0]);
                if (!map) return;
                let areaRate = data[2];
                let encounters = this.CombineDuplicateEncounters(
                    surfEncounterRates.map((rate, r) => (<Pokemon.EncounterMon>{
                        species: this.GetSpecies(data[4 + (r * 2)]),
                        rate: rate
                    }))

                );
                encounterTimesOfDay.forEach(time => map.encounters[time].surfing = encounters);
            });
            let bugCatchingContest = prepMap(0x10, 3);
            let bugCatchingEncounters = this.CombineDuplicateEncounters(this.ReadStridedData(romData, config.BugContestWilds, 4, 11).filter(data => data[0] <= 100).map(data => (<Pokemon.EncounterMon>{
                rate: data[0],
                species: this.GetSpecies(data[1])
            })));
            encounterTimesOfDay.forEach(time => bugCatchingContest.encounters[time].grass = bugCatchingContest.encounters[time].grass || bugCatchingEncounters)
            //Not present: Headbutt (unhandled), Swarms (unhandled), Fishing (another function)
        }

        private ReadMaps(romData: Buffer) {
            const mapHeaderBytes = 9;
            return this.ReadStridedData(romData, config.MapHeaders, 2, mapBanks)
                .map(bankPtr => this.SameBankPtrToLinear(config.MapHeaders, bankPtr.readUInt16LE(0)))
                .map((ptr, b, arr) => this.ReadStridedData(romData, ptr, mapHeaderBytes, ((arr[b + 1] - ptr) / mapHeaderBytes) || 12)
                    .map((mapHeader, m) => (<Gen2Map>{
                        bank: b + 1,
                        id: m + 1,
                        name: ((config.mapNames[b + 1] || [])[m + 1] || { name: '???' }).name,
                        areaId: mapHeader[5],
                        areaName: this.areas[mapHeader[5]],
                        fishingGroup: mapHeader[8],
                        encounters: {}
                    }))
                ).reduce((allMaps, currBank) => Array.prototype.concat.apply(allMaps, currBank), []);
        }

        private ReadAreaNames(romData: Buffer) {
            return this.ReadStridedData(romData, config.AreaNamesOffset, 4, 97)
                .map(data => this.FixAllCaps(this.ConvertText(romData.slice(this.SameBankPtrToLinear(config.AreaNamesOffset, data.readUInt16LE(2)))) || ''));
        }

        private GetTMHMNames(romData: Buffer) {
            let tmExp = /^[TH]M\d\d$/i;
            let tms = this.items.filter(i => tmExp.test(i.name));
            this.ReadStridedData(romData, config.TMMovesOffset, 1, tms.length)
                .forEach((m, i) => tms[i].name = tms[i].name.toUpperCase() + ' ' + this.moves[m[0]].name);
        }

        private ReadMoveData(romData: Buffer) {
            const dataBytes = 7;
            let movesOffset = config.MoveDataOffset - dataBytes; //include 00
            let moveNames = this.ReadStringBundle(romData, config.MoveNamesOffset, moveCount).map(m => this.FixAllCaps(m));
            moveNames.unshift(''); //move 0
            return this.ReadStridedData(romData, movesOffset, dataBytes, moveCount + 1).map((data, i) => (<Pokemon.Move>{
                id: i,
                name: moveNames[i],
                basePower: data[0x02],
                type: types[data[0x03]],
                accuracy: data[0x04],
                basePP: data[0x05]
            }));
        }

        private ReadItemData(romData: Buffer) {
            const dataBytes = 7;
            let itemsOffset = config.ItemAttributesOffset - dataBytes; //include 00
            let itemNames = this.ReadStringBundle(romData, config.ItemNamesOffset, itemCount - 1).map(i => this.FixAllCaps(i));
            itemNames.unshift(''); //item 0
            return this.ReadStridedData(romData, itemsOffset, dataBytes, itemCount).map((data, i) => (<Gen2Item>{
                id: i,
                name: itemNames[i],
                price: data.readUInt16BE(0x00),
                pocket: bagPockets[data[0x05]],
                isKeyItem: data[0x05] == 2
            }));
        }

        private ReadTrainerData(romData: Buffer) {
            let classNames = this.ReadStringBundle(romData, config.TrainerClassNamesOffset, trainerClasses).map(n => this.FixAllCaps(n));
            let trainers: Pokemon.Trainer[] = [];
            let bank = this.LinearAddrToROMBank(config.TrainerGroupsOffset).bank;
            this.ReadStridedData(romData, config.TrainerGroupsOffset, 2, trainerClasses).forEach((ptr, cId, ptrArr) => {
                let thisAddr = this.ROMBankAddrToLinear(bank, ptr.readUInt16LE(0));
                let nextAddr = ptrArr[cId + 1] ? this.ROMBankAddrToLinear(bank, ptrArr[cId + 1].readUInt16LE(0)) : 0;
                this.ReadBundledData(romData, thisAddr, 0xFF, nextAddr || 1, nextAddr).forEach((tData, tId) => {
                    trainers.push({
                        classId: cId,
                        spriteId: cId,
                        id: tId,
                        className: classNames[cId],
                        name: this.FixAllCaps(this.ConvertText(tData))
                    });
                });
            });
            return trainers;
        }

        private ReadPokeData(romData: Buffer) {
            const nameBytes = 10;
            const dataBytes = 32;
            let namesOffset = config.PokemonNamesOffset - nameBytes; //include 00
            let statsOffset = config.PokemonStatsOffset - dataBytes; //include 00
            let pokeNames = this.ReadStridedData(romData, namesOffset, nameBytes, dexCount).map(b => this.FixAllCaps(this.ConvertText(b)));
            return this.ReadStridedData(romData, statsOffset, dataBytes, dexCount).map((data, i) => (<Pokemon.Species>{
                id: i,
                dexNumber: data[0x00],
                name: pokeNames[i],
                baseStats: {
                    hp: data[0x01],
                    atk: data[0x02],
                    def: data[0x03],
                    speed: data[0x04],
                    spatk: data[0x05],
                    spdef: data[0x06]
                },
                type1: types[data[0x07]],
                type2: types[data[0x08]],
                catchRate: data[0x09],
                baseExp: data[0x0A],
                genderRatio: data[0x0D],
                eggCycles: data[0x0F],
                spriteSize: data[0x11] % 16, //sprites are always square
                growthRate: expCurveNames[data[0x16]],
                expFunction: expCurves[data[0x16]],
                eggGroup1: data[0x17] % 16,
                eggGroup2: data[0x17] >> 4
            }));
        }

        private ReadFrameBorders(romData: Buffer) {
            let framePal = ["white", "black"];
            return this.ReadStridedData(romData, config.FrameBordersOffset, 48, 9).map(frameData =>
                JSON.stringify(
                    Sprites.FloodClear(
                        Sprites.ParseTilesToLayout(frameData, framePal, 6, [
                            [6, 4, 4, 4, 4, 4, 4, 3],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [5, 4, 4, 4, 4, 4, 4, 1]
                        ], 1), 0, [], [[20, 20]])
                )
            );
        }

        private ProcessPalette(palData: Buffer) {
            return ['white', Sprites.Convert16BitColorToRGB(palData.readUInt16LE(2)), Sprites.Convert16BitColorToRGB(palData.readUInt16LE(0)), 'black'];
        }

        private ReadTrainerSprites(romData: Buffer) {
            let palettes = this.ReadStridedData(romData, config.TrainerPalettes, 4, trainerClasses).map(data => this.ProcessPalette(data));
            return new Array(trainerClasses).fill(0).map((x, classId) => {
                let ptrAddr = config.TrainerPicPointers + (classId * 3);
                let spriteAddr = this.ROMBankAddrToLinear(romData[ptrAddr] + config.PicBankOffset, romData[ptrAddr + 2] * 0x100 + romData[ptrAddr + 1]);
                let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[classId], 7, 7);
                let clearFix = trainerSpriteClearFix[classId] || {};
                Sprites.FloodClear(imgData, 0, clearFix.stop, clearFix.start, clearFix.clearDiagonal);
                return JSON.stringify(imgData);
            });
        }

        private ReadPokemonSprites(romData: Buffer) {
            let palettes = this.ReadStridedData(romData, config.PokemonPalettes, 8, this.pokemon.length)
                .map(data => ({ base: this.ProcessPalette(data), shiny: this.ProcessPalette(data.slice(4)) }));
            function readPokeSprite(ptrAddr: number, mon: Pokemon.Species, clearFix: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } = {}) {
                let spriteAddr = this.ROMBankAddrToLinear(romData[ptrAddr] + config.PicBankOffset, romData[ptrAddr + 2] * 0x100 + romData[ptrAddr + 1]);
                let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[mon.id].base, mon.spriteSize, mon.spriteSize);
                Sprites.FloodClear(imgData, 0, clearFix.stop || [], clearFix.start || [], clearFix.clearDiagonal);
                return {
                    base: JSON.stringify(imgData),
                    shiny: JSON.stringify({ palette: palettes[mon.id].shiny, pixels: imgData.pixels })
                };
            }
            return this.pokemon.map(mon => {
                let ptrAddr = config.PokemonPicPointers + ((mon.id - 1) * 6); //front and back pointer, 3 bytes each
                if (mon.id < 1 || mon.id > 251) return;
                if (mon.id == 201) { //Unown
                    ptrAddr = config.UnownPicPointers;
                    return new Array(26).fill(0).map((x, unown) => readPokeSprite.call(this, ptrAddr + (unown * 6), mon, unownSpriteClearFix[unown] || {}));
                }
                return [readPokeSprite.call(this, ptrAddr, mon, pokeSpriteClearFix[mon.id] || {})];
            });
        }

        private CalculateTimesOfDay(romData: Buffer) {
            let hour = 0;
            this.ReadStridedData(romData, config.TimeOfDayOffset, 2).forEach(tod => {
                let until = tod[0], todStr = encounterTimesOfDay[tod[1]];
                for (hour = hour; hour < until && hour < 24; hour++) {
                    this.timeOfDay[hour] = todStr;
                }
            });
        }
    }
}