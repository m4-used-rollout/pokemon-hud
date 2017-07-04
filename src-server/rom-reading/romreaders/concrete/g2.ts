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

    export interface Gen2Item extends Pokemon.Item {
        price: number;
        pocket: string;
    }

    export class Gen2 extends GBReader {
        constructor(romFileLocation: string) {
            super(romFileLocation, config.charmap);

            let romData = this.loadROM();
            this.pokemon = this.ReadPokeData(romData);
            this.items = this.ReadItemData(romData);
            this.ballIds = this.items.filter((i: Gen2Item) => i.pocket == "Ball").map(i => i.id);
            this.moves = this.ReadMoveData(romData);

            //TODO: turn "landmarks" into map names

        }

        private ReadMoveData(romData: Buffer) {
            const dataBytes = 7;
            let movesOffset = config.MoveDataOffset - dataBytes; //include 00
            let moveNames = this.ReadStringBundle(romData, config.MoveNamesOffset, moveCount);
            moveNames.unshift(''); //move 0
            console.log(JSON.stringify(moveNames));
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
                growth_rate: expCurveNames[data[0x16]],
                expFunction: expCurves[data[0x16]],
                eggGroup1: data[0x17] % 16,
                eggGroup2: data[0x17] >> 4,
            }));
        }
    }
}