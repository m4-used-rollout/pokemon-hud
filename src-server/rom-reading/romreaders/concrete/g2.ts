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
            //palettes.shift();
            return this.pokemon.map(mon => {
                let ptrAddr = config.PokemonPicPointers + ((mon.id - 1) * 6); //front and back pointer, 3 bytes each
                if (mon.id == 201) { //unown, just pick the first one
                    ptrAddr = config.UnownPicPointers;
                }
                if (mon.id < 1 || mon.id > 251) return;
                let spriteAddr = this.ROMBankAddrToLinear(romData[ptrAddr] + config.PicBankOffset, romData[ptrAddr + 2] * 0x100 + romData[ptrAddr + 1]);
                //let spriteData = new Tools.Gen2LZDecmp(romData, spriteAddr, mon.spriteSize, mon.spriteSize).getFlattenedData();
                //let imgData = Sprites.MakeTiledImage(spriteData, palettes[mon.id].base, mon.spriteSize * 8, mon.spriteSize * 8, 2);
                let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                let imgData = Sprites.Parse2BPPToImageMap(spriteData,palettes[mon.id].base, mon.spriteSize, mon.spriteSize);
                Sprites.FloodClear(imgData, 0);
                console.log(`Pkmn ${mon.id}`);
                return {
                    base: JSON.stringify(imgData),
                    shiny: JSON.stringify({ palette: palettes[mon.id].shiny, pixels: imgData.pixels })
                };
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