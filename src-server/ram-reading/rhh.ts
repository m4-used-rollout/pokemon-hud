/// <reference path="base.ts" />

namespace RamReader {

    interface Gen3PartyPokemon extends TPP.PartyPokemon, TPP.BoxedPokemon {
        encryption_key?: number;
        checksum?: number;
        species: Pokemon.Convert.StatSpeciesWithExp;
    }

    interface Gen3BattlePokemon extends Gen3PartyPokemon {
        volatile_status?: string[];
    }

    enum Gen3Language {
        Japanese = 1,
        English = 2,
        French = 3,
        Italian = 4,
        German = 5,
        Korean = 6,
        Spanish = 7
    }

    let POKEMON_NAME_LENGTH = 12;
    let PLAYER_NAME_LENGTH = 7;
    const MAX_MON_MOVES = 4;
    const NUM_BATTLE_STATS = 8;
    const VANILLA_POKEMON_NAME_LENGTH = 10;
    const MAIL_WORDS_COUNT = 9;
    const DAYCARE_MON_COUNT = 2;

    const TOTAL_BOXES_COUNT = 14;
    const IN_BOX_ROWS = 5; // Number of rows, 6 Pokémon per row
    const IN_BOX_COLUMNS = 6; // Number of columns, 5 Pokémon per column
    const IN_BOX_COUNT = (IN_BOX_ROWS * IN_BOX_COLUMNS);
    const BOX_NAME_LENGTH = 8;
    const MAX_FUSION_STORAGE = 4;

    const POKEBLOCKS_COUNT = 40;
    const VARS_COUNT = 0x40FF - 0x4000;
    const NUM_GAME_STATS = 64;

    type UnionToIntersection<U> =
        (U extends any ? (x: U) => void : never) extends
        (x: infer I) => void
        ? I
        : never;

    function PrintStruct(data: Record<string, Buffer>) {
        console.log(JSON.stringify(data, (key, value) => {
            return value && value.type === 'Buffer'
                ? Buffer.from(value.data).toString('hex')
                : value;
        }, 2));
    }

    export class Gen3RHH extends RamReaderBase<RomReader.Gen3RHH> {
        constructor(rom: RomReader.Gen3RHH, port: number, hostname = "localhost", config: Config) {
            super(rom, port, hostname, config);
            POKEMON_NAME_LENGTH = rom.gfRomHeader.pokemonNameLength1;
            PLAYER_NAME_LENGTH = rom.gfRomHeader.playerNameLength;
        }
        protected Markings = ['●', '■', '▲', '♥'];

        protected PokemonSubstruct0 = {
            species_teraType: 2,
            // u16 species:11; // 2047 species.
            // enum Type teraType:5; // 30 types.
            heldItem: 2,
            // u16 heldItem:10; // 1023 items.
            // u16 unused_02:6;
            experience_nickname11: 4,
            // u32 experience:21;
            // u32 nickname11:8; // 11th character of nickname.
            // u32 unused_04:3;
            ppBonuses: 1,
            friendship: 1,
            pokeball_nickname12: 2
            // u16 pokeball:6; // 63 balls.
            // u16 nickname12:8; // 12th character of nickname.
            // u16 unused_0A:2;
        };

        protected PokemonSubstruct1 = {
            move1_evo1: 2,
            // u16 move1:11; // 2047 moves.
            // u16 evolutionTracker1:5;
            move2_evo2: 2,
            // u16 move2:11; // 2047 moves.
            // u16 evolutionTracker2:5;
            move3: 2,
            // u16 move3:11; // 2047 moves.
            // u16 unused_04:5;
            move4_hyper: 2,
            // u16 move4:11; // 2047 moves.
            // u16 unused_06:3;
            // u16 hyperTrainedHP:1;
            // u16 hyperTrainedAttack:1;
            pp1_hyperDef: 1,
            // u8 pp1:7; // 127 PP.
            // u8 hyperTrainedDefense:1;
            pp2_hyperSpeed: 1,
            // u8 pp2:7; // 127 PP.
            // u8 hyperTrainedSpeed:1;
            pp3_hyperSpAtk: 1,
            // u8 pp3:7; // 127 PP.
            // u8 hyperTrainedSpAttack:1;
            pp4_hyperSpDef: 1
            // u8 pp4:7; // 127 PP.
            // u8 hyperTrainedSpDefense:1;
        };

        protected PokemonSubstruct2 = {
            hpEV: 1,
            attackEV: 1,
            defenseEV: 1,
            speedEV: 1,
            spAttackEV: 1,
            spDefenseEV: 1,
            cool: 1,
            beauty: 1,
            cute: 1,
            smart: 1,
            tough: 1,
            sheen: 1,
        };

        protected PokemonSubstruct3 = {
            pokerus: 1,
            metLocation: 1,
            metLevel_game_dyna_gender: 2,
            // u16 metLevel:7;
            // u16 metGame:4;
            // u16 dynamaxLevel:4;
            // u16 otGender:1;
            ivs: 4,
            // u32 hpIV:5;
            // u32 attackIV:5;
            // u32 defenseIV:5;
            // u32 speedIV:5;
            // u32 spAttackIV:5;
            // u32 spDefenseIV:5;
            // u32 isEgg:1;
            // u32 gigantamaxFactor:1;
            ribbons_ability: 4
            // u32 coolRibbon:3;     // Stores the highest contest rank achieved in the Cool category.
            // u32 beautyRibbon:3;   // Stores the highest contest rank achieved in the Beauty category.
            // u32 cuteRibbon:3;     // Stores the highest contest rank achieved in the Cute category.
            // u32 smartRibbon:3;    // Stores the highest contest rank achieved in the Smart category.
            // u32 toughRibbon:3;    // Stores the highest contest rank achieved in the Tough category.
            // u32 championRibbon:1; // Given when defeating the Champion. Because both RSE and FRLG use it, later generations don't specify from which region it comes from.
            // u32 winningRibbon:1;  // Given at the Battle Tower's Level 50 challenge by winning a set of seven battles that extends the current streak to 56 or more.
            // u32 victoryRibbon:1;  // Given at the Battle Tower's Level 100 challenge by winning a set of seven battles that extends the current streak to 56 or more.
            // u32 artistRibbon:1;   // Given at the Contest Hall by winning a Master Rank contest with at least 800 points, and agreeing to have the Pokémon's portrait placed in the museum after being offered.
            // u32 effortRibbon:1;   // Given at Slateport's market to Pokémon with maximum EVs.
            // u32 marineRibbon:1;   // Never distributed.
            // u32 landRibbon:1;     // Never distributed.
            // u32 skyRibbon:1;      // Never distributed.
            // u32 countryRibbon:1;  // Distributed during Pokémon Festa '04 and '05 to tournament winners.
            // u32 nationalRibbon:1; // Given to purified Shadow Pokémon in Colosseum/XD.
            // u32 earthRibbon:1;    // Given to teams that have beaten Mt. Battle's 100-battle challenge in Colosseum/XD.
            // u32 worldRibbon:1;    // Distributed during Pokémon Festa '04 and '05 to tournament winners.
            // u32 isShadow:1;
            // u32 unused_0B:1;
            // u32 abilityNum:2;
            // u32 modernFatefulEncounter:1;
        };

