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

    export class Gen3 extends RamReaderBase<RomReader.Gen3> {
        protected Markings = ['●', '■', '▲', '♥'];

        public ReadParty = this.CachedEmulatorCaller(`ReadByteRange/${this.rom.config.gPlayerParty}/${this.rom.config.PartyBytes}`, this.WrapBytes(data => this.ParseParty(data)));

        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/${this.rom.config.PCBlockAddress}/${this.rom.config.PCBytes}`, this.WrapBytes(data => ({
            current_box_number: data.readUInt32LE(0),
            boxes: this.rom.ReadArray(data.slice(4, 0x8344), 0, 30 * 80, 14).map((box, i) => ({
                box_number: i + 1,
                box_name: /*["The Fallen", "The Forgiven", "The Innocent", "The Lost", "The Remembered", "The Loved", "The Mourned", "The Troubled", "The Faithful", "The Forlorn"][i] ||*/ this.rom.ConvertText(data.slice(0x8344 + (i * 9), 0x8344 + ((i + 1) * 9))), //TriHard Names
                box_contents: this.rom.ReadArray(box, 0, 80, 30).map((pkmdata, b) => this.ParsePokemon(pkmdata, b + 1)).filter(p => !!p)
            } as TPP.BoxData))//.filter(b => b.box_contents.length > 0) // TriHard Filter
        } as TPP.CombinedPCData)));

        public ReadBattle = this.CachedEmulatorCaller(`ReadByteRange/${this.rom.config.InBattleAddr}/1/${this.rom.config.gBattleTypeFlags}/4/${this.rom.config.gTrainerBattleOpponent_A}/4/${this.rom.config.gEnemyParty}/${this.rom.config.PartyBytes}/${this.rom.config.gBattleMons}/${this.rom.config.gBattleMonsBytes}/${this.rom.config.gBattlersCount}/${((parseInt(this.rom.config.gBattlerPositions, 16) - parseInt(this.rom.config.gBattlersCount, 16)) + 4).toString(16)}`, this.WrapBytes<TPP.BattleStatus>(data => {
            const in_battle = (data.readUInt8(0) & 2) > 0;
            const battleFlags = data.readUInt32LE(1);
            if (in_battle) {
                const battle_kind = battleFlags & 8 ? "Trainer" : "Wild";
                const enemy_trainers = new Array<TPP.EnemyTrainer>();
                if (battle_kind == "Trainer") {
                    //const map = this.rom.GetMap(this.currentState.map_id, this.currentState.map_bank) as RomReader.TTHMap; //TTH
                    enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(data.readUInt16LE(5))));
                    //enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(map.trainers.find(t => t.id == data.readUInt16LE(5)))); //TTH
                    if (battleFlags & 0x8000) { //BATTLE_TYPE_TWO_OPPONENTS
                        enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(data.readUInt16LE(7))));
                        //enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(map.trainers.find(t => t.id == data.readUInt16LE(7)))); //TTH
                    }
                }
                const partyBytes = parseInt(this.rom.config.PartyBytes, 16);
                const gBattleMonsBytes = parseInt(this.rom.config.gBattleMonsBytes, 16);
                const enemy_party = this.ParseParty(data.slice(9, 9 + partyBytes));
                const numBattlers = data.readUInt8(9 + partyBytes + gBattleMonsBytes);
                const isBattlerOnEnemyTeam = new Array<boolean>();
                const battlerPartyIndexes = new Array<number>();
                for (let i = 0; i < numBattlers; i++) {
                    battlerPartyIndexes.push(data.readUInt16LE(11 + partyBytes + gBattleMonsBytes + (i * 2)));
                    isBattlerOnEnemyTeam.push(!!(data.readUInt8(19 + partyBytes + gBattleMonsBytes + i) & 1));
                    // B_POSITION_PLAYER_LEFT        0
                    // B_POSITION_OPPONENT_LEFT      1
                    // B_POSITION_PLAYER_RIGHT       2
                    // B_POSITION_OPPONENT_RIGHT     3
                }
                this.StoreCurrentBattleMons(this.ParseBattleMons(data.slice(9 + partyBytes), numBattlers), battlerPartyIndexes, isBattlerOnEnemyTeam);
                return { in_battle, battle_kind, enemy_party, enemy_trainers };
            }
            return { in_battle };
        }));

        protected TrainerChunkReaders = [
            //Save Block 2
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock2Address}/${(parseInt(this.rom.config.EncryptionKeyOffset || "FB", 16) + 4).toString(16)}`, this.WrapBytes(data => {
                const caughtList = this.GetSetFlags(data.slice(0x28), 412);
                const seenList = this.GetSetFlags(data.slice(0x5C), 412);
                const rawOptions = data.readUInt32LE(0x13) & 0xFFFFFF;
                const options = this.ParseOptions(rawOptions);
                if (this.ShouldForceOptions(options)) {
                    this.CallEmulator(`WriteU24LE/${this.rom.config.SaveBlock2Address}+13/${this.SetOptions(rawOptions, this.config.forceOptions).toString(16)}`);
                }
                return {
                    name: this.rom.ConvertText(data.slice(0, 8)),
                    gender: data.readUInt8(8) ? "Female" : "Male",
                    id: data.readUInt16LE(10),
                    secret: data.readUInt16LE(12),
                    options,
                    caught: caughtList.length,
                    caught_list: caughtList,
                    seen: seenList.length,
                    seen_list: seenList,
                    security_key: this.rom.config.EncryptionKeyOffset ? data.readUInt32LE(parseInt(this.rom.config.EncryptionKeyOffset, 16)) : 0,
                } as TPP.TrainerData;
            }), 0xE * 2, 0x13 * 2),
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
                EncryptionKeyOffset: 4,
                MoneyOffset: 8,
                ItemPCOffset: parseInt(this.rom.config.ItemPCCount, 16) * 4,
                ItemPocketOffset: parseInt(this.rom.config.ItemPocketCount, 16) * 4,
                ItemCandyOffset: parseInt(this.rom.config.ItemCandyCount || "0", 16) * 4,
                ItemKeyOffset: parseInt(this.rom.config.ItemKeyCount, 16) * 4,
                ItemBallOffset: parseInt(this.rom.config.ItemBallCount, 16) * 4,
                ItemTMOffset: parseInt(this.rom.config.ItemTMCount, 16) * 4,
                ItemBerriesOffset: parseInt(this.rom.config.ItemBerriesCount, 16) * 4
            }, sym => (this.rom.config[sym] ? `${sym == "EncryptionKeyOffset" ? this.rom.config.SaveBlock2Address : this.rom.config.SaveBlock1Address}+${this.rom.config[sym]}` : 0), struct => {
                const key = struct.EncryptionKeyOffset ? struct.EncryptionKeyOffset.readInt32LE(0) : 0;
                const halfKey = key & 0xFFFF;
                const items: TPP.TrainerData["items"] = {
                    pc: this.ParseItemCollection(struct.ItemPCOffset, struct.ItemPCOffset.length / 4), //no key
                    items: this.ParseItemCollection(struct.ItemPocketOffset, struct.ItemPocketOffset.length / 4, halfKey),
                    key: this.ParseItemCollection(struct.ItemKeyOffset, struct.ItemKeyOffset.length / 4, halfKey),
                    balls: this.ParseItemCollection(struct.ItemBallOffset, struct.ItemBallOffset.length / 4, halfKey),
                    tms: this.ParseItemCollection(struct.ItemTMOffset, struct.ItemTMOffset.length / 4, halfKey),
                    berries: this.ParseItemCollection(struct.ItemBerriesOffset, struct.ItemBerriesOffset.length / 4, halfKey)
                };
                if (struct.ItemCandyOffset)
                    items.candy = this.ParseItemCollection(struct.ItemCandyOffset, struct.ItemCandyOffset.length / 4, halfKey); //TTH
                return {
                    money: struct.MoneyOffset.readUInt32LE(0) ^ key,
                    coins: struct.MoneyOffset.readUInt16LE(4) ^ halfKey,
                    ball_count: items.balls.reduce((sum, b) => sum + b.count, 0),
                    items
                } as TPP.TrainerData
            }),
            // this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+${this.rom.config.MoneyOffset}/8/${this.rom.config.SaveBlock1Address}+${this.rom.config.ItemPCOffset}/${(this.TotalItemSlots() * 4).toString(16)}${this.rom.config.EncryptionKeyOffset ? `/${this.rom.config.SaveBlock2Address}+${this.rom.config.EncryptionKeyOffset}/4` : ""}`, this.WrapBytes(data => {
            //     const key = this.rom.config.EncryptionKeyOffset ? data.readUInt32LE((this.TotalItemSlots() * 4) + 8) : 0;
            //     const halfKey = key % 0x10000;
            //     const PCCount = parseInt(this.rom.config.ItemPCCount, 16);
            //     const CandyCount = parseInt(this.rom.config.ItemCandyCount || "0", 16);
            //     const ItemCount = parseInt(this.rom.config.ItemPocketCount, 16);
            //     const KeyCount = parseInt(this.rom.config.ItemKeyCount, 16);
            //     const BallCount = parseInt(this.rom.config.ItemBallCount, 16);
            //     const TMCount = parseInt(this.rom.config.ItemTMCount, 16);
            //     const BerriesCount = parseInt(this.rom.config.ItemBerriesCount, 16);
            //     const PCOffset = parseInt(this.rom.config.ItemPCOffset, 16) - 8;
            //     const CandyOffset = parseInt(this.rom.config.ItemCandyOffset || "0", 16) - PCOffset;
            //     const ItemsOffset = parseInt(this.rom.config.ItemPocketOffset, 16) - PCOffset;
            //     const KeyOffset = parseInt(this.rom.config.ItemKeyOffset, 16) - PCOffset;
            //     const BallOffset = parseInt(this.rom.config.ItemBallOffset, 16) - PCOffset;
            //     const TMOffset = parseInt(this.rom.config.ItemTMOffset, 16) - PCOffset;
            //     const BerriesOffset = parseInt(this.rom.config.ItemBerriesOffset, 16) - PCOffset;
            //     const ballPocket = this.ParseItemCollection(data.slice(BallOffset), BallCount, halfKey);
            //     return {
            //         money: data.readUInt32LE(0) ^ key,
            //         coins: data.readUInt16LE(4) ^ halfKey,
            //         items: {
            //             pc: this.ParseItemCollection(data.slice(8), PCCount), //no key //no PC (TriHard)
            //             // candy: this.ParseItemCollection(data.slice(CandyOffset), CandyCount, halfKey), //TTH
            //             items: this.ParseItemCollection(data.slice(ItemsOffset), ItemCount, halfKey),
            //             key: this.ParseItemCollection(data.slice(KeyOffset), KeyCount, halfKey),
            //             balls: ballPocket,
            //             tms: this.ParseItemCollection(data.slice(TMOffset), TMCount, halfKey),
            //             berries: this.ParseItemCollection(data.slice(BerriesOffset), BerriesCount, halfKey)
            //         },
            //         ball_count: ballPocket.reduce((sum, b) => sum + b.count, 0)
            //     } as TPP.TrainerData
            // })),
            //Badges Ruby/Sapphire/FireRed/LeafGreen
            !this.rom.config.VarsOffset && this.rom.types[0] == "Normal" && this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+${this.rom.config.FlagsOffset}+${this.rom.config.BadgesOffset || Math.floor(parseInt(this.rom.config.BadgeFlag, 16) / 8).toString(16)}/2`, this.WrapBytes(data => {
                return {
                    badges: (data.readUInt16LE(0) >>> (this.rom.config.BadgesOffset ? 0 : (parseInt(this.rom.config.BadgeFlag, 16) % 8))) % 0x100,
                } as TPP.Goals
            })),
            //Stats (FireRed)
            !this.rom.config.VarsOffset && this.rom.config.GameStatsOffset && this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock2Address}+${this.rom.config.EncryptionKeyOffset}/4/${this.rom.config.SaveBlock1Address}+${this.rom.config.GameStatsOffset}/${this.rom.config.GameStatsOffset}`, this.WrapBytes(data => {
                const key = data.readUInt32LE(0);
                return {
                    game_stats: this.ParseGameStats(this.rom.ReadArray(data, 4, 4, parseInt(this.rom.config.GameStatsBytes, 16) / 4).map(s => (s.readUInt32LE(0) ^ key) >>> 0))
                };
            })),
            //Badges Touhoumon
            this.rom.types[0] == "Illusion" && this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+${this.rom.config.FlagsOffset}/290`, this.WrapBytes(data => {
                const kantoBadges = (data.readUInt16LE(parseInt(this.rom.config.BadgesOffset, 16)) >>> 0) % 0x100;
                const johtoBadgesBuffer = Buffer.from([0]);
                const trainer = 0x500;
                if (this.GetFlag(data, trainer + 0x1)) this.SetFlag(johtoBadgesBuffer, 0); //Falkner
                if (this.GetFlag(data, trainer + 0x3)) this.SetFlag(johtoBadgesBuffer, 1); //Bugsy
                if (this.GetFlag(data, trainer + 0x5)) this.SetFlag(johtoBadgesBuffer, 2); //Whitney
                if (this.GetFlag(data, trainer + 0x7)) this.SetFlag(johtoBadgesBuffer, 3); //Morty
                if (this.GetFlag(data, trainer + 0x9)) this.SetFlag(johtoBadgesBuffer, 4); //Jasmine
                if (this.GetFlag(data, trainer + 0xB)) this.SetFlag(johtoBadgesBuffer, 5); //Chuck
                if (this.GetFlag(data, trainer + 0xD)) this.SetFlag(johtoBadgesBuffer, 6); //Pryce
                if (this.GetFlag(data, 0x1449)) this.SetFlag(johtoBadgesBuffer, 7); //Rising Badge
                return {
                    badges: kantoBadges | (johtoBadgesBuffer[0] << 8)
                } as TPP.Goals
            })),
            ///Flags/Vars/Stats Emerald
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
                const badges = (flags.readUInt16LE(0x10C) >>> 7) & 0xFF;
                const frontier = flags.readUInt32LE(0x118) >>> 4 & 0x3FFF;
                const gameClear = this.GetFlag(flags, 0x864); //FLAG_SYS_GAME_CLEAR
                return {
                    badges,
                    frontier_symbols: this.GetFlag(flags, 0x8D2) ? frontier : undefined, //FLAG_SYS_FRONTIER_PASS
                    // trick_house: [flags[(0x60 / 8)] & 2 ? "Complete" : flags[(0x60 / 8)] & 1 ? "Found Scroll" : "Incomplete"], //TTH
                    trick_house: VarsOffset > 0 ? vars.slice(0xAB, 0xB3).map(v => ["Incomplete", "Found Scroll", "Complete"][v]) : null,
                    game_stats: GameStatsBytes > 0 ? this.ParseGameStats(stats) : null,
                    puzzleTotal: this.rom.totalPuzzles,
                    level_cap: this.rom.GetCurrentLevelCap(badges, gameClear)
                } as TPP.TrainerData
            }), 760, 1668), //ignore a large swath in the middle of vars/stats because it changes every step
            //Clock
            this.rom.config.IwramClockAddr && this.CachedEmulatorCaller<TPP.TrainerData>(`${parseInt(this.rom.config.IwramClockAddr, 16) < 0x8000 ? 'IWRAM/' : ""}ReadByteRange/${this.rom.config.IwramClockAddr}/6`, this.WrapBytes(data => ({
                // struct Time
                // {
                //     /*0x00*/ s16 days;
                //     /*0x02*/ s8 hours;
                //     /*0x03*/ s8 minutes;
                //     /*0x04*/ s8 seconds;
                //     /*0x05*/ s8 dayOfWeek;
                // };
                time: {
                    h: data.readUInt8(2),
                    m: data.readUInt8(3),
                    s: data.readUInt8(4),
                    d: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][data.readUInt8(5) % 7]
                }
            } as TPP.TrainerData))),
            //Rival Name
            this.rom.config.RivalNameOffset && this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+${this.rom.config.RivalNameOffset}/8`, this.WrapBytes(data => ({
                rival_name: this.rom.ConvertText(data)
            } as TPP.TrainerData))),
            //Evolution
            this.rom.config.IwramMusicAddr && this.rom.config.EvolutionMusicIds && this.CachedEmulatorCaller<TPP.TrainerData>(`${parseInt(this.rom.config.IwramMusicAddr, 16) < 0x8000 ? 'IWRAM/' : ""}ReadU16BE/${this.rom.config.IwramMusicAddr}`, this.WrapBytes(data => ({
                evolution_is_happening: this.rom.config.EvolutionMusicIds.split(' ').map(i => parseInt(i, 16)).indexOf(data.readUInt16LE(0)) >= 0 && this.currentState.map_name.indexOf("Safari") < 0
            } as TPP.TrainerData))),
            //Daycare
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/${this.rom.config.SaveBlock1Address}+${this.rom.config.DaycareOffset}/88/${this.rom.config.SaveBlock1Address}+${this.rom.config.DaycareOffset}+8C/88`, this.WrapBytes(data => ({
                daycare: [
                    this.ParsePokemon(data.slice(0, 80)),
                    this.ParsePokemon(data.slice(0x88, 0x88 + 80))
                ].filter(dm => !!dm)
            } as TPP.TrainerData))),
        ].filter(t => !!t) as Array<() => Promise<TPP.TrainerData>>;

        // protected TotalItemSlots() {
        //     return parseInt(this.rom.config.ItemPCCount, 16) + parseInt(this.rom.config.ItemCandyCount || "0", 16) + parseInt(this.rom.config.ItemPocketCount, 16) + parseInt(this.rom.config.ItemKeyCount, 16) + parseInt(this.rom.config.ItemBallCount, 16) + parseInt(this.rom.config.ItemTMCount, 16) + parseInt(this.rom.config.ItemBerriesCount, 16);
        // }

        protected ParseItemCollection(itemData: Buffer, length = itemData.length / 4, key = 0) {
            return this.rom.ReadArray(itemData, 0, 4, length, true).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data.readUInt16LE(0)), (data.readUInt16LE(2) >>> 0) ^ (key >>> 0))).filter(i => i.id);
        }

        protected ParseParty(partyData: Buffer) {
            const party = new Array<TPP.PartyPokemon>();
            const PartyBytes = parseInt(this.rom.config.PartyBytes, 16);
            for (let i = 0; i < PartyBytes; i += 100)
                party.push(this.ParsePokemon(partyData.slice(i, i + 100)));
            return party;//.filter(p => !!p);
        }

        protected ParseBattleMons(battleData: Buffer, numBattlers: number) {
            const battleMons = new Array<TPP.PartyPokemon>();
            const battleBytes = 0x58 * numBattlers;
            for (let i = 0; i < battleBytes; i += 0x58) {
                battleMons.push(this.ParseBattlePokemon(battleData.slice(i, i + 0x58)));
            }
            return battleMons;
        }

        private pkmCache: { [key: number]: TPP.PartyPokemon & TPP.BoxedPokemon } = {};
        protected ParsePokemon(pkmdata: Buffer, boxSlot?: number): TPP.PartyPokemon & TPP.BoxedPokemon {
            const pkmn = {} as Gen3PartyPokemon;
            pkmn.personality_value = pkmdata.readUInt32LE(0);
            pkmn.encryption_key = pkmn.personality_value ^ pkmdata.readUInt32LE(4);
            if (!pkmdata.readUInt32LE(4) && !pkmn.personality_value) {
                //console.error("Pokemon OT Id and PV are both 0!");
                return null;
            }
            pkmn.original_trainer = {
                name: this.rom.ConvertText(pkmdata.slice(20, 20 + 7)),
                id: pkmdata.readUInt16LE(4),
                secret: pkmdata.readUInt16LE(6)
            }
            pkmn.name = this.rom.ConvertText(pkmdata.slice(8, 8 + 10));
            pkmn.language = Gen3Language[pkmdata.readUInt8(18)] || pkmdata.readUInt16LE(18).toString();
            pkmn.marking = this.ParseMarkings(pkmdata.readUInt8(27));
            pkmn.checksum = pkmdata.readUInt16LE(28);
            pkmn.shiny = this.CalculateShiny(pkmn);
            const sections = this.Descramble(this.Decrypt(pkmdata.slice(32, 80), pkmn.encryption_key, pkmn.checksum), pkmn.personality_value);
            if (!sections) {
                return this.pkmCache[pkmn.personality_value] || null;
            }

            //Growth Section
            pkmn.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(sections.A.readUInt16LE(0)));
            const itemId = sections.A.readUInt16LE(2);
            pkmn.held_item = itemId ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(itemId)) : null;
            const exp = sections.A.readUInt32LE(4);
            const ppUps = sections.A.readUInt8(8);
            pkmn.friendship = sections.A.readUInt8(9);

            //Moves
            pkmn.moves = [
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(0)), sections.B.readUInt8(8), ppUps % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(2)), sections.B.readUInt8(9), (ppUps >>> 2) % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(4)), sections.B.readUInt8(10), (ppUps >>> 4) % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(6)), sections.B.readUInt8(11), (ppUps >>> 6) % 4),
            ].filter(m => m && m.id);

            //EVs & Condition
            pkmn.evs = {
                hp: sections.C.readUInt8(0),
                attack: sections.C.readUInt8(1),
                defense: sections.C.readUInt8(2),
                speed: sections.C.readUInt8(3),
                special_attack: sections.C.readUInt8(4),
                special_defense: sections.C.readUInt8(5),
            }
            pkmn.condition = {
                coolness: sections.C.readUInt8(6),
                beauty: sections.C.readUInt8(7),
                cuteness: sections.C.readUInt8(8),
                smartness: sections.C.readUInt8(9),
                toughness: sections.C.readUInt8(10),
                feel: sections.C.readUInt8(11)
            }

            //Miscellaneous
            pkmn.pokerus = this.ParsePokerus(sections.D.readUInt8(0));
            const met = sections.D.readUInt16LE(2);
            //const metMap = this.rom.GetMap(sections.D.readUInt8(1));
            const metArea = sections.D.readUInt8(1) & 0xFF; // Blazing Emerald
            const bgCaughtIn = (met >>> 10) & 0x1F;
            pkmn.met = {
                // map_id: metMap.id,
                // area_id: metMap.areaId,
                // area_name: metMap.areaName,
                area_id: metArea,
                area_name: this.rom.GetAreaName(metArea),
                level: met % 128,
                // game: this.ParseOriginalGame((met >>> 7) % 16),
                // caught_in: this.rom.GetItem(this.rom.MapCaughtBallId((met >>> 11) % 16)).name || ((met >>> 11) % 16).toString(),
                game: this.ParseOriginalGame((met >>> 7) & 0x7), //Blazing Emerald
                caught_in: `${this.rom.GetItem(this.rom.MapCaughtBallId(bgCaughtIn + 1)).name}`// (${bgCaughtIn.toString(16)})`,
                //data: sections.D.slice(1, 4).toString('hex')
            }; // as TPP.Pokemon["met"];
            pkmn.original_trainer.gender = this.ParseGender(met >>> 15);
            const ivs = sections.D.readUInt32LE(4);
            pkmn.ivs = {
                hp: ivs % 32,
                attack: (ivs >>> 5) % 32,
                defense: (ivs >>> 10) % 32,
                speed: (ivs >>> 15) % 32,
                special_attack: (ivs >>> 20) % 32,
                special_defense: (ivs >>> 25) % 32
            }
            pkmn.is_egg = (ivs >>> 30) % 2 > 0;
            pkmn.ability = pkmn.species.abilities[ivs >>> 31] || (ivs >>> 31).toString();
            const ribbons = sections.D.readUInt32LE(8);
            pkmn.ribbons = this.ParseHoennRibbons(ribbons);
            //pkmn.fateful_encounter = (ribbons >>> 27) % 16;
            //pkmn.obedient = ribbons >>> 31;

            if (pkmdata.length > 80) {
                const status = pkmdata.readUInt32LE(80);
                pkmn.status = this.ParseStatus(status);
                pkmn.sleep_turns = status % 8
                pkmn.level = pkmdata.readUInt8(84);
                pkmn.pokerus_remaining = pkmdata.readUInt8(85);
                pkmn.health = [pkmdata.readUInt16LE(86), pkmdata.readUInt16LE(88)]
                pkmn.stats = {
                    hp: pkmdata.readUInt16LE(88),
                    attack: pkmdata.readUInt16LE(90),
                    defense: pkmdata.readUInt16LE(92),
                    speed: pkmdata.readUInt16LE(94),
                    special_attack: pkmdata.readUInt16LE(96),
                    special_defense: pkmdata.readUInt16LE(98),
                }
            }

            if (pkmn.species) {
                pkmn.form = this.rom.GetSpecies(pkmn.species.id).formNumber;
                pkmn.gender = this.CalculateGender(pkmn.species.gender_ratio, pkmn.personality_value);
                if (pkmn.species.expFunction) {
                    pkmn.level = pkmn.level || this.CalculateLevelFromExp(exp, pkmn.species.expFunction);
                    pkmn.experience = this.CalculateExpVals(exp, pkmn.level, pkmn.species.expFunction);
                }
                const moveLearn = this.rom.GetNextMoveLearn(pkmn.species.id, pkmn.form, pkmn.level, pkmn.moves.map(m => m.id));
                if (moveLearn)
                    pkmn.next_move = { level: moveLearn.level, name: null, id: null, type: moveLearn.type };

                if (pkmn.name.toLowerCase() == pkmn.species.name.toLowerCase())
                    pkmn.name = pkmn.species.name;
            }

            // pkmn["sections"] = {
            //     A: sections.A.toString('hex'),
            //     B: sections.B.toString('hex'),
            //     C: sections.C.toString('hex'),
            //     D: sections.D.toString('hex')
            // }

            if (boxSlot)
                pkmn.box_slot = boxSlot;

            // //PBR
            // (pkmn as any).aiss_id = this.AissId(pkmn.species.national_dex, pkmn.condition.coolness);
            return pkmn;
        }

        protected ParseBattlePokemon(pkmdata: Buffer): TPP.PartyPokemon {
            const speciesId = pkmdata.readUInt16LE(0);
            if (!speciesId)
                return null;
            const species = this.rom.GetSpecies(speciesId);
            const ivs = pkmdata.readUInt32LE(0x14);
            const level = pkmdata.readUInt8(0x2A);
            const itemId = pkmdata.readUInt16LE(0x2E);
            const ppUps = pkmdata.readUInt8(0x3B);
            const personalityValue = pkmdata.readUInt32LE(0x48);
            let name = this.rom.ConvertText(pkmdata.slice(0x30, 0x3C));
            if (name.toLowerCase() == species.name.toLowerCase())
                name = species.name;
            return {
                species: Object.assign(Pokemon.Convert.SpeciesToRunStatus(species), { type1: this.rom.GetType(pkmdata.readUInt8(0x21)), type2: this.rom.GetType(pkmdata.readUInt8(0x22)) }),
                stats: {
                    hp: pkmdata.readUInt16LE(0x2C),
                    attack: pkmdata.readUInt16LE(0x02),
                    defense: pkmdata.readUInt16LE(0x04),
                    speed: pkmdata.readUInt16LE(0x06),
                    special_attack: pkmdata.readUInt16LE(0x08),
                    special_defense: pkmdata.readUInt16LE(0x0A)
                },
                moves: [
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x0C)), pkmdata.readUInt8(0x24), ppUps % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x0E)), pkmdata.readUInt8(0x25), (ppUps >> 2) % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x10)), pkmdata.readUInt8(0x26), (ppUps >> 4) % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x12)), pkmdata.readUInt8(0x27), (ppUps >> 6) % 4),
                ].filter(m => m && m.id),
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
                    hp: pkmdata.readUInt8(0x18),
                    attack: pkmdata.readUInt8(0x19),
                    defense: pkmdata.readUInt8(0x1A),
                    speed: pkmdata.readUInt8(0x1B),
                    special_attack: pkmdata.readUInt8(0x1C),
                    special_defense: pkmdata.readUInt8(0x1D),
                    accuracy: pkmdata.readUInt8(0x1E),
                    evasion: pkmdata.readUInt8(0x1F),
                },
                ability: this.rom.GetAbility(pkmdata.readUInt8(0x20)),
                health: [pkmdata.readUInt16LE(0x28), pkmdata.readUInt16LE(0x2C)],
                //level,
                friendship: pkmdata.readUInt8(0x2B),
                held_item: itemId ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(itemId)) : null,
                name,
                original_trainer: {
                    name: this.rom.ConvertText(pkmdata.slice(0x3C, 0x44)),
                    id: pkmdata.readUInt16LE(0x54),
                    secret: pkmdata.readUInt16LE(0x56)
                },
                //experience: this.CalculateExpVals(pkmdata.readUInt32LE(0x44), level, species.expFunction), //seems to not always update
                personality_value: personalityValue,
                gender: this.CalculateGender(species.genderRatio, personalityValue),
                status: this.ParseStatus(pkmdata.readUInt32LE(0x4C)),
                volatile_status: this.ParseVolatileStatus(pkmdata.readUInt32LE(0x50))
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
            "TVs Watched", "Clocks Checked", "Lottery Wins", "Daycare Uses", "Cable Car Rides", "Hot Spring Baths", "Union Room Battles", "Berries Crushed"
        ];
        //, "Puzzles Completed"] //TTH
        //, "People Harassed", "Pokémon Lost", "Enemy Pokémon Defeated", "Things Stolen", "Elite Four Attempts"]; //TriHard Emerald

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

        protected OptionsSpec = {
            // sound: {
            //     0: "Mono",
            //     0x10000: "Stereo"
            // },
            // battle_style: {
            //     0: "Shift",
            //     0x20000: "Set"
            // },
            battle_style: {
                0: "Normal",
                0x20000: "Hard"
            },
            experience: {
                0: "Party",
                0x10000: "Single"
            },
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