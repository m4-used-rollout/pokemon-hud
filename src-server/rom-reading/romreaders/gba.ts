/// <reference path="gb.ts" />
/// <reference path="../config/g3.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../../ref/ini.d.ts" />
/// <reference path="../../../ref/pge.ini.d.ts" />
/// <reference path="../tools/lz77.ts" />


namespace RomReader {
    const fs = require("fs");
    const ini = require("ini");

    export abstract class GBAReader extends GBReader {
        protected stringTerminator = 0xFF;

        constructor(romFileLocation: string, private iniFileLocation: string) {
            super(romFileLocation, gen3Charmap);
        }

        protected LoadConfig(romData: Buffer): PGEINI {
            let romHeader = romData.toString('ascii', 0xAC, 0xB0);
            let iniData = ini.parse(fs.readFileSync(this.iniFileLocation, 'utf8'));
            let romIniData = iniData[romHeader] || {}
            romIniData.Header = romHeader;
            return romIniData;
        }

        protected ReadRomPtr(romData: Buffer, addr: number = 0) {
            return romData.readUInt32LE(addr) - 0x8000000;
        }

        protected ReadPtrBlock(romData: Buffer, startAddr: number, endAddr?: number) {
            endAddr = endAddr || 0;
            let pointers = new Array<number>();
            for (let i = startAddr; i < romData.length && (i < endAddr || startAddr > endAddr); i += 4) {
                let ptr = this.ReadRomPtr(romData, i);
                if (ptr < 0 || ptr > romData.length) {
                    return pointers;
                }
                pointers.push(ptr);
            }
            return pointers;
        }

        protected FindPtrFromPreceedingData(romData: Buffer, hexStr: string) {
            return this.ReadRomPtr(romData, romData.indexOf(hexStr, 0, 'hex') + Math.ceil(hexStr.length / 2));
        }

        protected DecompressPointerCollection(romData: Buffer, startAddr: number, numPtrs: number, strideBytes = 8) {
            return this.ReadStridedData(romData, startAddr, strideBytes, numPtrs).map(ptr => this.ReadRomPtr(ptr)).filter(addr => addr >= 0).map(addr => Tools.LZ77.Decompress(romData, addr));
        }

        CalculateHiddenPowerType(stats: TPP.Stats) {
            const types = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark'];
            return types[Math.floor(((stats.hp % 2) + ((stats.attack % 2) << 1) + ((stats.defense % 2) << 2) + ((stats.speed % 2) << 3) + ((stats.special_attack % 2) << 4) + ((stats.special_defense % 2) << 5)) * 15 / 63)];
        }
        CalculateHiddenPowerPower(stats: TPP.Stats) {
            return Math.floor((((stats.hp >> 1) % 2) + (((stats.attack >> 1) % 2) << 1) + (((stats.defense >> 1) % 2) << 2) + (((stats.speed >> 1) % 2) << 3) + (((stats.special_attack >> 1) % 2) << 4) + (((stats.special_defense >> 1) % 2) << 5)) * 40 / 63) + 30;
        }

        CalculateGender(pokemon: TPP.Pokemon) {
            if (pokemon.species.gender_ratio && typeof (pokemon.gender) !== "string") {
                if (pokemon.species.gender_ratio == 255) {
                    pokemon.gender = '';
                }
                else if (pokemon.species.gender_ratio == 254) {
                    pokemon.gender = "Female";
                }
                else if (pokemon.species.gender_ratio == 0) {
                    pokemon.gender = "Male";
                }
                else { //Generation 3+
                    pokemon.gender = (pokemon.personality_value % 256) > pokemon.species.gender_ratio ? "Male" : "Female";
                }
            }
        }
        CalculateShiny(pokemon: TPP.Pokemon) {
            if (typeof pokemon.shiny !== "boolean" && pokemon.original_trainer) {
                pokemon.shiny = ((pokemon.original_trainer.id ^ pokemon.original_trainer.secret) ^ (Math.floor(pokemon.personality_value / 65536) ^ (pokemon.personality_value % 65536))) < 8;
            }
        }

    }
}