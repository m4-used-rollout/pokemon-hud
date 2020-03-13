/// <reference path="base.ts" />
/// <reference path="../tools/narchive.ts" />
/// <reference path="../tools/blzcoder.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../../ref/ini.d.ts" />
/// <reference path="../../../ref/pge.ini.d.ts" />

namespace RomReader {
    const NARCArchive = Tools.NARChive;
    const fs = require("fs") as typeof import("fs");
    const ini = require("ini") as typeof import("ini");

    export abstract class NDSReader extends RomReaderBase {
        protected dataPath = "data/";
        protected romHeader = "";

        constructor(private basePath: string) {
            super();
            if (!this.basePath.endsWith('/') && !this.basePath.endsWith('\\')) {
                this.basePath += '/';
            }
            this.characteristics.hp[1] = "Often dozes off";
            this.characteristics.hp[2] = "Often scatters things";
        }

        protected readNARC(path: string) {
            return new NARCArchive(this.readDataFile(path));
        }

        protected readDataFile(path:string):Buffer {
            return this.readFile(this.dataPath + path);
        }

        protected readArm9() {
            const arm9 = this.readFile('arm9.bin');
            try {
                return BLZCoder.Decode(arm9);
            }
            catch (e) {
                return arm9;
            }
        }

        protected readFile(path: string): Buffer {
            return fs.readFileSync(this.basePath + path);
        }

        protected LoadConfig(iniFileLocation: string): UPRINI {
            this.romHeader = this.readFile("header.bin").toString('ascii', 0xC, 0x10);
            const iniDict = ini.parse(fs.readFileSync(iniFileLocation, 'utf8')) as UPRINI[];
            const iniList = Object.keys(iniDict).map(k => {
                const iniData = iniDict[k];
                iniData.ProperName = k;
                return iniData;
            });
            let romIni = iniList.filter(i => i.Game == this.romHeader).pop() || {} as UPRINI;
            while (romIni.CopyFrom) {
                let copyFrom = romIni.CopyFrom;
                delete romIni.CopyFrom;
                romIni = Object.assign(iniList.filter(i => i.Game == copyFrom).pop() || {} as UPRINI, romIni);
            }
            return romIni;
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            const spriteFolder = TPP.Server.getConfig().spriteFolder;
            let possibleSpriteUrls: string[] = [];
            if (!generic && spriteFolder) {
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : ''}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : ''}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${id}.png`);
            }
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${id}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${id}.png`);
            for (let i = 0; i < possibleSpriteUrls.length; i++) {
                if (fs.existsSync(__dirname + '/' + possibleSpriteUrls[i]))
                    return possibleSpriteUrls[i];
            }
            return './img/empty-sprite.png'; //whatever
        }
    }
}