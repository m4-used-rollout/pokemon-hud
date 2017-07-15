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

    const tmCount = 50, hmCount = 7, itemCount = 256, dexCount = 256, moveCount = 251, mapBanks = 26;

    const pokeSpriteClearFix: { [key: number]: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } } = {};
    pokeSpriteClearFix[5] = { start: [[16, 37], [41, 23]] }; //Charmeleon
    pokeSpriteClearFix[6] = { start: [[36, 27], [37, 28], [38, 29], [39, 30]] }; //Charizard
    pokeSpriteClearFix[15] = { start: [[11, 30]] }; //Beedrill
    pokeSpriteClearFix[26] = { start: [[37, 22], [39, 22]] }; //Raichu
    pokeSpriteClearFix[34] = { start: [[13, 12]] }; //Nidoking
    pokeSpriteClearFix[52] = { start: [[35, 35]] }; //Meowth
    pokeSpriteClearFix[56] = { start: [[18, 18], [37, 18], [39, 31], [16, 25]] }; //Mankey
    pokeSpriteClearFix[57] = { start: [[15, 15]] }; //Primeape
    pokeSpriteClearFix[58] = { stop: [[22, 9]] }; //Growlithe
    pokeSpriteClearFix[69] = { start: [[31, 31], [31, 27], [32, 28], [33, 30]] }; //Bellsprout
    pokeSpriteClearFix[71] = { start: [[37, 5], [38, 6]] }; //Victreebel
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
    pokeSpriteClearFix[201] = { start: [[28, 38]] }; //Unown A
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

    interface Gen2Item extends Pokemon.Item {
        price: number;
        pocket: string;
    }

    interface Gen2Map extends Pokemon.Map {
        fishingGroup: number;
    }

    export class Gen2 extends GBReader {
        private swarms: Pokemon.Encounters = {}
        private timeOfDay = new Array<string>(24);

        constructor(romFileLocation: string) {
            super(romFileLocation, config.charmap);

            let romData = this.loadROM();
            this.CalculateTimesOfDay(romData);
            this.pokemon = this.ReadPokeData(romData);
            this.pokemonSprites = this.ReadPokemonSprites(romData);
            this.items = this.ReadItemData(romData);
            this.ballIds = this.items.filter((i: Gen2Item) => i.pocket == "Ball").map(i => i.id);
            this.moves = this.ReadMoveData(romData);
            this.areas = this.ReadAreaNames(romData);
            this.maps = this.ReadMaps(romData);
            this.FindMapEncounters(romData);
            this.FindFishingEncounters(romData);
            this.levelCaps = this.ReadPyriteLevelCaps(romData);
            //console.log(JSON.stringify(this.items, null, 2));
            //console.log(JSON.stringify(this.maps, null, 2));
        }

        public GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            if (!map) return {};
            let time = this.timeOfDay[(state.time || { h: 9 }).h] || "morning";
            return (map.encounters || {})[time];
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 8) == 8; //Fog Badge
        }

        private ReadPyriteLevelCaps(romData: Buffer) {
            return this.ReadStridedData(romData, 0x3fef, 1, 17).map(l => l[0]).filter(l => l > 0);
        }

        private FindFishingEncounters(romData: Buffer) {
            let switchFish = this.ReadStridedData(romData, config.TimeFishGroups, 4, 255, true).map(fish => ({ day: fish[0], night: fish[2] }));
            switchFish.unshift({ day: 0, night: 0 });
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
            //TODO:Headbutt
        }

        private CombineDuplicateEncounters(mons: Pokemon.EncounterMon[]) {
            return mons.filter(thisMon => {
                let firstMon = mons.filter(m => m.species.name == thisMon.species.name).shift();
                if (firstMon != thisMon) {
                    firstMon.rate += thisMon.rate;
                    return false;
                }
                return true;
            }).sort((e1, e2) => e2.rate - e1.rate);
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
                .map(data => this.ReadStringBundle(romData, this.SameBankPtrToLinear(config.AreaNamesOffset, data.readUInt16LE(2)), 1).shift() || '');
        }

        private ReadMoveData(romData: Buffer) {
            const dataBytes = 7;
            let movesOffset = config.MoveDataOffset - dataBytes; //include 00
            let moveNames = this.ReadStringBundle(romData, config.MoveNamesOffset, moveCount - 1);
            moveNames.unshift(''); //move 0
            return this.ReadStridedData(romData, movesOffset, dataBytes, moveCount).map((data, i) => (<Pokemon.Move>{
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
            let itemNames = this.ReadStringBundle(romData, config.ItemNamesOffset, itemCount - 1); //ReadStridedData(romData, namesOffset, nameBytes, itemCount).map(b => convertText(b));
            itemNames.unshift(''); //item 0
            return this.ReadStridedData(romData, itemsOffset, dataBytes, itemCount).map((data, i) => (<Gen2Item>{
                id: i,
                name: itemNames[i],
                price: data.readUInt16BE(0x00),
                pocket: bagPockets[data[0x05]],
                isKeyItem: data[0x05] == 2
            }));
        }

        private ReadPokeData(romData: Buffer) {
            const nameBytes = 10;
            const dataBytes = 32;
            let namesOffset = config.PokemonNamesOffset - nameBytes; //include 00
            let statsOffset = config.PokemonStatsOffset - dataBytes; //include 00
            let pokeNames = this.ReadStridedData(romData, namesOffset, nameBytes, dexCount).map(b => this.ConvertText(b));
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

        private ProcessPalette(palData: Buffer) {
            return ['white', Sprites.Convert16BitColorToRGB(palData.readUInt16LE(2)), Sprites.Convert16BitColorToRGB(palData.readUInt16LE(0)), 'black'];
        }

        private ReadPokemonSprites(romData: Buffer) {
            let palettes = this.ReadStridedData(romData, config.PokemonPalettes, 8, this.pokemon.length)
                .map(data => ({ base: this.ProcessPalette(data), shiny: this.ProcessPalette(data.slice(4)) }));
            function readPokeSprite(ptrAddr: number, mon: Pokemon.Species, clearFix: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } = {}) {
                let spriteAddr = this.ROMBankAddrToLinear(romData[ptrAddr] + config.PicBankOffset, romData[ptrAddr + 2] * 0x100 + romData[ptrAddr + 1]);
                let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                let imgData = Sprites.Parse2BPPToImageMap(spriteData, palettes[mon.id].base, mon.spriteSize, mon.spriteSize);
                Sprites.FloodClear(imgData, 0, clearFix.stop || [], clearFix.start || [], clearFix.clearDiagonal);
                return {
                    base: JSON.stringify(imgData),
                    shiny: JSON.stringify({ palette: palettes[mon.id].shiny, pixels: imgData.pixels })
                };
            }
            return this.pokemon.map(mon => {
                let ptrAddr = config.PokemonPicPointers + ((mon.id - 1) * 6); //front and back pointer, 3 bytes each
                if (mon.id == 201) { //unown, just pick the first one
                    ptrAddr = config.UnownPicPointers;
                }
                if (mon.id < 1 || mon.id > 251) return;
                return readPokeSprite.call(this, ptrAddr, mon, pokeSpriteClearFix[mon.id] || {});
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