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

        protected fixRomPtr(ptr: number | Buffer) {
            if (ptr instanceof Buffer) {
                ptr = ptr.readInt32LE(0);
            }
            return ptr - 0x8000000;
        }

        protected parsePointerBlock(ptrBufferArr: Buffer[]) {
            return ptrBufferArr.map(ptr => this.fixRomPtr(ptr)).map(ptr => ptr > 0 ? ptr : null).concat([null]).filter((ptr, i, arr) => i < arr.indexOf(null));
        }

    }
}