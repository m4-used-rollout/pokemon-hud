/// <reference path="./g3.ts" />

namespace RomReader {

    const typeNames = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
    const dexColors = ["Red", "Blue", "Yellow", "Green", "Black", "Brown", "Purple", "Gray", "White", "Pink"];
    const contestTypes = ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'];
    const contestEffects = ['The appeal effect of this move is constant.', 'Prevents the user from being startled.', 'Startles the previous appealer.', 'Startles all previous appealers.', 'Affects appealers other than startling them.', 'Appeal effect may change.', 'The appeal order changes for the next round.'];

    const grassEncounterRates = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1];
    const rockSmashEncounterRates = [60, 30, 5, 4, 1];
    const surfEncounterRates = [60, 30, 5, 4, 1];
    const fishingEncounterRates = [70, 30, 60, 20, 20, 40, 30, 15, 10, 5];
    const fishingRequiredRods = [262, 262, 263, 263, 263, 264, 264, 264, 264, 264];

    interface Gen3Item extends Pokemon.Item {
        isPokeball: boolean;
        data?: string;
        pocket?: string | number;
        pluralName?: string; //TTH
    }

    export interface TTHMap extends Pokemon.Map {
        author?: string;
        puzzleNo?: number;
        trainers: Pokemon.Trainer[];
    }

    export class Gen3TTH extends Gen3 {
        public get totalPuzzles() {
            return this.puzzleList ? this.puzzleList.length - 1 : 0;
        }
        public evolutions: Pokemon.Evolution[][];
        stringTerminator = 0xFF;

        constructor(romFileLocation: string, iniFileLocation: string = "pge.ini") {
            super(romFileLocation, iniFileLocation);
            const romData = this.loadROM();
            const config = this.config = this.LoadConfig(romData);
            this.types = typeNames;
            this.shouldFixCaps = false;
            this.gfRomHeader = this.ParseGFRomHeader(romData);

            // Update INI from Rom Header
            // Doesn't exist for Ruby or Sapphire
            if (this.romHeader != 'AXVE' && this.romHeader != 'AXPE') {
                config.ItemPCOffset = this.gfRomHeader.pcItemsOffset.toString(16);
                config.ItemPocketOffset = this.gfRomHeader.bagItemsOffset.toString(16);
                config.ItemBallOffset = this.gfRomHeader.bagPokeballsOffset.toString(16);
                config.ItemBerriesOffset = this.gfRomHeader.bagBerriesOffset.toString(16);
                config.ItemTMOffset = this.gfRomHeader.bagTMHMsOffset.toString(16);
                config.ItemKeyOffset = this.gfRomHeader.bagKeyItemsOffset.toString(16);
                config.ItemPCCount = this.gfRomHeader.pcItemsCount.toString(16);
                config.ItemPocketCount = this.gfRomHeader.bagCountItems.toString(16);
                config.ItemBallCount = this.gfRomHeader.bagCountPokeballs.toString(16);
                config.ItemBerriesCount = this.gfRomHeader.bagCountBerries.toString(16);
                config.ItemTMCount = this.gfRomHeader.bagCountTMHMs.toString(16);
                config.ItemKeyCount = this.gfRomHeader.bagCountKeyItems.toString(16);

                config.ItemCandyOffset = this.gfRomHeader.bagCandyOffset.toString(16); //TTH
                config.ItemCandyCount = this.gfRomHeader.bagCountCandy.toString(16); // TTH

                config.FlagsOffset = this.gfRomHeader.flagsOffset.toString(16);
                config.FlagsBytes = (this.gfRomHeader.varsOffset - this.gfRomHeader.flagsOffset).toString(16);
                config.VarsOffset = this.gfRomHeader.varsOffset.toString(16);
                config.GameStatsOffset = (this.gfRomHeader.varsOffset + (0x100 * 2)).toString(16);

                config.Item
            }

            this.abilities = this.ReadAbilities(romData, config);
            this.pokemon = this.ReadPokeData(romData, config);
            this.items = this.ReadItemData(romData, config);
            this.ballIds = this.items.filter((i: Gen3Item) => i.isPokeball).map(i => i.id);

            this.moves = this.ReadMoveData(romData, config);
            this.GetTMHMNames(romData, config);
            this.trainers = this.ReadTrainerData(romData, config);
            this.areas = this.ReadMapLabels(romData, config);
            this.puzzleList = [{ id: -1, bank: -1 },
            ...(config.PuzzleList ?
                this.ReadArray(romData, parseInt(config.PuzzleList, 16), 2, this.totalPuzzles, true, data => data.readUInt16LE(0) == 0xFFFF)
                    .map(m => ({ id: m[0], bank: m[1] }))
                : [])]; //TTH
            this.maps = this.ReadMaps(romData, config);
            this.FindMapEncounters(romData, config);
            this.moveLearns = this.ReadMoveLearns(romData, config);
            this.evolutions = this.ReadEvolutions(romData, config);
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return true;
        }

        GetCurrentLevelCap(badges: number, champion?: boolean) {
            return 100;
        }

        IsUnknownTrainerMap(id: number, bank: number) {
            return false; //TTH
        }

        protected isFRLG(config: PGEINI) {
            return false;
        }

        protected ReadAbilities(romData: Buffer, config: PGEINI, numAbilities = parseInt(config.NumberOfAbilities)) {
            return this.ReadArray(romData, parseInt(config.AbilityNames, 16), 17, numAbilities).map(a => this.FixAllCaps(this.ConvertText(a)));
        }

        protected ReadPokeData(romData: Buffer, config: PGEINI) {
            let pokemonNames = this.ReadArray(romData, parseInt(config.PokemonNames, 16), 11, parseInt(config.NumberOfPokemon)).map(p => this.FixAllCaps(this.ConvertText(p)));
            let dexMapping = this.ReadArray(romData, parseInt(config.NationalDexTable, 16), 2, parseInt(config.NumberOfPokemon)).map(n => n.readInt16LE(0));
            dexMapping.unshift(0);
            return this.ReadArray(romData, parseInt(config.PokemonData, 16), 0x24, parseInt(config.NumberOfPokemon)).map((data, i) => (<Pokemon.Species>{
                name: pokemonNames[i],
                id: i,
                dexNumber: dexMapping[i],
                baseStats: {
                    hp: data[0x0],
                    atk: data[0x1],
                    def: data[0x2],
                    speed: data[0x3],
                    spatk: data[0x4],
                    spdef: data[0x5]
                },
                type1: this.types[data[0x6]] || data[0x6].toString(),
                type2: this.types[data[0x7]] || data[0x7].toString(),
                catchRate: data[0x8],
                baseExp: data.readInt16LE(0xA),
                effortYield: data.readInt16LE(0xC),
                item1: data.readInt16LE(0xE),
                item2: data.readInt16LE(0x10),
                genderRatio: data[0x12],
                eggCycles: data[0x13],
                baseFriendship: data[0x14],
                growthRate: expCurveNames[data[0x15]],
                expFunction: expCurves[data[0x15]],
                eggGroup1: eggGroups[data[0x16]],
                eggGroup2: eggGroups[data[0x17]],
                abilities: [this.abilities[data.readUInt16LE(0x18)], this.abilities[data.readUInt16LE(0x1A)], this.abilities[data.readUInt16LE(0x1C)]],
                safariZoneRate: data[0x1E],
                dexColor: dexColors[data[0x1F] & 0x7F],
                doNotflipSprite: !!(data[0x1F] & 128),
                flags: data.readUInt32LE(0x20)
            }));
        }

        protected ReadTrainerData(romData: Buffer, config: PGEINI) {
            let trainerClasses = this.ReadArray(romData, parseInt(config.TrainerClasses, 16), 13, parseInt(config.NumberOfTrainerClasses)).map(tc => this.FixAllCaps(this.ConvertText(tc)));
            return this.ReadArray(romData, parseInt(config.TrainerTable, 16), 40, parseInt(config.NumberOfTrainers)).map((data, i) => (<Pokemon.Trainer>{
                classId: data[1],
                className: trainerClasses[data[1]],
                id: i,
                name: this.FixAllCaps(this.ConvertText(data.slice(4))),
                spriteId: data[3],
                gender: data[2] & 128 ? "Female" : "Male",
            }));
        }

        protected ReadItemData(romData: Buffer, config: PGEINI) {
            return this.ReadArray(romData, parseInt(config.ItemData, 16), 44, parseInt(config.NumberOfItems)).map((data, i) => (<Gen3Item>{
                name: this.ConvertText(romData.slice(this.ReadRomPtr(data, 0), 255 + this.ReadRomPtr(data, 0))), //TTH
                pluralName: this.ConvertText(romData.slice(data.readInt32LE(4) > 0 && !data.readInt32LE(8) ? this.ReadRomPtr(data, 4) : this.ReadRomPtr(data, 0), 255 + (data.readInt32LE(4) > 0 ? this.ReadRomPtr(data, 4) : this.ReadRomPtr(data, 0)))) + (data.readInt32LE(4) || data.readInt32LE(8) ? "" : "s"), //TTH
                id: i,
                isKeyItem: data[26] == (this.isFRLG(config) ? 1 : 4) || data.readInt16LE(24) > 0,
                isPokeball: data[26] == 2,
                // data: data.toString("hex")
            }));
        }

        protected ReadMoveData(romData: Buffer, config: PGEINI) {
            let moveNames = this.ReadArray(romData, parseInt(config.AttackNames, 16), 17, parseInt(config.NumberOfAttacks) + 1).map(p => this.FixAllCaps(this.ConvertText(p)));
            // let contestData = this.ReadArray(romData, parseInt(config.ContestMoveEffectData, 16), 4, parseInt(config.NumberOfAttacks)).map(data => ({
            //     effect: contestEffects[data[0]],
            //     appeal: new Array(Math.floor(data[1] / 10)).fill('♡').join(''),
            //     jamming: new Array(Math.floor(data[2] / 10)).fill('♥').join('')
            // }));
            // let contestMoveData = this.ReadArray(romData, parseInt(config.ContestMoveData, 16), 8, parseInt(config.NumberOfAttacks) + 1).map(data => ({
            //     descriptionId: data[0],
            //     contestType: contestTypes[data[1]],
            //     effect: contestData[data[0]].effect,
            //     appeal: contestData[data[0]].appeal,
            //     jamming: contestData[data[0]].jamming
            // }));
            return this.ReadArray(romData, parseInt(config.AttackData, 16), 0x14, parseInt(config.NumberOfAttacks) + 1).map((data, i) => (<Pokemon.Move>{
                id: i,
                name: moveNames[i],
                basePower: data.readUInt16LE(0x2),
                type: this.types[data[0x4]],
                accuracy: data[0x5],
                basePP: data[0x6],
                priority: data.readInt8(0xA),
                // contestData: contestMoveData[i] ? {
                //     type: contestMoveData[i].contestType,
                //     effect: contestMoveData[i].effect,
                //     appeal: contestMoveData[i].appeal,
                //     jamming: contestMoveData[i].jamming
                // } : null
            }));
        }

        protected GetTMHMNames(romData: Buffer, config: PGEINI) {
            const tmHmExp = /^(T|H)M(\d+)/i;
            let moveMap = this.ReadArray(romData, parseInt(config.TMData, 16), 2, parseInt(config.TotalTMsPlusHMs)).map(m => m.readUInt16LE(0));
            let TMs = this.items.filter(i => tmHmExp.test(i.name));
            TMs.forEach(tm => {
                let tmParse = tmHmExp.exec(tm.name);
                let tmNo = parseInt(tmParse[2]) + (tmParse[1] == 'H' ? parseInt(config.TotalTMs) : 0) - 1;
                tm.name += ` ${this.GetMove(moveMap[tmNo]).name}`
            });
        }

        protected ReadMapLabels(romData: Buffer, config: PGEINI) {
            if (romData.readUInt32LE(parseInt(config.MapLabelData, 16)) < 0x8000000)
                return this.ReadArray(romData, parseInt(config.MapLabelData, 16), 8, parseInt(config.NumberOfMapLabels)).map(data => {
                    const addr = this.ReadRomPtr(data, 4);
                    return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20))).replace('ë', "Aqua"); //Sapphire
                });
            return this.ReadArray(romData, parseInt(config.MapLabelData, 16), this.isFRLG(config) ? 4 : 8, parseInt(config.NumberOfMapLabels))
                .map(ptr => {
                    const addr = this.ReadRomPtr(ptr, 0);
                    return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20)));
                });
        }

        protected ReadMaps(romData: Buffer, config: PGEINI) {
            let mapBanksPtr = parseInt(config.Pointer2PointersToMapBanks || "0", 16);
            const mapLabelOffset = parseInt(config.MapLabelOffset || "0", 16);
            return this.ReadPtrBlock(romData, mapBanksPtr)
                .map((bankPtr, b, arr) => this.ReadPtrBlock(romData, bankPtr, arr[b + 1]).map(ptr => romData.slice(ptr, ptr + 32))
                    .map((mapHeader, m) => (<TTHMap>{
                        bank: b,
                        id: m,
                        areaId: mapHeader[0x14] - mapLabelOffset,
                        areaName: this.areas[mapHeader[0x14] - mapLabelOffset],
                        name: this.GetPuzzleName(romData, mapHeader.readUInt32LE(0x8) - 0x8000000) || this.areas[mapHeader[0x14] - mapLabelOffset], //TTH
                        author: this.GetPuzzleAuthor(romData, mapHeader.readUInt32LE(0x8) - 0x8000000), //TTH
                        trainers: this.GetPuzzleTrainers(romData, mapHeader.readUInt32LE(0x1C) - 0x8000000, config), //TTH
                        puzzleNo: this.puzzleList.findIndex(p => p.id == m && p.bank == b), //TTH
                        encounters: {}
                    }))
                ).reduce((allMaps, currBank) => Array.prototype.concat.apply(allMaps, currBank), []);
        }

        TrainerIsRival(id: number, classId: number) {
            return false;
        }

        //Trick or Treat House
        protected GetPuzzleTrainers(romData: Buffer, mapTrainerTableAddr: number, config: PGEINI): Pokemon.Trainer[] {
            if (mapTrainerTableAddr < 0)
                return [];

            const trainerClasses = this.ReadArray(romData, parseInt(config.TrainerClasses, 16), 13, parseInt(config.NumberOfTrainerClasses)).map(tc => this.FixAllCaps(this.ConvertText(tc)));
            return this.ReadArray(romData, mapTrainerTableAddr, 36, 32, true, data => data.readUInt16LE(0) == 0).map((data, i) => (<Pokemon.Trainer>{
                classId: data[1],
                className: trainerClasses[data[1]],
                id: i + 1,
                name: this.FixAllCaps(this.ConvertText(data.slice(4))),
                spriteId: data[3],
                gender: data[2] & 128 ? "Female" : "Male",
            }));
        }

        //Trick or Treat House
        protected GetPuzzleName(romData: Buffer, mapScriptPtr: number) {
            return this.ReadArray(romData, mapScriptPtr, 5, 0, true, data => data[0] == 0).filter(data => data[0] == 0x20).map(data => this.ConvertText(romData.slice(this.ReadRomPtr(data, 1), this.ReadRomPtr(data, 1) + 255))).shift();
        }

        protected GetPuzzleAuthor(romData: Buffer, mapScriptPtr: number) {
            return this.ReadArray(romData, mapScriptPtr, 5, 0, true, data => data[0] == 0).filter(data => data[0] == 0x21).map(data => this.ConvertText(romData.slice(this.ReadRomPtr(data, 1), this.ReadRomPtr(data, 1) + 255))).shift();
        }

        protected ParseGFRomHeader(romData: Buffer) {
            //TODO: This doesn't exist in Ruby and Sapphire
            const headerData = romData.slice(0x100, 0x204);
            const romHeader = <GFRomHeader>{
                version: headerData.readUInt32LE(0x0),
                language: headerData.readUInt32LE(0x4),
                gameName: headerData.toString("utf8", 0x8, 0x28),
                monFrontPicsAddr: headerData.readUInt32LE(0x28),
                monBackPicsAddr: headerData.readUInt32LE(0x2C),
                monNormalPalettesAddr: headerData.readUInt32LE(0x30),
                monShinyPalettesAddr: headerData.readUInt32LE(0x34),
                monIconsAddr: headerData.readUInt32LE(0x38),
                monIconPaletteIdsAddr: headerData.readUInt32LE(0x3C),
                monIconPalettesAddr: headerData.readUInt32LE(0x40),
                monSpeciesNamesAddr: headerData.readUInt32LE(0x44),
                moveNamesAddr: headerData.readUInt32LE(0x48),
                decorationsAddr: headerData.readUInt32LE(0x4C),
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
                unk5: headerData.readUInt8(0x78),
                unk6: headerData.readUInt8(0x79),
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
                baseStatsAddr: headerData.readUInt32LE(0xBC),
                abilityNamesAddr: headerData.readUInt32LE(0xC0),
                abilityDescriptionsAddr: headerData.readUInt32LE(0xC4),
                itemsAddr: headerData.readUInt32LE(0xC8),
                movesAddr: headerData.readUInt32LE(0xCC),
                ballGfxAddr: headerData.readUInt32LE(0xD0),
                ballPalettesAddr: headerData.readUInt32LE(0xD4),
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
                moveDescriptionsAddr: headerData.readUInt32LE(0xFC),
                unk20: headerData.readUInt32LE(0x100)
            }
            romHeader.bagCountCandy = 50; // TTH

            // Precalc bag offsets
            romHeader.bagCandyOffset = romHeader.pcItemsOffset + romHeader.pcItemsCount * 4; // TTH
            romHeader.bagItemsOffset = romHeader.bagCandyOffset + romHeader.bagCountCandy * 4; // TTH
            romHeader.bagKeyItemsOffset = romHeader.bagItemsOffset + romHeader.bagCountItems * 4;
            romHeader.bagPokeballsOffset = romHeader.bagKeyItemsOffset + romHeader.bagCountKeyItems * 4;
            romHeader.bagTMHMsOffset = romHeader.bagPokeballsOffset + romHeader.bagCountPokeballs * 4;
            romHeader.bagBerriesOffset = romHeader.bagTMHMsOffset + romHeader.bagCountTMHMs * 4;

            return romHeader;
        }

        protected FindMapEncounters(romData: Buffer, config: PGEINI) {
            this.ReadArray(romData, parseInt(config.WildPokemonHeaders || "", 16), 20).forEach(data => {
                let mapBank = data[0], mapId = data[1];
                if (mapBank == 0xFF && mapId == 0xFF)
                    return;
                let map = this.GetMap(mapId, mapBank);
                let rockSmashExp = /[[TH]M\d+ Rock Smash/i
                let rockSmashTmId = (this.items.filter(i => rockSmashExp.test(i.name)).shift() || { id: 0 }).id;
                map.encounters = {
                    all: {
                        grass: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 4), grassEncounterRates),
                        surfing: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 8), surfEncounterRates),
                        hidden_grass: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 12), rockSmashEncounterRates, rockSmashEncounterRates.map(e => rockSmashTmId), true),
                        fishing: this.ReadEncounterSet(romData, this.ReadRomPtr(data, 16), fishingEncounterRates, fishingRequiredRods, true),
                    }
                };
            });
        }

        protected ReadEncounterSet(romData: Buffer, setAddr: number, encounterRates: number[], requiredItems: number[] = [], includeGroupRate = false) {
            if (setAddr <= 0)
                return [];
            let setPtr = this.ReadRomPtr(romData, setAddr + 4);
            let groupRate = romData.readInt32LE(setAddr) / 100;
            try {
                return this.CombineDuplicateEncounters(this.ReadArray(romData, setPtr, 4, encounterRates.length).map((data, i) => (<Pokemon.EncounterMon>{
                    species: this.GetSpecies(data.readInt16LE(2)),
                    rate: encounterRates[i] * (includeGroupRate ? groupRate : 1),
                    requiredItem: this.GetItem(requiredItems[i])
                })));
            }
            catch (e) {
                console.error(`Could not read encounter set at ${setAddr.toString(16)}->${setPtr.toString(16)}: ${e}`);
                return [];
            }
        }

        protected ReadMoveLearns(romData: Buffer, config: PGEINI) {
            const movelearns = {} as { [key: number]: Pokemon.MoveLearn[] };
            this.ReadPtrBlock(romData, parseInt(config.PokemonAttackTable, 16)).forEach((addr, i) => {
                movelearns[i] = this.ReadArray(romData, addr, 2).map(data => {
                    const raw = data.readUInt16LE(0);
                    const move = this.GetMove(raw % 0x200);
                    return {
                        level: raw >> 9,
                        id: move.id,
                        accuracy: move.accuracy,
                        basePower: move.basePower,
                        basePP: move.basePP,
                        contestData: move.contestData,
                        name: move.name,
                        type: move.type
                    } as Pokemon.MoveLearn;
                });
            });
            return movelearns;
        }

        protected ReadEvolutions(romData: Buffer, config: PGEINI) {
            const evoCount = parseInt(config.NumberOfEvolutionsPerPokemon, 16) || 10;
            const evos = this.ReadArray(romData, parseInt(config.PokemonEvolutions, 16), 8 * evoCount, this.pokemon.length)
                .map(evoData => this.ReadArray(evoData, 0, 8, evoCount)
                    .map(e => this.ParseEvolution(e.readUInt16LE(0), e.readInt16LE(2), e.readUInt16LE(4)))
                );
            evos.forEach((evos, i) => this.pokemon[i] && (this.pokemon[i].evolutions = evos.filter(e => !!e)));
            return evos;
        }

        // For Blazing Emerald (and any future Skeli hack possibly?)
        protected ReadLevelCaps(romData: Buffer, config: PGEINI) {
            const capAddr = parseInt(config.LevelCaps || '0', 16);
            const capCount = parseInt(config.LevelCapCount || '9', 16);
            this.levelCaps = capAddr > 0 ?
                this.ReadArray(romData, capAddr, 0xC, capCount)
                    .map(data => data[1] == 0x23 ? data[0] : data.indexOf(0x3B) >= 0 ? 100 - data[data.indexOf(0x3B) - 1] : 0)
                    .filter(l => l > 0) : [];
            this.levelCaps.push(100);
        }

        evolutionMethods = Object.assign([undefined,
            /* 1*/ this.EvolutionMethod.Happiness,
            /* 2*/ this.EvolutionMethod.HappinessDay,
            /* 3*/ this.EvolutionMethod.HappinessNight,
            /* 4*/ this.EvolutionMethod.Level,
            /* 5*/ this.EvolutionMethod.Trade,
            /* 6*/ this.EvolutionMethod.TradeItem,
            /* 7*/ this.EvolutionMethod.Stone,
            /* 8*/ this.EvolutionMethod.LevelAttackHigher,
            /* 9*/ this.EvolutionMethod.LevelAtkDefEqual,
            /*10*/ this.EvolutionMethod.LevelDefenseHigher,
            /*11*/ this.EvolutionMethod.LevelLowPV,
            /*12*/ this.EvolutionMethod.LevelHighPV,
            /*13*/ this.EvolutionMethod.LevelSpawnPokemon,
            /*14*/ this.EvolutionMethod.LevelIsSpawned,
            /*15*/ this.EvolutionMethod.LevelHighBeauty,
            /*16*/ this.EvolutionMethod.LevelFemale,
            /*17*/ this.EvolutionMethod.LevelMale,
            /*18*/ this.EvolutionMethod.LevelNight,
            /*19*/ this.EvolutionMethod.LevelDay,
            /*20*/ this.EvolutionMethod.LevelDusk,
            /*21*/ this.EvolutionMethod.LevelItemDay,
            /*22*/ this.EvolutionMethod.LevelItemNight,
            /*23*/ this.EvolutionMethod.LevelWithMove,
            /*24*/ this.EvolutionMethod.LevelWithMoveType,
            /*25*/ this.EvolutionMethod.LevelSpecificArea,
            /*26*/ this.EvolutionMethod.StoneMale,
            /*27*/ this.EvolutionMethod.StoneFemale,
            /*28*/ this.EvolutionMethod.LevelInRain,
            /*29*/ this.EvolutionMethod.LevelWithOtherSpecies,
            /*30*/ this.EvolutionMethod.LevelWithDarkType,
            /*31*/ this.EvolutionMethod.TradeForOtherSpecies,
            /*32*/ this.EvolutionMethod.LevelSpecificMap,
            /*33*/ this.EvolutionMethod.LevelNatureAmped,
            /*34*/ this.EvolutionMethod.LevelNatureLowKey,
            /*35*/ this.EvolutionMethod.CriticalHits,
            /*36*/ this.EvolutionMethod.RockArch,
            /*37*/ this.EvolutionMethod.ScrollOfDarkness,
            /*38*/ this.EvolutionMethod.ScrollOfWaters,
        ], {
            [0xFFFF]: this.EvolutionMethod.MegaEvo,
            [0xFFFE]: this.EvolutionMethod.MegaEvoMove,
            [0xFFFD]: this.EvolutionMethod.MegaEvoPrimal,
        });

    }

    interface GFRomHeader {
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
        unk5: number;
        unk6: number;
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