/// <reference path="../../config/g2.ts" />
/// <reference path="../gb.ts" />

namespace RomReader {

    const config = gen2Offsets;

    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "", "", "", "", "", "", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Ground", "Fairy", "Plant", "Humanshape", "Water 3", "Mineral", "Indeterminate", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
    const bagPockets = ["???", "Item", "Key Item", "Ball", "TM/HM"];

    const tmCount = 50, hmCount = 7, itemCount = 256, dexCount = 256, moveCount = 251;

    interface Gen2Item extends Pokemon.Item {
        price: number;
        pocket: string;
    }

    interface Gen2Map extends Pokemon.Map {
        fishingGroup: number;
    }

    export class Gen2 extends GBReader {
        constructor(romFileLocation: string) {
            super(romFileLocation, config.charmap);

            let romData = this.loadROM();
            this.pokemon = this.ReadPokeData(romData);
            this.items = this.ReadItemData(romData);
            this.ballIds = this.items.filter((i: Gen2Item) => i.pocket == "Ball").map(i => i.id);
            this.moves = this.ReadMoveData(romData);
            this.areas = this.ReadAreaNames(romData);
            this.maps = this.ReadMaps(romData);
            this.levelCaps = this.ReadPyriteLevelCaps(romData);
            console.log(JSON.stringify(this));

        }

        private ReadPyriteLevelCaps(romData: Buffer) {
            return this.ReadStridedData(romData, 0x3fef, 1, 17).map(l => l[0]).filter(l => l > 0);
        }

        private ReadMaps(romData: Buffer) {
            const mapHeaderBytes = 9;
            return this.ReadStridedData(romData, config.MapHeaders, 2, 26)
                .map(bankPtr => this.SameBankPtrToLinear(config.MapHeaders, bankPtr.readUInt16LE(0)))
                .map((ptr, b, arr) => this.ReadStridedData(romData, ptr, mapHeaderBytes, (arr[b + 1] - ptr) / mapHeaderBytes)
                    .map((mapHeader, m) => (<Gen2Map>{
                        bank: b + 1,
                        id: m + 1,
                        name: config.mapNames[b + 1][m + 1].name,
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
    }
}