        protected BoxPokemonStruct = {
            personality: 4,
            otId: 4,
            nickname: 0 - Math.min(10, parseInt(this.rom.config.PokemonNameLength, 16)), //negative so it will pack
            language_nature: 1,
            badEgg_hasSpecies_isEgg_blockBoxRS_daysSinceFormChange: 1,
            otName: -7, //negative so it will pack
            markings_status: 1,
            checksum: 2,
            hpLost_shiny: 2,
            substructs: 12 * 4
        };

        protected PokemonStruct = {
            box: RomReader.SizeOfCStruct(this.BoxPokemonStruct),
            status: 4,
            level: 1,
            mail: 1,
            hp: 2,
            maxHp: 2,
            attack: 2,
            defense: 2,
            speed: 2,
            spAttack: 2,
            spDefense: 2
        };

        protected PokemonStorageStruct = {
            currentBox: 1,
            boxes: TOTAL_BOXES_COUNT * IN_BOX_COUNT * RomReader.SizeOfCStruct(this.BoxPokemonStruct),
            boxNames: TOTAL_BOXES_COUNT * (BOX_NAME_LENGTH + 1),
            boxWallpapers: TOTAL_BOXES_COUNT,
            fusions: MAX_FUSION_STORAGE * RomReader.SizeOfCStruct(this.PokemonStruct)
        };

        protected BattlePokemonStruct = {
            species: 2,
            attack: 2,
            defense: 2,
            speed: 2,
            spAttack: 2,
            spDefense: 2,
            moves: 2 * MAX_MON_MOVES,
            ivs: 4,
            statStages: 0 - NUM_BATTLE_STATS,
            ability: 2,
            types: -3,
            pp: 0 - MAX_MON_MOVES,
            hp: 2,
            level: 1,
            friendship: 1,
            maxHP: 2,
            item: 2,
            nickname: 0 - (this.rom.gfRomHeader.pokemonNameLength1 + 1),
            ppBonuses: 1,
            otName: 0 - (this.rom.gfRomHeader.playerNameLength + 1),
            experience: 4,
            personality: 4,
            status1: 4,
            volatiles: 12,
            otId: 4,
            metLevel: 1,
            isShiny: 1
        };

        protected BattlePackedBytes = {
            ivs: {
                hpIV: 5,
                attackIV: 5,
                defenseIV: 5,
                speedIV: 5,
                spAttackIV: 5,
                spDefenseIV: 5,
                abilityNum: 2,
            },
            volatiles: {
                confusionTurns: 3,
                flinched: 1,
                uproarTurns: 3,
                torment: 1,
                bideTurns: 2,
                lockConfusionTurns: 2,
                multipleTurns: 1,
                wrapped: 1,
                powder: 1,
                unused: 1,
                infatuation: 4,
                defenseCurl: 1,
                transformed: 1,
                recharge: 1,
                rage: 1,
                substitute: 1,
                destinyBond: 1,
                escapePrevention: 1,
                nightmare: 1,
                cursed: 1,
                foresight: 1,
                dragonCheer: 1,
                focusEnergy: 1,
            }
        };

        protected PokemonPackedBytes = {
            species_teraType: {
                species: 11,
                teraType: 5
            },
            heldItem: {
                heldItem: 10,
            },
            experience_nickname11: {
                experience: 21,
                nickname11: 8,
            },
            pokeball_nickname12: {
                pokeball: 6,
                nickname12: 8,
            },
            move1_evo1: {
                move1: 11,
                evolutionTracker1: 5,
            },
            move2_evo2: {
                move2: 11,
                evolutionTracker2: 5
            },
            move3: {
                move3: 11,
                unused: 5
            },
            move4_hyper: {
                move4: 11,
                unused: 3,
                hyperTrainedHP: 1,
                hyperTrainedAttack: 1
            },
            pp1_hyperDef: {
                pp1: 7,
                hyperTrainedDefense: 1
            },
            pp2_hyperSpeed: {
                pp2: 7,
                hyperTrainedSpeed: 1
            },
            pp3_hyperSpAtk: {
                pp3: 7,
                hyperTrainedSpAttack: 1,
            },
            pp4_hyperSpDef: {
                pp4: 7,
                hyperTrainedSpDefense: 1
            },
            metLevel_game_dyna_gender: {
                metLevel: 7,
                metGame: 4,
                dynamaxLevel: 4,
                otGender: 1
            },
            ivs: {
                hpIV: 5,
                attackIV: 5,
                defenseIV: 5,
                speedIV: 5,
                spAttackIV: 5,
                spDefenseIV: 5,
                isEgg: 1,
                gigantamaxFactor: 1
            },
            ribbons_ability: {
                coolRibbon: 3,
                beautyRibbon: 3,
                cuteRibbon: 3,
                smartRibbon: 3,
                toughRibbon: 3,
                championRibbon: 1,
                winningRibbon: 1,
                victoryRibbon: 1,
                artistRibbon: 1,
                effortRibbon: 1,
                marineRibbon: 1,
                landRibbon: 1,
                skyRibbon: 1,
                countryRibbon: 1,
                nationalRibbon: 1,
                earthRibbon: 1,
                worldRibbon: 1,
                isShadow: 1,
                unused: 1,
                abilityNum: 2,
                modernFatefulEncounter: 1,
            },
            language_nature: {
                language: 3,
                hiddenNatureModifier: 5,
            },
            badEgg_hasSpecies_isEgg_blockBoxRS_daysSinceFormChange: {
                isBadEgg: 1,
                hasSpecies: 1,
                isEgg: 1,
                blockBoxRS: 1,
                daysSinceFormChange: 3,
                unused: 1
            },
            markings_status: {
                markings: 4,
                compressedStatus: 4
            },
            hpLost_shiny: {
                hpLost: 14,
                shinyModifier: 1
            }
        };

