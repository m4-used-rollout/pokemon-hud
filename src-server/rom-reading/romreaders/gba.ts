/// <reference path="gb.ts" />
/// <reference path="../config/g3.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../../ref/ini.d.ts" />
/// <reference path="../../../ref/pge.ini.d.ts" />



namespace RomReader {
    const fs = require("fs");
    const ini = require("ini");
    const fixCaps = /(\b[a-z])/g;

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

    }
}