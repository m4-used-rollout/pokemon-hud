/// <reference path="gb.ts" />
/// <reference path="../config/g3.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../../ref/ini.d.ts" />
/// <reference path="../../../ref/pge.ini.d.ts" />
/// <reference path="../tools/lz77.ts" />


namespace RomReader {
    const fs = require("fs") as typeof import("fs");
    const ini = require("ini") as typeof import("ini");

    export abstract class GBAReader extends GBReader {
        protected stringTerminator = 0xFF;
        public romHeader = "";
        public shinyChance = 8;

        constructor(romFileLocation: string, private iniFileLocation: string) {
            super(romFileLocation, gen3Charmap);
        }

        protected LoadConfig(romData: Buffer): PGEINI {
            this.romHeader = romData.toString('ascii', 0xAC, 0xB0);
            let iniData = ini.parse(fs.readFileSync(this.iniFileLocation, 'utf8'));
            let romIniData: PGEINI = iniData[this.romHeader] || {}
            romIniData.Header = this.romHeader;
            Object.keys(romIniData).forEach(k => {
                const num = parseInt(romIniData[k], 16)
                if (num > 0x8000000)
                    romIniData[k] = (num % 0x8000000).toString(16);
            });
            return romIniData;
        }

        protected ReadRomPtr(romData: Buffer, addr: number = 0) {
            return romData.readUInt32LE(addr) % 0x8000000;
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
            return this.ReadArray(romData, startAddr, strideBytes, numPtrs).map(ptr => this.ReadRomPtr(ptr)).filter(addr => addr >= 0).map(addr => Tools.LZ77.Decompress(romData, addr));
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
                pokemon.shiny = ((pokemon.original_trainer.id ^ pokemon.original_trainer.secret) ^ (Math.floor(pokemon.personality_value / 65536) ^ (pokemon.personality_value % 65536))) < this.shinyChance;
            }
        }
        ShinyThreshold() {
            return this.shinyChance;
        }

