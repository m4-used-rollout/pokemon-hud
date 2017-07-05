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

        protected loadROM(): Buffer {
            return fs.readFileSync(this.romFileLocation);
        }

        protected ReadStridedData(romData: Buffer, startOffset: number, strideBytes: number, length: number) {
            let choppedData = new Array<Buffer>();
            for (let i = 0; i < length && (startOffset + (strideBytes * (i + 1))) < romData.length; i++) {
                choppedData.push(romData.slice(startOffset + (strideBytes * i), startOffset + (strideBytes * (i + 1))));
            }
            return choppedData;
        }

        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number) {
            let foundStrings = new Array<string>();
            for (let i = startOffset, strStart = startOffset; i < romData.length && foundStrings.length < numStrings; i++) {
                if (romData[i] == this.stringTerminator) {
                    foundStrings.push(this.ConvertText(romData.slice(strStart, i)));
                    strStart = i + 1;
                }
            }
            return foundStrings;
        }

        protected LinearAddrToROMBank(linear: number) {
            let bank = linear >> 14;
            let address = (linear % 0x4000) | (bank ? 0x4000 : 0);
            return { bank: bank, address: address };
        }

        protected ROMBankAddrToLinear(bank: number, address: number) {
            return (bank << 14) | (address & 0x3fff);
        }

        protected SameBankPtrToLinear(baseAddr:number, ptr:number) {
            return this.ROMBankAddrToLinear(this.LinearAddrToROMBank(baseAddr).bank, ptr);
        }
    }
}