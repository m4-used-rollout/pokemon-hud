/// <reference path="base.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

namespace RomReader {
    const fs = require("fs");
    const fixCaps = /(\b[a-z])/g;
    const fixWronglyCapped = /(['’][A-Z]|okéMon)/g;
    const fixWronglyLowercased = /(^[T|H]m|\bTv\b)/g;

    export abstract class GBReader extends RomReaderBase {
        protected stringTerminator = 0x50;
        protected symTable: { [key: string]: number };

        constructor(private romFileLocation: string, private charmap: string[]) {
            super();
            this.ballIds = this.abilities = [];
            this.characteristics = null;
            this.types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "", "", "", "", "", "", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
        }

        ConvertText(text: string | Buffer | number[]) {
            if (!text)
                return "";
            let charArray: Array<number>;
            if (typeof text === "string")
                return text;
            else if (text instanceof Buffer) {
                charArray = [];
                for (let i = 0; i < text.length; charArray.push(text[i++]));
            }
            else
                charArray = text;
            let end = charArray.indexOf(this.stringTerminator);
            if (end >= 0)
                charArray.splice(end);
            // end = charArray.indexOf(0x00);   //was for bad romhacky text, but breaks on gen 3
            // if (end >= 0)
            //     charArray.splice(end);
            return charArray.map(c => this.charmap[c] || ' ').join('');
        }

        GetForm(pokemon: TPP.Pokemon) {
            if (pokemon.species.id == 201) {
                return Math.floor((((pokemon.ivs.attack & 6) << 5) | ((pokemon.ivs.defense & 6) << 3) | ((pokemon.ivs.speed & 6) << 1) | ((pokemon.ivs.special_attack & 6) >> 1)) / 10);
            }
            return 0;
        }

        protected loadROM(): Buffer {
            return fs.readFileSync(this.romFileLocation);
        }

        protected ReadBundledData(romData: Buffer, startOffset: number, terminator: number, numBundles: number, endOffset = 0) {
            let bundles = new Array<Buffer>();
            numBundles = numBundles || romData.length;
            if (endOffset < startOffset || endOffset > romData.length) {
                endOffset = romData.length;
            }
            for (let i = startOffset, bundleStart = startOffset; i < endOffset && bundles.length < numBundles; i++) {
                if (romData[i] == terminator) {
                    bundles.push(romData.slice(bundleStart, i));
                    bundleStart = i + 1;
                }
            }
            return bundles;
        }

        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number, endOffset = 0) {
            return this.ReadBundledData(romData, startOffset, this.stringTerminator, numStrings, endOffset).map(b => this.ConvertText(b));
        }

        protected LinearAddrToROMBank(linear: number, bankSize = 0x4000) {
            let bank = linear >> 14;
            let address = (linear % bankSize) | (bank ? bankSize : 0);
            return { bank: bank, address: address };
        }

        protected ROMBankAddrToLinear(bank: number, address: number, bankSize = 0x4000) {
            return (bank << 14) | (address % bankSize);
        }

        protected SameBankPtrToLinear(baseAddr: number, ptr: number) {
            return this.ROMBankAddrToLinear(this.LinearAddrToROMBank(baseAddr).bank, ptr);
        }

        protected FixAllCaps(str: string) {
            return str.toLowerCase().replace(fixCaps, c => c.toUpperCase()).replace(fixWronglyCapped, c => c.toLowerCase()).replace(fixWronglyLowercased, c => c.toUpperCase());
        }

        public CalcHiddenPowerType(stats: TPP.Stats) {
            const types = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark'];
            return types[4 * (stats.attack % 4) + (stats.defense % 4)];
        }

        public CalcHiddenPowerPower(stats: TPP.Stats) {
            return Math.floor((5 * ((stats.special_attack >> 3) + ((stats.speed >> 3) << 1) + ((stats.defense >> 3) << 2) + ((stats.attack >> 3) << 3)) + (stats.special_defense % 4)) / 2) + 31;
        }

        private symbolEntry = /([0-9A-F]+):([0-9A-F]+) ([^\s]+)/i;
        protected LoadSymbolFile(filename: string) {
            const symFile: string = fs.readFileSync(filename, 'utf8');
            const symTable: { [key: string]: number } = {};
            symFile.split('\n').forEach(line => {
                const parsed = this.symbolEntry.exec(line.trim());
                if (parsed) {
                    const bank = parseInt(parsed[1], 16);
                    const address = parseInt(parsed[2], 16);
                    if (address >= 0x8000) //outside of ROM, ignore bank
                        symTable[parsed[3]] = address;
                    else
                        symTable[parsed[3]] = this.ROMBankAddrToLinear(bank, address, 0x4000)
                }
            });
            //console.dir(symTable);
            return symTable;
        }

        protected IsFlagSet(romData: Buffer, flagStartOffset: number, flagIndex: number) {
            return (romData[flagStartOffset + Math.floor(flagIndex / 8)] & ((flagIndex % 8) + 1)) > 0; //FIX
        }

        protected ParseBCD(bcd: Buffer) {
            return bcd.toString('hex').split('').reverse().reduce((sum, char, place) => sum + (parseInt(char, 16) * Math.pow(10, place)), 0);
        }
    }
}