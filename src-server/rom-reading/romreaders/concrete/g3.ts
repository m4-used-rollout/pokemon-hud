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

    interface Gen3Item extends Pokemon.Item {
        isPokeball: boolean;
    }

    export class Gen3 extends GBAReader {
        constructor(romFileLocation: string, iniFileLocation: string = "pge.ini") {
            super(romFileLocation, iniFileLocation);
            let romData = this.loadROM();
            let config = this.LoadConfig(romData);
            this.abilities = this.ReadAbilities(romData, config);
            this.pokemon = this.ReadPokeData(romData, config);
            // this.pokemonSprites = this.ReadPokemonSprites(romData, config);
            // this.trainers = this.ReadTrainerData(romData, config);
            // this.trainerSprites = this.ReadTrainerSprites(romData, config);
            // this.frameBorders = this.ReadFrameBorders(romData, config);
            this.items = this.ReadItemData(romData, config);
            this.ballIds = this.items.filter((i: Gen3Item) => i.isPokeball).map(i => i.id);
            this.moves = this.ReadMoveData(romData, config);
            this.areas = this.ReadMapLabels(romData, config);
            this.maps = this.ReadMaps(romData, config);
            this.FindMapEncounters(romData, config);
            // this.GetTMHMNames(romData, config);
            console.log(JSON.stringify(this.maps));
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            return map.encounters.all;
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
                type1: typeNames[data[6]],
                type2: typeNames[data[7]],
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
                //flipSprite: !!(data[25] & 128)
            }));
        }

        private ReadItemData(romData: Buffer, config: PGEINI) {
            return this.ReadStridedData(romData, parseInt(config.ItemData, 16), 44, parseInt(config.NumberOfItems)).map((data, i) => (<Gen3Item>{
                name: this.FixAllCaps(this.ConvertText(data)),
                id: i,
                // price: data.readInt16LE(16),
                // holdEffect: data[18],
                // parameter: data[19],
                // description: this.ConvertText(romData.slice(this.fixRomPtr(data.readInt32LE(20)), this.fixRomPtr(data.readInt32LE(20)) + 255)),
                // mystery: data.readInt16LE(24),
                isKeyItem: data.readInt16LE(24) > 0,
                // pocket: data[26],
                // type: data[27],
                // fieldUsePtr: data.readInt32LE(28),
                // battleUsage: data.readInt32LE(32),
                // battleUsagePtr: data.readInt32LE(36),
                // extraParameter: data.readInt32LE(40),
                isPokeball: data.readInt32LE(32) == 2 && data.readInt32LE(40) == data[27]
            }));
        }

        private ReadMoveData(romData: Buffer, config: PGEINI) {
            let moveNames = this.ReadStridedData(romData, parseInt(config.AttackNames, 16), 13, parseInt(config.NumberOfAttacks) + 1).map(p => this.FixAllCaps(this.ConvertText(p)));
            let contestData = this.ReadStridedData(romData, parseInt(config.ContestMoveEffectData, 16), 4, parseInt(config.NumberOfAttacks)).map(data => ({
                effect: contestEffects[data[0]],
                appeal: new Array(Math.floor(data[1] / 10)).fill('♥').join(''),
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
                type: typeNames[data[2]],
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
                contestData: {
                    type: contestMoveData[i].contestType,
                    effect: contestMoveData[i].effect,
                    appeal: contestMoveData[i].appeal,
                    jamming: contestMoveData[i].jamming
                }
            }));
        }

        private ReadMapLabels(romData: Buffer, config: PGEINI) {
            return this.ReadStridedData(romData, parseInt(config.MapLabelData, 16), this.isFRLG(config) ? 4 : 8, parseInt(config.NumberOfMapLabels))
                .map(ptr => {
                    var addr = this.fixRomPtr(ptr.readInt32LE(0));
                    return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20)));
                });
        }

        private ReadMaps(romData: Buffer, config: PGEINI) {
            return this.parsePointerBlock(this.ReadStridedData(romData, this.fixRomPtr(romData.readInt32LE(parseInt(config.Pointer2PointersToMapBanks, 16))), 4))
                .map((bankPtr, b, arr) => this.parsePointerBlock(this.ReadStridedData(romData, bankPtr, 4, ((arr[b + 1] - bankPtr) / 4) || 255)).map(ptr => romData.slice(ptr, ptr + 32))
                    .map((mapHeader, m) => (<Pokemon.Map>{
                        bank: b + 1,
                        id: m + 1,
                        areaId: mapHeader[0x14],
                        areaName: this.areas[mapHeader[0x14]],
                        name: this.areas[mapHeader[0x14]],
                        encounters: {}
                    }))
                ).reduce((allMaps, currBank) => Array.prototype.concat.apply(allMaps, currBank), []);
        }

        private FindMapEncounters(romData: Buffer, config: PGEINI) {
            let wildPokemonPtr = this.fixRomPtr(romData.readInt32LE(romData.indexOf(wildPokemonPtrMarker, 0, 'hex') + (wildPokemonPtrMarker.length / 2)));
            this.ReadStridedData(romData, wildPokemonPtr, 20).forEach(data => {
                let mapBank = data[0], mapId = data[1];
                if (mapBank == 0xFF && mapId == 0xFF)
                    return;
                this.GetMap(mapId, mapBank).encounters = {
                    all: {
                        grass: this.ReadEncounterSet(romData, this.fixRomPtr(data.readInt32LE(4)), grassEncounterRates),
                        surfing: this.ReadEncounterSet(romData, this.fixRomPtr(data.readInt32LE(8)), surfEncounterRates),
                        hidden_grass: this.ReadEncounterSet(romData, this.fixRomPtr(data.readInt32LE(12)), rockSmashEncounterRates),
                        fishing: this.ReadEncounterSet(romData, this.fixRomPtr(data.readInt32LE(16)), fishingEncounterRates, fishingRequiredRods),
                    }
                };
            });
        }

        private ReadEncounterSet(romData: Buffer, setAddr: number, encounterRates: number[], requiredItems: number[] = []) {
            if (setAddr <= 0)
                return [];
            let setPtr = this.fixRomPtr(romData.readInt32LE(setAddr + 4));
            return this.CombineDuplicateEncounters(this.ReadStridedData(romData, setPtr, 4, encounterRates.length).map((data, i) => (<Pokemon.EncounterMon>{
                species: this.GetSpecies(data.readInt16LE(2)),
                rate: encounterRates[i],
                requiredItem: this.GetItem(requiredItems[i])
            })));
        }
    }

}