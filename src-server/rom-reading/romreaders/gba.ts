/// <reference path="gb.ts" />
/// <reference path="../config/g3.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../../ref/ini.d.ts" />
/// <reference path="../../../ref/pge.ini.d.ts" />



namespace RomReader {
    const fs = require("fs");
    const ini = require("ini");

    export abstract class GBAReader extends GBReader {
        protected stringTerminator = 0xFF;

        constructor(romFileLocation: string, private iniFileLocation: string) {
            super(romFileLocation, gen3Charmap);
            this.ballIds = this.natures = this.abilities = [];
            this.characteristics = null;
        }

        protected LoadConfig(romData: Buffer): PGEINI {
            let romHeader = romData.toString('ascii', 0xAC, 0xB0);
            let iniData = ini.parse(fs.readFileSync(this.iniFileLocation, 'utf8'));
            let romIniData = iniData[romHeader] || {}
            romIniData.Header = romHeader;
            return romIniData;
        }

        protected readRomPtr(romData: Buffer, addr: number) {
            return romData.readInt32LE(addr) - 0x8000000;
        }

        protected readPtrBlock(romData: Buffer, startAddr: number, endAddr?: number) {
            endAddr = endAddr || 0;
            let pointers = new Array<number>();
            for (let i = startAddr; i < romData.length && (i < endAddr || startAddr > endAddr); i += 4) {
                let ptr = this.readRomPtr(romData, i);
                if (ptr < 0 || ptr > romData.length) {
                    return pointers;
                }
                pointers.push(ptr);
            }
            return pointers;
        }

        protected findPtrFromPreceedingData(romData: Buffer, hexStr: string) {
            return this.readRomPtr(romData, romData.indexOf(hexStr, 0, 'hex') + Math.ceil(hexStr.length / 2));
        }

    }
}