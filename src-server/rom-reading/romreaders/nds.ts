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

        protected readDataFile(path: string): Buffer {
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

        protected readEvolutions(evoNarc: Tools.NARChive) {
            return evoNarc.files.forEach((file, i) => this.GetSpecies(i).evolutions = this.ReadStridedData(file, 0, 6, 7).map((data): Pokemon.Evolution => {
                const method = data.readUInt16LE(0);
                const evoParam = data.readUInt16LE(2);
                const speciesId = (this.GetSpecies(data.readUInt16LE(4)) || { dexNumber: data.readUInt16LE(4) }).dexNumber;
                switch (method) {
                    case 1: // HAPPINESS
                        return { speciesId, happiness: evoParam || 220 };
                    case 2: // HAPPINESS_DAY
                        return { speciesId, happiness: evoParam || 220, timeOfDay: "MornDay" };
                    case 3: // HAPPINESS_NIGHT
                        return { speciesId, happiness: evoParam || 220, timeOfDay: "Night" };
                    case 4: // LEVEL
                        return { speciesId, level: evoParam };
                    case 5: // TRADE,
                        return { speciesId, isTrade: true };
                    case 6: // TRADE_ITEM
                        return { speciesId, isTrade: true, item: this.GetItem(evoParam) };
                    case 7: // STONE
                        return { speciesId, item: this.GetItem(evoParam) };
                    case 8: // LEVEL_ATTACK_HIGHER
                        return { speciesId, level: evoParam || undefined, specialCondition: "Attack > Defense" };
                    case 9: // LEVEL_ATK_DEF_SAME
                        return { speciesId, level: evoParam || undefined, specialCondition: "Attack = Defense" };
                    case 10:// LEVEL_DEFENSE_HIGHER
                        return { speciesId, level: evoParam || undefined, specialCondition: "Attack < Defense" };
                    case 11:// LEVEL_LOW_PV
                        return { speciesId, level: evoParam || undefined, specialCondition: "Low PV" };
                    case 12:// LEVEL_HIGH_PV
                        return { speciesId, level: evoParam || undefined, specialCondition: "High PV" };
                    case 13:// LEVEL_CREATE_EXTRA
                        return { speciesId, level: evoParam || undefined, specialCondition: "Create Extra Pokemon" };
                    case 14:// LEVEL_IS_EXTRA
                        return { speciesId, level: evoParam || undefined, specialCondition: "Created Pokemon" };
                    case 15:// LEVEL_HIGH_BEAUTY
                        return { speciesId, level: evoParam || undefined, specialCondition: "High Beauty" };
                    case 16:// STONE_MALE_ONLY
                        return { speciesId, item: this.GetItem(evoParam), specialCondition: "Male Only" };
                    case 17:// STONE_FEMALE_ONLY,
                        return { speciesId, item: this.GetItem(evoParam), specialCondition: "Female Only" };
                    case 18:// LEVEL_ITEM_DAY
                        return { speciesId, item: this.GetItem(evoParam), timeOfDay: "MornDay", specialCondition: "Level While Holding" };
                    case 19:// LEVEL_ITEM_NIGHT
                        return { speciesId, item: this.GetItem(evoParam), timeOfDay: "Night", specialCondition: "Level While Holding" };
                    case 20:// LEVEL_WITH_MOVE
                        return { speciesId, move: this.GetMove(evoParam) };
                    case 21:// LEVEL_WITH_OTHER
                        return { speciesId, level: evoParam || undefined, specialCondition: "Level With Other" };
                    case 22:// LEVEL_MALE_ONLY
                        return { speciesId, level: evoParam, specialCondition: "Male Only" };
                    case 23:// LEVEL_FEMALE_ONLY
                        return { speciesId, level: evoParam, specialCondition: "Female Only" };
                    case 24:// LEVEL_ELECTRIFIED_AREA
                        return { speciesId, level: evoParam || undefined, specialCondition: "Electrified Area" };
                    case 25:// LEVEL_MOSS_ROCK
                        return { speciesId, level: evoParam || undefined, specialCondition: "Moss Rock" };
                    case 26:// LEVEL_ICY_ROCK
                        return { speciesId, level: evoParam || undefined, specialCondition: "Icy Rock" };
                    default:// NONE
                        return null;
                }
            }).filter(e => !!e));
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