        protected PokedexStruct = {
            order: 1,
            mode: 1,
            nationalMagic: 1,
            unownPersonality: 4,
            spindaPersonality: 4,
            unknown: 4,
            filler: -0x68 // Previously Dex Flags
        };

        protected TimeStruct = {
            days: 2, //signed
            hours: 1, //signed
            minutes: 1, //signed
            seconds: 1 //signed
        };

        protected SaveBlock2 = {
            playerName: PLAYER_NAME_LENGTH + 1,
            playerGender: 1, // MALE, FEMALE
            specialSaveWarpFlags: 1,
            playerTrainerId: -4,
            playTimeHours: 2,
            playTimeMinutes: 1,
            playTimeSeconds: 1,
            playTimeVBlanks: 1,
            options: -3,
            // u8 optionsButtonMode;  // OPTIONS_BUTTON_MODE_[NORMAL/LR/L_EQUALS_A]
            // u16 optionsTextSpeed:3; // OPTIONS_TEXT_SPEED_[SLOW/MID/FAST]
            // u16 optionsWindowFrameType:5; // Specifies one of the 20 decorative borders for text boxes
            // u16 optionsSound:1; // OPTIONS_SOUND_[MONO/STEREO]
            // u16 optionsBattleStyle:1; // OPTIONS_BATTLE_STYLE_[SHIFT/SET]
            // u16 optionsBattleSceneOff:1; // whether battle animations are disabled
            // u16 regionMapZoom:1; // whether the map is zoomed in
            pokedex: RomReader.SizeOfCStruct(this.PokedexStruct),
            filler_90: -8,
            localTimeOffset: RomReader.SizeOfCStruct(this.TimeStruct),
            lastBerryTreeUpdate: RomReader.SizeOfCStruct(this.TimeStruct),
            gcnLinkFlags: 4, // Read by Pokémon Colosseum/XD
            encryptionKey: 4,
            // Nothing else needed
            // /*0xB0*/ struct PlayersApprentice playerApprentice;
            // /*0xDC*/ struct Apprentice apprentices[APPRENTICE_COUNT];
            // /*0x1EC*/ struct BerryCrush berryCrush;
            // /*0x1FC*/ struct PokemonJumpRecords pokeJump;
            // /*0x20C*/ struct BerryPickingResults berryPick;
            // /*0x21C*/ struct RankingHall1P hallRecords1P[HALL_FACILITIES_COUNT][FRONTIER_LVL_MODE_COUNT][HALL_RECORDS_COUNT]; // From record mixing.
            // /*0x57C*/ struct RankingHall2P hallRecords2P[FRONTIER_LVL_MODE_COUNT][HALL_RECORDS_COUNT]; // From record mixing.
            // /*0x624*/ u16 contestLinkResults[CONTEST_CATEGORIES_COUNT][CONTESTANT_COUNT];
            // /*0x64C*/ struct BattleFrontier frontier;
        };


        protected WarpData = {
            mapGroup: 1, //signed
            mapNum: 1, //signed
            warpId: 1, //signed
            x: 2, //signed
            y: 2 //signed
        };

        protected ItemSlot = {
            itemId: 2,
            quantity: 2
        };

        protected Bag = {
            items: this.rom.gfRomHeader.bagCountItems * RomReader.SizeOfCStruct(this.ItemSlot),
            keyItems: this.rom.gfRomHeader.bagCountKeyItems * RomReader.SizeOfCStruct(this.ItemSlot),
            pokeBalls: this.rom.gfRomHeader.bagCountPokeballs * RomReader.SizeOfCStruct(this.ItemSlot),
            TMsHMs: this.rom.gfRomHeader.bagCountTMHMs * RomReader.SizeOfCStruct(this.ItemSlot),
            berries: this.rom.gfRomHeader.bagCountBerries * RomReader.SizeOfCStruct(this.ItemSlot)
        };

        protected Pokeblock = {
            color: 1,
            spicy: 1,
            dry: 1,
            sweet: 1,
            bitter: 1,
            sour: 1,
            feel: 1,
        };

        protected Mail = {
            words: MAIL_WORDS_COUNT * 2,
            playerName: PLAYER_NAME_LENGTH + 1,
            trainerId: -4,
            species: 2,
            itemId: 2
        };

        protected DaycareMail = {
            message: RomReader.SizeOfCStruct(this.Mail),
            otName: PLAYER_NAME_LENGTH + 1,
            monName: VANILLA_POKEMON_NAME_LENGTH + 1,
            language: 1
            // u8 gameLanguage: 4;
            // u8 monLanguage: 4;
        };

        protected DaycareMon = {
            mon: RomReader.SizeOfCStruct(this.BoxPokemonStruct),
            mail: RomReader.SizeOfCStruct(this.DaycareMail),
            steps: 4
        };

        protected DayCare = {
            mons: RomReader.SizeOfCStruct(this.DaycareMon) * DAYCARE_MON_COUNT,
            offspringPersonality: 4,
            stepCounter: 4
        };

        protected SaveBlock1NeededSubstructs = {
            [0x04]: {
                location: RomReader.SizeOfCStruct(this.WarpData),
            },
            [0x490]: {
                money: 4,
                coins: 2,
                registeredItem: 2, // registered for use with SELECT button
            },
            [this.rom.gfRomHeader.flagsOffset]: {
                flags: this.rom.gfRomHeader.varsOffset - this.rom.gfRomHeader.flagsOffset,
                vars: VARS_COUNT * 2,
                gameStats: NUM_GAME_STATS * 4
            },
            [0x3030]: {
                daycare: RomReader.SizeOfCStruct(this.DaycareMon),
            },
            [this.rom.gfRomHeader.seen1Offset]: {
                dexSeen: 0 - Math.ceil(this.rom.gfRomHeader.pokedexCount / 8), //Negative so they pack
                dexCaught: 0 - Math.ceil(this.rom.gfRomHeader.pokedexCount / 8) //Negative so they pack
            }
        };

        protected readerFunc = this.ReadSync;

