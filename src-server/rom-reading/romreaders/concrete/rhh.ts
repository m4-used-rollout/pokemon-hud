/// <reference path="./g3.ts" />

namespace RomReader {
    const fs = require('fs');

    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
    const dexColors = ["Red", "Blue", "Yellow", "Green", "Black", "Brown", "Purple", "Gray", "White", "Pink"];
    const contestTypes = ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'];
    const contestEffects = ['The appeal effect of this move is constant.', 'Prevents the user from being startled.', 'Startles the previous appealer.', 'Startles all previous appealers.', 'Affects appealers other than startling them.', 'Appeal effect may change.', 'The appeal order changes for the next round.'];

    const timesOfDay = ["morn", "day", "eve", "nite"];

    const grassEncounterRates = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1];
    const rockSmashEncounterRates = [60, 30, 5, 4, 1];
    const surfEncounterRates = [60, 30, 5, 4, 1];
    const fishingEncounterRates = [70, 30, 60, 20, 20, 40, 30, 15, 10, 5];
    const fishingRequiredRods = [709, 709, 710, 710, 710, 711, 711, 711, 711, 711];

    enum EvolutionConditions {
        // Gen 2
        IF_GENDER,                          // The Pokémon is of specific gender.
        IF_TIME,                            // It is currently the specific time of day.
        IF_NOT_TIME,                        // It is NOT currently the specific time of day.
        IF_MIN_FRIENDSHIP,                  // The Pokémon has the defined amount of Friendship.
        IF_ATK_GT_DEF,                      // The Pokémon's Attack is greater than its Defense stat.
        IF_ATK_EQ_DEF,                      // The Pokémon's Attack is equal to its Defense stat.
        IF_ATK_LT_DEF,                      // The Pokémon's Attack is lower than its Defense stat.
        IF_HOLD_ITEM,                       // The Pokémon is holding a specific item.
        // Gen 3
        IF_PID_UPPER_MODULO_10_GT,          // The Pokémon's upper personality value's modulo by 10 is greater than the defined value.
        IF_PID_UPPER_MODULO_10_EQ,          // The Pokémon's upper personality value's modulo by 10 is equal to the defined value.
        IF_PID_UPPER_MODULO_10_LT,          // The Pokémon's upper personality value's modulo by 10 is lower or equal than the defined value.
        IF_MIN_BEAUTY,                      // The Pokémon has the defined amount of Beauty.
        IF_MIN_COOLNESS,                    // The Pokémon has the defined amount of Coolness.
        IF_MIN_SMARTNESS,                   // The Pokémon has the defined amount of Smartness. (aka Cleverness in Gen6+)
        IF_MIN_TOUGHNESS,                   // The Pokémon has the defined amount of Toughness.
        IF_MIN_CUTENESS,                    // The Pokémon has the defined amount of Cuteness.
        // Gen 4
        IF_SPECIES_IN_PARTY,                // The party contains a Pokémon of the specified species.
        IF_IN_MAP,                          // The player is currently in the specific map.
        IF_IN_MAPSEC,                       // The player is currently in the specific map sector.
        IF_KNOWS_MOVE,                      // The Pokémon knows specific move.
        // Gen 5
        IF_TRADE_PARTNER_SPECIES,           // The Pokémon is traded for a specific species.
        // Gen 6
        IF_TYPE_IN_PARTY,                   // The party contains a Pokémon of the specified type.
        IF_WEATHER,                         // It is currently the specific weather in the current map.
        IF_KNOWS_MOVE_TYPE,                 // The Pokémon knows a move with a specific type.
        // Gen 8
        IF_NATURE,                          // The Pokémon has a specific nature.
        IF_AMPED_NATURE,                    // The Pokémon has one of the following natures: Hardy, Brave, Adamant, Naughty, Docile, Impish, Lax, Hasty, Jolly, Naive, Rash, Sassy, or Quirky.
        IF_LOW_KEY_NATURE,                  // The Pokémon has one of the following natures: Lonely, Bold, Relaxed, Timid, Serious, Modest, Mild, Quiet, Bashful, Calm, Gentle, or Careful.
        IF_RECOIL_DAMAGE_GE,                // The Pokémon suffered at least certain amount of non-fainting recoil damage.
        IF_CURRENT_DAMAGE_GE,               // The Pokémon has the specified difference of HP from its Max HP.
        IF_CRITICAL_HITS_GE,                // The Pokémon performed the specified number of critical hits in one battle at least.
        IF_USED_MOVE_X_TIMES,               // The Pokémon has used a move for at least X amount of times.
        // Gen 9
        IF_DEFEAT_X_WITH_ITEMS,             // The Pokémon defeated X amount of Pokémon of the specified species that are holding the specified item.
        IF_PID_MODULO_100_GT,               // The Pokémon's personality value's modulo by 100 is greater than the defined value.
        IF_PID_MODULO_100_EQ,               // The Pokémon's personality value's modulo by 100 is equal than the defined value.
        IF_PID_MODULO_100_LT,               // The Pokémon's personality value's modulo by 100 is lower than the defined value.
        IF_MIN_OVERWORLD_STEPS,             // The Player has taken a specific amount of steps in the overworld with the Pokémon following them or in the first slot of the party.
        IF_BAG_ITEM_COUNT,                  // The Player has the specific amount of an item in the bag. It then removes those items.
        IF_REGION,                          // The Player is in the specific region.
        IF_NOT_REGION,                      // The Player is NOT in the specific region.
        CONDITIONS_END
    };

    enum EvolutionMethods {
        EVO_NONE,                   // Not an actual evolution, used to generate offspring that can't evolve into the specified species, like regional forms.
        EVO_LEVEL,                  // Pokémon reaches the specified level
        EVO_TRADE,                  // Pokémon is traded
        EVO_ITEM,                   // specified item is used on Pokémon
        EVO_SPLIT_FROM_EVO,         // A clone is generated and evolved when another evolution happens
        EVO_SCRIPT_TRIGGER,         // Player interacts with an overworld trigger
        EVO_LEVEL_BATTLE_ONLY,      // Pokémon reaches the specified level, in battle only
        EVO_BATTLE_END,             // Battle ends, doesn't need to level up
        EVO_SPIN                    // The player spins in the overworld
    };

    const evoStruct = { method: 2, param: 2, targetSpecies: 2, params: 4 };
    const evoParamStruct = { condition: 2, arg1: 2, arg2: 2, arg3: 2 };

    interface Gen3Item extends Pokemon.Item {
        isPokeball: boolean;
        data?: string;
        pocket?: string | number;
    }

    function align(offset: number, alignment: number) {
        alignment = Math.min(alignment, 4);
        return (offset + (alignment - 1)) & ~(alignment - 1);
    }

    export function ReadCStruct<T extends Record<string, number>>(data: Buffer, structure: T, offset = 0, packed = false): { [K in keyof T]: Buffer } {
        const outStruct: Record<string, Buffer> = {};

        for (const key of Object.keys(structure)) {
            let size = structure[key];
            let noAlign = packed;

            // If size is <0, it's an array of char/u8 and will pack. Don't align.
            if (size < 0) {
                size *= -1;
                noAlign = true;
            }

            if (!noAlign) {
                offset = align(offset, size);
            }

            outStruct[key] = data.slice(offset, offset + size);
            offset += size;

            if (offset >= data.length) // Don't read past end
                break;
        }

        return outStruct as any;
    }

    export function SizeOfCStruct(struct: Record<string, number>, packed = false) {
        let offset = 0;
        let minAlign = 1;
        let maxAlign = 4;

        for (const key of Object.keys(struct)) {
            let size = struct[key];
            let noAlign = packed;

            // If size is <0, it's an array of char/u8 and will pack. Don't align.
            if (size < 0) {
                size *= -1;
                noAlign = true;
            }

            const alignment = Math.min(size, maxAlign);

            if (!noAlign) {
                offset = align(offset, alignment);
                minAlign = Math.max(minAlign, alignment);
            }

            offset += size;
        }

        if (!packed) {
            offset = align(offset, minAlign);
        }

        return offset;
    }

    export function GetCStructOffset<T extends Record<string, number>>(struct: T, symbol: keyof T, packed = false) {
        let offset = 0;
        let minAlign = 1;
        let maxAlign = 4;

        for (const key of Object.keys(struct)) {
            let size = struct[key];
            let noAlign = packed;

            // If size is <0, it's an array of char/u8 and will pack. Don't align.
            if (size < 0) {
                size *= -1;
                noAlign = true;
            }

            const alignment = Math.min(size, maxAlign);

            if (!noAlign) {
                offset = align(offset, alignment);
                minAlign = Math.max(minAlign, alignment);
            }

            if (key == symbol)
                return offset;

            offset += size;
        }

        return undefined;
    }

    export function UnpackBytes<T extends Record<string, number>>(data: Buffer, struct: T): { [K in keyof T]: Buffer } {
        const result: Record<string, Buffer> = {};
        let bitOffset = 0;

        for (const [key, bitLength] of Object.entries(struct)) {
            if (key.toLowerCase() != "unused") {
                const byteLength = Math.ceil(bitLength / 8);
                const out = Buffer.alloc(byteLength);

                for (let i = 0; i < bitLength; i++) {
                    const currentBit = bitOffset + i;

                    const srcByteIndex = Math.floor(currentBit / 8);
                    const srcBitIndex = currentBit % 8;

                    const bit = (data[srcByteIndex] >> srcBitIndex) & 1;

                    const destByteIndex = Math.floor(i / 8);
                    const destBitIndex = i % 8;

                    out[destByteIndex] |= bit << destBitIndex;
                }
                result[key] = out;
            }
            bitOffset += bitLength;
        }

        return result as any;

    }

    export class Gen3RHH extends GBAReader {
        public evolutions: Pokemon.Evolution[][];
        stringTerminator = 0xFF;
        public config: PGEINI;
        public gfRomHeader: GFRomHeader;
        public rhhRomHeader: ReturnType<Gen3RHH["ParseRHHRomHeader"]>;
        public tppRomHeader: ReturnType<Gen3RHH["ParseTPPRomHeader"]>;
        public cmdrRomHeader: ReturnType<Gen3RHH["ParseCmdrRomHeader"]>;

        constructor(romFileLocation: string) {
            super(romFileLocation, "pge.ini");
            const romData = this.loadROM();
            const config = this.config = {} as PGEINI;
            this.shouldFixCaps = true;
            const gfRomHeader = this.gfRomHeader = this.ParseGFRomHeader(romData);
            const rhhRomHeader = this.rhhRomHeader = this.ParseRHHRomHeader(romData);
            const tppRomHeader = this.tppRomHeader = this.ParseTPPRomHeader(romData);
            const cmdrRomHeader = this.cmdrRomHeader = this.ParseCmdrRomHeader(romData);

            // Update INI from Rom Header
            config.ItemPCOffset = this.gfRomHeader.pcItemsOffset.toString(16);
            config.ItemPocketOffset = this.cmdrRomHeader.bagItemsOffset.toString(16);
            config.ItemBallOffset = this.cmdrRomHeader.bagPokeballsOffset.toString(16);
            config.ItemBerriesOffset = this.cmdrRomHeader.bagBerriesOffset.toString(16);
            config.ItemTMOffset = this.cmdrRomHeader.bagTMHMsOffset.toString(16);
            config.ItemKeyOffset = this.cmdrRomHeader.bagKeyItemsOffset.toString(16);
            config.ItemPCCount = this.gfRomHeader.pcItemsCount.toString(16);
            config.ItemPocketCount = this.gfRomHeader.bagCountItems.toString(16);
            config.ItemBallCount = this.gfRomHeader.bagCountPokeballs.toString(16);
            config.ItemBerriesCount = this.gfRomHeader.bagCountBerries.toString(16);
            config.ItemTMCount = this.gfRomHeader.bagCountTMHMs.toString(16);
            config.ItemKeyCount = this.gfRomHeader.bagCountKeyItems.toString(16);
            config.FlagsOffset = this.gfRomHeader.flagsOffset.toString(16);
            config.FlagsBytes = (this.gfRomHeader.varsOffset - this.gfRomHeader.flagsOffset).toString(16);
            config.VarsOffset = this.gfRomHeader.varsOffset.toString(16);
            Object.keys(tppRomHeader).forEach(k => typeof tppRomHeader[k] === "string" && (config[k] = tppRomHeader[k]));
            config.VarsBytes = (parseInt(config.GameStatsOffset || "0", 16) - this.gfRomHeader.varsOffset).toString(16);
            config.NumberOfItems = rhhRomHeader.itemsCount.toString(16);
            config.NumberOfAbilities = rhhRomHeader.abilitiesCount.toString(16);
            config.NumberOfAttacks = rhhRomHeader.movesCount.toString(16);
            config.NumberOfPokemon = rhhRomHeader.numSpecies.toString(16);
            config.TMData = tppRomHeader.gTMHMItemMoveIds.toString(16);
            config.PokemonData = this.gfRomHeader.baseStatsAddr.toString(16);
            config.AttackData = this.gfRomHeader.movesAddr.toString(16);
            config.AbilityData = rhhRomHeader.abilitiesInfoPtr.toString(16);
            config.ItemData = this.gfRomHeader.itemsAddr.toString(16);
            config.ItemNameLength = rhhRomHeader.itemNameLength.toString(16);
            config.PokemonNameLength = this.gfRomHeader.pokemonNameLength1.toString(16);
            config.TrainerNameLength = this.gfRomHeader.trainerNameLength.toString(16);
            config.AbilityNameLength = this.gfRomHeader.abilityNameLength.toString(16);
            config.MoveNameLength = this.gfRomHeader.moveNameLength.toString(16);
            config.SaveBlock1Address = '*' + cmdrRomHeader.SaveBlock1Pointer.toString(16);
            config.SaveBlock2Address = '*' + cmdrRomHeader.SaveBlock2Pointer.toString(16);
            config.SaveBlock1Bytes = this.gfRomHeader.saveBlock1Size.toString(16);
            config.SaveBlock2Bytes = this.gfRomHeader.saveBlock2Size.toString(16);
            config.InBattleAddr = cmdrRomHeader.InBattle.toString(16);
            config.EncryptionKeyOffset = cmdrRomHeader.SecurityKeyOffset.toString(16);
            config.TrainerTable = tppRomHeader.gTrainers.toString(16);
            config.TrainerClasses = tppRomHeader.gTrainerClasses.toString(16);
            config.NumberOfTrainers = tppRomHeader.TrainerCount.toString(16);
            config.NumberOfTrainerClasses = tppRomHeader.TrainerClassCount.toString(16);
            config.TrainerImageTable = tppRomHeader.gTrainerSprites.toString(16);
            config.Pointer2PointersToMapBanks = tppRomHeader.gMapGroups.toString(16);
            config.gTypesInfo = tppRomHeader.gTypesInfo.toString(16);
            config.TypesCount = tppRomHeader.TypesCount.toString(16);
            config.TypeNameLength = tppRomHeader.TypeNameLength.toString(16);
            config.TypeInfoBytes = tppRomHeader.TypeInfoSize.toString(16);
            config.ContestMoveEffectData = tppRomHeader.gContestEffects.toString(16);
            config.MapLabelData = tppRomHeader.gRegionMapEntries.toString(16);
            config.NumberOfMapLabels = tppRomHeader.RegionCount.toString(16);
            config.WildPokemonHeaders = tppRomHeader.gWildMonHeaders.toString(16);

            this.types = this.ReadTypes(romData, config, tppRomHeader.TypesCount, tppRomHeader.TypeNameLength, tppRomHeader.TypeInfoSize);
            this.abilities = this.ReadAbilities(romData, config, rhhRomHeader.abilitiesCount);
            this.moves = this.ReadMoveData(romData, config);
            this.items = this.ReadItemData(romData, config);
            this.ballIds = this.items.filter((i: Gen3Item) => i.isPokeball).map(i => i.id);
            this.GetTMHMNames(romData, config);
            this.pokemon = this.ReadPokeData(romData, config);
            this.trainers = this.ReadTrainerData(romData, config);
            this.areas = this.ReadMapLabels(romData, config);
            this.maps = this.ReadMaps(romData, config);
            this.FindMapEncounters(romData, config);
        }

        GetCurrentLevelCap(badges: number, champion?: boolean) {
            return 100;
        }

        private CurrentMapIn(id: number, bank: number, mapArr: number[][]) {
            return mapArr.some(m => m[0] == bank && ((m.length == 2 && m[1] == id) || m[1] <= id && m[2] >= id));
        }

        IsUnknownTrainerMap(id: number, bank: number) {
            return this.CurrentMapIn(id, bank, [
                [9, 2, 4],      //Slateport Battle Tent
                [5, 1, 3],      //Fallarbor Battle Tent
                [6, 0, 2],      //Verdanturf Battle Tent
                [26, 4, 8],     //Battle Frontier
                [26, 14, 55],   //Battle Frontier
                [26, 60, 65],   //Trainer Hill
                [26, 88]        //Trainer Hill
            ]);
        }

        protected isFRLG(config: PGEINI) {
            return false;
        }

        // struct TypeInfo
        // {
        //     u8 name[TYPE_NAME_LENGTH + 1];
        //     u8 generic[17];
        //     u8 palette;
        //     u16 zMove;
        //     u16 maxMove;
        //     u16 teraTypeRGBValue;    // Most values pulled from the Tera type icon palette.
        //     u16 damageCategory:2;    // Used for B_PHYSICAL_SPECIAL_SPLIT <= GEN_3
        //     u16 useSecondTypeIconPalette:1;
        //     u16 isSpecialCaseType:1;
        //     u16 isHiddenPowerType:1; // Changing this for any type will change the distribution of all Hidden Power types from vanilla.
        //     u16 padding:11;
        //     const u16 *const paletteTMHM;
        // };

        protected ReadTypes(romData: Buffer, config: PGEINI, typeCount = parseInt(config.TypesCount, 16), typeNameLength = parseInt(config.TypeNameLength, 16), typeInfoBytes = parseInt(config.TypeInfoBytes, 16)) {
            return this.ReadArray(romData, parseInt(config.gTypesInfo, 16), Math.ceil(typeInfoBytes / 4) * 4, typeCount).map(t => this.FixAllCaps(this.ConvertText(t.slice(0, typeNameLength + 1))));
        }

        // struct AbilityInfo
        // {
        //     u8 name[ABILITY_NAME_LENGTH + 1];
        //     const u8 *description;
        //     s8 aiRating;
        //     u8 cantBeCopied:1; // cannot be copied by Role Play or Doodle
        //     u8 cantBeSwapped:1; // cannot be swapped with Skill Swap or Wandering Spirit
        //     u8 cantBeTraced:1; // cannot be copied by Trace - same as cantBeCopied except for Wonder Guard
        //     u8 cantBeSuppressed:1; // cannot be negated by Gastro Acid or Neutralizing Gas
        //     u8 cantBeOverwritten:1; // cannot be overwritten by Entrainment, Worry Seed or Simple Beam (but can be by Mummy) - same as cantBeSuppressed except for Truant
        //     u8 breakable:1; // can be bypassed by Mold Breaker and clones
        //     u8 failsOnImposter:1; // doesn't work on an Imposter mon; when can we actually use this?
        // };

        protected ReadAbilities(romData: Buffer, config: PGEINI, numAbilities = parseInt(config.NumberOfAbilities, 16)) {
            const abilityStruct = {
                name: parseInt(config.AbilityNameLength, 16) + 1,
                description: 4,
                aiRating: 1,
                flags: 1
            };
            return this.ReadArray(romData, parseInt(config.AbilityData, 16), SizeOfCStruct(abilityStruct), numAbilities).map(a => this.FixAllCaps(this.ConvertText(a)));
        }

        protected ReadPokeData(romData: Buffer, config: PGEINI) {
            this.moveLearns = [];
            this.evolutions = [];
            const ObjectEventGraphicsInfoStruct = {
                tileTag: 2,
                paletteTag: 2,
                reflectionPaletteTag: 2,
                size: 2,
                width: 2,
                height: 2,
                palette_shadow_inanimate_compressed: 1,
                tracks: 1,
                oam: 4,
                subspriteTables: 4,
                anims: 4,
                images: 4,
                affineAnims: 4
            };
            const struct = {
                baseHP: 1,
                baseAttack: 1,
                baseDefense: 1,
                baseSpeed: 1,
                baseSpAttack: 1,
                baseSpDefense: 1,
                type1: 1,
                type2: 1,
                catchRate: 1,
                forceTeraType: 1,
                expYield: 2,
                evYield: 2,
                itemCommon: 2,
                itemRare: 2,
                genderRatio: 1,
                eggCycles: 1,
                friendship: 1,
                growthRate: 1,
                eggGroups: 2,
                abilities: 6,
                safariZoneFleeRate: 1,
                categoryName: -13, // negative to show that it packs
                speciesName: 0 - (parseInt(config.PokemonNameLength, 16) + 1), //negative to show that it packs
                cryId: 2,
                natDexNum: 2,
                height: 2,
                weight: 2,
                pokemonScale: 2,
                pokemonOffset: 2,
                trainerScale: 2,
                trainerOffset: 2,
                description: 4,
                bodyColor_noFlip: 1,
                frontAnimDelay: 1,
                frontAnimId: 1,
                backAnimId: 1,
                frontAnimFrames: 4,
                frontPic: 4,
                backPic: 4,
                palette: 4,
                shinyPalette: 4,
                iconSprite: 4,
                frontPicFemale: 4,
                backPicFemale: 4,
                paletteFemale: 4,
                shinyPaletteFemale: 4,
                iconSpriteFemale: 4,
                footprint: 4,
                frontPicSize: 1,
                frontPicYOffset: 1,
                backPicSize: 1,
                backPicYOffset: 1,
                frontPicSizeFemale: 1,
                backPicSizeFemale: 1,
                iconPalIndex_female_jumpType: 1,
                enemyMonElevation: 1,
                flags: 4,
                //     // Flags
                //     u32 isLegendary:1;
                //     u32 isMythical:1;
                //     u32 isUltraBeast:1;
                //     u32 isParadox:1;
                //     u32 isTotem:1;
                //     u32 isMegaEvolution:1;
                //     u32 isPrimalReversion:1;
                //     u32 isUltraBurst:1;
                //     u32 isGigantamax:1;
                //     u32 isTeraForm:1;
                //     u32 isAlolanForm:1;
                //     u32 isGalarianForm:1;
                //     u32 isHisuianForm:1;
                //     u32 isPaldeanForm:1;
                //     u32 cannotBeTraded:1;
                //     u32 perfectIVCount:3;   // This species will always generate with the specified amount of perfect IVs.
                //     u32 dexForceRequired:1; // This species will be taken into account for Pokédex ratings even if they have the "isMythical" flag set.
                //     u32 tmIlliterate:1;     // This species will be unable to learn the universal moves.
                //     u32 isFrontierBanned:1; // This species is not allowed to participate in Battle Frontier facilities.
                enemyShadowXOffset: 1,
                enemyShadowYOffset: 1,
                enemyShadowSize_suppress: 2,
                levelUpLearnset: 4,
                teachableLearnset: 4,
                eggMoveLearnset: 4,
                evolutions: 4,
                formSpeciesIdTable: 4,
                formChangeTable: 4,
                overworldData: SizeOfCStruct(ObjectEventGraphicsInfoStruct),
                overworldDataFemale: SizeOfCStruct(ObjectEventGraphicsInfoStruct),
                overworldPalette: 4,
                overworldShinyPalette: 4,
                overworldPaletteFemale: 4,
                overworldShinyPaletteFemale: 4
            };
            const structSize = SizeOfCStruct(struct);
            return this.ReadArray(romData, parseInt(config.PokemonData, 16), structSize, parseInt(config.NumberOfPokemon, 16)).map((data, i) => {
                const pokeData = ReadCStruct(data, struct);

                // Forms
                const formSpeciesIdTablePtr = this.ReadRomPtr(pokeData.formSpeciesIdTable);
                const formSpeciesIdTable = (formSpeciesIdTablePtr > 0) ? this.ReadArray(romData, formSpeciesIdTablePtr, 2, 255, true, chunk => chunk.readUInt16LE(0) == 0xFFFF).map(f => f.readUInt16LE(0)) : [i];
                const baseSpeciesId = formSpeciesIdTable[0];
                const formNumber = formSpeciesIdTable.indexOf(i);

                // Movelearns
                const levelUpLearnsetPtr = this.ReadRomPtr(pokeData.levelUpLearnset);
                const levelUpLearnset = (levelUpLearnsetPtr > 0) ? this.ReadArray(romData, levelUpLearnsetPtr, 4, 255, true, chunk => chunk.readUInt16LE(0) == 0xFFFF).map(l => ({ move: l.readUInt16LE(0), level: l.readUInt16LE(2) })) : [];
                this.moveLearns[i] = levelUpLearnset.map(m => ({ ...this.GetMove(m.move), level: m.level }));

                // Evolutions
                const evoPtr = this.ReadRomPtr(pokeData.evolutions);
                const evos = (evoPtr > 0) ? this.ReadArray(romData, evoPtr, SizeOfCStruct(evoStruct), 255, true, chunk => chunk.readUInt16LE(0) == 0xFFFF).map(e => ReadCStruct(e, evoStruct)) : [];
                this.evolutions[i] = evos.map(e => this.ParseRHHEvolution(romData, e)).filter(e => !!e);

                return (<Pokemon.Species>{
                    id: i,
                    name: this.FixAllCaps(this.ConvertText(pokeData.speciesName)),
                    dexNumber: pokeData.natDexNum.readUInt16LE(0),
                    baseStats: {
                        hp: pokeData.baseHP[0],
                        atk: pokeData.baseAttack[0],
                        def: pokeData.baseDefense[0],
                        speed: pokeData.baseSpeed[0],
                        spatk: pokeData.baseSpAttack[0],
                        spdef: pokeData.baseSpDefense[0]
                    },
                    type1: this.types[pokeData.type1[0]] || pokeData.type1.toString(),
                    type2: this.types[pokeData.type2[0]] || pokeData.type2.toString(),
                    catchRate: pokeData.catchRate[0],
                    baseExp: pokeData.expYield.readInt16LE(0),
                    effortYield: pokeData.evYield.readInt16LE(0),
                    item1: pokeData.itemCommon.readInt16LE(0),
                    item2: pokeData.itemRare.readInt16LE(0),
                    genderRatio: pokeData.genderRatio[0],
                    eggCycles: pokeData.eggCycles[0],
                    baseFriendship: pokeData.friendship[0],
                    growthRate: expCurveNames[pokeData.growthRate[0]],
                    expFunction: expCurves[pokeData.growthRate[0]],
                    eggGroup1: eggGroups[pokeData.eggGroups[0]],
                    eggGroup2: eggGroups[pokeData.eggGroups[1]],
                    abilities: [this.abilities[pokeData.abilities.readUInt16LE(0)], this.abilities[pokeData.abilities.readUInt16LE(0x2)], this.abilities[pokeData.abilities.readUInt16LE(0x4)]],
                    safariZoneRate: pokeData.safariZoneFleeRate[0],
                    dexColor: dexColors[pokeData.bodyColor_noFlip[0] & 0x7F],
                    doNotflipSprite: !!(pokeData.bodyColor_noFlip[0] & 128),
                    flags: pokeData.flags.readUInt32LE(0),
                    formNumber,
                    baseSpeciesId
                });
            });
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            const spriteFolder = TPP.Server.getConfig().spriteFolder;
            const baseSpeciesId = this.GetBaseForm(id);
            let possibleSpriteUrls: string[] = [];
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${gender == "Female" ? "female/" : ""}${id}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${id}.png`);
            if (baseSpeciesId != id) {
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${baseSpeciesId}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${baseSpeciesId}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${gender == "Female" ? "female/" : ""}${baseSpeciesId}.png`);
                possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${baseSpeciesId}.png`);
            }
            for (let i = 0; i < possibleSpriteUrls.length; i++) {
                if (fs.existsSync(__dirname + '/' + possibleSpriteUrls[i]))
                    return possibleSpriteUrls[i];
            }
            return './img/empty-sprite.png'; //whatever
        }

        GetBaseForm(speciesId: number) {
            const species = this.GetSpecies(speciesId);
            if (species)
                return species.baseSpeciesId || speciesId;
            return speciesId;
        }

        // struct TrainerClass
        // {
        //     u8 name[13];
        //     u8 money;
        //     u16 ball;
        // };

        // struct Trainer
        // {
        //     /*0x00*/ u64 aiFlags;
        //     /*0x04*/ const struct TrainerMon *party;
        //     /*0x08*/ u16 items[MAX_TRAINER_ITEMS];
        //     /*0x10*/ u8 trainerClass;
        //     /*0x11*/ u8 encounterMusic_gender; // last bit is gender
        //     /*0x12*/ u8 trainerPic;
        //     /*0x13*/ u8 trainerName[TRAINER_NAME_LENGTH + 1];
        //     /*0x1E*/ u8 battleType:2;
        //              u8 startingStatus:6;    // this trainer starts a battle with a given status. see include/constants/battle.h for values
        //     /*0x1F*/ u8 mugshotColor;
        //     /*0x20*/ u8 partySize;
        //     /*0x21*/ u8 poolSize;
        //     /*0x22*/ u8 poolRuleIndex;
        //     /*0x23*/ u8 poolPickIndex;
        //     /*0x24*/ u8 poolPruneIndex;
        //     /*0x25*/ u16 overrideTrainer;
        //     /*0x26*/ u8 trainerBackPic;
        // };

        protected ReadTrainerData(romData: Buffer, config: PGEINI) {
            const trainerClassStruct = {
                name: 13,
                money: 1,
                ball: 2
            };
            const trainerClassStructSize = SizeOfCStruct(trainerClassStruct);

            const trainerStruct = {
                aiFlags: 8,
                partyPtr: 4,
                items: 2 * 4,
                trainerClass: 1,
                encounterMusic_gender: 1,
                trainerPic: 1,
                trainerName: 0 - (parseInt(config.TrainerNameLength, 16) + 1), //negative tells it to pack
                battleType_status: 1,
                mugshotColor: 1,
                partySize: 1,
                poolSize: 1,
                poolRuleIndex: 1,
                poolPickIndex: 1,
                poolPruneIndex: 1,
                overrideTrainer: 2,
                trainerBackPic: 1
            };
            const trainerStructSize = SizeOfCStruct(trainerStruct);
            const numTrainers = parseInt(config.NumberOfTrainers, 16);
            const trainerClasses = this.ReadArray(romData, parseInt(config.TrainerClasses, 16), trainerClassStructSize, parseInt(config.NumberOfTrainerClasses, 16)).map(tc => this.FixAllCaps(this.ConvertText(tc)));
            return this.ReadArray(romData, parseInt(config.TrainerTable, 16) + (trainerStructSize * numTrainers), trainerStructSize, numTrainers).map((data, i) => {
                const tData = ReadCStruct(data, trainerStruct);
                return (<Pokemon.Trainer>{
                    classId: tData.trainerClass[0],
                    className: trainerClasses[tData.trainerClass[0]],
                    id: i,
                    name: this.FixAllCaps(this.ConvertText(tData.trainerName)),
                    spriteId: tData.trainerPic[0],
                    gender: tData.encounterMusic_gender[0] & 128 ? "Female" : "Male",
                    //data: data.toString('hex')
                });
            });
        }


        // struct Item
        // {
        //     u32 price;
        //     u16 secondaryId;
        //     ItemUseFunc fieldUseFunc;
        //     const u8 *description;
        //     const u8 *effect;
        //     const u8 *name;
        //     const u8 *pluralName;
        //     u8 holdEffect;
        //     u8 holdEffectParam;
        //     u8 importance:2;
        //     u8 notConsumed:1;
        //     enum Pocket pocket:5;
        //     enum ItemSortType sortType;
        //     u8 type;
        //     u8 battleUsage;
        //     u8 flingPower;
        //     const u32 *iconPic;
        //     const u16 *iconPalette;
        // };

        protected ReadItemData(romData: Buffer, config: PGEINI) {
            const itemStruct = {
                price: 4,
                secondaryId: 2,
                fieldUseFunc: 4,
                description: 4,
                effect: 4,
                name: 4,
                pluralName: 4,
                holdEffect: 1,
                holdEffectParam: 1,
                flags_pocket: 1,
                //     u8 importance:2;
                //     u8 notConsumed:1;
                //     enum Pocket pocket:5;
                sortType: 1,
                type: 1,
                battleUsage: 1,
                flingPower: 1,
                iconPic: 4,
                iconPalette: 4
            };
            return this.ReadArray(romData, parseInt(config.ItemData, 16), SizeOfCStruct(itemStruct), parseInt(config.NumberOfItems, 16)).map((data, i) => {
                const itemData = ReadCStruct(data, itemStruct);
                const pocket = itemData.flags_pocket[0] >>> 3;
                return (<Gen3Item>{
                    name: this.ConvertText(romData.slice(this.ReadRomPtr(itemData.name), 255 + this.ReadRomPtr(itemData.name))),
                    id: i,
                    isKeyItem: pocket == 4,
                    isPokeball: pocket == 1,
                    //data: data.toString("hex")
                });
            });
        }

        // struct MoveInfo
        // {
        //     const u8 *name;
        //     const u8 *description;
        //     enum BattleMoveEffects effect:14;
        //     enum DamageCategory category:2;
        //     enum Type type:7;     // Up to 128
        //     u16 power:9;    // up to 511
        //     // end of word
        //     u16 accuracy:7;
        //     u16 target:9;
        //     u8 pp;
        //     union {
        //         u8 effect;
        //         u8 powerOverride;
        //     } zMove;
        //     // end of word
        //     s32 priority:4;
        //     u32 strikeCount:4; // Max 15 hits. Defaults to 1 if not set. May apply its effect on each hit.
        //     u32 criticalHitStage:2;
        //     bool32 alwaysCriticalHit:1;
        //     u32 numAdditionalEffects:3; // limited to 7
        //     // Flags
        //     bool32 makesContact:1;
        //     bool32 ignoresProtect:1;
        //     bool32 magicCoatAffected:1;
        //     bool32 snatchAffected:1;
        //     bool32 ignoresKingsRock:1;
        //     bool32 punchingMove:1;
        //     bool32 bitingMove:1;
        //     bool32 pulseMove:1;
        //     bool32 soundMove:1;
        //     bool32 ballisticMove:1;
        //     bool32 powderMove:1;
        //     bool32 danceMove:1;
        //     bool32 windMove:1;
        //     bool32 slicingMove:1;
        //     bool32 healingMove:1;
        //     bool32 minimizeDoubleDamage:1;
        //     bool32 ignoresTargetAbility:1;
        //     bool32 ignoresTargetDefenseEvasionStages:1;
        //     bool32 shadowMove:1;
        //     // end of word
        //     bool32 damagesUnderground:1;
        //     bool32 damagesUnderwater:1;
        //     bool32 damagesAirborne:1;
        //     bool32 damagesAirborneDoubleDamage:1;
        //     bool32 ignoreTypeIfFlyingAndUngrounded:1;
        //     bool32 thawsUser:1;
        //     bool32 ignoresSubstitute:1;
        //     bool32 forcePressure:1;
        //     bool32 cantUseTwice:1;
        //     bool32 alwaysHitsInRain:1;
        //     bool32 accuracy50InSun:1;
        //     bool32 alwaysHitsInHailSnow:1;
        //     // Ban flags
        //     bool32 gravityBanned:1;
        //     bool32 mirrorMoveBanned:1;
        //     bool32 meFirstBanned:1;
        //     bool32 mimicBanned:1;
        //     bool32 metronomeBanned:1;
        //     bool32 copycatBanned:1;
        //     bool32 assistBanned:1; // Matches same moves as copycatBanned + semi-invulnerable moves and Mirror Coat.
        //     bool32 sleepTalkBanned:1;
        //     bool32 instructBanned:1;
        //     bool32 encoreBanned:1;
        //     bool32 parentalBondBanned:1;
        //     bool32 skyBattleBanned:1;
        //     bool32 sketchBanned:1;
        //     bool32 dampBanned:1;
        //     //Other
        //     bool32 validApprenticeMove:1;
        //     u32 padding:5;
        //     // end of word

        //     union {
        //         struct {
        //             u16 stringId;
        //             u16 status;
        //         } twoTurnAttack;
        //         u32 protectMethod;
        //         u32 status;
        //         u32 moveProperty;
        //         u32 holdEffect;
        //         u32 type;
        //         u32 fixedDamage;
        //         u32 damagePercentage;
        //         u32 absorbPercentage;
        //         u32 recoilPercentage;
        //         u32 nonVolatileStatus;
        //         u32 overwriteAbility;
        //     } argument;

        //     // primary/secondary effects
        //     const struct AdditionalEffect *additionalEffects;

        //     // contest parameters
        //     u8 contestEffect;
        //     u8 contestCategory:3;
        //     u8 contestComboStarterId;
        //     u8 contestComboMoves[MAX_COMBO_MOVES];
        //     const u8 *battleAnimScript;
        // };

        protected ReadMoveData(romData: Buffer, config: PGEINI) {
            const moveStruct = {
                name: 4,
                description: 4,
                effect_cat: 2,
                type_power: 2,
                accuracy_target: 2,
                pp: 1,
                zMove: 1,
                priority_strikeCount: 1,
                flags: 7,
                argument: 4,
                additionalEffects: 4,
                contestEffect: 1,
                contestCategory: 1,
                contestComboStarterId: 1,
                contestComboMoves: 17,
                battleAnimScript: 4
            };
            const packedBytes = {
                effect_cat: {
                    effect: 14,
                    category: 2
                },
                type_power: {
                    type: 7,
                    power: 9
                },
                type_cat_power: {
                    type: 5,
                    category: 2,
                    power: 9
                },
                accuracy_target: {
                    accuracy: 7,
                    target: 9
                },
                priority_strikeCount: {
                    priority: 4,
                    strikeCount: 4
                },
            };
            return this.ReadArray(romData, parseInt(config.AttackData, 16), SizeOfCStruct(moveStruct), parseInt(config.NumberOfAttacks, 16) + 1).map((data, i) => {
                const moveData = ReadCStruct(data, moveStruct);
                const effect_cat = UnpackBytes(moveData.effect_cat, packedBytes.effect_cat);
                const type_power = UnpackBytes(moveData.type_power, packedBytes.type_cat_power);
                const accuracy_target = UnpackBytes(moveData.accuracy_target, packedBytes.accuracy_target);
                const priority_strikeCount = UnpackBytes(moveData.priority_strikeCount, packedBytes.priority_strikeCount);
                return (<Pokemon.Move>{
                    id: i,
                    name: this.ConvertText(romData.slice(this.ReadRomPtr(moveData.name), 255 + this.ReadRomPtr(moveData.name))),
                    basePower: type_power.power.readUInt16LE(0),
                    type: this.types[type_power.type[0]] || type_power.type.toString(),
                    accuracy: accuracy_target.accuracy[0],
                    basePP: moveData.pp[0],
                    priority: priority_strikeCount.priority[0],
                    physical: !(type_power.category[0] & 3),
                    special: !!(type_power.category[0] & 1),
                    status: !!(type_power.category[0] & 2),
                    // contestData: contestMoveData[i] ? {
                    //     type: contestMoveData[i].contestType,
                    //     effect: contestMoveData[i].effect,
                    //     appeal: contestMoveData[i].appeal,
                    //     jamming: contestMoveData[i].jamming
                    // } : null
                });
            });
        }

        protected GetTMHMNames(romData: Buffer, config: PGEINI) {
            const tmHmExp = /^(T|H)M(\d+)/i;
            const TMs = this.items.filter(i => tmHmExp.test(i.name));
            const tmCount = TMs.filter(t => t.name.startsWith('TM')).length;
            const hmCount = TMs.filter(t => t.name.startsWith('HM')).length;
            const moveMap = this.ReadArray(romData, parseInt(config.TMData, 16), 4, tmCount + hmCount + 1).map(m => ({ itemId: m.readUInt16LE(0), moveId: m.readInt16LE(2) }));
            moveMap.forEach(m => (this.GetItem(m.itemId) || { name: "" }).name += ` ${(this.GetMove(m.moveId) || { name: "" }).name}`);
            // TMs.forEach(tm => {
            //     let tmParse = tmHmExp.exec(tm.name);
            //     let tmNo = parseInt(tmParse[2]) + (tmParse[1] == 'H' ? tmCount : 0) - 1;
            //     tm.name += ` ${this.GetMove(moveMap[tmNo]).name}`
            // });
        }

        protected ReadMapLabels(romData: Buffer, config: PGEINI) {
            const regionStruct = {
                x: 1,
                y: 1,
                width: 1,
                height: 1,
                name: 4
            };
            return this.ReadArray(romData, parseInt(config.MapLabelData, 16), SizeOfCStruct(regionStruct), parseInt(config.NumberOfMapLabels, 16)).map(data => {
                const rData = ReadCStruct(data, regionStruct);
                const addr = this.ReadRomPtr(rData.name);
                return this.FixAllCaps(this.ConvertText(romData.slice(addr, addr + 20)));
            });
        }

        protected ReadMaps(romData: Buffer, config: PGEINI) {
            const mapHeaderStruct = {
                mapLayout: 4,
                events: 4,
                mapScripts: 4,
                connections: 4,
                music: 2,
                mapLayoutId: 2,
                regionMapSectionId: 1,
                cave: 1,
                weather: 1,
                mapType: 1,
                filler_18: -2,
                flags: 1,
                battleType: 1
            };
            let mapBanksPtr = parseInt(config.Pointer2PointersToMapBanks || "0", 16);
            return this.ReadPtrBlock(romData, mapBanksPtr)
                .map((bankPtr, b, arr) => this.ReadPtrBlock(romData, bankPtr, arr[b + 1]).map(ptr => romData.slice(ptr, ptr + SizeOfCStruct(mapHeaderStruct)))
                    .map((mapHeader, m) => {
                        const mData = ReadCStruct(mapHeader, mapHeaderStruct);
                        return (<Pokemon.Map>{
                            bank: b,
                            id: m,
                            areaId: mData.regionMapSectionId[0],
                            areaName: this.areas[mData.regionMapSectionId[0]],
                            encounters: {}
                        });
                    })
                ).reduce((allMaps, currBank) => Array.prototype.concat.apply(allMaps, currBank), []);
        }

        TrainerIsRival(id: number, classId: number) {
            return false;
        }


        protected ParseRHHRomHeader(romData: Buffer) {
            const headerAddr = romData.indexOf("RHHEXP");
            if (headerAddr < 0)
                return undefined;
            console.log(`Found RHH Rom Header at ${headerAddr.toString(16)}`);
            const data = ReadCStruct(romData, {
                rhh_magic: 6, // 'RHHEXP'
                expansionVersionMajor: 1,
                expansionVersionMinor: 1,
                expansionVersionPatch: 1,
                expansionVersionFlags: 1,
                movesCount: 2,
                numSpecies: 2,
                abilitiesCount: 2,
                abilitiesInfoPtr: 4,
                itemsCount: 2,
                itemNameLength: 1,
                padding: 1,
            }, headerAddr);
            return {
                rhh_magic: data.rhh_magic.toString(),
                expansionVersion: `${data.expansionVersionMajor}.${data.expansionVersionMinor}.${data.expansionVersionPatch}${data.expansionVersionFlags.toString("hex")}`,
                movesCount: data.movesCount.readUInt16LE(0),
                numSpecies: data.numSpecies.readUInt16LE(0),
                abilitiesCount: data.abilitiesCount.readUInt16LE(0),
                abilitiesInfoPtr: data.abilitiesInfoPtr.readUInt32LE(0) % 0x8000000,
                itemsCount: data.itemsCount.readUInt16LE(0),
                itemNameLength: data.itemNameLength.readUInt8(0)
            };
        }

        protected ParseTPPRomHeader(romData: Buffer) {
            const headerAddr = romData.indexOf("TPP ");
            if (headerAddr < 0)
                return undefined;
            console.log(`Found TPP Rom Header at ${headerAddr.toString(16)}`);
            const data = ReadCStruct(romData, {
                tpp_magic: 4, // 'TPP '
                ChattyStringLocation: 4, // Pointer to the gChattyString variable in chatty.c.
                ChattyReadyLocation: 4, // Pointer to the sChattyReady variable in chatty.c, so that external programs can set it to true when they have finished writing to gChattyString.
                gPlayerPartyLocation: 4, // Pointer to the gPlayerParty variable.
                PartyBytes: 4, // The size of the player's party in bytes.
                PCBlockAddress: 4, // The address of the start of the PC blocks.
                PCBytes: 4, // The size of the PC data in bytes.
                GameStatsOffset: 4, // The offset of the Game Stats struct within the save block.
                GameStatsBytes: 4, // The size of the Game Stats struct in bytes.
                DaycareOffset: 4, // The offset of the Daycare struct within the save block.
                MoneyOffset: 4, // The offset of the money variable within the save block.
                BadgesAddress: 4, // The address of the badge flag ids array.
                ClockAddr: 4, // The address of the RTC struct.
                MusicAddr: 4, // The address of the variable that holds the current map music.
                EvolutionMusicIds: 4, // The ID of the music that plays when a Pokémon evolves.
                CurrentAreaAddr: 4, // The address of the variable that holds the current area ID (gMapHeader.regionMapSectionId).
                gBattleTypeFlagsAddr: 4, // The address of the gBattleTypeFlags variable.
                gTrainerBattleOpponent_A: 4, // The address of the trainer ID of the current trainer battle opponent.
                gEnemyPartyAddr: 4, // The address of the gEnemyParty variable.
                gBattlersCountAddr: 4, // The address of the gBattlersCount variable.
                gBattlerPartyIndexesAddr: 4, // The address of the gBattlerPartyIndexes array.
                gBattlerPositionsAddr: 4, // The address of the gBattlerPositions array.
                gBattleMonsAddr: 4, // The address of the gBattleMons array.
                gBattleMonsBytes: 4, // The size of a gBattleMons in bytes.
                gTMHMItemMoveIds: 4, // The address of the gTMHMItemMoveIds array.
                gMapGroupsAddr: 4, // The address of the gMapGroups array, which is an array of pointers to arrays of pointers to MapHeader structs. The first index is the map group, and the second index is the map number within that group.
                gWildMonHeadersAddr: 4, // The address of the gWildMonHeaders array, which is an array of pointers to arrays of pointers to WildMonHeader structs. The first index is the map group, and the second index is the map number within that group.
                gTrainersAddr: 4, // The address of the gTrainers 2D array, which is an array of arrays of Trainer structs. The first index is the difficulty level, and the second index is the trainer ID within that difficulty level.
                gTrainerClassesAddr: 4, // The address of the gTrainerClasses array, which is an array of TrainerClass structs indexed by trainer class.
                TrainerCount: 4, // The number of trainers in each difficulty level (the size of the second dimension of the gTrainers array).
                TrainerClassCount: 4, // The number of trainer classes (the size of the gTrainerClasses array).
                gTrainerSpritesAddr: 4, // The address of the gTrainerSprites array, which is an array of TrainerSprite structs indexed by trainer class.
                gTypesInfo: 4, // The address of the gTypesInfo array, which is an array of type data
                TypesCount: 1, // The number of types.
                TypeNameLength: 1,
                TypeInfoSize: 2,
                gContestEffects: 4,
                gRegionMapEntries: 4,
                RegionCount: 4,
            }, headerAddr);
            return {
                gPlayerParty: data.gPlayerPartyLocation.readUInt32LE(0).toString(16),
                PartyBytes: data.PartyBytes.readUInt32LE(0).toString(16),
                PCBlockAddress: '*' + data.PCBlockAddress.readUInt32LE(0).toString(16),
                PCBytes: data.PCBytes.readUInt32LE(0).toString(16),
                GameStatsOffset: data.GameStatsOffset.readUInt32LE(0).toString(16),
                GameStatsBytes: data.GameStatsBytes.readUInt32LE(0).toString(16),
                DaycareOffset: data.DaycareOffset.readUInt32LE(0).toString(16),
                MoneyOffset: data.MoneyOffset.readUInt32LE(0).toString(16),
                BadgeFlag: romData.readUInt16LE(this.ReadRomPtr(data.BadgesAddress)),
                ClockAddr: data.ClockAddr.readUInt32LE(0).toString(16),
                MusicAddr: data.MusicAddr.readUInt32LE(0).toString(16),
                EvolutionMusicIds: data.EvolutionMusicIds.slice(0, 2).readUInt16LE(0).toString(16) + ' ' + data.EvolutionMusicIds.slice(2).readUInt16LE(0).toString(16),
                CurrentAreaAddr: data.CurrentAreaAddr.readUInt32LE(0).toString(16),
                gBattleTypeFlags: data.gBattleTypeFlagsAddr.readUInt32LE(0).toString(16),
                gTrainerBattleOpponent_A: data.gTrainerBattleOpponent_A.readUInt32LE(0).toString(16),
                gEnemyParty: data.gEnemyPartyAddr.readUInt32LE(0).toString(16),
                gBattlersCount: data.gBattlersCountAddr.readUInt32LE(0).toString(16),
                gBattlerPartyIndexes: data.gBattlerPartyIndexesAddr.readUInt32LE(0).toString(16),
                gBattlerPositions: data.gBattlerPositionsAddr.readUInt32LE(0).toString(16),
                gBattleMons: data.gBattleMonsAddr.readUInt32LE(0).toString(16),
                gBattleMonsBytes: data.gBattleMonsBytes.readUInt32LE(0).toString(16),
                gTMHMItemMoveIds: data.gTMHMItemMoveIds.readUInt32LE(0) % 0x8000000,
                gMapGroups: data.gMapGroupsAddr.readUInt32LE(0) % 0x8000000,
                gWildMonHeaders: data.gWildMonHeadersAddr.readUInt32LE(0) % 0x8000000,
                gTrainers: data.gTrainersAddr.readUInt32LE(0) % 0x8000000,
                gTrainerClasses: data.gTrainerClassesAddr.readUInt32LE(0) % 0x8000000,
                TrainerCount: data.TrainerCount.readUInt32LE(0),
                TrainerClassCount: data.TrainerClassCount.readUInt32LE(0),
                gTrainerSprites: data.gTrainerSpritesAddr.readUInt32LE(0) % 0x8000000,
                gTypesInfo: data.gTypesInfo.readUInt32LE(0) % 0x8000000,
                TypesCount: data.TypesCount[0],
                TypeNameLength: data.TypeNameLength[0],
                TypeInfoSize: data.TypeInfoSize.readUInt16LE(0),
                gContestEffects: data.gContestEffects.readUInt32LE(0) % 0x8000000,
                gRegionMapEntries: data.gRegionMapEntries.readUInt32LE(0) % 0x8000000,
                RegionCount: data.RegionCount.readUInt32LE(0),
            }
        }

        protected ParseCmdrRomHeader(romData: Buffer) {
            const headerAddr = romData.indexOf("CMDR");
            if (headerAddr < 0)
                return undefined;
            console.log(`Found Cmdr Rom Header at ${headerAddr.toString(16)}`);
            const data = ReadCStruct(romData, {
                cmdr_magic: 4, // 'CMDR'. Useful to locate the header if it shifts.
                Windows: 4, // Pointer to the array of pointers to window templates used in battle and menus.
                TargetingCursor: 4, // Pointer to the struct that defines the targeting cursor used in battle.
                TargetingControllerFunction: 4, // Pointer to the function that controls the targeting cursor in battle.
                MoveSwitchingControllerFunction: 4, // Pointer to the function that controls move switching in battle.
                FirstMonBattleController: 4, // Pointer to the first battle controller function, which controls the first Pokémon in battle.
                SecondMonBattleController: 4, // Pointer to the second battle controller function, which controls the second Pokémon in battle.
                NicknameScreen: 4, // Pointer to the function that shows the nickname screen.
                PokemonSummaryScreen: 4, // Pointer to the function that shows the Pokémon summary screen.
                PokemonSummaryScreenCallbackOffset: 4, // The offset within the Pokémon summary screen function where the callback function pointer is loaded. This is used to hook the summary screen.
                SummaryReturnToBattle: 4, // Pointer to the function that returns from the summary screen to battle.
                SummaryReturnToParty: 4, // Pointer to the function that returns from the summary screen to the party menu.
                SummaryReturnToTMLearn: 4, // Pointer to the function that returns from the summary screen to the TM/HM learning screen.
                CursorMoveLearnOffset: 4, // The offset within the TM/HM learning screen function where the cursor move learn state is loaded. This is used to track when the player is selecting a move to learn.
                DialogText: 4, // Pointer to the function that shows dialog text.
                BattleText: 4, // Pointer to the function that shows battle text.
                BattleFlags: 4, // Pointer to the variable that holds battle flags.
                BattleResources: 4, // Pointer to the struct that holds battle resources such as animations and palettes.
                MenuIdOffset: 4, // The offset within the main menu function where the current menu ID is loaded. This is used to track which menu the player is currently in.
                DoubleBattleMenuIdOffset: 4, // The offset within the double battle main menu function where the current menu ID is loaded. This is used to track which menu the player is currently in during double battles.
                YesNoWindowId: 4, // Pointer to the variable that holds the window ID of the yes/no prompt in battle.
                BattleMoveLearnState: 4, // Pointer to the variable that holds the state of move learning in battle.
                BattleCommunicationState: 4, // Pointer to the variable that holds the state of battle communication (e.g. whether the player is selecting a move, selecting a target, etc.).
                CursorYesNo: 4, // Pointer to the struct that defines the cursor used in yes/no prompts in battle.
                CursorBattle: 4, // Pointer to the struct that defines the cursor used in battle menus.
                CursorDoubleBattle: 4, // Pointer to the struct that defines the cursor used in double battle menus.
                CursorFight: 4, // Pointer to the struct that defines the cursor used in the fight menu.
                CursorDoubleFight: 4, // Pointer to the struct that defines the cursor used in the fight menu during double battles.
                BagId: 4, // Pointer to the variable that holds the window ID of the bag menu in battle.
                CursorBagStart: 4, // Pointer to the struct that defines the cursor used in the bag menu in battle.
                ScrollBagStart: 4, // Pointer to the struct that defines the scroll used in the bag menu in battle.
                SaveBlock1Pointer: 4, // Pointer to the pointer that points to the start of Save Block 1 in RAM.
                SaveBlock2Pointer: 4, // Pointer to the pointer that points to the start of Save Block 2 in RAM.
                CurrentMusic: 4, // Pointer to the variable that holds the current music ID.
                InBattle: 4, // Pointer to the variable that indicates whether the player is currently in battle.
                CursorSubmenu: 4, // Pointer to the struct that defines the cursor used in submenus in battle (e.g. the submenu that appears when you select a Pokémon in the fight menu).
                PartyMenu: 4, // Pointer to the function that shows the party menu in battle.
                BagMenu: 4, // Pointer to the function that shows the bag menu in battle.
                Evolution: 4, // Pointer to the function that handles evolution in battle.
                SecurityKeyOffset: 4, // The offset within the function that initializes the game where the security key is loaded. This is used to verify that the ROM is a valid copy and not a random hack.
                ContestResources: 4, // Pointer to the struct that holds resources for Pokémon contests.
                PartyMenuInternal: 4, // Pointer to the internal function that shows the party menu in battle. This is used to hook the party menu separately from the main party menu function.
                ItemsOffset: 4, // The offset of the bag in the save block.
                pcItemsCount: 1, // The number of items that can be stored in the PC.
                bagCountItems: 1, // The number of item slots in the player's bag.
                bagCountKeyItems: 1, // The number of key item slots in the player's bag.
                bagCountPokeballs: 1, // The number of Poké Ball slots in the player's bag.
                bagCountTMHMs: 1, // The number of TM/HM slots in the player's bag.
                bagCountBerries: 1, // The number of berry slots in the player's bag.
            }, headerAddr);

            const bagItemsOffset = data.ItemsOffset.readUInt32LE(0);
            const bagKeyItemsOffset = bagItemsOffset + data.bagCountItems[0] * 4;
            const bagPokeballsOffset = bagKeyItemsOffset + data.bagCountKeyItems[0] * 4;
            const bagTMHMsOffset = bagPokeballsOffset + data.bagCountPokeballs[0] * 4;
            const bagBerriesOffset = bagTMHMsOffset + data.bagCountTMHMs[0] * 4;

            return {
                cmdr_magic: data.cmdr_magic.toString(),
                Windows: data.Windows.readUInt32LE(0),
                TargetingCursor: data.TargetingCursor.readUInt32LE(0),
                TargetingControllerFunction: data.TargetingControllerFunction.readUInt32LE(0),
                MoveSwitchingControllerFunction: data.MoveSwitchingControllerFunction.readUInt32LE(0),
                FirstMonBattleController: data.FirstMonBattleController.readUInt32LE(0),
                SecondMonBattleController: data.SecondMonBattleController.readUInt32LE(0),
                NicknameScreen: data.NicknameScreen.readUInt32LE(0),
                PokemonSummaryScreen: data.PokemonSummaryScreen.readUInt32LE(0),
                PokemonSummaryScreenCallbackOffset: data.PokemonSummaryScreenCallbackOffset.readUInt32LE(0),
                SummaryReturnToBattle: data.SummaryReturnToBattle.readUInt32LE(0) % 0x8000000,
                SummaryReturnToParty: data.SummaryReturnToParty.readUInt32LE(0) % 0x8000000,
                SummaryReturnToTMLearn: data.SummaryReturnToTMLearn.readUInt32LE(0) % 0x8000000,
                CursorMoveLearnOffset: data.CursorMoveLearnOffset.readUInt32LE(0),
                DialogText: data.DialogText.readUInt32LE(0),
                BattleText: data.BattleText.readUInt32LE(0),
                BattleFlags: data.BattleFlags.readUInt32LE(0),
                BattleResources: data.BattleResources.readUInt32LE(0),
                MenuIdOffset: data.MenuIdOffset.readUInt32LE(0),
                DoubleBattleMenuIdOffset: data.DoubleBattleMenuIdOffset.readUInt32LE(0),
                YesNoWindowId: data.YesNoWindowId.readUInt32LE(0),
                BattleMoveLearnState: data.BattleMoveLearnState.readUInt32LE(0),
                BattleCommunicationState: data.BattleCommunicationState.readUInt32LE(0),
                CursorYesNo: data.CursorYesNo.readUInt32LE(0),
                CursorBattle: data.CursorBattle.readUInt32LE(0),
                CursorDoubleBattle: data.CursorDoubleBattle.readUInt32LE(0),
                CursorFight: data.CursorFight.readUInt32LE(0),
                CursorDoubleFight: data.CursorDoubleFight.readUInt32LE(0),
                BagId: data.BagId.readUInt32LE(0),
                CursorBagStart: data.CursorBagStart.readUInt32LE(0),
                ScrollBagStart: data.ScrollBagStart.readUInt32LE(0),
                SaveBlock1Pointer: data.SaveBlock1Pointer.readUInt32LE(0),
                SaveBlock2Pointer: data.SaveBlock2Pointer.readUInt32LE(0),
                CurrentMusic: data.CurrentMusic.readUInt32LE(0),
                InBattle: data.InBattle.readUInt32LE(0),
                CursorSubmenu: data.CursorSubmenu.readUInt32LE(0),
                PartyMenu: data.PartyMenu.readUInt32LE(0),
                BagMenu: data.BagMenu.readUInt32LE(0),
                Evolution: data.Evolution.readUInt32LE(0),
                SecurityKeyOffset: data.SecurityKeyOffset.readUInt32LE(0),
                ContestResources: data.ContestResources.readUInt32LE(0),
                PartyMenuInternal: data.PartyMenuInternal.readUInt32LE(0),
                ItemsOffset: data.ItemsOffset.readUInt32LE(0),
                pcItemsCount: data.pcItemsCount.readUInt8(0),
                bagCountItems: data.bagCountItems.readUInt8(0),
                bagCountKeyItems: data.bagCountKeyItems.readUInt8(0),
                bagCountPokeballs: data.bagCountPokeballs.readUInt8(0),
                bagCountTMHMs: data.bagCountTMHMs.readUInt8(0),
                bagCountBerries: data.bagCountBerries.readUInt8(0),
                bagItemsOffset,
                bagKeyItemsOffset,
                bagPokeballsOffset,
                bagTMHMsOffset,
                bagBerriesOffset
            }
        }

        private wildEncounterTypeStruct = {
            landMonsInfo: 4,
            waterMonsInfo: 4,
            rockSmashMonsInfo: 4,
            fishingMonsInfo: 4,
            hiddenMonsInfo: 4,
        }
        private wildPokemonHeaderStruct = {
            mapGroup: 1,
            mapNum: 1,
            encounterTypes: SizeOfCStruct(this.wildEncounterTypeStruct) * 4
        }


        protected FindMapEncounters(romData: Buffer, config: PGEINI) {

            this.ReadArray(romData, parseInt(config.WildPokemonHeaders || "", 16), SizeOfCStruct(this.wildPokemonHeaderStruct)).forEach(data => {
                const mData = ReadCStruct(data, this.wildPokemonHeaderStruct);
                let mapBank = mData.mapGroup[0], mapId = mData.mapNum[0];
                if (mapBank == 0xFF && mapId == 0xFF)
                    return;
                let map = this.GetMap(mapId, mapBank);
                let rockSmashExp = /[[TH]M\d+ Rock Smash/i
                let rockSmashTmId = (this.items.filter(i => rockSmashExp.test(i.name)).shift() || { id: 0 }).id;
                this.ReadArray(mData.encounterTypes, 0, SizeOfCStruct(this.wildEncounterTypeStruct), 4).forEach((data, i) => {
                    const encounterGroup = ReadCStruct(data, this.wildEncounterTypeStruct);
                    map.encounters = {
                        ...(map.encounters || {}),
                        [timesOfDay[i]]: {
                            grass: this.ReadEncounterSet(romData, this.ReadRomPtr(encounterGroup.landMonsInfo), grassEncounterRates),
                            surfing: this.ReadEncounterSet(romData, this.ReadRomPtr(encounterGroup.waterMonsInfo), surfEncounterRates),
                            hidden_grass: this.ReadEncounterSet(romData, this.ReadRomPtr(encounterGroup.rockSmashMonsInfo), rockSmashEncounterRates, rockSmashEncounterRates.map(e => rockSmashTmId), true),
                            fishing: this.ReadEncounterSet(romData, this.ReadRomPtr(encounterGroup.fishingMonsInfo), fishingEncounterRates, fishingRequiredRods, true),
                        }
                    };
                });
                const activeTimes = Object.values(map.encounters).filter(e => Object.values(e).some(e => e.length > 0));
                if (activeTimes.length == 1)
                    map.encounters = { all: activeTimes[0] };
            });
        }

        protected ReadEncounterSet(romData: Buffer, setAddr: number, encounterRates: number[], requiredItems: number[] = [], includeGroupRate = false) {
            const wildPokemonStruct = {
                minLevel: 1,
                maxLevel: 1,
                species: 2
            }
            const wildPokemonInfoStruct = {
                encounterRate: 1,
                wildPokemon: 4
            }
            if (setAddr <= 0)
                return [];
            let set = ReadCStruct(romData, wildPokemonInfoStruct, setAddr);
            let groupRate = set.encounterRate[0] / 100;
            try {
                return this.CombineDuplicateEncounters(this.ReadArray(romData, this.ReadRomPtr(set.wildPokemon), SizeOfCStruct(wildPokemonStruct), encounterRates.length).map((data, i) => {
                    const wildData = ReadCStruct(data, wildPokemonStruct);
                    return (<Pokemon.EncounterMon>{
                        species: this.GetSpecies(wildData.species.readInt16LE(0)),
                        rate: encounterRates[i] * (includeGroupRate ? groupRate : 1),
                        requiredItem: this.GetItem(requiredItems[i])
                    });
                }));
            }
            catch (e) {
                console.error(`Could not read encounter set at ${setAddr.toString(16)}->${set.wildPokemon.readInt32LE(0).toString(16)}: ${e}`);
                return [];
            }
        }

        protected ParseRHHEvolution(romData: Buffer, evoData: { [K in keyof typeof evoStruct]: Buffer }): Pokemon.Evolution | undefined {
            const paramPtr = this.ReadRomPtr(evoData.params);
            const params = (paramPtr > 0) ? this.ReadArray(romData, paramPtr, SizeOfCStruct(evoParamStruct), 255, true, EvolutionConditions.CONDITIONS_END).map(e => ReadCStruct(e, evoParamStruct)) : [];

            //TODO: Support Conditions

            let evo: Pokemon.Evolution = { speciesId: evoData.targetSpecies.readUInt16LE(0), specialCondition: "" };
            let evoParam = evoData.param.readUInt16LE(0);
            switch (evoData.method.readUInt16LE(0) as EvolutionMethods) {
                case EvolutionMethods.EVO_NONE:
                    return undefined;
                case EvolutionMethods.EVO_LEVEL_BATTLE_ONLY:
                    evo.specialCondition += " only in battle";
                //fallthrough
                case EvolutionMethods.EVO_LEVEL:
                    evo.level = evoParam;
                    break;
                case EvolutionMethods.EVO_ITEM:
                    evo.item = this.GetItem(evoParam);
                    break;
                case EvolutionMethods.EVO_TRADE:
                    evo.isTrade = true;
                    break;
                case EvolutionMethods.EVO_SPLIT_FROM_EVO:
                    evo.specialCondition += " splits from another evo";
                    break;
                case EvolutionMethods.EVO_BATTLE_END:
                    evo.specialCondition += " at battle's end";
                    break;
                case EvolutionMethods.EVO_SCRIPT_TRIGGER:
                    evo.specialCondition += " based on a script";
                    break;
                case EvolutionMethods.EVO_SPIN:
                    evo.specialCondition += " spin around";
                    break;
            }
            evo.specialCondition = evo.specialCondition.trim();
            if (evo.specialCondition.length < 1)
                delete evo.specialCondition;
            return evo;
        }

        protected LoadConfig(romData: Buffer): PGEINI {
            return {} as PGEINI;
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 16) == 16; //Balance/Soul Badge
        }
    }
}