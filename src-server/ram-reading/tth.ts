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

    enum Gen3VolatileStatus {
        Confusion = 0x00000007,
        Flinched = 0x00000008,
        Uproar = 0x00000070,
        Bide = 0x00000300,
        "Lock Confuse" = 0x00000C00,
        "Multiple Turns" = 0x00001000,
        Wrapped = 0x0000E000,
        Infatuated = 0x000F0000,
        "Focus Energy" = 0x00100000,
        Transformed = 0x00200000,
        "Must Recharge" = 0x00400000,
        Rage = 0x00800000,
        Substitute = 0x01000000,
        "Destiny Bond" = 0x02000000,
        Trapped = 0x04000000,
        Nightmare = 0x08000000,
        Cursed = 0x10000000,
        Foresight = 0x20000000,
        "Defense Curl" = 0x40000000,
        Torment = 0x80000000
    }

    let POKEMON_NAME_LENGTH = 10;
    let PLAYER_NAME_LENGTH = 7;
    const MAX_MON_MOVES = 4;
    const NUM_BATTLE_STATS = 8;
    const BoxMonBytes = 0x4C;
    const PartyMonBytes = 0x60;

    export class Gen3TTH extends RamReaderBase<RomReader.Gen3TTH> {
        constructor(rom: RomReader.Gen3TTH, port: number, hostname = "localhost", config: Config) {
            super(rom, port, hostname, config);
            POKEMON_NAME_LENGTH = rom.gfRomHeader.pokemonNameLength1;
            PLAYER_NAME_LENGTH = rom.gfRomHeader.playerNameLength;
        }
        protected Markings = ['●', '■', '▲', '♥'];

        protected readerFunc = this.ReadSync;

        public ReadParty = this.CachedEmulatorCaller(`ReadByteRange/${this.rom.config.gPlayerParty}/${this.rom.config.PartyBytes}`, this.WrapBytes(data => this.ParseParty(data)));

        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/${this.rom.config.PCBlockAddress}/${this.rom.config.PCBytes}`, this.WrapBytes(data => ({
            current_box_number: data.readUInt32LE(0),
            boxes: this.rom.ReadArray(data.slice(4, 30 * 14 * BoxMonBytes), 0, 30 * BoxMonBytes, 14).map((box, i) => ({
                box_number: i + 1,
                box_name: this.rom.ConvertText(data.slice(30 * 14 * BoxMonBytes + (i * 9), 30 * 14 * BoxMonBytes + ((i + 1) * 9))),
                box_contents: this.rom.ReadArray(box, 0, BoxMonBytes, 30).map((pkmdata, b) => this.ParsePokemon(pkmdata, b + 1)).filter(p => !!p)
            } as TPP.BoxData))
        } as TPP.CombinedPCData)));

        public ReadBattle = this.StructEmulatorCaller<TPP.BattleStatus>("System Bus", {
            InBattleAddr: 1,
            gBattleTypeFlags: 4,
            gTrainerBattleOpponent_A: 4,
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
                const enemy_trainers = new Array<TPP.EnemyTrainer>();
                if (battle_kind == "Trainer") {
                    const map = this.rom.GetMap(this.currentState.map_id, this.currentState.map_bank) as RomReader.TTHMap; //TTH
                    enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(map.trainers.find(t => t.id == struct.gTrainerBattleOpponent_A.readUInt16LE(0)))); //TTH
                    if (battleFlags & 0x8000) { //BATTLE_TYPE_TWO_OPPONENTS
                        enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(map.trainers.find(t => t.id == struct.gTrainerBattleOpponent_A.readUInt16LE(2)))); //TTH
                    }
                }
                const battle_party = this.ParseParty(struct.gPlayerParty);
                const enemy_party = this.ParseParty(struct.gEnemyParty);
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
                this.StoreCurrentBattleMons(this.ParseBattleMons(struct.gBattleMons, numBattlers), battlerPartyIndexes, isBattlerOnEnemyTeam);
                return { in_battle, battle_kind, battle_party, enemy_party, enemy_trainers };
            }
            return { in_battle };
        });

        protected TrainerChunkReaders = [
            //Save Block 2
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock2Address}/F2C`, this.WrapBytes(data => {

                const version = {
                    sentinel: data[0x0],
                    revision: data[0x1],
                    gameId: data.readInt16LE(0x2)
                };
                const playerName = data.slice(0x4, 0x4 + PLAYER_NAME_LENGTH + 1);
                const playerGender = data[0xC];
                const specialSaveWarpFlags = data[0xD];
                const playerTrainerIdFull = data.readInt32LE(0xE);
                const playerTrainerId = data.readInt16LE(0xE);
                const playerTrainerSecret = data.readInt16LE(0x10);
                const playTimeHours = data.readUInt16LE(0x12);
                const playTimeMinutes = data[0x14];
                const playTimeSeconds = data[0x15];
                const playTimeVBlanks = data[0x16];
                const rawOptions = data.readUInt32LE(0x17) & 0xFFFFFF;

                const options = this.ParseOptions(rawOptions);
                if (this.ShouldForceOptions(options)) {
                    this.CallEmulator(`WriteU24LE/${this.rom.config.SaveBlock2Address}+17/${this.SetOptions(rawOptions, this.config.forceOptions).toString(16)}`);
                }
                return {
                    gameVersion: version,
                    name: this.rom.ConvertText(playerName),
                    gender: this.ParseGender(playerGender),
                    id: playerTrainerId,
                    secret: playerTrainerSecret,
                    options,
                    security_key: this.rom.config.EncryptionKeyOffset ? data.readUInt32LE(parseInt(this.rom.config.EncryptionKeyOffset, 16)) : 0,
                } as TPP.TrainerData;
            }), 0x12 * 2, 0x17 * 2), // Ignore playTime
            //Location
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}/6/${this.rom.config.CurrentAreaAddr}/1`, this.WrapBytes(data => ({
                x: data.readUInt16LE(0),
                y: data.readUInt16LE(2),
                map_bank: data.readUInt8(4),
                map_id: data.readUInt8(5),
                //area_id: data.readUInt8(6),
                map_name: this.rom.GetMap(data.readUInt8(5), data.readUInt8(4)).name,
                //area_name: this.rom.GetAreaName(data.readUInt8(6) - parseInt(this.rom.config.MapLabelOffset || "0", 16))
                area_id: this.rom.GetMap(data.readUInt8(5), data.readUInt8(4)).areaId,
                area_name: this.rom.GetMap(data.readUInt8(5), data.readUInt8(4)).areaName
            } as TPP.TrainerData))),
            //Inventory
            this.StructEmulatorCaller<TPP.TrainerData>(`System Bus`, {
                MoneyOffset: 8,
                ItemPCOffset: parseInt(this.rom.config.ItemPCCount, 16) * 4,
                ItemCandyOffset: parseInt(this.rom.config.ItemCandyCount || "0", 16) * 4, // TTH
                ItemPocketOffset: parseInt(this.rom.config.ItemPocketCount, 16) * 4,
                ItemKeyOffset: parseInt(this.rom.config.ItemKeyCount, 16) * 4,
                ItemTMOffset: parseInt(this.rom.config.ItemTMCount, 16) * 4,
                ItemBerriesOffset: parseInt(this.rom.config.ItemBerriesCount, 16) * 4
            }, sym => (this.rom.config[sym] ? `${this.rom.config.SaveBlock1Address}+${this.rom.config[sym]}` : 0), struct => {
                const items: TPP.TrainerData["items"] = {
                    pc: this.ParseItemCollection(struct.ItemPCOffset),
                    items: this.ParseItemCollection(struct.ItemPocketOffset),
                    key: this.ParseItemCollection(struct.ItemKeyOffset),
                    tms: this.ParseItemCollection(struct.ItemTMOffset),
                    berries: this.ParseItemCollection(struct.ItemBerriesOffset),
                    candy: this.ParseItemCollection(struct.ItemCandyOffset)
                };
                return {
                    money: struct.MoneyOffset.readUInt32LE(0),
                    coins: struct.MoneyOffset.readUInt16LE(4),
                    items
                } as TPP.TrainerData
            }),
            //Dex
            this.StructEmulatorCaller<TPP.TrainerData>(`System Bus`, {
                seen1Offset: Math.ceil(this.rom.gfRomHeader.pokedexCount / 8),
                seen2Offset: Math.ceil(this.rom.gfRomHeader.pokedexCount / 8) //TTH doesn't have this. Reused this entry as the offset of the caught flags
            }, sym => `${this.rom.config.SaveBlock1Address}+${this.rom.gfRomHeader[sym].toString(16)}`, struct => {
                const seen_list = this.GetSetFlags(struct.seen1Offset);
                const caught_list = this.GetSetFlags(struct.seen2Offset);
                return {
                    seen_list,
                    caught_list,
                    seen: seen_list.length,
                    caught: caught_list.length
                };
            }),
            ///Flags/Vars/Stats
            this.rom.config.VarsOffset && this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+${this.rom.config.FlagsOffset}/${(parseInt(this.rom.config.GameStatsOffset || "0", 16) - parseInt(this.rom.config.FlagsOffset, 16) + parseInt(this.rom.config.GameStatsBytes || "0", 16)).toString(16)}/${this.rom.config.SaveBlock2Address}+${this.rom.config.EncryptionKeyOffset}/4`, this.WrapBytes(data => {
                const GameStatsOffset = parseInt(this.rom.config.GameStatsOffset || "0", 16);
                const FlagsOffset = parseInt(this.rom.config.FlagsOffset, 16);
                const GameStatsBytes = parseInt(this.rom.config.GameStatsBytes || "0", 16);
                const FlagsBytes = parseInt(this.rom.config.FlagsBytes, 16);
                const VarsOffset = parseInt(this.rom.config.VarsOffset || "0", 16);
                const VarsBytes = parseInt(this.rom.config.VarsBytes || "0", 16);
                const key = data.readUInt32LE((GameStatsOffset - FlagsOffset) + GameStatsBytes);
                const flags = data.slice(0, FlagsBytes);
                const vars = this.rom.ReadArray(data.slice(VarsOffset - FlagsOffset), 0, 2, 256).map(v => v.readUInt16LE(0));
                const stats = this.rom.ReadArray(data.slice(GameStatsOffset - FlagsOffset), 0, 4, 64).map(s => (s.readUInt32LE(0) ^ key) >>> 0);
                let badges = (flags.readUInt16LE(0x10C) >>> 7) & 0xFF;
                const frontier = flags.readUInt32LE(0x118) >>> 4 & 0x3FFF;
                const gameClear = this.GetFlag(flags, 0x864); //FLAG_SYS_GAME_CLEAR
                if (gen3BadgeFlagMaps[(this.config.mainRegion || "Hoenn").toLowerCase()])
                    badges = this.ReadBadgeFlags(data, gen3BadgeFlagMaps[(this.config.mainRegion || "Hoenn").toLowerCase()]);
                return {
                    trick_house: [flags[(0x60 / 8)] & 2 ? "Complete" : flags[(0x60 / 8)] & 1 ? "Found Scroll" : "Incomplete"], //TTH
                    game_stats: GameStatsBytes > 0 ? this.ParseGameStats(stats) : null,
                    puzzleTotal: this.rom.totalPuzzles,
                    level_cap: this.rom.GetCurrentLevelCap(badges, gameClear)
                } as TPP.TrainerData
            }), 760, 1668), //ignore a large swath in the middle of vars/stats because it changes every step
            //Clock
            // this.rom.config.IwramClockAddr && this.CachedEmulatorCaller<TPP.TrainerData>(`${parseInt(this.rom.config.IwramClockAddr, 16) < 0x8000 ? 'IWRAM/' : ""}ReadByteRange/${this.rom.config.IwramClockAddr}/6`, this.WrapBytes(data => ({
            //     // struct Time
            //     // {
            //     //     /*0x00*/ s16 days;
            //     //     /*0x02*/ s8 hours;
            //     //     /*0x03*/ s8 minutes;
            //     //     /*0x04*/ s8 seconds;
            //     //     /*0x05*/ s8 dayOfWeek;
            //     // };
            //     time: {
            //         h: data.readUInt8(2),
            //         m: data.readUInt8(3),
            //         s: data.readUInt8(4),
            //         d: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][data.readUInt8(5) % 7]
            //     }
            // } as TPP.TrainerData))),
            //Evolution
            this.rom.config.IwramMusicAddr && this.rom.config.EvolutionMusicIds && this.CachedEmulatorCaller<TPP.TrainerData>(`${parseInt(this.rom.config.IwramMusicAddr, 16) < 0x8000 ? 'IWRAM/' : ""}ReadU16BE/${this.rom.config.IwramMusicAddr}`, this.WrapBytes(data => ({
                evolution_is_happening: this.rom.config.EvolutionMusicIds.split(' ').map(i => parseInt(i, 16)).indexOf(data.readUInt16LE(0)) >= 0 && this.currentState.map_name.indexOf("Safari") < 0
            } as TPP.TrainerData))),
        ].filter(t => !!t) as Array<() => Promise<TPP.TrainerData>>;

        protected TotalItemSlots() {
            return parseInt(this.rom.config.ItemPCCount, 16) + parseInt(this.rom.config.ItemCandyCount || "0", 16) + parseInt(this.rom.config.ItemPocketCount, 16) + parseInt(this.rom.config.ItemKeyCount, 16) + parseInt(this.rom.config.ItemBallCount, 16) + parseInt(this.rom.config.ItemTMCount, 16) + parseInt(this.rom.config.ItemBerriesCount, 16);
        }

        protected ParseItemCollection(itemData: Buffer, length = itemData.length / 4, key = 0) {
            return this.rom.ReadArray(itemData, 0, 4, length).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data.readUInt16LE(0)), (data.readUInt16LE(2) >>> 0) ^ (key >>> 0))).filter(i => i.id);
        }

        protected ParseParty(partyData: Buffer) {
            const party = new Array<TPP.PartyPokemon>();
            const PartyBytes = parseInt(this.rom.config.PartyBytes, 16);
            for (let i = 0; i < PartyBytes; i += PartyMonBytes)
                party.push(this.ParsePokemon(partyData.slice(i, i + PartyMonBytes)));
            return party;//.filter(p => !!p);
        }

        protected ParseBattleMons(battleData: Buffer, numBattlers: number) {
            return this.rom.ReadArray(battleData, 0, 0x5C, numBattlers).map<TPP.PartyPokemon>(m => this.ParseBattlePokemon(m));
        }

        private pkmCache: { [key: number]: TPP.PartyPokemon & TPP.BoxedPokemon } = {};
        protected ParsePokemon(pkmdata: Buffer, boxSlot?: number): TPP.PartyPokemon & TPP.BoxedPokemon {

            const personality = pkmdata.readUInt32LE(0x0);
            const otIdFull = pkmdata.readUInt32LE(0x4);
            const otId = pkmdata.readUInt16LE(0x4);
            const otSecret = pkmdata.readUInt16LE(0x6);
            const nickname = pkmdata.slice(0x8, 0x8 + POKEMON_NAME_LENGTH);
            const lang = pkmdata.readUInt8(0x12) & 7;
            const pkrsTimer = (pkmdata.readUInt8(0x12) >>> 3) & 0xF;
            const pkrsTimerFinished = !!(pkmdata.readUInt8(0x12) >>> 7);
            const badEgg = !!(pkmdata.readUInt8(0x13) & 1);
            const hasSpecies = !!(pkmdata.readUInt8(0x13) & (1 << 1));
            const isEgg = !!(pkmdata.readUInt8(0x13) & (1 << 2));
            const eventLegal = !!(pkmdata.readUInt8(0x13) & (1 << 3));
            const markings = pkmdata.readUInt8(0x13) >>> 4;
            const otName = pkmdata.slice(0x14, 0x14 + PLAYER_NAME_LENGTH);
            const metLocation = pkmdata.readUInt8(0x1B);
            const species = pkmdata.readUInt16LE(0x1C);
            const heldItem = pkmdata.readUInt16LE(0x1E);
            const experience = pkmdata.readUInt32LE(0x20);
            const metLevel = pkmdata.readUInt16LE(0x24) & 0x7F;
            const metGame = (pkmdata.readUInt16LE(0x24) >>> 7) & 0xF;
            const otGender = (pkmdata.readUInt16LE(0x24) >>> (7 + 4)) & 3;
            const moves = this.rom.ReadArray(pkmdata, 0x26, 2, MAX_MON_MOVES).map(m => m.readUInt16LE(0));
            const pp = this.rom.ReadArray(pkmdata, 0x2E, 1, MAX_MON_MOVES).map(p => p.readUInt8(0));
            const ppBonuses = pkmdata.readUInt8(0x32);
            const friendship = pkmdata.readUInt8(0x33);
            const pokeball = pkmdata.readInt32LE(0x34) & 0x3F;
            const abilityNum = (pkmdata.readInt32LE(0x34) >>> 6) & 3;
            const coolRibbon = (pkmdata.readInt32LE(0x34) >>> (6 + 2)) & 7;
            const beautyRibbon = (pkmdata.readInt32LE(0x34) >>> (6 + 2 + 3)) & 7;
            const cuteRibbon = (pkmdata.readInt32LE(0x34) >>> (6 + 2 + 3 + 3)) & 7;
            const smartRibbon = (pkmdata.readInt32LE(0x34) >>> (6 + 2 + 3 + 3 + 3)) & 7;
            const toughRibbon = (pkmdata.readInt32LE(0x34) >>> (6 + 2 + 3 + 3 + 3 + 3)) & 7;
            const championRibbon = (pkmdata.readInt32LE(0x34) >>> (6 + 2 + 3 + 3 + 3 + 3)) & 1;
            const artistRibbon = (pkmdata.readInt32LE(0x34) >>> (6 + 2 + 3 + 3 + 3 + 3 + 1)) & 1;
            const ivs = pkmdata.readUInt32LE(0x38);
            const evs = {
                hp: pkmdata.readUInt8(0x3C),
                attack: pkmdata.readUInt8(0x3D),
                defense: pkmdata.readUInt8(0x3E),
                speed: pkmdata.readUInt8(0x3F),
                special_attack: pkmdata.readUInt8(0x40),
                special_defense: pkmdata.readUInt8(0x41),
            }
            const condition = {
                coolness: pkmdata.readUInt8(0x42),
                beauty: pkmdata.readUInt8(0x43),
                cuteness: pkmdata.readUInt8(0x44),
                smartness: pkmdata.readUInt8(0x45),
                toughness: pkmdata.readUInt8(0x46),
                feel: pkmdata.readUInt8(0x47)
            }
            const checksum = pkmdata.readUInt16LE(0x48);
            const myChecksum = this.CalcChecksum(pkmdata.slice(0, 0x48));

            if (checksum != myChecksum) {
                console.log(`Checksum ${checksum} does not match calculated sum ${myChecksum}`);
                //return null;
            }

            const pkmn = {} as Gen3PartyPokemon;
            pkmn.personality_value = personality;
            pkmn.encryption_key = personality ^ otIdFull;
            if (!otIdFull && !personality) {
                //console.error("Pokemon OT Id and PV are both 0!");
                return null;
            }
            pkmn.original_trainer = {
                name: this.rom.ConvertText(otName),
                id: otId,
                secret: otSecret,
                gender: this.ParseGender(otGender)
            }
            pkmn.name = this.rom.ConvertText(nickname);
            pkmn.language = Gen3Language[lang] || lang.toString();
            pkmn.marking = this.ParseMarkings(markings);
            pkmn.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(species));
            pkmn.held_item = heldItem ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(heldItem)) : null;
            pkmn.friendship = friendship;
            pkmn.moves = moves.map((m, i) => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(m), pp[i], (ppBonuses >>> (i * 2)) % 4)).filter(m => m && m.id);
            pkmn.evs = evs;
            pkmn.condition = condition;
            pkmn.pokerus = {
                infected: pkrsTimer > 0 || pkrsTimerFinished,
                cured: pkrsTimerFinished,
                days_left: pkrsTimer,
                strain: 1
            };
            pkmn.met = {
                area_id: metLocation,
                area_name: this.rom.GetAreaName(metLocation),
                level: metLevel,
                game: this.ParseOriginalGame(metGame),
                caught_in: this.rom.GetItem(pokeball).name || pokeball.toString(16),
            };
            pkmn.ivs = {
                hp: ivs % 32,
                attack: (ivs >>> 5) % 32,
                defense: (ivs >>> 10) % 32,
                speed: (ivs >>> 15) % 32,
                special_attack: (ivs >>> 20) % 32,
                special_defense: (ivs >>> 25) % 32
            }
            pkmn.is_egg = isEgg || badEgg;
            pkmn.ability = pkmn.species && pkmn.species.abilities && pkmn.species.abilities[abilityNum] || (abilityNum).toString();
            pkmn.ribbons = [
                this.ParseRibbon(coolRibbon, "Cool"),
                this.ParseRibbon(beautyRibbon, "Beauty"),
                this.ParseRibbon(cuteRibbon, "Cute"),
                this.ParseRibbon(smartRibbon, "Smart"),
                this.ParseRibbon(toughRibbon, "Tough"),
                this.ParseRibbon(championRibbon, "Champion"),
                this.ParseRibbon(artistRibbon, "Artist")
            ];

            if (pkmdata.length > 0x4C) {
                const status = pkmdata.readUInt32LE(0x4C);
                const level = pkmdata.readUInt8(0x50);
                const mail = pkmdata.readUInt8(0x51);
                const hp = pkmdata.readUInt16LE(0x52);
                const maxHP = pkmdata.readUInt16LE(0x54);
                const attack = pkmdata.readUInt16LE(0x56);
                const defense = pkmdata.readUInt16LE(0x58);
                const speed = pkmdata.readUInt16LE(0x5A);
                const spAttack = pkmdata.readUInt16LE(0x5C);
                const spDefense = pkmdata.readUInt16LE(0x5E);
                pkmn.status = this.ParseStatus(status);
                pkmn.sleep_turns = status % 8
                pkmn.level = level;
                pkmn.health = [hp, maxHP]
                pkmn.stats = {
                    hp: maxHP,
                    attack,
                    defense,
                    speed,
                    special_attack: spAttack,
                    special_defense: spDefense
                }
            }

            if (pkmn.species) {
                pkmn.form = this.rom.GetSpecies(pkmn.species.id).formNumber;
                pkmn.gender = this.CalculateGender(pkmn.species.gender_ratio, pkmn.personality_value);
                if (pkmn.species.expFunction) {
                    pkmn.level = pkmn.level || this.CalculateLevelFromExp(experience, pkmn.species.expFunction);
                    pkmn.experience = this.CalculateExpVals(experience, pkmn.level, pkmn.species.expFunction);
                }
                const moveLearn = this.rom.GetNextMoveLearn(pkmn.species.id, pkmn.form, pkmn.level, pkmn.moves.map(m => m.id));
                if (moveLearn)
                    pkmn.next_move = { level: moveLearn.level, name: null, id: null, type: moveLearn.type };

                if (pkmn.name.toLowerCase() == pkmn.species.name.toLowerCase())
                    pkmn.name = pkmn.species.name;
            }

            if (boxSlot)
                pkmn.box_slot = boxSlot;

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
            const speciesId = pkmdata.readUInt16LE(0x0);
            const attack = pkmdata.readUInt16LE(0x2);
            const defense = pkmdata.readUInt16LE(0x4);
            const speed = pkmdata.readUInt16LE(0x6);
            const spAttack = pkmdata.readUInt16LE(0x8);
            const spDefense = pkmdata.readUInt16LE(0xA);
            const moves = this.rom.ReadArray(pkmdata, 0xC, 2, MAX_MON_MOVES).map(m => m.readUInt16LE(0));
            const ivs = pkmdata.readUInt32LE(0x14);
            const statStages = this.rom.ReadArray(pkmdata, 0x18, 1, NUM_BATTLE_STATS).map(s => s.readInt8(0));
            const ability = pkmdata.readUInt16LE(0x20);
            const type1 = pkmdata[0x22];
            const type2 = pkmdata[0x23];
            const type3 = pkmdata[0x24];
            const pp = this.rom.ReadArray(pkmdata, 0x25, 1, MAX_MON_MOVES).map(p => p.readUInt8(0));
            const hp = pkmdata.readUInt16LE(0x2A);
            const level = pkmdata[0x2C];
            const friendship = pkmdata[0x2D];
            const maxHP = pkmdata.readUInt16LE(0x2E);
            const item = pkmdata.readUInt16LE(0x30);
            const nickname = pkmdata.slice(0x32, 0x3D);
            const ppBonuses = pkmdata[0x3D];
            const otName = pkmdata.slice(0x3E, 0x46);
            const experience = pkmdata.readUInt32LE(0x48);
            const personality = pkmdata.readUInt32LE(0x4C);
            const status1 = pkmdata.readUInt32LE(0x50);
            const status2 = pkmdata.readUInt32LE(0x54);
            const otIdFull = pkmdata.readUInt32LE(0x58);
            const otId = pkmdata.readUInt16LE(0x58);
            const otSecret = pkmdata.readUInt16LE(0x5A);

            if (!speciesId)
                return null;
            const species = this.rom.GetSpecies(speciesId);
            let name = this.rom.ConvertText(nickname);
            if (name.toLowerCase() == species.name.toLowerCase())
                name = species.name;
            return {
                species: Object.assign(Pokemon.Convert.SpeciesToRunStatus(species), { type1: this.rom.GetType(type1), type2: this.rom.GetType(type2) }),
                stats: {
                    hp: maxHP,
                    attack,
                    defense,
                    speed,
                    special_attack: spAttack,
                    special_defense: spDefense
                },
                moves: moves.map((m, i) => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(m), pp[i], (ppBonuses >>> (i * 2)) % 4)).filter(m => m && m.id),
                ivs: {
                    hp: ivs % 32,
                    attack: (ivs >>> 5) % 32,
                    defense: (ivs >>> 10) % 32,
                    speed: (ivs >>> 15) % 32,
                    special_attack: (ivs >>> 20) % 32,
                    special_defense: (ivs >>> 25) % 32
                },
                is_egg: (ivs >>> 30) % 2 > 0,
                buffs: {
                    hp: statStages[0],
                    attack: statStages[1],
                    defense: statStages[2],
                    speed: statStages[3],
                    special_attack: statStages[4],
                    special_defense: statStages[5],
                    accuracy: statStages[6],
                    evasion: statStages[7],
                },
                ability: this.rom.GetAbility(ability),
                health: [hp, maxHP],
                level,
                friendship,
                held_item: item ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(item)) : null,
                name,
                original_trainer: {
                    name: this.rom.ConvertText(otName),
                    id: otId,
                    secret: otSecret
                },
                experience: this.CalculateExpVals(experience, level, species.expFunction),
                personality_value: personality,
                gender: this.CalculateGender(species.genderRatio, personality),
                status: this.ParseStatus(status1),
                volatile_status: this.ParseVolatileStatus(status2)
            } as Gen3BattlePokemon;
        }

        protected ParseVolatileStatus(status: number) {
            return Object.keys(Gen3VolatileStatus).map(k => parseInt(k)).filter(k => k && (status & k)).map(k => Gen3VolatileStatus[k]);
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
            "Blackouts", "Link Battles Won", "Link Battles Lost", "Link Battles Tied", "Splash Uses", "Struggle Uses",
            "Hit the Jackpot", "Consecutive Roulette Wins", "Battle Tower Attempts", null, "Best Battle Tower Streak",
            "Pokéblocks Made", "Pokéblocks Made With Friends", "Link Contests Won", "Contests Entered", "Contests Won",
            "Shopping Trips", "Itemfinder Uses", "Rainstorms Soaked By", "Pokédex Views", "Ribbons Earned", "Ledges Jumped",
            "TVs Watched", "Clocks Checked", "Lottery Wins", "Daycare Uses", "Cable Car Rides", "Hot Spring Baths", "Union Room Battles", "Berries Crushed",
            "Puzzles Completed", "Select Presses", "Rules Discovered", "Candy Collected", "Puzzles Cleaned Out", "Candy Trades"]; //TTH

        protected Decrypt(data: Buffer, key: number, checksum?: number) {
            if (typeof (checksum) == "number" && checksum == this.CalcChecksum(data)) {
                return data; //already decrypted
            }
            for (let i = 0; i < data.length; i += 4) {
                data.writeInt32LE(data.readInt32LE(i) ^ key, i);
            }
            if (typeof (checksum) == "number" && this.CalcChecksum(data) != checksum) {
                console.error(`Checksum ${checksum} does not match calculated sum ${this.CalcChecksum(data)}`);
                return null;
            }
            return data;
        }

        public CalcChecksum(data: Buffer) {
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
                sum = (sum + data.readUInt32LE(i)) & 0xFFFF;
            }
            return sum;
        }

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