        public ReadParty = this.CachedEmulatorCaller(`ReadByteRange/${this.rom.config.gPlayerParty}/${this.rom.config.PartyBytes}`, this.WrapBytes(data => this.ParseParty(data)));

        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/${this.rom.config.PCBlockAddress}/${this.rom.config.PCBytes}`, this.WrapBytes(data => {
            const boxData = RomReader.ReadCStruct(data, this.PokemonStorageStruct);
            const BoxMonBytes = RomReader.SizeOfCStruct(this.BoxPokemonStruct);
            const boxNames = this.rom.ReadArray(boxData.boxNames, 0, BOX_NAME_LENGTH + 1, TOTAL_BOXES_COUNT).map(n => this.rom.ConvertText(n));
            return ({
                current_box_number: boxData.currentBox[0],
                boxes: this.rom.ReadArray(boxData.boxes, 0, IN_BOX_COUNT * BoxMonBytes, TOTAL_BOXES_COUNT).map((box, i) => ({
                    box_number: i + 1,
                    box_name: boxNames[i],
                    box_contents: this.rom.ReadArray(box, 0, BoxMonBytes, IN_BOX_COUNT).map((pkmdata, b) => this.ParsePokemon(pkmdata, b + 1)).filter(p => !!p)
                } as TPP.BoxData))
            } as TPP.CombinedPCData);
        }));

        public ReadBattle = this.StructEmulatorCaller<TPP.BattleStatus>("System Bus", {
            InBattleAddr: 1,
            gBattleTypeFlags: 4,
            gTrainerBattleOpponent_A: 17,
            gPlayerParty: parseInt(this.rom.config.PartyBytes, 16),
            gEnemyParty: parseInt(this.rom.config.PartyBytes, 16),
            gBattleMons: parseInt(this.rom.config.gBattleMonsBytes, 16),
            gBattlersCount: 1,
            gBattlerPartyIndexes: 8,
            gBattlerPositions: 4
        }, sym => this.rom.config[sym], struct => {
            const in_battle = (struct.InBattleAddr.readUInt8(0) & 2) > 0;
            const battleFlags = struct.gBattleTypeFlags.readUInt32LE(0);
            if (in_battle) {
                const battle_kind = battleFlags & 8 ? "Trainer" : "Wild";
                const battle_party = this.ParseParty(struct.gPlayerParty);
                const enemy_party = this.ParseParty(struct.gEnemyParty);
                const enemy_trainers = new Array<TPP.EnemyTrainer>();
                if (battle_kind == "Trainer") {
                    enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(struct.gTrainerBattleOpponent_A.readUInt16LE(0))));
                    if (battleFlags & 0x8000) { //BATTLE_TYPE_TWO_OPPONENTS
                        enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(struct.gTrainerBattleOpponent_A.readUInt16LE(15))));
                    }
                    if (!enemy_trainers.filter(t => !!t).length) // Assume a battle facility
                        enemy_trainers.push({
                            id: struct.gTrainerBattleOpponent_A.readUInt16LE(0),
                            name: enemy_party.map(p => p && p.original_trainer && p.original_trainer.name).filter((n, i, arr) => arr.indexOf(n) == i).join(' & ') || "",
                            class_id: -1,
                            gender: enemy_party[0] && enemy_party[0].original_trainer && enemy_party[0].original_trainer.gender || undefined,
                            pic_id: -1,
                            class_name: ""
                        })
                }

                const numBattlers = struct.gBattlersCount[0];
                const isBattlerOnEnemyTeam = new Array<boolean>();
                const battlerPartyIndexes = new Array<number>();
                for (let i = 0; i < numBattlers; i++) {
                    battlerPartyIndexes.push(struct.gBattlerPartyIndexes.readUInt16LE(i * 2));
                    isBattlerOnEnemyTeam.push(!!(struct.gBattlerPositions.readUInt8(i) & 1));
                    // B_POSITION_PLAYER_LEFT        0
                    // B_POSITION_OPPONENT_LEFT      1
                    // B_POSITION_PLAYER_RIGHT       2
                    // B_POSITION_OPPONENT_RIGHT     3
                }
                const currentBattlers = this.ParseBattleMons(struct.gBattleMons, numBattlers);
                this.StoreCurrentBattleMons(currentBattlers, battlerPartyIndexes, isBattlerOnEnemyTeam);
                return { in_battle, battle_kind, battle_party, enemy_party, enemy_trainers };
            }
            return { in_battle };
        });

        protected TrainerChunkReaders = [
            //Save Block 2
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock2Address}/${RomReader.SizeOfCStruct(this.SaveBlock2).toString(16)}`, this.WrapBytes(data => {
                const blockData = RomReader.ReadCStruct(data, this.SaveBlock2);

                const rawOptions = blockData.options.readIntLE(0, 3);
                const optionsOffset = RomReader.GetCStructOffset(this.SaveBlock2, "options");

                const options = this.ParseOptions(rawOptions);
                if (this.ShouldForceOptions(options)) {
                    this.CallEmulator(`WriteU24LE/${this.rom.config.SaveBlock2Address}+${optionsOffset.toString(16)}/${this.SetOptions(rawOptions, this.config.forceOptions).toString(16)}`);
                }
                return {
                    name: this.rom.ConvertText(blockData.playerName),
                    gender: this.ParseGender(blockData.playerGender[0]),
                    id: blockData.playerTrainerId.readInt16LE(0),
                    secret: blockData.playerTrainerId.readInt16LE(2),
                    options,
                    security_key: blockData.encryptionKey.readInt32LE(0),
                } as TPP.TrainerData;
            }), RomReader.GetCStructOffset(this.SaveBlock2, "playTimeHours") * 2, (RomReader.GetCStructOffset(this.SaveBlock2, "playTimeVBlanks") + 1) * 2), // Ignore playTime
            //Location
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.CurrentAreaAddr}/1/${this.rom.config.SaveBlock1Address}+4/${RomReader.SizeOfCStruct(this.SaveBlock1NeededSubstructs[4]).toString(16)}`, this.WrapBytes(data => {
                const areaId = data[0];
                const locData = RomReader.ReadCStruct(data, this.WarpData, 1);
                return {
                    map_bank: locData.mapGroup.readInt8(0),
                    map_id: locData.mapNum.readInt8(0),
                    area_id: areaId,
                    area_name: this.rom.GetAreaName(areaId)
                } as TPP.TrainerData;
            })),
            ///Flags/Vars/Stats
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock2Address}+${RomReader.GetCStructOffset(this.SaveBlock2, "encryptionKey").toString(16)}/4/${this.rom.config.SaveBlock1Address}+${this.rom.config.FlagsOffset}/${RomReader.SizeOfCStruct(this.SaveBlock1NeededSubstructs[this.rom.gfRomHeader.flagsOffset]).toString(16)}`, this.WrapBytes(data => {
                const gameData = RomReader.ReadCStruct(data, this.SaveBlock1NeededSubstructs[this.rom.gfRomHeader.flagsOffset], 4);
                const key = data.readUInt32LE(0);
                const flags = gameData.flags;
                const vars = this.rom.ReadArray(gameData.vars, 0, 2, VARS_COUNT).map(v => v.readUInt16LE(0));
                const stats = this.rom.ReadArray(gameData.gameStats, 0, 4, NUM_GAME_STATS).map(s => (s.readUInt32LE(0) ^ key) >>> 0);
                let badges = (flags.readUInt16LE(0x10C) >>> 7) & 0xFF;
                const frontier = flags.readUInt32LE(0x118) >>> 4 & 0x3FFF;
                const gameClear = this.GetFlag(flags, 0x864); //FLAG_SYS_GAME_CLEAR
                if (gen3BadgeFlagMaps[(this.config.mainRegion || "Hoenn").toLowerCase()])
                    badges = this.ReadBadgeFlags(data, gen3BadgeFlagMaps[(this.config.mainRegion || "Hoenn").toLowerCase()]);
                return {
                    badges,
                    frontier_symbols: this.GetFlag(flags, 0x8D2) ? frontier : undefined, //FLAG_SYS_FRONTIER_PASS
                    trick_house: vars.slice(0xAB, 0xB3).map(v => ["Incomplete", "Found Scroll", "Complete"][v]),
                    game_stats: this.ParseGameStats(stats)
                } as TPP.TrainerData;
            }), 760, 1668), //ignore a large swath in the middle of vars/stats because it changes every step
            //Inventory
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock2Address}+${RomReader.GetCStructOffset(this.SaveBlock2, "encryptionKey").toString(16)}/4/${this.rom.config.SaveBlock1Address}+490/${RomReader.SizeOfCStruct(this.SaveBlock1NeededSubstructs[0x490]).toString(16)}`, this.WrapBytes(data => {
                const key = data.readUInt32LE(0);
                const halfKey = key & 0xFFFF;
                const invData = RomReader.ReadCStruct(data, this.SaveBlock1NeededSubstructs[0x490], 4);

                return {
                    money: invData.money.readUInt32LE(0) ^ key,
                    coins: invData.coins.readUInt16LE(0) ^ halfKey,

                } as TPP.TrainerData;
            })),
            //Items
            this.StructEmulatorCaller<TPP.TrainerData>("System Bus", {
                ItemPC: this.rom.config.ItemPCCount ? parseInt(this.rom.config.ItemPCCount, 16) * RomReader.SizeOfCStruct(this.ItemSlot) : 0,
                ItemPocket: this.rom.config.ItemPocketCount ? parseInt(this.rom.config.ItemPocketCount, 16) * RomReader.SizeOfCStruct(this.ItemSlot) : 0,
                ItemKey: this.rom.config.ItemKeyCount ? parseInt(this.rom.config.ItemKeyCount, 16) * RomReader.SizeOfCStruct(this.ItemSlot) : 0,
                ItemBall: this.rom.config.ItemBallCount ? parseInt(this.rom.config.ItemBallCount, 16) * RomReader.SizeOfCStruct(this.ItemSlot) : 0,
                ItemTM: this.rom.config.ItemTMCount ? parseInt(this.rom.config.ItemTMCount, 16) * RomReader.SizeOfCStruct(this.ItemSlot) : 0,
                ItemBerries: this.rom.config.ItemBerriesCount ? parseInt(this.rom.config.ItemBerriesCount, 16) * RomReader.SizeOfCStruct(this.ItemSlot) : 0,
                encryptionKey: 4
            }, symbol => this.rom.config[symbol + "Offset"] ? this.rom.config.SaveBlock1Address + "+" + this.rom.config[symbol + "Offset"] : this.rom.config.SaveBlock2Address + "+" + RomReader.GetCStructOffset(this.SaveBlock2, symbol as any).toString(16), struct => {
                const key = struct.encryptionKey.readUInt32LE(0);
                const halfKey = key & 0xFFFF;
                const items: TPP.TrainerData["items"] = {
                    pc: this.ParseItemCollection(struct.ItemPC),
                    items: this.ParseItemCollection(struct.ItemPocket, halfKey),
                    balls: this.ParseItemCollection(struct.ItemBall, halfKey),
                    key: this.ParseItemCollection(struct.ItemKey, halfKey),
                    tms: this.ParseItemCollection(struct.ItemTM, halfKey),
                    berries: this.ParseItemCollection(struct.ItemBerries, halfKey),
                };
                return {
                    ball_count: items.balls.reduce((sum, b) => sum + b.count, 0),
                    items
                };
            }),
            //Pokedex
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+${this.rom.gfRomHeader.seen1Offset.toString(16)}/${RomReader.SizeOfCStruct(this.SaveBlock1NeededSubstructs[this.rom.gfRomHeader.seen1Offset]).toString(16)}`, this.WrapBytes(data => {
                const dexData = RomReader.ReadCStruct(data, this.SaveBlock1NeededSubstructs[this.rom.gfRomHeader.seen1Offset]);
                const caughtList = this.GetSetFlags(dexData.dexCaught);
                const seenList = this.GetSetFlags(dexData.dexSeen);
                return {
                    caught: caughtList.length,
                    caught_list: caughtList,
                    seen: seenList.length,
                    seen_list: seenList,
                } as TPP.TrainerData;
            })),
            //Evolution
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadU16BE/${this.rom.config.MusicAddr}`, this.WrapBytes(data => ({
                evolution_is_happening: this.rom.config.EvolutionMusicIds.split(' ').map(i => parseInt(i, 16)).indexOf(data.readUInt16LE(0)) >= 0
            } as TPP.TrainerData))),
            //Daycare
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+3030/${RomReader.SizeOfCStruct(this.SaveBlock1NeededSubstructs[0x3030]).toString(16)}`, this.WrapBytes(data => {
                const daycareBlockData = RomReader.ReadCStruct(data, this.SaveBlock1NeededSubstructs[0x3030]);
                const daycareData = RomReader.ReadCStruct(daycareBlockData.daycare, this.DayCare);
                return { daycare: this.rom.ReadArray(daycareData.mons, 0, RomReader.SizeOfCStruct(this.DaycareMon), DAYCARE_MON_COUNT).map(m => RomReader.ReadCStruct(m, this.DaycareMon)).map(dc => this.ParsePokemon(dc.mon)).filter(m => !!m) } as TPP.TrainerData;
            })),
        ].filter(t => !!t) as Array<() => Promise<TPP.TrainerData>>;

        protected TotalItemSlots() {
            return parseInt(this.rom.config.ItemPCCount, 16) + parseInt(this.rom.config.ItemCandyCount || "0", 16) + parseInt(this.rom.config.ItemPocketCount, 16) + parseInt(this.rom.config.ItemKeyCount, 16) + parseInt(this.rom.config.ItemBallCount, 16) + parseInt(this.rom.config.ItemTMCount, 16) + parseInt(this.rom.config.ItemBerriesCount, 16);
        }

        protected ParseItemCollection(itemData: Buffer, key = 0) {
            const length = itemData.length / 4
            return this.rom.ReadArray(itemData, 0, 4, length).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data.readUInt16LE(0)), (data.readUInt16LE(2) >>> 0) ^ (key >>> 0))).filter(i => i.id);
        }

        protected ParseParty(partyData: Buffer, partyLength = 6) {
            return this.rom.ReadArray(partyData, 0, RomReader.SizeOfCStruct(this.PokemonStruct), partyLength).map(monData => this.ParsePokemon(monData));
        }

        protected ParseBattleMons(battleData: Buffer, numBattlers: number) {
            return this.rom.ReadArray(battleData, 0, RomReader.SizeOfCStruct(this.BattlePokemonStruct), numBattlers).map<TPP.PartyPokemon>(m => this.ParseBattlePokemon(m));
        }

        private pkmCache: { [pv: number]: TPP.PartyPokemon & TPP.BoxedPokemon } = {};
        protected ParsePokemon(pkmdata: Buffer, boxSlot?: number): TPP.PartyPokemon & TPP.BoxedPokemon {
            type PokeData = Gen3RHH['PokemonStruct']
                & Gen3RHH['BoxPokemonStruct']
                & Gen3RHH['PokemonSubstruct0']
                & Gen3RHH['PokemonSubstruct1']
                & Gen3RHH['PokemonSubstruct2']
                & Gen3RHH['PokemonSubstruct3']
                & UnionToIntersection<Gen3RHH['PokemonPackedBytes'][keyof Gen3RHH['PokemonPackedBytes']]>;
            const pokeData: { [k in keyof PokeData]: Buffer } = RomReader.ReadCStruct(pkmdata, this.PokemonStruct) as any;
            Object.assign(pokeData, RomReader.ReadCStruct(pokeData.box, this.BoxPokemonStruct));

            let cached: Gen3PartyPokemon = null;
            if (!boxSlot)
                cached = this.pkmCache[pokeData.personality.readUInt32LE(0)];

            const pkmn = {} as Gen3PartyPokemon;
            pkmn.personality_value = pokeData.personality.readUInt32LE(0);
            pkmn.encryption_key = pokeData.personality.readUInt32LE(0) ^ pokeData.otId.readUInt32LE(0);
            pkmn.checksum = pokeData.checksum.readUInt16LE(0);
            if (!pokeData.otId.readUInt32LE(0) && !pkmn.personality_value) {
                //console.error("Pokemon OT Id and PV are both 0!");
                return cached;
            }
            const decryptedSubstructs = this.Decrypt(pokeData.substructs, pkmn.encryption_key, pkmn.checksum);
            if (!decryptedSubstructs)
                return cached;

            const descrambledSubstructs = this.Descramble(decryptedSubstructs, pkmn.personality_value);
            Object.assign(pokeData, ...Object.keys(descrambledSubstructs).sort().map((k, i) => RomReader.ReadCStruct(descrambledSubstructs[k], [this.PokemonSubstruct0, this.PokemonSubstruct1, this.PokemonSubstruct2, this.PokemonSubstruct3][i])));
            Object.assign(pokeData, ...Object.keys(pokeData).filter(k => !!this.PokemonPackedBytes[k]).map(k => RomReader.UnpackBytes(pokeData[k], this.PokemonPackedBytes[k])));
            //PrintStruct(pokeData);

            pkmn.original_trainer = {
                name: this.rom.ConvertText(pokeData.otName),
                id: pokeData.otId.readUInt16LE(0),
                secret: pokeData.otId.readUInt16LE(2),
                gender: this.ParseGender(pokeData.otGender[0])
            }
            const nickLonger = Buffer.alloc(12);
            for (let i = 0; i < pokeData.nickname.byteLength; i++)
                nickLonger[i] = pokeData.nickname[i];
            nickLonger[10] = pokeData.nickname11[0];
            nickLonger[11] = pokeData.nickname12[0];
            pkmn.name = this.rom.ConvertText(nickLonger);
            pkmn.language = Gen3Language[pokeData.language[0]] || pokeData.language.toString('hex');
            pkmn.marking = this.ParseMarkings(pokeData.markings[0]);
            pkmn.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(pokeData.species.readInt16LE(0)));
            pkmn.held_item = pokeData.heldItem.readInt16LE(0) ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(pokeData.heldItem.readInt16LE(0))) : null;
            pkmn.friendship = pokeData.friendship[0];
            const pp = [pokeData.pp1, pokeData.pp2, pokeData.pp3, pokeData.pp4];
            pkmn.moves = [pokeData.move1, pokeData.move2, pokeData.move3, pokeData.move4].map((m, i) => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(m.readInt16LE(0)), pp[i][0], (pokeData.ppBonuses[0] >>> (i * 2)) % 4)).filter(m => m && m.id);
            pkmn.evs = {
                attack: pokeData.attackEV[0],
                defense: pokeData.defenseEV[0],
                hp: pokeData.hpEV[0],
                special_attack: pokeData.spAttackEV[0],
                special_defense: pokeData.spDefenseEV[0],
                speed: pokeData.speedEV[0]
            };
            pkmn.condition = {
                beauty: pokeData.beauty[0],
                coolness: pokeData.cool[0],
                cuteness: pokeData.cute[0],
                feel: pokeData.sheen[0],
                smartness: pokeData.smart[0],
                toughness: pokeData.tough[0]
            };
            pkmn.pokerus = this.ParsePokerus(pokeData.pokerus[0]);
            pkmn.met = {
                area_id: pokeData.metLocation[0],
                area_name: this.rom.GetAreaName(pokeData.metLocation[0]),
                level: pokeData.metLevel[0],
                game: this.ParseOriginalGame(pokeData.metGame[0]),
                caught_in: this.rom.GetItem(pokeData.pokeball[0]).name || pokeData.pokeball.toString('hex'),
            };
            pkmn.ivs = {
                hp: pokeData.hpIV[0],
                attack: pokeData.attackIV[0],
                defense: pokeData.defenseIV[0],
                speed: pokeData.speedIV[0],
                special_attack: pokeData.spAttackIV[0],
                special_defense: pokeData.spDefenseIV[0]
            }
            pkmn.is_egg = !!(pokeData.isEgg[0] || pokeData.isBadEgg[0]);
            pkmn.ability = pkmn.species && pkmn.species.abilities && pkmn.species.abilities[pokeData.abilityNum[0]] || pokeData.abilityNum.toString('hex');
            if (pkmn.ability == this.rom.GetAbility(0))
                pkmn.ability = pkmn.species && pkmn.species.abilities && pkmn.species.abilities[0];
            pkmn.ribbons = [
                this.ParseRibbon(pokeData.coolRibbon[0], "Cool"),
                this.ParseRibbon(pokeData.beautyRibbon[0], "Beauty"),
                this.ParseRibbon(pokeData.cuteRibbon[0], "Cute"),
                this.ParseRibbon(pokeData.smartRibbon[0], "Smart"),
                this.ParseRibbon(pokeData.toughRibbon[0], "Tough"),
                this.ParseRibbon(pokeData.championRibbon[0], "Champion"),
                this.ParseRibbon(pokeData.artistRibbon[0], "Artist")
            ];

            pkmn.status = pokeData.status && this.ParseStatus(pokeData.status.readUInt32LE(0));
            pkmn.level = pokeData.level && pokeData.level[0];
            pkmn.health = pokeData.hp && [pokeData.hp.readUInt16LE(0), pokeData.maxHp.readUInt16LE(0)]
            pkmn.stats = pokeData.spDefense && {
                hp: pokeData.maxHp.readUInt16LE(0),
                attack: pokeData.attack.readUInt16LE(0),
                defense: pokeData.defense.readUInt16LE(0),
                speed: pokeData.speed.readUInt16LE(0),
                special_attack: pokeData.spAttack.readUInt16LE(0),
                special_defense: pokeData.spDefense.readUInt16LE(0)
            }

            if (pkmn.species) {
                pkmn.form = this.rom.GetSpecies(pkmn.species.id).formNumber;
                pkmn.gender = this.CalculateGender(pkmn.species.gender_ratio, pkmn.personality_value);
                if (pkmn.species.expFunction) {
                    pkmn.level = pkmn.level || this.CalculateLevelFromExp(pokeData.experience.readUIntLE(0, 3), pkmn.species.expFunction);
                    pkmn.experience = this.CalculateExpVals(pokeData.experience.readUIntLE(0, 3), pkmn.level, pkmn.species.expFunction);
                }
                const moveLearn = this.rom.GetNextMoveLearn(pkmn.species.id, pkmn.form, pkmn.level, pkmn.moves.map(m => m.id));
                if (moveLearn)
                    pkmn.next_move = { level: moveLearn.level, name: null, id: null, type: moveLearn.type };

                if (pkmn.name.toLowerCase() == pkmn.species.name.toLowerCase())
                    pkmn.name = pkmn.species.name;
            }

            if (boxSlot)
                pkmn.box_slot = boxSlot;
            else
                this.pkmCache[pkmn.personality_value] = pkmn;

            return pkmn;
        }

        // #define STAT_HP      0
        // #define STAT_ATK     1
        // #define STAT_DEF     2
        // #define STAT_SPEED   3
        // #define STAT_SPATK   4
        // #define STAT_SPDEF   5
        // #define NUM_STATS    6

        // #define STAT_ACC     6 // Only in battles.
        // #define STAT_EVASION 7 // Only in battles.

        protected ParseBattlePokemon(pkmdata: Buffer): TPP.PartyPokemon {
            type BattleData = Gen3RHH['BattlePokemonStruct']
                & UnionToIntersection<Gen3RHH['BattlePackedBytes'][keyof Gen3RHH['BattlePackedBytes']]>;
            const pokeData: { [k in keyof BattleData]: Buffer } = RomReader.ReadCStruct(pkmdata, this.BattlePokemonStruct) as any;
            Object.assign(pokeData, ...Object.keys(pokeData).filter(k => !!this.BattlePackedBytes[k]).map(k => RomReader.UnpackBytes(pokeData[k], this.BattlePackedBytes[k])));

            const speciesId = pokeData.species.readInt16LE(0);
            if (!speciesId)
                return null;
            const species = this.rom.GetSpecies(speciesId);
            if (!species || !species.id)
                return null;

            let name = this.rom.ConvertText(pokeData.nickname);
            if (species && species.name && (name || "").toLowerCase() == species.name.toLowerCase())
                name = species.name;
            const item = pokeData.item.readUInt16LE(0);
            return {
                species: Object.assign(Pokemon.Convert.SpeciesToRunStatus(species), { type1: this.rom.GetType(pokeData.types[0]), type2: this.rom.GetType(pokeData.types[1]), type3: this.rom.GetType(pokeData.types[2]) }),
                stats: {
                    hp: pokeData.maxHP.readUInt16LE(0),
                    attack: pokeData.attack.readUInt16LE(0),
                    defense: pokeData.defense.readUInt16LE(0),
                    speed: pokeData.speed.readUInt16LE(0),
                    special_attack: pokeData.spAttack.readUInt16LE(0),
                    special_defense: pokeData.spDefense.readUInt16LE(0)
                },
                moves: this.rom.ReadArray(pokeData.moves, 0, 2, MAX_MON_MOVES).map((m, i) => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(m.readUInt16LE(0)), pokeData.pp[i], (pokeData.ppBonuses[0] >>> (i * 2)) % 4)).filter(m => m && m.id),
                ivs: {
                    hp: pokeData.hpIV[0],
                    attack: pokeData.attackIV[0],
                    defense: pokeData.defenseIV[0],
                    speed: pokeData.speedIV[0],
                    special_attack: pokeData.spAttackIV[0],
                    special_defense: pokeData.spDefenseIV[0],
                },
                buffs: {
                    hp: pokeData.statStages.readInt8(0),
                    attack: pokeData.statStages.readInt8(1),
                    defense: pokeData.statStages.readInt8(2),
                    speed: pokeData.statStages.readInt8(3),
                    special_attack: pokeData.statStages.readInt8(4),
                    special_defense: pokeData.statStages.readInt8(5),
                    accuracy: pokeData.statStages.readInt8(6),
                    evasion: pokeData.statStages.readInt8(7),
                },
                ability: this.rom.GetAbility(pokeData.ability.readUInt16LE(0)),
                health: [pokeData.hp.readUInt16LE(0), pokeData.maxHP.readUInt16LE(0)],
                level: pokeData.level[0],
                friendship: pokeData.friendship[0],
                held_item: item ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(item)) : null,
                name,
                original_trainer: {
                    name: this.rom.ConvertText(pokeData.otName),
                    id: pokeData.otId.readUInt16LE(0),
                    secret: pokeData.otId.readUInt16LE(2)
                },
                experience: this.CalculateExpVals(pokeData.experience.readUInt32LE(0), pokeData.level[0], species.expFunction),
                personality_value: pokeData.personality.readUInt32LE(0),
                gender: this.CalculateGender(species.genderRatio, pokeData.personality.readUInt32LE(0)),
                status: this.ParseStatus(pokeData.status1.readUInt32LE(0)),
                volatile_status: [
                    !!pokeData.confusionTurns[0] && "Confused",
                    !!pokeData.flinched[0] && "Flinched",
                    !!pokeData.uproarTurns[0] && "Causing an Uproar",
                    !!pokeData.torment[0] && "Torment",
                    !!pokeData.bideTurns[0] && "Bide",
                    !!pokeData.lockConfusionTurns[0] && "Lock Confusion",
                    !!pokeData.multipleTurns[0] && "Multiple Turns",
                    !!pokeData.wrapped[0] && "Wrapped",
                    !!pokeData.powder[0] && "Powdered",
                    !!pokeData.infatuation[0] && "Infatuated",
                    !!pokeData.defenseCurl[0] && "Defense Curled",
                    !!pokeData.transformed[0] && "Transformed",
                    !!pokeData.recharge[0] && "Must Recharge",
                    !!pokeData.rage[0] && "Raging",
                    !!pokeData.substitute[0] && "Has Substitute",
                    !!pokeData.destinyBond[0] && "Destiny Bonded",
                    !!pokeData.escapePrevention[0] && "Can't Escape",
                    !!pokeData.nightmare[0] && "Nightmare",
                    !!pokeData.cursed[0] && "Cursed",
                    !!pokeData.foresight[0] && "Foresight",
                    !!pokeData.dragonCheer[0] && "Dragon Cheer",
                    !!pokeData.focusEnergy[0] && "Focused Energy"
                ].filter(v => !!v)
            } as Gen3BattlePokemon;
        }

        protected CalculateGender(genderRatio: number, personalityValue: number) {
            if (genderRatio == 255) {
                return null;
            }
            else if (genderRatio == 254) {
                return "Female";
            }
            else if (genderRatio == 0) {
                return "Male";
            }
            else {
                return (personalityValue % 256) > genderRatio ? "Male" : "Female";
            }
        }

        protected GameStatsMapping = ["Saves Made", "Play Time at First HoF", "Trends Started", "Berries Planted", "Bikes Traded",
            "Steps Taken", "Interviews", "Battles Fought (Total)", "Battles Fought (Wild)", "Battles Fought (Trainer)", "Hall of Fame Entries",
            "Pokémon Caught", "Pokémon Caught While Fishing", "Eggs Hatched", "Pokémon Evolved", "Pokémon Center Uses", "Naps Taken at Home",
            "Safari Zone Trips", "Trees Cut", "Rocks Smashed", "Secret Bases Moved", "Pokémon Traded",
            null, "Link Battles Won", "Link Battles Lost", "Link Battles Tied", "Splash Uses", "Struggle Uses",
            "Hit the Jackpot", "Consecutive Roulette Wins", "Battle Tower Attempts", null, "Best Battle Tower Streak",
            "Pokéblocks Made", "Pokéblocks Made With Friends", "Link Contests Won", "Contests Entered", "Contests Won",
            "Shopping Trips", "Itemfinder Uses", "Rainstorms Soaked By", "Pokédex Views", "Ribbons Earned", "Ledges Jumped",
            "TVs Watched", "Clocks Checked", "Lottery Wins", "Daycare Uses", "Cable Car Rides", "Hot Spring Baths", "Union Room Battles", "Berries Crushed",
            "DexNav Scans", "Host Battles", "Hugs Received"
        ];

        protected ReadBadgeFlags(flags: Buffer, flagMap: number[]) {
            const badgeBuffer = Buffer.alloc(Math.ceil(flagMap.length / 8));
            flagMap.forEach((f, i) => this.GetFlag(flags, f) && this.SetFlag(badgeBuffer, i));
            let badgeInt = 0;
            for (let i = 0; i * 8 < flagMap.length; i++)
                badgeInt += badgeBuffer[i] << (i * 8);
            return badgeInt;
        }

        protected OptionsSpec = {
            sound: {
                0: "Mono",
                0x10000: "Stereo"
            },
            battle_style: {
                0: "Shift",
                0x20000: "Set"
            },
            // battle_style: { //Blazing Emerald
            //     0: "Normal",
            //     0x20000: "Hard"
            // },
            // experience: {
            //     0: "Party",
            //     0x10000: "Single"
            // },
            battle_scene: {
                0: "On",
                0x40000: "Off"
            },
            map_zoom: {
                0: "Full",
                0x80000: "Zoom"
            },
            text_speed: {
                0: "Slow",
                0x100: "Med",
                0x200: "Fast"
            },
            frame: {
                bitmask: 0xF800,
                offset: 1
            },
            button_mode: {
                0: "Normal",
                1: "LR",
                2: "L=A"
            },

        }
    }
}