/// <reference path="../../config/g1.ts" />
/// <reference path="../../tools/lz-gsc.ts" />
/// <reference path="../gb.ts" />

namespace RomReader {

    const charmap = gen1Charmap;
    const mapNames = gen1MapNames;
    const genericMonRef: Pokemon.Species[] = require(`./data/generic/species.json`);

    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "", "", "", "", "", "", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    const tmCount = 50, hmCount = 5, dexCount = 151;

    interface ClearFix { [key: number]: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } };
    const pokeSpriteClearFix: ClearFix = {};

    const unownSpriteClearFix: ClearFix = {};

    const trainerSpriteClearFix: ClearFix = {};

    interface Gen1Map extends Pokemon.Map {
        fishingGroup: number;
    }

    export class Gen1 extends GBReader {
        private fishingRodIds = { oldRod: 0, goodRod: 0, superRod: 0 };

        constructor(romFileLocation: string) {
            super(romFileLocation, charmap);
            this.natures = [];

            let romData = this.loadROM();
            this.symTable = this.LoadSymbolFile(romFileLocation.replace(/\.[^.]*$/, '.sym'));
            this.pokemon = this.ReadPokeData(romData);
            // this.pokemonSprites = this.ReadPokemonSprites(romData);
            // this.trainers = this.ReadTrainerData(romData);
            // this.trainerSprites = this.ReadTrainerSprites(romData);
            // this.frameBorders = this.ReadFrameBorders(romData);
            this.items = this.ReadItemData(romData);
            this.ballIds = this.FindBallIds(romData);
            this.FindFishingRods(romData);
            this.areas = this.ReadAreaNames();
            this.moves = this.ReadMoveData(romData);
            this.moveLearns = this.ReadMoveLearns(romData);
            this.maps = this.ReadMaps(romData);
            this.FindFishingEncounters(romData);
            this.AddTMHMs(romData);
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            //return `./img/sprites/${TPP.Server.getConfig().spriteFolder}/${this.GetSpecies(id).dexNumber}.png`;
            return `./img/sprites/redblue/${this.GetSpecies(id).dexNumber}.png`;
        }
        GetTrainerSprite(id: number) {
            //return `./img/trainers/${TPP.Server.getConfig().trainerSpriteFolder || TPP.Server.getConfig().spriteFolder}/${id}.png`
            return `./img/trainers/redblue/${id}.png`
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 16) == 16; //Soul Badge
        }

        private FindFishingEncounters(romData) {
            const fishBank = this.LinearAddressToBanked(this.symTable['SuperRodData']).bank;
            const alwaysFish = new Array<Pokemon.EncounterMon>();
            const oldRodSpecies = romData.readUInt8(this.symTable['ItemUseOldRod'] + 7);
            const goodRodSpecies = [romData.readUInt8(this.symTable['GoodRodMons'] + 1), romData.readUInt8(this.symTable['GoodRodMons'] + 3)];
            alwaysFish.push({
                speciesId: oldRodSpecies,
                species: this.GetSpecies(oldRodSpecies),
                requiredItem: this.GetItem(this.fishingRodIds.oldRod),
                rate: 100 //Old Rod always catches.
            });
            goodRodSpecies.forEach(f => alwaysFish.push({
                speciesId: f,
                species: this.GetSpecies(f),
                requiredItem: this.GetItem(this.fishingRodIds.goodRod),
                rate: 25 //50% for this species, 50% to catch anything at all
            }));
            this.ReadStridedData(romData, this.symTable['SuperRodData'], 3).forEach(sr => {
                const fgAddr = this.BankAddressToLinear(fishBank, sr.readInt16LE(1));
                this.GetMap(sr.readUInt8(0)).encounters['all'].fishing = this.CombineDuplicateEncounters(alwaysFish
                    .concat(this.ReadStridedData(romData, fgAddr + 1, 2, romData[fgAddr])
                        .map((f, i, arr) => (<Pokemon.EncounterMon>{
                            speciesId: f[1],
                            species: this.GetSpecies(f[1]),
                            requiredItem: this.GetItem(this.fishingRodIds.superRod),
                            rate: Math.round(50 / arr.length)
                        }))
                    ));
            });
        }

        private ParseEncounters(encounters: Buffer, encounterRates: number[]) {
            return this.ReadStridedData(encounters, 0, 2).map((e, i) => (<Pokemon.EncounterMon>{
                speciesId: e[1],
                species: this.GetSpecies(e[1]),
                rate: encounterRates[i]
            }));
        }

        private ReadEncounterTablesAt(romData: Buffer, addr: number, encounterRates: number[]): Pokemon.EncounterSet {
            let grass = new Array<Pokemon.EncounterMon>();
            if (romData[addr] > 0) {
                grass = this.CombineDuplicateEncounters(this.ParseEncounters(romData.slice(addr + 1, addr + 21), encounterRates));
                addr += 20;
            }
            addr++;
            let surfing = new Array<Pokemon.EncounterMon>();
            if (romData[addr] > 0) {
                surfing = this.CombineDuplicateEncounters(this.ParseEncounters(romData.slice(addr + 1, addr + 21), encounterRates));
            }
            return { grass: grass, surfing: surfing, fishing: [] };
        }

        private ReadMaps(romData: Buffer) {
            const encounterRates = this.ReadStridedData(romData, this.symTable['WildMonEncounterSlotChances'], 2).map(data => data[0]).concat(0xFF)
                .map((r, i, arr) => Math.round(((r - (i > 0 ? arr[i - 1] : 0)) / 256) * 100));
            const encounterBank = this.LinearAddressToBanked(this.symTable['WildDataPointers']).bank;
            return this.ReadStridedData(romData, this.symTable['WildDataPointers'], 2).map((ptr, i) => (<Pokemon.Map>{
                id: i,
                name: gen1MapNames[i],
                encounters: { all: this.ReadEncounterTablesAt(romData, this.BankAddressToLinear(encounterBank, ptr.readInt16LE(0)), encounterRates) }
            }));
        }

        private ReadAreaNames() {
            return gen1MapNames.map(n => n);
        }

        private AddTMHMs(romData: Buffer) {
            const firstTMId = (0xFA + 1) - tmCount;
            const tms = this.ReadStridedData(romData, this.symTable['TechnicalMachines'], 1, tmCount)
                .map((m, i) => (<Pokemon.Item>{ id: firstTMId + i, isKeyItem: false, name: `TM${i < 9 ? "0" : ""}${i + 1} ${this.moves[m[0]] ? this.moves[m[0]].name : "???"}` }));
            const hms = this.ReadStridedData(romData, this.symTable['HMMoves'], 1).reverse()
                .map((m, i, arr) => (<Pokemon.Item>{ id: firstTMId - (i + 1), isKeyItem: true, name: `HM${(arr.length - i) < 10 ? "0" : ""}${arr.length - i} ${this.moves[m[0]] ? this.moves[m[0]].name : "???"}` }));
            this.items = this.items.concat(hms.reverse(), tms);
        }

        private ReadMoveData(romData: Buffer) {
            const dataBytes = this.symTable['MoveEnd'] - this.symTable['Moves'];
            const movesOffset = this.symTable['Moves'] - dataBytes; //include 00
            const moveCount = (this.symTable['BaseStats'] - this.symTable['Moves']) / dataBytes;
            const moveNames = this.ReadStringBundle(romData, this.symTable['MoveNames'], moveCount).map(m => this.FixAllCaps(m));
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

        private FindBallIds(romData: Buffer) {
            const useBallAddr = this.LinearAddressToBanked(this.symTable["ItemUseBall"]).address;
            return this.ReadStridedData(romData.slice(this.symTable["ItemUsePtrTable"], this.symTable["ItemUseBall"]), 0, 2, 255)
                .map((u, i) => ({ ptr: u.readInt16LE(0), id: i + 1 }))
                .filter(p => p.ptr == useBallAddr)
                .map(p => p.id);
        }

        private FindFishingRods(romData: Buffer) {
            const useFishingRodAddrs = ['ItemUseOldRod', 'ItemUseGoodRod', 'ItemUseSuperRod'].map(a => this.LinearAddressToBanked(this.symTable[a]).address);
            this.ReadStridedData(romData.slice(this.symTable["ItemUsePtrTable"], this.symTable["ItemUseBall"]), 0, 2, 255)
                .map((u, i) => ({ ptr: u.readInt16LE(0), id: i + 1 }))
                .filter(p => useFishingRodAddrs.indexOf(p.ptr) >= 0)
                .forEach(p => this.fishingRodIds[Object.keys(this.fishingRodIds)[useFishingRodAddrs.indexOf(p.ptr)]] = p.id);
        }

        private ReadItemData(romData: Buffer) {
            return [''].concat(this.ReadStringBundle(romData, this.symTable['ItemNames'], 255, this.symTable['UnusedNames']).map(i => this.FixAllCaps(i))).map((item, i) => (<Pokemon.Item>{
                id: i,
                name: item,
                price: i ? this.ParseBCD(romData.slice(this.symTable['ItemPrices'] + ((i - 1) * 3), this.symTable['ItemPrices'] + (i * 3))) : 0,
                isKeyItem: i ? this.IsFlagSet(romData, this.symTable['KeyItemBitfield'], i - 1) : false
            }));
        }

        public BankSizes = {
            ROM: 0x4000,
            VRAM: 0x2000,
            SRAM: 0x2000,
            CartRAM: 0x2000, //SRAM
            WRAM: 0x2000
        }

        // private ReadTrainerData(romData: Buffer) {
        //     let classNames = this.ReadStringBundle(romData, config.TrainerClassNamesOffset, trainerClasses).map(n => this.FixAllCaps(n));
        //     let trainers: Pokemon.Trainer[] = [];
        //     let bank = this.LinearAddrToROMBank(config.TrainerGroupsOffset).bank;
        //     this.ReadStridedData(romData, config.TrainerGroupsOffset, 2, trainerClasses).forEach((ptr, cId, ptrArr) => {
        //         let thisAddr = this.ROMBankAddrToLinear(bank, ptr.readUInt16LE(0));
        //         let nextAddr = ptrArr[cId + 1] ? this.ROMBankAddrToLinear(bank, ptrArr[cId + 1].readUInt16LE(0)) : 0;
        //         this.ReadBundledData(romData, thisAddr, 0xFF, nextAddr || 1, nextAddr).forEach((tData, tId) => {
        //             trainers.push({
        //                 classId: cId,
        //                 spriteId: cId,
        //                 id: tId,
        //                 className: classNames[cId],
        //                 name: this.FixAllCaps(this.ConvertText(tData))
        //             });
        //         });
        //     });
        //     return trainers;
        // }

        private PokedexToIndex(romData: Buffer, dexNum: number) {
            for (var c = 0; romData.readUInt8(this.symTable['PokedexOrder'] + c) != dexNum; c++);
            return c;
        }

        private IndexToPokedex = (romData: Buffer, id: number) => romData.readUInt8(this.symTable['PokedexOrder'] + id);

        private ReadPokeData(romData: Buffer) {
            const nameBytes = 10;
            const dataBytes = this.symTable['MonBaseStatsEnd'] - this.symTable['MonBaseStats'];
            const contiguousMons = Math.floor((this.symTable['CryData'] - this.symTable['BaseStats']) / dataBytes);
            return this.ReadStridedData(romData, this.symTable['BaseStats'], dataBytes, contiguousMons).concat(this.ReadStridedData(romData, this.symTable['MewBaseStats'], dataBytes, dexCount - contiguousMons))
                .map(data => {
                    const speciesOffset = this.PokedexToIndex(romData, data[0x00]);
                    const nameAddr = this.symTable['MonsterNames'] + (nameBytes * speciesOffset);
                    return (<Pokemon.Species>{
                        id: speciesOffset + 1,
                        dexNumber: data[0x00],
                        name: this.FixAllCaps(this.ConvertText(romData.slice(nameAddr, nameAddr + nameBytes))),
                        baseStats: {
                            hp: data[0x01],
                            atk: data[0x02],
                            def: data[0x03],
                            speed: data[0x04],
                            spatk: data[0x05],
                            spdef: data[0x05]
                        },
                        type1: types[data[0x06]],
                        type2: types[data[0x07]],
                        catchRate: data[0x08],
                        baseExp: data[0x09],
                        genderRatio: genericMonRef.filter(p => p.dexNumber == data[0x00]).pop().genderRatio,
                        spriteSize: data[0x0A] % 16, //sprites are always square
                        frontSpritePointer: data.readInt16LE(0x0B),
                        // 0x0D	Pointer to backsprite	word
                        // 0x0F-0x12	Attacks known at lv. 1	4 bytes
                        growthRate: expCurveNames[data[0x13]],
                        expFunction: expCurves[data[0x13]],
                        // 0x14-0x1A	TM and HM flags	7 bytes
                        // 0x1B	Padding	byte
                    });
                });
        }

        private ReadMoveLearns(romData: Buffer) {
            const moveLearns= {} as { [key: number]: Pokemon.MoveLearn[] };
            const mons = (this.symTable["RhydonEvosMoves"] - this.symTable["EvosMovesPointerTable"]) / 2;
            const bank = this.LinearAddressToBanked(this.symTable["EvosMovesPointerTable"]).bank;
            this.ReadStridedData(romData, this.symTable["EvosMovesPointerTable"], 2, mons).forEach((ptr, i) => {
                let addr = this.BankAddressToLinear(bank, ptr.readUInt16LE(0));
                const moves = new Array<Pokemon.MoveLearn>();
                for (addr = addr; romData[addr] != 0; addr++); //skip evolution data
                for (addr++; romData[addr] != 0; addr += 2)
                    if (romData[addr] && romData[addr+1])
                        moves.push(Object.assign({ level: romData[addr]}, this.GetMove(romData[addr + 1])));
                moveLearns[i] = moves;
            });
            // console.dir(moveLearns);
            return moveLearns;
        }

        // private ReadFrameBorders(romData: Buffer) {
        //     let framePal = ["white", "black"];
        //     return this.ReadStridedData(romData, config.FrameBordersOffset, 48, 9).map(frameData =>
        //         JSON.stringify(
        //             Sprites.FloodClear(
        //                 Sprites.ParseTilesToLayout(frameData, framePal, 6, [
        //                     [6, 4, 4, 4, 4, 4, 4, 3],
        //                     [2, 0, 0, 0, 0, 0, 0, 2],
        //                     [2, 0, 0, 0, 0, 0, 0, 2],
        //                     [2, 0, 0, 0, 0, 0, 0, 2],
        //                     [2, 0, 0, 0, 0, 0, 0, 2],
        //                     [2, 0, 0, 0, 0, 0, 0, 2],
        //                     [2, 0, 0, 0, 0, 0, 0, 2],
        //                     [5, 4, 4, 4, 4, 4, 4, 1]
        //                 ], 1), 0, [], [[20, 20]])
        //         )
        //     );
        // }

        private ProcessPalette(palData: Buffer) {
            return ['white', Sprites.Convert16BitColorToRGB(palData.readUInt16LE(2)), Sprites.Convert16BitColorToRGB(palData.readUInt16LE(0)), 'black'];
        }

        // private ReadTrainerSprites(romData: Buffer) {
        //     let palettes = this.ReadStridedData(romData, config.TrainerPalettes, 4, trainerClasses).map(data => this.ProcessPalette(data));
        //     return new Array(trainerClasses).fill(0).map((x, classId) => {
        //         let ptrAddr = config.TrainerPicPointers + (classId * 3);
        //         let spriteAddr = this.ROMBankAddrToLinear(romData[ptrAddr] + config.PicBankOffset, romData[ptrAddr + 2] * 0x100 + romData[ptrAddr + 1]);
        //         let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
        //         let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[classId], 7, 7);
        //         let clearFix = trainerSpriteClearFix[classId] || {};
        //         Sprites.FloodClear(imgData, 0, clearFix.stop, clearFix.start, clearFix.clearDiagonal);
        //         return JSON.stringify(imgData);
        //     });
        // }

        // private ReadPokemonSprites(romData: Buffer) {
        //     let palettes = this.ReadStridedData(romData, config.PokemonPalettes, 8, this.pokemon.length)
        //         .map(data => ({ base: this.ProcessPalette(data), shiny: this.ProcessPalette(data.slice(4)) }));
        //     function readPokeSprite(ptrAddr: number, mon: Pokemon.Species, clearFix: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } = {}) {
        //         let spriteAddr = this.ROMBankAddrToLinear(romData[ptrAddr] + config.PicBankOffset, romData[ptrAddr + 2] * 0x100 + romData[ptrAddr + 1]);
        //         let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
        //         let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[mon.id].base, mon.spriteSize, mon.spriteSize);
        //         Sprites.FloodClear(imgData, 0, clearFix.stop || [], clearFix.start || [], clearFix.clearDiagonal);
        //         return {
        //             base: JSON.stringify(imgData),
        //             shiny: JSON.stringify({ palette: palettes[mon.id].shiny, pixels: imgData.pixels })
        //         };
        //     }
        //     return this.pokemon.map(mon => {
        //         let ptrAddr = config.PokemonPicPointers + ((mon.id - 1) * 6); //front and back pointer, 3 bytes each
        //         if (mon.id < 1 || mon.id > 251) return;
        //         if (mon.id == 201) { //Unown
        //             ptrAddr = config.UnownPicPointers;
        //             return new Array(26).fill(0).map((x, unown) => readPokeSprite.call(this, ptrAddr + (unown * 6), mon, unownSpriteClearFix[unown] || {}));
        //         }
        //         return [readPokeSprite.call(this, ptrAddr, mon, pokeSpriteClearFix[mon.id] || {})];
        //     });
        // }

    }
}