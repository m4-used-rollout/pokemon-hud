/// <reference path="base.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

namespace RomReader {
    const fs = require("fs");

    export abstract class GBReader extends RomReaderBase {
        protected stringTerminator = 0x50;

        constructor(private romFileLocation: string, private charmap: string[]) {
            super();
            this.ballIds = this.natures = this.abilities = [];
            this.characteristics = null;
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
            return charArray.map(c => this.charmap[c] || ' ').join('');
        }

        GetForm(pokemon:TPP.Pokemon) {
            if (pokemon.species.id == 201) {
                return Math.floor((((pokemon.ivs.attack & 6) << 5) | ((pokemon.ivs.defense & 6) << 3) | ((pokemon.ivs.speed & 6) << 1) | ((pokemon.ivs.special_attack & 6) >> 1)) / 10);
            }
            return 0;
        }

        protected loadROM(): Buffer {
            return fs.readFileSync(this.romFileLocation);
        }

        protected ReadStridedData(romData: Buffer, startOffset: number, strideBytes: number, length: number = 0, lengthIsMax = false) {
            let choppedData = new Array<Buffer>();
            for (let i = 0; (i < length || length <= 0) && (startOffset + (strideBytes * (i + 1))) <= romData.length; i++) {
                let chunk = romData.slice(startOffset + (strideBytes * i), startOffset + (strideBytes * (i + 1)));
                if ((length <= 0 || lengthIsMax) && chunk[0] == 0xFF) {
                    return choppedData;
                }
                choppedData.push(chunk);
            }
            return choppedData;
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

        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number) {
            return this.ReadBundledData(romData, startOffset, this.stringTerminator, numStrings).map(b => this.ConvertText(b));
        }

        protected LinearAddrToROMBank(linear: number) {
            let bank = linear >> 14;
            let address = (linear % 0x4000) | (bank ? 0x4000 : 0);
            return { bank: bank, address: address };
        }

        protected ROMBankAddrToLinear(bank: number, address: number) {
            return (bank << 14) | (address & 0x3fff);
        }

        protected SameBankPtrToLinear(baseAddr: number, ptr: number) {
            return this.ROMBankAddrToLinear(this.LinearAddrToROMBank(baseAddr).bank, ptr);
        }
    }
}