        protected ParseGFRomHeader(romData: Buffer) {
            //TODO: This doesn't exist in Ruby and Sapphire
            const headerData = romData.slice(0x100, 0x204);
            const romHeader = <GFRomHeader>{
                version: headerData.readUInt32LE(0x0),
                language: headerData.readUInt32LE(0x4),
                gameName: headerData.toString("utf8", 0x8, 0x28),
                monFrontPicsAddr: headerData.readUInt32LE(0x28) % 0x8000000,
                monBackPicsAddr: headerData.readUInt32LE(0x2C) % 0x8000000,
                monNormalPalettesAddr: headerData.readUInt32LE(0x30) % 0x8000000,
                monShinyPalettesAddr: headerData.readUInt32LE(0x34) % 0x8000000,
                monIconsAddr: headerData.readUInt32LE(0x38) % 0x8000000,
                monIconPaletteIdsAddr: headerData.readUInt32LE(0x3C) % 0x8000000,
                monIconPalettesAddr: headerData.readUInt32LE(0x40) % 0x8000000,
                monSpeciesNamesAddr: headerData.readUInt32LE(0x44) % 0x8000000,
                moveNamesAddr: headerData.readUInt32LE(0x48) % 0x8000000,
                decorationsAddr: headerData.readUInt32LE(0x4C) % 0x8000000,
                flagsOffset: headerData.readUInt32LE(0x50),
                varsOffset: headerData.readUInt32LE(0x54),
                pokedexOffset: headerData.readUInt32LE(0x58),
                seen1Offset: headerData.readUInt32LE(0x5C),
                seen2Offset: headerData.readUInt32LE(0x60),
                pokedexVar: headerData.readUInt32LE(0x64),
                pokedexFlag: headerData.readUInt32LE(0x68),
                mysteryEventFlag: headerData.readUInt32LE(0x6C),
                pokedexCount: headerData.readUInt32LE(0x70),
                playerNameLength: headerData.readUInt8(0x74),
                trainerNameLength: headerData.readUInt8(0x75),
                pokemonNameLength1: headerData.readUInt8(0x76),
                pokemonNameLength2: headerData.readUInt8(0x77),
                abilityNameLength: headerData.readUInt8(0x78),
                moveNameLength: headerData.readUInt8(0x79),
                unk7: headerData.readUInt8(0x7A),
                unk8: headerData.readUInt8(0x7B),
                unk9: headerData.readUInt8(0x7C),
                unk10: headerData.readUInt8(0x7D),
                unk11: headerData.readUInt8(0x7E),
                unk12: headerData.readUInt8(0x7F),
                unk13: headerData.readUInt8(0x80),
                unk14: headerData.readUInt8(0x81),
                unk15: headerData.readUInt8(0x82),
                unk16: headerData.readUInt8(0x83),
                unk17: headerData.readUInt8(0x84),
                // 3 bytes padding
                saveBlock2Size: headerData.readUInt32LE(0x88),
                saveBlock1Size: headerData.readUInt32LE(0x8C),
                partyCountOffset: headerData.readUInt32LE(0x90),
                partyOffset: headerData.readUInt32LE(0x94),
                warpFlagsOffset: headerData.readUInt32LE(0x98),
                trainerIdOffset: headerData.readUInt32LE(0x9C),
                playerNameOffset: headerData.readUInt32LE(0xA0),
                playerGenderOffset: headerData.readUInt32LE(0xA4),
                frontierStatusOffset: headerData.readUInt32LE(0xA8),
                frontierStatusOffset2: headerData.readUInt32LE(0xAC),
                externalEventFlagsOffset: headerData.readUInt32LE(0xB0),
                externalEventDataOffset: headerData.readUInt32LE(0xB4),
                unk18: headerData.readUInt32LE(0xB8),
                baseStatsAddr: headerData.readUInt32LE(0xBC) % 0x8000000,
                abilityNamesAddr: headerData.readUInt32LE(0xC0) % 0x8000000,
                abilityDescriptionsAddr: headerData.readUInt32LE(0xC4) % 0x8000000,
                itemsAddr: headerData.readUInt32LE(0xC8) % 0x8000000,
                movesAddr: headerData.readUInt32LE(0xCC) % 0x8000000,
                ballGfxAddr: headerData.readUInt32LE(0xD0) % 0x8000000,
                ballPalettesAddr: headerData.readUInt32LE(0xD4) % 0x8000000,
                gcnLinkFlagsOffset: headerData.readUInt32LE(0xD8),
                gameClearFlag: headerData.readUInt32LE(0xDC),
                ribbonFlag: headerData.readUInt32LE(0xE0),
                bagCountItems: headerData.readUInt8(0xE4),
                bagCountKeyItems: headerData.readUInt8(0xE5),
                bagCountPokeballs: headerData.readUInt8(0xE6),
                bagCountTMHMs: headerData.readUInt8(0xE7),
                bagCountBerries: headerData.readUInt8(0xE8),
                pcItemsCount: headerData.readUInt8(0xE9),
                // 2 bytes padding
                pcItemsOffset: headerData.readUInt32LE(0xEC),
                giftRibbonsOffset: headerData.readUInt32LE(0xF0),
                enigmaBerryOffset: headerData.readUInt32LE(0xF4),
                enigmaBerrySize: headerData.readUInt32LE(0xF8),
                moveDescriptionsAddr: headerData.readUInt32LE(0xFC) % 0x8000000,
                unk20: headerData.readUInt32LE(0x100)
            }
            // romHeader.bagCountCandy = 50; // TTH

            // Precalc bag offsets
            romHeader.bagItemsOffset = romHeader.pcItemsOffset + romHeader.pcItemsCount * 4;
            // romHeader.bagCandyOffset = romHeader.pcItemsOffset + romHeader.pcItemsCount * 4; // TTH
            // romHeader.bagItemsOffset = romHeader.bagCandyOffset + romHeader.bagCountCandy * 4; // TTH
            romHeader.bagKeyItemsOffset = romHeader.bagItemsOffset + romHeader.bagCountItems * 4;
            romHeader.bagPokeballsOffset = romHeader.bagKeyItemsOffset + romHeader.bagCountKeyItems * 4;
            romHeader.bagTMHMsOffset = romHeader.bagPokeballsOffset + romHeader.bagCountPokeballs * 4;
            romHeader.bagBerriesOffset = romHeader.bagTMHMsOffset + romHeader.bagCountTMHMs * 4;

            return romHeader;
        }

    }

    export interface GFRomHeader {
        version: number;
        language: number;
        gameName: string;
        monFrontPicsAddr: number;
        monBackPicsAddr: number;
        monNormalPalettesAddr: number;
        monShinyPalettesAddr: number;
        monIconsAddr: number;
        monIconPaletteIdsAddr: number;
        monIconPalettesAddr: number;
        monSpeciesNamesAddr: number;
        moveNamesAddr: number;
        decorationsAddr: number;
        flagsOffset: number;
        varsOffset: number;
        pokedexOffset: number;
        seen1Offset: number;
        pokedexVar: number;
        pokedexFlag: number;
        mysteryEventFlag: number;
        pokedexCount: number;
        playerNameLength: number;
        trainerNameLength: number;
        pokemonNameLength1: number;
        pokemonNameLength2: number;
        abilityNameLength: number; // Probably
        moveNameLength: number; // Probably
        unk7: number;
        unk8: number;
        unk9: number;
        unk10: number;
        unk11: number;
        unk12: number;
        unk13: number;
        unk14: number;
        unk15: number;
        unk16: number;
        unk17: number;
        saveBlock2Size: number;
        saveBlock1Size: number;
        partyCountOffset: number;
        partyOffset: number;
        warpFlagsOffset: number;
        trainerIdOffset: number;
        playerNameOffset: number;
        playerGenderOffset: number;
        frontierStatusOffset: number;
        frontierStatusOffset2: number;
        externalEventFlagsOffset: number;
        externalEventDataOffset: number;
        unk18: number;
        baseStatsAddr: number;
        abilityNamesAddr: number;
        abilityDescriptionsAddr: number;
        itemsAddr: number;
        movesAddr: number;
        ballGfxAddr: number;
        ballPalettesAddr: number;
        gcnLinkFlagsOffset: number;
        gameClearFlag: number;
        ribbonFlag: number;
        bagCountItems: number;
        bagCountKeyItems: number;
        bagCountPokeballs: number;
        bagCountTMHMs: number;
        bagCountBerries: number;
        pcItemsCount: number;
        pcItemsOffset: number;
        giftRibbonsOffset: number;
        enigmaBerryOffset: number;
        enigmaBerrySize: number;
        moveDescriptionsAddr: number;
        unk20: number;

        // Not present in ROM
        bagItemsOffset?: number;
        bagKeyItemsOffset?: number;
        bagPokeballsOffset?: number;
        bagTMHMsOffset?: number;
        bagBerriesOffset?: number;
        bagCountCandy?: number; // TTH
        bagCandyOffset?: number; // TTH
    };

}